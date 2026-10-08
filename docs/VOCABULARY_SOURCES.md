# Vocabulary source and import policy

The expanded vocabulary is an adapted **CC BY-SA 4.0 dictionary dataset**. Its license is separate from the application code and the original authored application vocabulary. The imported records carry their source links and license. Reusers of this adapted dictionary must retain attribution, identify modifications, link the license, and license further adaptations under CC BY-SA 4.0 or a compatible license. Commercial reuse is permitted under those conditions. See the [Creative Commons license](https://creativecommons.org/licenses/by-sa/4.0/) and [Wikimedia reuse terms, section 7](https://foundation.wikimedia.org/wiki/Policy:Terms_of_Use#7._Licensing_of_Content).

The source is the [Kaikki Punjabi dictionary](https://kaikki.org/dictionary/Punjabi/index.html), extracted from English Wiktionary with Wiktextract. The input is [Punjabi JSONL](https://kaikki.org/dictionary/Punjabi/kaikki.org-dictionary-Punjabi.jsonl). Kaikki identifies its processed per-language downloads as deprecated. Keep the input checksum in the generated metadata; a future importer should migrate to the [raw extract](https://kaikki.org/dictionary/rawdata.html) when this endpoint is retired. Wiktionary text is available under [CC BY-SA 4.0](https://en.wiktionary.org/wiki/Wiktionary:Copyrights); external quotations and media can have separate terms.

The snapshot retrieved on **2026-10-08** was extracted on **2026-10-03** from a **2026-09-02** Wiktionary dump. The input SHA-256 is `8bbee081aa826ba360edeec75fd3cace1d0971b172569c33631cadcea5a250a2`. The importer emits 5,184 entries covering 4,851 distinct Gurmukhi headwords and 8,190 senses. These are dictionary imports awaiting fluent Eastern Punjabi review. They are not frequency rankings or a claim of native verification.

## Reproduce the import

Run from the application directory:

```sh
node scripts/import-vocabulary.js \
  --download /private/tmp/punjabi-kaikki.jsonl \
  --out data/vocabulary-expansion.js \
  --report data/vocabulary-import-report.json \
  --expected-sha256 8bbee081aa826ba360edeec75fd3cace1d0971b172569c33631cadcea5a250a2 \
  --retrieved-at 2026-10-08 \
  --dump-date 2026-09-02 \
  --extraction-date 2026-10-03
```

The download endpoint changes. To reproduce the exact snapshot, retain a copy of the original input and use `--input` in place of `--download`. `--expected-sha256` stops an import if the input has changed. The dates in the command describe this snapshot; update them only after checking a new source release. `--inspect` prints the report without writing a vocabulary bundle. An optional `--json` argument also writes an inspectable JSON artifact.

## What is retained

Only Punjabi Gurmukhi headwords with an explicitly supplied Latin romanization and an English gloss are accepted. Romanization conventions vary in the source and are preserved without phonetic guesses. Records are grouped by normalized headword and part of speech. Distinct meanings retain separate sense IDs. Headword IDs depend on headword and part of speech, so reordering topics or meanings does not reset learning history. Gender is taken only from explicit sense tags; absent or conflicting gender stays unknown. Number stays unspecified unless the source marks a predominantly plural noun.

The importer removes other scripts, proper names, characters, affixes, inflected-form-only and alternative-only senses, obsolete/archaic and marked dialect senses, unsupported extraction tags, and unsuitable or excessively long glosses. The report counts each exclusion. It preserves remaining source qualifiers, so a figurative or specialized meaning is not presented as an unqualified translation.

Topic tags use transparent English keyword rules and are **provisional browsing aids**. They supply no grammatical or semantic permission to construct a sentence. An entry can appear in several topics, and child topics also receive their parent topic. Imported entries have no generated sentences, no invented transliteration, no copied quotations, and no imported sound recordings. All imported records have `verifiedGrammar: false` and `grammarEligible: false`.

## Grammar and quality boundaries

Gurmukhi script does not establish Eastern Punjabi dialect. A dictionary can contain borrowed words, literary senses, technical terms and uneven coverage. A fluent reviewer should approve lesson selections and topic assignments before presenting them as a beginner course. Conjugation tables require independent checking: the inspected extract contains inconsistent passive tags and generated perfective spellings for ਖਾਣਾ that disagree with the university reference grammar. This pipeline deliberately discards source conjugation tables.

The [Punjabi University frequency page](https://www.learnpunjabi.org/statistics.html) is a reference for 500 common written word tokens, including inflected forms, drawn from a roughly 6.8-million-word corpus. It does not establish spoken frequency or provide 500 unique lemmas. No open redistribution license was found on that page or its linked university pages, so its definitions, recordings and table were not imported.

For grammar evidence, see [GRAMMAR_SOURCES.md](GRAMMAR_SOURCES.md). Reviewed application grammar and imported vocabulary remain distinct: importing a dictionary word does not authorize an arbitrary gender, case form, conjugation or object combination.

## Small construction metadata overlay

`data/grammar-ready-vocabulary.js` contains metadata overlays for **30 existing imported nouns**. It contains no replacement spellings, romanizations, translations or word records. The application joins these overlays by stable lexical ID before installing the lexicon.

Each selected entry has exactly one accepted noun sense and an explicit masculine or feminine dictionary tag. There are 26 food/fruit/vegetable senses, two drink senses, one book sense and one pen sense. Gender is copied from the source. Twelve entries have a matching direct-singular source declension cell; the other eighteen are ordinary base nouns used with grammatical singular agreement. Mass/count status is left unspecified. No new plurals, obliques or conjugations are inferred.

The semantic tags `edible`, `drinkable`, `readable`, `giveable` and `takeable` are manually assigned from the inspected English senses. They authorize compatible direct-object selection only. The general direct-object and agreement principles are cross-checked against university grammar §§5.4, 8.3 and 8.5. This is a review of construction metadata, not a fluent speaker's verification of every pronunciation or sentence. Each overlay carries `source-crosschecked;native-review-pending` and `nativeReviewed: false`. In this narrow overlay, `verifiedGrammar: true` means its gender, singular agreement and direct-object compatibility metadata have been reviewed; the raw imported record remains unmodified and unverified.

Words with conflicting gender/senses, such as ਚਾਹ (tea/desire), are excluded. The other 5,154 imported records remain excluded from random sentence object selection. Broader grammar participation requires a separate review of the relevant sense, forms and compatibility restrictions.
