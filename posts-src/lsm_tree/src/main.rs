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
    sstables: Vec<SSTable>, // older first
}

impl LsmTree {
    const MAX_ENTRY_SIZE: usize = 64 * 1024; // 64 KB
}

fn read_entry_from_header(header: &[u8; 8]) -> Result<(Vec<u8>, Vec<u8>)> {
    let key_length = u32::from_le_bytes(
        header_buffer
            .get(0..4)
            .ok_or_else(|| anyhow!("Invalid header: missing key length"))?
            .try_into()
            .context("Invalid key length slice")?,
    ) as usize;

    let value_length = u32::from_le_bytes(
        header_buffer
            .get(4..8)
            .ok_or_else(|| anyhow!("Invalid header: missing value length"))?
            .try_into()
            .context("Invalid value length slice")?,
    ) as usize;

    // defensive check to avoid any OOM even though we also check on write
    if key_length > LsmTree::MAX_ENTRY_SIZE || value_length > LsmTree::MAX_ENTRY_SIZE {
        bail!(
            "Corrupt entry: header too large (key length={} value length={})",
            key_length,
            value_length
        )
    }

    let mut key = vec![0u8; key_length];
    reader.read_exact(&mut key)?;

    let mut value = vec![0u8; value_length];
    reader.read_exact(&mut value)?;

    Ok((key, value))
}

#[derive(Debug)]
pub struct Memtable {
    map: BTreeMap<Vec<u8>, Vec<u8>>,
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
        // flush our any buffered writes
        self.writer.flush()?;

        let file = OpenOptions::new().read(true).open(&self.path)?;
        let mut reader = BufReader::new(file);

        let mut records = Vec::new();
        let mut header_buffer = [0u8; 8];

        loop {
            match reader.read_exact(&mut header_buffer) {
                Ok(()) => {}
                Err(e) if e.kind() == std::io::ErrorKind::UnexpectedEof => break,
                Err(e) => return Err(e).context("Failed to read WAL header"),
            }

            let (key, value) = read_entry_from_header(&header_buffer)?;
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
    /// Creates an SSTable file from the data in a memtable.
    /// Format of the entries remains the same.
    pub fn from_memtable(path: &Path, memtable: &Memtable) -> Result<Self> {
        let path_buf = path.to_path_buf();
        let mut file = File::create(&path)?;

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

        let mut header_buffer = [0u8; 8];
        loop {
            match reader.read_exact(&mut header_buffer) {
                Ok(()) => {}
                Err(e) if e.kind() == std::io::ErrorKind::UnexpectedEof => break,
                Err(e) => return Err(e).context("Failed to read SSTable header"),
            }

            let (key, value) = read_entry_from_header(&header_buffer)?;
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

        let mut header_buffer = [0u8; 8];

        Ok(std::iter::from_fn(move || {
            match reader.read_exact(&mut header_buffer) {
                Ok(()) => {}
                Err(e) if e.kind() == std::io::ErrorKind::UnexpectedEof => return None,
                Err(e) => return Some(Err(e).context("Failed to read SSTable header")),
            }

            match read_entry_from_header(&header_buffer) {
                Ok((key, value)) => Some(Ok((key, value))),
                Err(e) => Some(Err(e)),
            }
        }))
    }
}

fn main() {
    println!("Hello, world!");
}
