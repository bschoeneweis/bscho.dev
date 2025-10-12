use std::{
    cmp::Ordering,
    collections::{BTreeMap, HashMap, HashSet},
};

type DocumentId = u32;
type Term = String;
type PostingList = HashSet<DocumentId>;

#[derive(Debug)]
enum BooleanOp {
    Must,
    Should,
    MustNot,
}

const STOP_WORDS: &[&str] = &["the", "of"];

fn tokenize(text: &str) -> Vec<Term> {
    text.trim()
        .to_lowercase()
        .chars()
        .map(|c| if c.is_alphanumeric() { c } else { ' ' })
        .collect::<String>()
        .split_whitespace()
        .filter(|token| !STOP_WORDS.contains(token))
        .map(|token| token.to_string())
        .collect()
}

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

    fn build(documents: &[&str]) -> Self {
        let mut inverted_index = Self::new();
        for (document_id, document) in documents.iter().enumerate() {
            inverted_index.insert_document((document_id + 1) as u32, document); // add 1 to follow along with examples
        }

        inverted_index
    }

    fn insert_document(&mut self, document_id: DocumentId, text: &str) {
        let terms = tokenize(text);

        let mut term_frequencies: HashMap<Term, usize> = HashMap::with_capacity(terms.len());
        for term in terms {
            *term_frequencies.entry(term.clone()).or_default() += 1;
        }
        for unique_term in term_frequencies.keys() {
            self.dictionary
                .entry(unique_term.clone())
                .or_default()
                .insert(document_id);
        }
        self.term_frequencies.insert(document_id, term_frequencies);

        self.document_count += 1;
    }

    fn get_posting_list(&self, term: &str) -> PostingList {
        self.dictionary.get(term).cloned().unwrap_or_default()
    }

    fn query_and(&self, terms: &[&str]) -> PostingList {
        let mut terms_iter = terms.iter();
        let Some(first_term) = terms_iter.next() else {
            return HashSet::new();
        };

        let mut result_set = self.get_posting_list(first_term);
        for term in terms_iter {
            let term_posting_list = self.get_posting_list(term);
            result_set = result_set
                .intersection(&term_posting_list)
                .copied()
                .collect();
            if result_set.is_empty() {
                break; // small optimization to exit early if we already have no intersections
            }
        }

        result_set
    }

    fn query_or(&self, terms: &[&str]) -> PostingList {
        let mut result_set = HashSet::new();
        for term in terms {
            let term_posting_list = self.get_posting_list(term);
            result_set = result_set.union(&term_posting_list).copied().collect();
        }

        result_set
    }

    fn get_all_document_ids(&self) -> HashSet<DocumentId> {
        self.term_frequencies.keys().copied().collect()
    }

    fn query_not(&self, terms: &[&str]) -> PostingList {
        let all_document_ids = self.get_all_document_ids();

        let mut ids_to_exclude = HashSet::new();
        for term in terms {
            let term_posting_list = self.get_posting_list(term);
            ids_to_exclude.extend(term_posting_list);
        }

        all_document_ids
            .difference(&ids_to_exclude)
            .copied()
            .collect()
    }

    fn tf_idf(&self, document_id: DocumentId, term: &str) -> f64 {
        let term_frequency = self
            .term_frequencies
            .get(&document_id)
            .and_then(|term_map| term_map.get(term))
            .copied()
            .unwrap_or(0) as f64;

        let document_total_terms = self
            .term_frequencies
            .get(&document_id)
            .map(|term_map| term_map.values().sum::<usize>() as f64)
            .unwrap_or(1.0);

        let document_frequency = self
            .dictionary
            .get(term)
            .map(|documents| documents.len())
            .unwrap_or(0)
            .max(1); // prevent divide by zero

        let inverse_document_frequency =
            (self.document_count as f64 / document_frequency as f64).log10();

        (term_frequency / document_total_terms) * inverse_document_frequency
    }

    fn search(&self, query: &str) -> Vec<(DocumentId, f64)> {
        let query_terms = tokenize(query);
        let mut scored_documents: HashMap<DocumentId, f64> = HashMap::new();

        for term in &query_terms {
            let term_posting_list = self.get_posting_list(term);
            for document_id in term_posting_list {
                let tf_idf = self.tf_idf(document_id, term);
                *scored_documents.entry(document_id).or_insert(0.0) += tf_idf;
            }
        }

        let mut results: Vec<_> = scored_documents.into_iter().collect();
        results.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(Ordering::Equal));

        results
    }

    fn boolean_query(&self, query: Vec<(BooleanOp, &str)>) -> Vec<(DocumentId, f64)> {
        let mut must_terms = Vec::new();
        let mut should_terms = Vec::new();
        let mut must_not_terms = Vec::new();

        for (op, term) in query {
            match op {
                BooleanOp::Must => must_terms.push(term),
                BooleanOp::Should => should_terms.push(term),
                BooleanOp::MustNot => must_not_terms.push(term),
            }
        }

        // start with a base set depending on what operations are defined
        // and narrow our matching documents
        let mut matching_documents = if !must_terms.is_empty() {
            self.query_and(&must_terms)
        } else if !should_terms.is_empty() {
            self.query_or(&should_terms)
        } else {
            self.get_all_document_ids()
        };

        if !must_not_terms.is_empty() {
            let excluded = self.query_not(&must_not_terms);
            matching_documents = matching_documents
                .intersection(&excluded)
                .copied()
                .collect();
        }

        // score all of the matches
        let mut scored_documents = Vec::with_capacity(matching_documents.len());
        for document_id in matching_documents {
            let mut score = 0.0;

            for term in &must_terms {
                // apply a slight boost for MUST matches
                let tf_idf = self.tf_idf(document_id, *term);
                let boosted_score_for_must = tf_idf * 2.0;
                score += boosted_score_for_must;
            }

            for term in &should_terms {
                let tf_idf = self.tf_idf(document_id, *term);
                score += tf_idf;
            }

            if score > 0.0 {
                scored_documents.push((document_id, score));
            }
        }

        scored_documents.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(Ordering::Equal));

        scored_documents
    }
}

fn main() {
    let documents = vec![
        "The Lord of the Rings: The Fellowship of the Ring",
        "The Lord of the Rings: The Two Towers",
        "The Lord of the Rings: The Return of the King",
        "Star Wars: Episode VI - Return of the Jedi",
    ];

    let inverted_index = InvertedIndex::build(&documents);
    println!("{:#?}", inverted_index);

    let matching_documents = inverted_index.get_posting_list("return");
    println!("Documents matching 'return': {:?}", matching_documents);

    let and_matches = inverted_index.query_and(&["return", "rings"]);
    println!("'return' AND 'rings': {:?}", and_matches);

    let or_matches = inverted_index.query_or(&["rings", "fellowship"]);
    println!("'rings' OR 'fellowship': {:?}", or_matches);

    let not_matches = inverted_index.query_not(&["return"]);
    println!("NOT 'return': {:?}", not_matches);

    // TF-IDFs for document 1
    let rings_tf_idf = inverted_index.tf_idf(1, "rings");
    println!("'rings' TD-IDF for document 1: {:.4}", rings_tf_idf);
    let fellowship_tf_idf = inverted_index.tf_idf(1, "fellowship");
    println!(
        "'fellowship' TD-IDF for document 1: {:.4}",
        fellowship_tf_idf
    );

    let search_result = inverted_index.search("return of the king");
    println!("query = 'return of the king': {:?}", search_result);

    let search_result = inverted_index.search("lord of the rings");
    println!("query = 'lord of the rings': {:?}", search_result);

    let search_result = inverted_index.search("star wars");
    println!("query = 'star wars': {:?}", search_result);

    let boolean_query = vec![(BooleanOp::Must, "return"), (BooleanOp::Should, "star")];
    let boolean_query_result = inverted_index.boolean_query(boolean_query);
    println!(
        "boolean query = [(MUST, 'return'), (SHOULD, 'star')]: {:?}",
        boolean_query_result
    );

    let boolean_query = vec![(BooleanOp::Must, "return"), (BooleanOp::MustNot, "star")];
    let boolean_query_result = inverted_index.boolean_query(boolean_query);
    println!(
        "boolean query = [(MUST, 'return'), (MUST NOT, 'star')]: {:?}",
        boolean_query_result
    );
}
