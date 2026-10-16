# Bounded sentence-semantics evaluation

Baseline: `332513d279bbd757615d44077860e5acf7f2be14` (merged PR #8). Seed: `20261016`. One baseline capture and one final capture; targeted quota completion is part of each capture. All output comes from the existing application engine. No runtime AI or translation API is used.

| Measure | Baseline | Final |
| --- | ---: | ---: |
| Enabled templates evaluated | 97 | 97 |
| Distinct main bilingual outputs | 17539 | 17504 |
| Distinct main Punjabi surfaces (within template) | 17066 | 17035 |
| Targeted coverage sentences | 6819 | 6541 |
| Total bilingual records analysed | 24358 | 24045 |
| Distinct words used propositionally | 3004 | 2977 |
| Distinct words also reachable as quoted practice | 3111 | 3111 |
| Exercised role/sense bindings | 8533/8661 | 8276/8658 |
| Full-corpus screen: incorrect / questionable | 639 / 1009 | 5 / 2 |
| Full-corpus screen clear (excluding quotes) | 92.17% | 99.97% |
| Main-corpus screen clear (excluding quotes) | 90.60% | 99.98% |
| AI-review sample size (96 content templates) | 544 | 545 |
| AI sample: plausible / incorrect / uncertain | 498 / 18 / 28 | 522 / 2 / 21 |
| AI sample: semantic/grammatical validity | 91.54% | 95.78% |
| AI sample: translation accurate / incorrect / uncertain | 523 / 17 / 4 | 526 / 13 / 6 |
| AI sample: contextual translation accuracy | 96.14% | 96.51% |
| AI sample: natural wording | 84.38% | 93.39% |

The full-corpus screen uses the same frozen explicit rubric for both passes and is not a fluent-speaker correctness score. The separate development-time AI review covers the saved template-stratified samples, not an independent native review of every generated sentence. Sample percentages are descriptive, not calibrated population estimates; uncertainty is not a confirmed error. Quoted-word practice is excluded from quality-rate denominators. Sample decisions use identical criteria; final review slots withdrawn by a regression repair receive deterministic replacement records rather than selecting examples by outcome.

Pass 2 permitted only directly introduced serious regression repairs: authored connector constructions blocked by display eligibility (P79/P81), and empty sense tags incorrectly inheriting other senses’ entry-wide properties. Only the affected connector cases and records referencing affected properties were regenerated; unaffected captured records were retained. The property repair ledger preserves withdrawn examples and role bindings. No further pre-existing quality issues discovered in Pass 2 were patched.

## Findings and implementation

The baseline identified 28 screening root-cause groups across the requested A–G classes: wrong contextual senses, incompatible arguments, grammatical/quantity errors, discourse reference, unnatural realizations, insufficient metadata and uncertain special-context readings.

1354 vocabulary records (1610 senses) received substantive sentence metadata changes. The reusable catalog contains 17 noun-property groups, 49 predicate frames and 60 adjective requirements, plus source-sense review overlays. Capabilities marked false mean unsupported in the ordinary learner construction, not proof of linguistic impossibility.

The existing generators now share a bounded final acceptance check (eight attempts), with earlier pair checks where possible. Sense-specific properties distinguish digital content, fixed geography, portable goods, liquids, solids, physical dimensions and abstract/communicative uses. Source-qualified agents and complement-dependent predicates are checked. Progressive search wording and singular give-away wording retain the existing source sense and Punjabi roles. English mass/count/number hints, possessive determiners and established-actor reference are separated from Punjabi agreement. Original dictionary definitions and meaningful qualifiers are retained.

## Ten source-linked discoveries

| Corpus ID / template | Actual original Punjabi | Actual original English | Class and correction/prevention |
| --- | --- | --- | --- |
| baseline-000014 / P01 | ਮਸੇਰਾ ਸਕੂਲ ਰੱਖਦਾ ਹੈ। | The cousin (maternal aunt's son) holds a school. | B: Fixed institutions/places fail the physical holding frame; choose a manipulable object. |
| baseline-000207 / P02 | ਪੁਰਖ ਨਿੱਕਲਦਾ ਹੈ। | A man rises. | A/F: Reject the sun-only rise binding for a human. The valid come-out sense remains a separate, currently unprofiled construction. |
| baseline-003701 / P19 | ਕੀ ਤੁਸੀਂ ਈਮੇਲ ਰੱਖ ਸਕਦੇ ਹੋ? | Can you hold an email? | B: Digital content is distinct from a physical sheet; holding is rejected while digital keeping/storage remains allowed. |
| baseline-006034 / P31 | ਆਕਲੈਂਡ ਵਿੱਚ ਪੈਸੇ ਹਨ। | There are money in Auckland. | C: English money is singular mass: “There is money in Auckland.” Punjabi ਪੈਸੇ ਹਨ stays plural. |
| baseline-007937 / P42 | ਤੁਹਾਨੂੰ ਕਿੰਨੇ ਪੈਸੇ ਚਾਹੀਦੇ ਹਨ? | How many money do you need? | C: Use “How much money do you need?” while retaining Punjabi plural quantity agreement. |
| baseline-010941 / P58 | ਉਹ ਕਲਮ ਨਾਲ ਈਮੇਲ ਲਿਖਦਾ ਹੈ। | He or she writes an email with the pen. | B: The writing instrument and medium must agree; choose a physical message/letter for a pen. |
| baseline-011368 / P60 | ਸੁਨੇਹਾ ਵੱਡਾ ਹੈ। | The message is renown. | A/F: The nominal English gloss renown is not approved as a predicative adjective; retain the other valid senses and dictionary record. |
| baseline-016927 / P91 | ਇਹ ਕਿਸ ਦਾ ਉਸਤਰਾ ਹੈ? | Whose a razor is this? | C: Whose supplies the determiner: “Whose razor is this?” |
| baseline-000467 / P03 | ਦੇਵਰ ਪਤਝੜ ਵਿੱਚ ਦੁਕਾਨ ਵਿੱਚ ਮੇਜ਼ ਵੰਡਦੀ ਹੈ। | The brother-in-law distributes a table in the shop in autumn. | C/E: Use masculine agreement for devar; a single table uses the existing give-away alternative. |
| baseline-002901 / P15 | ਮਹਿਲ ਮੁੰਗਫਲੀ ਵੰਡਣੀ ਨਹੀਂ ਚਾਹੁੰਦਾ ਹੈ। | The wife does not want to share peanut. | C/G: Peanut receives a singular count determiner. The uncommon wife sense remains explicitly uncertain rather than receiving an invented gender correction. |

## Quotas and coverage

Every enabled template was attempted. The 200 target counts distinct bilingual surfaces, not repeated IDs; different supported senses can share a Punjabi surface, so separate Punjabi-surface counts are also supplied. This does not establish 200 unique Punjabi strings for every template. Shortfalls below are explicit after bounded random sampling and forced-pool completion through every enabled target binding. Fixed questions, numeral identification, counted possession and fixed-clause templates can have fewer than 200 different supported surfaces. No claim is made that every semantic permutation was exhaustively enumerated.

| Template | Baseline distinct | Final distinct |
| --- | ---: | ---: |
| P09 (whatDoing) | 200 | 198 |
| P10 (whereGoing) | 200 | 199 |
| P11 (whenComing) | 200 | 199 |
| P41 (whichWant) | 1 | 1 |
| P42 (amountQuestion) | 4 | 5 |
| P58 (instrument) | 200 | 169 |
| P73 (connector:but) | 199 | 198 |
| P74 (connector:purpose) | 199 | 198 |
| P75 (connector:if) | 200 | 199 |
| P76 (connector:when) | 200 | 199 |
| P78 (connector:however) | 199 | 198 |
| P80 (connector:because) | 199 | 198 |
| P81 (connector:therefore) | 199 | 198 |
| P82 (connector:although) | 199 | 198 |
| P86 (connector:finally) | 200 | 199 |
| P87 (numberIdentity) | 21 | 21 |
| P89 (question:who) | 1 | 1 |
| P91 (question:whose) | 95 | 104 |
| P92 (question:else) | 1 | 1 |
| P93 (question:duration) | 1 | 1 |
| P94 (question:distance) | 1 | 1 |
| P95 (question:count) | 1 | 1 |
| P96 (countedPossession) | 20 | 20 |
| P97 (connector:reasonResult) | 199 | 198 |

All 3111 dictionary entries remain; 0 original definitions changed. Coverage files retain every enabled binding and its demonstrated/unreached status, and the lexicon captures the reasons for unsupported roles. Per-template vocabulary/role counts and all source sense IDs are in `comparison.json` and the compressed corpora.

## Remaining limitations

- Source dictionaries and English definition heads remain imperfect. Ambiguous heads such as military drill versus a drill tool, uncommon kinship senses, and some imported gender labels need further source/native adjudication. They are not marked fluent-reviewed.
- Predicative news still has an English agreement gap; some topic phrases lack articles, source/causal clauses can be unnatural, and a full-size vehicle can still appear in a small room. These Pass 2 findings are documented rather than starting another implementation cycle.
- Some valid Punjabi readings lack an approved argument-profile binding (for example the human come-out reading alongside a sun-only rise sense). Unsupported bindings are skipped; the vocabulary and dictionary senses remain available.
- Conservative ordinary-context rules can under-generate figurative, metonymic, ownership or specialised uses. They also cannot ensure that two individually plausible connected events are a likely real-world story.
- Long meaning-bearing kinship explanations and uncommon loanword definitions can remain less idiomatic. No Google Translate-level or 100% correctness claim is made.

## Reproduction and focused validation

To reproduce the saved assessments without generation: `node scripts/assess-sentence-semantics.js baseline`, `node scripts/assess-sentence-semantics.js final`, then `node scripts/sentence-semantics-report.js`. Fresh capture commands are `node scripts/evaluate-sentence-semantics.js baseline 332513d279bbd757615d44077860e5acf7f2be14` and `node scripts/evaluate-sentence-semantics.js final`. Saved AI annotations are tied to corpus hashes: a fresh, different capture requires new development-time language adjudication and will not silently reuse the old scores. Regression repairs and their seeds/withdrawn cases are recorded in the final summary and repair ledger. No API performs the review.

Focused checks: comprehensive semantic rules (7 initial cases plus the two directly introduced connector/property-scope regression cases), existing contextual-generation regressions (10 including subcases), lexical semantics (26; two affected cases rerun after the transfer-affordance correction), grammar engine (13), and sentence projection (2): 60 cases passed across the bounded runs. No application-wide build/lint/test cycle was run.

Dictionary data originates from the repository’s English Wiktionary/Kaikki snapshots (CC BY-SA); original source attribution and URLs remain in `data/source-evidence.js` and the original datasets. Dictionary definitions are unchanged.