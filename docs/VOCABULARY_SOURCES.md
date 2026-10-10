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

## Original import policy (baseline release)

Only Punjabi Gurmukhi headwords with an explicitly supplied Latin romanization and an English gloss are accepted. Romanization conventions vary in the source and are preserved without phonetic guesses. Records are grouped by normalized headword and part of speech. Distinct meanings retain separate sense IDs. Headword IDs depend on headword and part of speech, so reordering topics or meanings does not reset learning history. Gender is taken only from explicit sense tags; absent or conflicting gender stays unknown. Number stays unspecified unless the source marks a predominantly plural noun.

The importer removes other scripts, proper names, characters, affixes, inflected-form-only and alternative-only senses, obsolete/archaic and marked dialect senses, unsupported extraction tags, and unsuitable or excessively long glosses. The report counts each exclusion. It preserves remaining source qualifiers, so a figurative or specialized meaning is not presented as an unqualified translation.

The original importer used transparent English keyword rules for **provisional browsing tags**. These original tags supplied no grammatical or semantic permission to construct a sentence. The unchanged source bundle still has `verifiedGrammar: false` and `grammarEligible: false`; the current runtime audit below assesses source senses and grants bounded construction permission separately. No invented transliteration, copied quotations or imported sound recordings are included.

## Grammar and quality boundaries

Gurmukhi script does not establish Eastern Punjabi dialect. A dictionary can contain borrowed words, literary senses, technical terms and uneven coverage. A fluent reviewer should approve lesson selections and topic assignments before presenting them as a beginner course. Conjugation tables require independent checking: the inspected extract contains inconsistent passive tags and generated perfective spellings for ਖਾਣਾ that disagree with the university reference grammar. The original import deliberately discarded source conjugation tables. The current verb profile builder retains only selected simple-stem cells that independently agree with the reference rules, with morphology and argument-sense authorization kept separate.

The [Punjabi University frequency page](https://www.learnpunjabi.org/statistics.html) is a reference for 500 common written word tokens, including inflected forms, drawn from a roughly 6.8-million-word corpus. It does not establish spoken frequency or provide 500 unique lemmas. No open redistribution license was found on that page or its linked university pages, so its definitions, recordings and table were not imported.

For grammar evidence, see [GRAMMAR_SOURCES.md](GRAMMAR_SOURCES.md). Reviewed application grammar and imported vocabulary remain distinct: importing a dictionary word does not authorize an arbitrary gender, case form, conjugation or object combination.

## Historical 30-noun construction overlay

`data/grammar-ready-vocabulary.js` contains metadata overlays for **30 existing imported nouns**. It contains no replacement spellings, romanizations, translations or word records. The application joins these overlays by stable lexical ID before installing the lexicon.

Each selected entry has exactly one accepted noun sense and an explicit masculine or feminine dictionary tag. There are 26 food/fruit/vegetable senses, two drink senses, one book sense and one pen sense. Gender is copied from the source. Twelve entries have a matching direct-singular source declension cell; the other eighteen are ordinary base nouns used with grammatical singular agreement. Mass/count status is left unspecified. No new plurals, obliques or conjugations are inferred.

The semantic tags `edible`, `drinkable`, `readable`, `giveable` and `takeable` are manually assigned from the inspected English senses. They authorize compatible direct-object selection only. The general direct-object and agreement principles are cross-checked against university grammar §§5.4, 8.3 and 8.5. This is a review of construction metadata, not a fluent speaker's verification of every pronunciation or sentence. Each overlay carries `source-crosschecked;native-review-pending` and `nativeReviewed: false`. In this narrow overlay, `verifiedGrammar: true` means its gender, singular agreement and direct-object compatibility metadata have been reviewed; the raw imported record remains unmodified and unverified.

In that baseline release, words with conflicting gender/senses, such as ਚਾਹ (tea/desire), were excluded, and the other 5,154 imported records remained outside random sentence object selection. The current full-corpus audit supersedes that restriction for individually supported senses. The old overlay is retained as provenance and its authored semantic tags are preserved on compatible singleton senses.

## Current full-corpus sense and construction audit

`scripts/extract-source-evidence.js` checks the original input SHA-256 before writing `data/source-evidence.js`. It aligns all **5,184 imported records and 8,190 original senses** by their original source sense identifiers. The evidence bundle contains dictionary definition links, topical categories with their disambiguation weights, and noun/adjective declension cells with explicitly supplied Gurmukhi and Roman forms. It contains no quotations, audio, replacement dictionary records or whole verb conjugation tables. The original source vocabulary arrays remain unchanged.

Run the extraction and report with a retained copy of the exact snapshot:

```sh
node scripts/extract-source-evidence.js /tmp/punjabi-kaikki.jsonl
node scripts/build-verb-profiles.js /tmp/punjabi-kaikki.jsonl
node scripts/build-authored-category-baselines.js 49ded7b
node scripts/corpus-assessment-report.js
```

A checksum mismatch stops source extraction. A lexical identity mismatch leaves the live entry unresolved and preserves its edited text. Exact imported aliases merged into an existing canonical entry can use matching source evidence without changing canonical IDs or existing legacy sense IDs. A separate `dictionarySenseId` links such a sense to its imported source counterpart. User spelling, grammatical fields, translations and category choices remain preserved; changed lexical metadata requires construction revalidation.

`vocabulary-audit.js` assesses every canonical entry when the unified registry loads. It separates core data completeness, schema validity, source alignment, morphology, construction compatibility, confidence, fluent-speaker review and sentence eligibility. “Complete grammar” means complete **for the supported construction scope**, not a complete dictionary of all possible inflections or syntactic uses. All entries still await independent fluent-speaker review; an arbitrary review boolean is insufficient to mark an entry reviewed.

Classification uses individually identified senses, exact semantic definition heads, explicit definition hypernyms and mapped source topical categories. Words merely occurring elsewhere in a gloss grant no category permission. Source topic labels with unresolved disambiguation probabilities are not treated as unambiguous evidence. An explicit adjective part of speech supports the browsing topic Properties & Descriptions, but does not establish its modifier semantics. Unsupported detailed classifications retain General or an explicit unresolved sense state. Category validation reports unsupported assignments, semantic conflicts, unknown categories, duplicate labels, orphaned parents and unresolved senses. The dictionary's combined “leather, skin, hide” sense is separately flagged for possible internal polysemy rather than silently pretending those alternatives have been independently reviewed.

The ordinary **ਕਾਠ — wood/timber** sense is feminine and belongs to Materials & Substances and Nature. Its separate masculine **physique/body/build/frame** sense belongs to Physical Appearance and Body. Both remain on the same lexical entry; selecting a category or sentence sense determines the displayed meaning and agreement metadata. The wood sense is never labelled anatomy simply because another sense mentions “body”.

Direct singular noun identity/description participation requires an unrestricted source-supported sense, explicit gender and a concise contextual rendering. This permission does not make the noun edible, readable or compatible with every verb. Topic, location, calendar and causal noun phrases require an unambiguous, explicitly supplied source oblique cell. Postpositions are constructed separately. Adjective participation requires reviewed modifier constraints and either all four explicit direct agreement cells or an explicit source indeclinable tag. Bare adjective strings are not automatically manner adverbs. Time and manner adverbs are mapped from exact complete source meanings, with temporal contexts retained; relative or interrogative expressions are not inserted indiscriminately.

Contextual English meanings are selected by a stable sense ID and supported definition head or an explicit reviewed mapping. The complete original dictionary gloss remains accessible. English countability hints are recorded separately from source Punjabi countability; they support articles such as “a mountain” or mass “wood” without claiming a Punjabi countability annotation that the source did not provide. Classification, morphology and contextual rendering remain reproducible software assessments, not claims of native-speaker verification.

`data/authored-category-baselines.js` records the original application's 529 canonical IDs, normalized lexical fingerprints and category IDs from commit `49ded7b`. It contains no replacement lexical text. A known legacy category default is corrected only when its lexical fingerprint and categories still exactly match that baseline, no category edit flag is set, and a reviewed semantic definition head supports the correction. Saved category or lexical changes prevent this migration. Category correction grants no grammatical eligibility. Original Essential Communication and Conversation & Storytelling memberships are reported as informational learning contexts rather than unsupported semantic assertions; genuinely suspicious remaining assignments stay in the review queue.

For exact imported-record counts, category changes and unresolved queues, see [corpus-assessment.json](../reports/corpus-assessment.json). For canonical entry counts after alias deduplication, role bindings and demonstrated template coverage, use [complete-integration-audit.json](../reports/complete-integration-audit.json) and the current implementation report. Source entries, canonical entries, senses and generated phrase bindings are counted separately.

## Modifier usage context

The audit retains limiting adjective source contexts alongside forms. Matching
declension cells alone do not authorize every description: ਕੋਰਾ
“new/unused (for earthen pot)” does not describe an arbitrary chair or door,
and ਧੂੰਆਂਧਾਰ “heavy, pouring (of rain)” does not describe iron. The
representative examples instead select unrestricted ਨਵਾਂ and ਭਾਰਾ senses.
Parenthetical limitations, explicit usage markers and figurative contexts are
assessed throughout the source adjective corpus. Exact supported context
mappings constrain targets; unsupported specialized target senses stay
restricted with reasons, preserving other eligible senses and canonical IDs.
This source-based assessment remains separate from fluent-speaker review.
