use std::{
    collections::BTreeMap,
    fs::{File, OpenOptions},
    io::{BufReader, BufWriter, Read, Write},
    path::{Path, PathBuf},
};

use anyhow::{anyhow, bail, Context, Result};

#[derive(Debug)]
pub struct LsmTree {
    memtable: Memtable,
    wal: Wal,
    sstables: Vec<SSTable>,
    path: PathBuf,
    next_sstable_id: u8,
}

impl LsmTree {
    const MAX_ENTRY_SIZE: usize = 64 * 1024; // 64 KB
    const MAX_MEMTABLE_SIZE: usize = 128 * 1024; // 128 KB

    /// Open (or create) an LSM tree given the directory.
    /// If the structure exists already, we will:
    ///   - open and replay the WAL
    ///   - load any existing SSTables
    pub fn open(path: &Path) -> Result<Self> {
        let path_buf = path.to_path_buf();
        std::fs::create_dir_all(&path_buf)?;

        // we'll have the WAL live at `<path>/wal.log`
        let wal_path = path_buf.join("wal.log");
        let mut wal = Wal::open(&wal_path)?;

        // fill the memtable with the WAL replay
        let mut memtable = Memtable::new();
        for (key, value) in wal.replay()? {
            memtable.put(key, value);
        }

        // grab any existing SSTables `<path>/sstable_{:04}.sst`
        let mut sstables_with_id = Vec::new();
        for dir_entry_result in std::fs::read_dir(&path_buf)? {
            let dir_entry = dir_entry_result?;
            let dir_entry_path = dir_entry.path();

            if !dir_entry_path.is_file() {
                continue;
            }

            match dir_entry_path.file_name().and_then(|x| x.to_str()) {
                Some(file_name)
                    if file_name.starts_with(SSTable::FILE_NAME_PREFIX)
                        && file_name.ends_with(SSTable::FILE_EXT) =>
                {
                    let sstable_id_opt = file_name
                        .strip_prefix(SSTable::FILE_NAME_PREFIX)
                        .and_then(|s| s.strip_suffix(SSTable::FILE_EXT))
                        .and_then(|s| s.parse::<u32>().ok());

                    if let Some(sstable_id) = sstable_id_opt {
                        sstables_with_id.push((
                            sstable_id,
                            SSTable {
                                path: dir_entry_path,
                            },
                        ));
                    }
                }
                _ => continue,
            }
        }

        // sort them by id (age), oldest first
        sstables_with_id.sort_by_key(|(id, _)| *id);

        let sstables: Vec<SSTable> = sstables_with_id
            .into_iter()
            .map(|(_, sstable)| sstable)
            .collect();

        Ok(Self {
            memtable,
            wal,
            sstables,
            path: path_buf,
            next_sstable_id: 0,
        })
    }

    /// Put a key/value pair onto the WAL and memtable
    pub fn put(&mut self, key: Vec<u8>, value: Vec<u8>) -> Result<()> {
        self.wal.append(&key, &value)?;
        self.memtable.put(key, value);

        if self.memtable.total_bytes() > Self::MAX_MEMTABLE_SIZE {
            self.flush()?;
        }

        Ok(())
    }

    /// Search for a key first against the memtable, then against
    /// SSTable from newest to oldest
    pub fn get(&self, key: &[u8]) -> Result<Option<Vec<u8>>> {
        if let Some(value) = self.memtable.get(key) {
            return Ok(Some(value.to_vec()));
        }

        for table in self.sstables.iter().rev() {
            let table_read_opt = table.get(key)?;
            if let Some(value) = table_read_opt {
                return Ok(Some(value.to_vec()));
            }
        }

        Ok(None)
    }

    /// Write the current memtable to an SSTable on-disk, and then clear
    /// the existing memtable and reset the WAL
    pub fn flush(&mut self) -> Result<()> {
        if self.memtable.is_empty() {
            return Ok(());
        }

        let file_name = format!(
            "{}{}{}",
            SSTable::FILE_NAME_PREFIX,
            self.next_sstable_id,
            SSTable::FILE_EXT
        );
        self.next_sstable_id += 1;
        let path = self.path.join(file_name);

        let sstable = SSTable::from_memtable(&path, &self.memtable)?;
        self.sstables.push(sstable);

        self.memtable.clear();
        self.wal.purge()?;

        Ok(())
    }

    /// Very basic compaction that is called independently.
    /// It will take all SSTables, merge them, sort the merged map,
    /// write all of them as a single SStable, and then drop the old tables
    pub fn compact_all(&mut self) -> Result<()> {
        // we wouldn't generally use the memtable to do this, but all of the
        // operations are setup for us, we so can use one here
        let mut merged = Memtable::new();

        for table in &self.sstables {
            for read_result in table.iter()? {
                let (key, value) = read_result?;
                merged.put(key, value);
            }
        }

        let file_name = format!(
            "{}{}{}",
            SSTable::FILE_NAME_PREFIX,
            self.next_sstable_id,
            SSTable::FILE_EXT
        );
        self.next_sstable_id += 1;
        let path = self.path.join(file_name);

        let compacted_table = SSTable::from_memtable(&path, &merged)?;

        let paths_to_delete: Vec<PathBuf> =
            self.sstables.iter().map(|sst| sst.path.clone()).collect();

        self.sstables.clear();
        self.sstables.push(compacted_table);

        // clean up old tables on disk
        for path in &paths_to_delete {
            std::fs::remove_file(path)?;
        }

        Ok(())
    }
}

/// Helper function to read out key/value pairs from a file given
/// our binary format: `<u32 key length><u32 value length><key bytes><val bytes>`
fn read_entry_from_header(reader: &mut BufReader<File>) -> Result<Option<(Vec<u8>, Vec<u8>)>> {
    let mut header = [0u8; 8];

    match reader.read_exact(&mut header) {
        Ok(()) => {}
        Err(e) if e.kind() == std::io::ErrorKind::UnexpectedEof => return Ok(None),
        Err(e) => return Err(e).context("Failed to read entry header"),
    }

    let key_length = u32::from_le_bytes(
        header
            .get(0..4)
            .ok_or_else(|| anyhow!("Invalid header: missing key length"))?
            .try_into()
            .context("Invalid key length slice")?,
    ) as usize;

    let value_length = u32::from_le_bytes(
        header
            .get(4..8)
            .ok_or_else(|| anyhow!("Invalid header: missing value length"))?
            .try_into()
            .context("Invalid value length slice")?,
    ) as usize;

    // defensive check to avoid any OOM even though we also check on write
    if key_length > LsmTree::MAX_ENTRY_SIZE || value_length > LsmTree::MAX_ENTRY_SIZE {
        bail!(
            "Corrupt entry: header saying key or value is too large (key length={} value length={})",
            key_length,
            value_length
        )
    }

    let mut key = vec![0u8; key_length];
    reader.read_exact(&mut key)?;

    let mut value = vec![0u8; value_length];
    reader.read_exact(&mut value)?;

    Ok(Some((key, value)))
}

#[derive(Debug)]
pub struct Memtable {
    map: BTreeMap<Vec<u8>, Vec<u8>>,
}

impl Default for Memtable {
    fn default() -> Self {
        Self::new()
    }
}

impl Memtable {
    pub fn new() -> Self {
        Self {
            map: BTreeMap::new(),
        }
    }

    pub fn put(&mut self, key: Vec<u8>, value: Vec<u8>) {
        self.map.insert(key, value);
    }

    pub fn get(&self, key: &[u8]) -> Option<&[u8]> {
        self.map.get(key).map(|v| v.as_slice())
    }

    pub fn iter(&self) -> impl Iterator<Item = (&[u8], &[u8])> {
        self.map.iter().map(|(k, v)| (k.as_slice(), v.as_slice()))
    }

    pub fn size(&self) -> usize {
        self.map.len()
    }

    pub fn total_bytes(&self) -> usize {
        self.map.iter().map(|(k, v)| k.len() + v.len()).sum()
    }

    pub fn is_empty(&self) -> bool {
        self.map.is_empty()
    }

    pub fn clear(&mut self) {
        self.map.clear();
    }
}

#[derive(Debug)]
pub struct Wal {
    path: PathBuf,
    writer: BufWriter<File>,
}

impl Wal {
    pub fn open(path: &Path) -> Result<Self> {
        let path = path.to_path_buf();
        let file = OpenOptions::new()
            .create(true)
            .append(true)
            .read(true)
            .open(&path)?;

        Ok(Self {
            path,
            writer: BufWriter::new(file),
        })
    }

    /// Append a `Put(key, value)` record to the WAL and fsync
    /// using the following log format:
    /// `<u32 key length><u32 value length><key bytes><val bytes>`
    pub fn append(&mut self, key: &[u8], value: &[u8]) -> Result<()> {
        let key_length = key.len() as u32;
        let value_length = value.len() as u32;

        self.writer.write_all(&key_length.to_le_bytes())?;
        self.writer.write_all(&value_length.to_le_bytes())?;
        self.writer.write_all(key)?;
        self.writer.write_all(value)?;

        // flush buffer and sync the file for durability
        self.writer.flush()?;
        self.writer.get_ref().sync_all()?;

        Ok(())
    }

    /// Replay all record in the WAL (returns key/value pairs to rebuild the memtable)
    pub fn replay(&mut self) -> Result<Vec<(Vec<u8>, Vec<u8>)>> {
        // flush out any buffered writes
        self.writer.flush()?;

        let file = OpenOptions::new().read(true).open(&self.path)?;
        let mut reader = BufReader::new(file);

        let mut records = Vec::new();
        loop {
            let (key, value) = match read_entry_from_header(&mut reader) {
                Ok(Some((key, value))) => (key, value),
                Ok(None) => break, // EOF
                Err(e) => return Err(e).context("Failed to read WAL record"),
            };
            records.push((key, value));
        }

        Ok(records)
    }

    /// Purges the WAL after a flush
    pub fn purge(&mut self) -> Result<()> {
        // truncate then re-init
        OpenOptions::new()
            .create(true)
            .write(true)
            .truncate(true)
            .open(&self.path)?;

        let file = OpenOptions::new()
            .append(true)
            .read(true)
            .open(&self.path)?;

        self.writer = BufWriter::new(file);

        Ok(())
    }
}

#[derive(Debug)]
pub struct SSTable {
    path: PathBuf,
}

impl SSTable {
    const FILE_NAME_PREFIX: &'static str = "sstable_";
    const FILE_EXT: &'static str = ".sst";

    /// Creates an SSTable file from the data in a memtable.
    /// Format of the entries remains the same.
    pub fn from_memtable(path: &Path, memtable: &Memtable) -> Result<Self> {
        let path_buf = path.to_path_buf();
        let mut file = File::create(path)?;

        // write all of the pre-sorted data
        for (key, value) in memtable.iter() {
            let key_length = key.len() as u32;
            let value_length = value.len() as u32;
            file.write_all(&key_length.to_le_bytes())?;
            file.write_all(&value_length.to_le_bytes())?;
            file.write_all(key)?;
            file.write_all(value)?;
        }

        file.flush()?;
        file.sync_all()?;

        Ok(Self { path: path_buf })
    }

    /// Find a single key on-disk.
    /// Sequentially scans each record until a match is found or we EOF.
    pub fn get(&self, target_key: &[u8]) -> Result<Option<Vec<u8>>> {
        let file = File::open(&self.path)?;
        let mut reader = BufReader::new(file);
        loop {
            let (key, value) = match read_entry_from_header(&mut reader) {
                Ok(Some((key, value))) => (key, value),
                Ok(None) => break, // EOF
                Err(e) => return Err(e).context("Failed to read WAL record"),
            };

            // linear scan, but we could be smarter here for an optimization
            if target_key == key {
                return Ok(Some(value));
            }
        }

        Ok(None)
    }

    /// Simple iterator for convenience to go over all key/values
    /// in an SSTable (primarily for compaction)
    pub fn iter(&self) -> Result<impl Iterator<Item = Result<(Vec<u8>, Vec<u8>)>>> {
        let file = File::open(&self.path)?;
        let mut reader = BufReader::new(file);
        Ok(std::iter::from_fn(move || {
            match read_entry_from_header(&mut reader) {
                Ok(Some((key, value))) => Some(Ok((key, value))),
                Ok(None) => None, // EOF
                Err(e) => Some(Err(e).context("Failed to read SSTable record")),
            }
        }))
    }
}

fn main() -> Result<()> {
    let lsm_tree_path = Path::new("./tmp");
    let mut lsm_tree = LsmTree::open(lsm_tree_path)?;

    lsm_tree.put(b"ring bearer".to_vec(), b"Frodo Baggins".to_vec())?;
    lsm_tree.put(b"wizard".to_vec(), b"Gandalf the Grey".to_vec())?;
    lsm_tree.put(b"meal".to_vec(), b"second breakfast".to_vec())?;
    lsm_tree.put(b"pipeweed".to_vec(), b"Longbottom Leaf".to_vec())?;

    println!(
        "ring bearer   -> {:?}",
        lsm_tree
            .get(b"ring bearer")?
            .map(|b| String::from_utf8_lossy(&b).to_string())
    );
    println!(
        "wizard        -> {:?}",
        lsm_tree
            .get(b"wizard")?
            .map(|b| String::from_utf8_lossy(&b).to_string())
    );
    println!(
        "meal          -> {:?}",
        lsm_tree
            .get(b"meal")?
            .map(|b| String::from_utf8_lossy(&b).to_string())
    );
    println!(
        "pipeweed      -> {:?}",
        lsm_tree
            .get(b"pipeweed")?
            .map(|b| String::from_utf8_lossy(&b).to_string())
    );
    println!(
        "dragon        -> {:?}",
        lsm_tree
            .get(b"dragon")?
            .map(|b| String::from_utf8_lossy(&b).to_string())
    ); // not there, currently in The Lonely Mountain

    lsm_tree.flush()?;
    println!("(after flush)...");

    println!(
        "ring bearer   -> {:?}",
        lsm_tree
            .get(b"ring bearer")?
            .map(|b| String::from_utf8_lossy(&b).to_string())
    );
    println!(
        "wizard        -> {:?}",
        lsm_tree
            .get(b"wizard")?
            .map(|b| String::from_utf8_lossy(&b).to_string())
    );
    println!(
        "meal          -> {:?}",
        lsm_tree
            .get(b"meal")?
            .map(|b| String::from_utf8_lossy(&b).to_string())
    );
    println!(
        "pipeweed      -> {:?}",
        lsm_tree
            .get(b"pipeweed")?
            .map(|b| String::from_utf8_lossy(&b).to_string())
    );
    println!(
        "dragon        -> {:?}",
        lsm_tree
            .get(b"dragon")?
            .map(|b| String::from_utf8_lossy(&b).to_string())
    ); // not there, currently in The Lonely Mountain

    lsm_tree.put(b"meal".to_vec(), b"elevenses".to_vec())?;
    println!(
        "meal (new)    -> {:?}",
        lsm_tree
            .get(b"meal")?
            .map(|b| String::from_utf8_lossy(&b).to_string())
    );

    lsm_tree.flush()?;
    println!("(after second flush)");

    println!(
        "ring bearer   -> {:?}",
        lsm_tree
            .get(b"ring bearer")?
            .map(|b| String::from_utf8_lossy(&b).to_string())
    );
    println!(
        "wizard        -> {:?}",
        lsm_tree
            .get(b"wizard")?
            .map(|b| String::from_utf8_lossy(&b).to_string())
    );
    println!(
        "meal (new)    -> {:?}",
        lsm_tree
            .get(b"meal")?
            .map(|b| String::from_utf8_lossy(&b).to_string())
    );
    println!(
        "pipeweed      -> {:?}",
        lsm_tree
            .get(b"pipeweed")?
            .map(|b| String::from_utf8_lossy(&b).to_string())
    );
    println!(
        "dragon        -> {:?}",
        lsm_tree
            .get(b"dragon")?
            .map(|b| String::from_utf8_lossy(&b).to_string())
    ); // not there, currently in The Lonely Mountain

    lsm_tree.compact_all()?;
    println!("(after compaction)");

    println!(
        "ring bearer   -> {:?}",
        lsm_tree
            .get(b"ring bearer")?
            .map(|b| String::from_utf8_lossy(&b).to_string())
    );
    println!(
        "wizard        -> {:?}",
        lsm_tree
            .get(b"wizard")?
            .map(|b| String::from_utf8_lossy(&b).to_string())
    );
    println!(
        "meal (new)    -> {:?}",
        lsm_tree
            .get(b"meal")?
            .map(|b| String::from_utf8_lossy(&b).to_string())
    );
    println!(
        "pipeweed      -> {:?}",
        lsm_tree
            .get(b"pipeweed")?
            .map(|b| String::from_utf8_lossy(&b).to_string())
    );
    println!(
        "dragon        -> {:?}",
        lsm_tree
            .get(b"dragon")?
            .map(|b| String::from_utf8_lossy(&b).to_string())
    ); // not there, currently in The Lonely Mountain

    Ok(())
}
