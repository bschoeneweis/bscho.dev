use std::collections::{BTreeMap, HashMap};

type DocumentId = u32;
type Term = String;
type PostingList = Vec<DocumentId>;

#[derive(Debug)]
struct InvertedIndex {
    dictionary: BTreeMap<Term, PostingList>,
    term_frequencies: HashMap<DocumentId, HashMap<Term, usize>>,
    document_count: usize,
}

impl InvertedIndex {
    fn new() -> Self {
        Self {
            dictionary: BTreeMap::new(),
            term_frequencies: HashMap::new(),
            document_count: 0,
        }
    }
}


fn main() {
    let documents = vec![
        "The Lord of the Rings: The Fellowship of the Ring",
        "The Lord of the Rings: The Two Towers",
        "The Lord of the Rings: The Return of the King",
        "Star Wars: Episode VI - Return of the Jedi",
    ]; 
}
