# Connector and compact vocabulary implementation report

Date: 2026-10-13 (UTC). Repository: `bulletgoose/punjabi-app`. Branch: `feature/connectors-compact-sentence-vocabulary`. [Pull request #7](https://github.com/bulletgoose/punjabi-app/pull/7).

This follow-up implements the user’s connector, cleanup and compact Vocabulary request on the existing PR #6 application. It does not rebuild the app. The latest instruction authorizes merge and publication after validation. The previous release remains documented in [IMPLEMENTATION_REPORT.md](IMPLEMENTATION_REPORT.md); its larger catalog figures describe the historical pre-cleanup release.

All **15 requested connectors** and **14 existing question blocks** have actual bilingual construction demonstrations. **26 templates** were added (P72–P97), giving **104 total / 97 enabled**. The pristine shared catalog contains **3,111 lexical entries / 5,131 senses** after **2,469 spreadsheet “No” entries** were retired and **79 duplicates** consolidated. **3,012 entries** were demonstrated in ordinary constructions, and **all 3,111** can participate in explicit quoted-word practice. Those measures are separate: quotation does not verify a word’s conversational inflections or argument structure. Newly added vocabulary obtains citation eligibility immediately, while conversational eligibility still requires its grammatical evidence.

## Completed work

- Preserved the unified lexical, grammar and thematic systems; the 5,184-record / 8,190-sense source evidence and all 254 verb profiles are unchanged. Raw source data remains archived for provenance, while retired records are absent from the active default catalog.
- Added actual placement and assembly rules for and, but, so that, if, when, then, however, or, because, therefore, although, also, first, after that and finally.
- Integrated additional questions and numbers; retained the existing adjective/state constructions. Added bounded counted-book possession and numeral identification. Canonical-word citation practice supports retained entries whose broader grammar is unresolved.
- Removed Word Game-only Building Block tabs. Vocabulary and Word Game query the same central vocabulary API. Internal compatibility bindings remain for old saves and grammatical constructions; they are not separate vocabulary datasets.
- Replaced large Vocabulary cards with compact rows: one-word English heading, Gurmukhi, Roman Punjabi, part of speech, meaning of at most ten words, mastery bar and expandable Meaning. Full definitions are preserved. Review metadata remains in records rather than the default learner interface.
- Preserved saved sentences, saved words, personal translations, custom templates, disabled settings and learning histories through migration and reload. Corrected the anatomical eye-pupil sense so it cannot supply a human work/sleep subject.
- Updated the offline shell to v15, precached the new modules, and changed runtime asset URLs to avoid reuse of previous-release JavaScript by an installed PWA. Firebase, pronunciation, audio IndexedDB and hosting infrastructure were not changed.

## A. Vocabulary, evidence and truthful review states

| Measure | Active entries |
| --- | ---: |
| Assessed | 3,111 |
| Complete metadata for supported grammatical constructions | 3,061 |
| Complete supported semantic classification | 1,668 |
| Checksum-aligned source-supported entries | 2,671 |
| Source-cell or reference-supported morphology | 1,113 |
| Actual fluent-speaker reviews | 0 |
| Awaiting independent fluent-speaker review | 3,111 |

“Complete” is bounded by the supported construction, not every tense, case, meaning or dialect. All active records retain separate core completeness, schema, source, morphology, construction, confidence, human-review and eligibility states. The existing lexical audit reports **50** functional records outside its eight main roles and adjective/state assessment. Their connector, question and numeral constructions are validated separately below; this older assessment is not a claim that those functional constructions remain unavailable. **99** have no ordinary-construction demonstration in the constrained audit, including eligible entries that the sampler did not exercise successfully. All have canonical-word citation coverage; none is falsely marked native-reviewed.

Unresolved reasons and sense-level restrictions are listed in [the review queue](../reports/vocabulary-review-queue.json) and [the complete audit](../reports/complete-integration-audit.json). Parenthetical semantic qualifications must not be discarded before classification: “pupil (of the eye)” is anatomy, not a student. Independent review of source ambiguity, unusual senses, register, dialect, modifier restrictions and argument structure remains necessary.

### What happened to the spreadsheet statuses

Counts below map the original review-sheet IDs through duplicate redirects. Distinct status groups can converge on the same surviving lexical ID; their counts must not be summed as a new catalog total.

| Original status | Original rows | Surviving lexical IDs | Ordinary constructions demonstrated | Word practice |
| --- | ---: | ---: | ---: | ---: |
| Yes — main sentence roles | 2825 | 2804 | 2792 | 2804 |
| Yes — additional lists | 362 | 354 | 267 | 354 |
| Listed, but disabled | 3 | 3 | 3 | 3 |
| No | 2469 | 0 | 0 | 0 |

All additional-list and previously disabled rows were evaluated. Some source nouns gained direct WHAT bindings; adjectives/states retain only supported agreement and semantic targets. Numerals, questions and connectors have explicit constructions. An entry with only citation support is not claimed to work as an arbitrary noun phrase, adjective or finite predicate.

## B. Cleanup and categories

The removal list is the exact **2,469 IDs marked “No”** in the existing review sheet, measured from baseline `499e191`. The immutable catalog policy blocks the retired source IDs, and user deletion tombstones are retained. Derived policy tombstones and citation aliases are rebuilt rather than duplicated in compact saves, so shipped source imports do not restore deleted entries. Personal edits/custom vocabulary are protected and can make a user’s catalog larger than the pristine 3,111 count. Historical saved sentences and word records are retained.

Duplicate consolidation is intentionally bounded: the same normalized Gurmukhi spelling, part of speech and concise primary meaning, without a conflicting known gender. Previously authored application IDs are preferred over newly imported duplicates. This is not a measured spoken-frequency ranking, and distinct regional words, homographs and genuine senses are not silently deleted just because they share an English heading. Matching senses and categories are preserved, aliases redirect, Word Game answer totals combine, and the latest memory card is retained.

For breakfast, the duplicate ਨਾਸ਼ਤਾ with Roman nāshtā/nāśtā is consolidated into the original `what-nashta` entry. ਨਿਹਾਰੀ remains a distinct word with source senses; it is not an inflected form of nāshtā. Review of genuinely different Punjabi synonyms remains a human choice rather than fuzzy automatic deletion.

There are **36 changed category sets** among surviving entries, including category/sense preservation during duplicate consolidation and the eye-pupil correction. **0** surviving entries moved out of General by reclassification in this follow-up; the reduction from 2,085 to 1,174 General memberships mainly reflects retirement. No new thematic categories were required. Sense-specific category views remain supported: ਕਾਠ uses wood under materials/nature and physique under body, without replacing either dictionary sense.

| Example | Before | After |
| --- | --- | --- |
| ਨਾਸ਼ਤਾ | Two records with transliteration conventions | One entry with preserved senses, aliases and progress |
| ਤਾਰਾ, anatomical eye-pupil sense | Could receive human/occupation permission from “pupil” | Anatomy; excluded from human work/sleep clauses |
| ਕਾਠ | Ordinary wood and alternate physique senses | Regression preserved: wood is not mislabeled as body; physique remains sense-specific |
| ਕਿਉਂਕਿ / ਇਸ ਕਰਕੇ | Repeated reason/connector lexical records | Surviving connector IDs with preserved reason aliases and category context |

Category diagnostics remain explicit: unresolved sense categories and authored learning-context differences are not claimed fixed merely by cleanup. The complete audit includes the actual diagnostic records. Multi-category memberships can reflect different senses and do not sum to the number of entries.

### Active category membership counts

| Category | Entries |
| --- | ---: |
| abstract | 86 |
| actions | 113 |
| activities | 35 |
| anatomy | 126 |
| animals | 177 |
| appearance | 6 |
| body | 132 |
| business | 49 |
| causality | 13 |
| celebrations | 2 |
| clothing | 78 |
| colors | 17 |
| communication | 99 |
| construction | 38 |
| culture | 151 |
| descriptions | 86 |
| education | 99 |
| emotions | 127 |
| essential | 41 |
| family | 81 |
| food | 223 |
| functional | 3 |
| general | 1174 |
| geography | 77 |
| health | 188 |
| home | 139 |
| kitchen | 53 |
| materials | 77 |
| medical | 36 |
| movement | 21 |
| nature | 493 |
| numbers | 62 |
| objects | 76 |
| opinions | 24 |
| people | 231 |
| personality | 39 |
| places | 194 |
| plants | 113 |
| produce | 162 |
| quantities | 41 |
| shopping | 49 |
| society | 70 |
| sport | 28 |
| storytelling | 30 |
| technology | 16 |
| time | 129 |
| tools | 45 |
| travel | 31 |
| weather | 65 |
| work | 108 |

## C. Building Block integration

Counts are unique canonical lexical entries, excluding disabled bindings. Generated postpositional phrases are counted separately in the JSON audit. Drops can reflect duplicate consolidation or correction, rather than lost source evidence.

| Role | Before enabled entries | After enabled entries | After ordinary demonstrations |
| --- | ---: | ---: | ---: |
| WHO | 188 | 186 | 186 |
| WHEN | 75 | 70 | 70 |
| WHERE | 81 | 81 | 81 |
| WHAT | 2522 | 2671 | 2584 |
| HOW | 42 | 42 | 33 |
| WHY | 27 | 30 | 26 |
| ABOUT | 935 | 921 | 921 |
| VERB | 124 | 116 | 116 |

| Additional role | Enabled lexical entries | Ordinary demonstrations |
| --- | ---: | ---: |
| ADJECTIVE | 98 | 97 |
| STATE | 37 | 37 |
| QUESTION | 14 | 14 |
| CONNECTOR | 15 | 15 |
| NUMBER | 21 | All 21 numeral identities; one–twenty also counted books |
| WORD | 3,111 | All 3,111 quoted canonical forms; reported separately |

Ordinary-construction coverage increased from **2,939** to **3,012** demonstrated lexical entries despite the smaller catalog. The eight primary roles demonstrate **2,853** unique entries (before: 2,812). Auxiliary descriptions, questions and connectors account for additional coverage. Counts are software existence demonstrations, not exhaustive linguistic approval of every cross-product combination.

## D. Grammar and template expansion

| Coverage | Before | After |
| --- | ---: | ---: |
| Bound verbs / full habitual coverage | 124 | 116 |
| Full supported finite-future coverage | 104 | 96 |
| Full supported perfective coverage | 110 | 100 |
| Total templates | 78 | 104 |
| Enabled templates | 71 | 97 |

The canonical verb counts decrease because duplicates/retired entries are consolidated; all 254 dictionary morphology profiles remain preserved. This follow-up adds connective, question and numeral constructions rather than claiming new unsupported finite paradigms. Existing SOV, habitual agreement, gender/number, split ergativity, postpositions, obliques, tense/aspect, negation and question behavior remain covered by tests.

P72–P86 cover the 15 connectors. Purpose uses explicitly authored person/number subjunctive forms of ਸਕ, without gender inflection. Although uses Punjabi ਭਾਵੇਂ … ਪਰ while natural English omits the redundant “but.” Also is placed after its subject before the predicate. Cause/result samples use a work/tired relation. Human connector subjects require a compatible selected sense, not an entry-level thematic label.

P87 identifies a numeral. P88 quotes a canonical word with ਕਹੋ and does not guess its inflection. P89–P95 add who, whom, whose, what else, duration, distance and independent quantity questions; existing where/when/why/how/which/polar questions remain. Duration uses masculine ਕਿੰਨਾ ਚਿਰ. P97 adds the previously disabled ਇਸ ਲਈ reason marker in its own result construction. P96 supplies explicitly checked ਕਿਤਾਬ / ਕਿਤਾਬਾਂ and ਹੈ / ਹਨ for one–twenty books; this does not authorize guessed pluralization of every noun. See [grammar sources](GRAMMAR_SOURCES.md).

User template names, enabled settings, probabilities and custom slots remain preserved. The 26 new templates are enabled by default; no new source entry bypasses grammatical/sense restrictions to supply a finite predicate.

## E. Contextual translations and breakdown

[24 regenerated source-linked examples](CONTEXTUAL_TRANSLATION_EXAMPLES.md) cover **18 thematic categories**, including **19 examples with multiple imported dictionary meanings**. Each includes Gurmukhi, Roman Punjabi, natural English, contextual components, alternative dictionary definitions, stable sense IDs and selection/form explanations. The report uses actual current generator output; it is not an independent fluent-speaker validation.

Vocabulary headings are concise display labels; canonical definitions and structured senses are unchanged. Multiword contextual meanings such as “so that” remain valid grammatical translations. The existing Enhanced Sentence Breakdown retains matching contextual meanings, expandable lexical/grammar details and canonical IDs. Metadata review walls are hidden without altering truthful background provenance.

### Actual generated examples for all 26 new templates

#### P72 — Coordination: and

ਤੁਸੀਂ ਛਿੱਕਦੇ ਹੋ ਅਤੇ ਤੁਸੀਂ ਖੇਡਦੇ ਹੋ।

tusī̃ chikkde ho ate tusī̃ kheḍde ho.

You sneeze and you play.

| Punjabi | Roman Punjabi | Contextual meaning | Role |
| --- | --- | --- | --- |
| ਤੁਸੀਂ | tusī̃ | you | subject |
| ਛਿੱਕਦੇ ਹੋ | chikkde ho | sneeze | verb |
| ਅਤੇ | ate | and | connector |
| ਤੁਸੀਂ | tusī̃ | you | subject |
| ਖੇਡਦੇ ਹੋ | kheḍde ho | play | verb |

Alternative dictionary meanings: kheḍṇā: To play.

Selection/form explanation: Direct subject with person/number agreement. Habitual agreement follows the selected subject. Discourse marker placement belongs to this clause pattern.

#### P73 — Contrast: but

ਕਾਕਾ ਥੱਕਿਆ ਹੈ ਪਰ ਕਾਕਾ ਕੰਮ ਕਰਦਾ ਹੈ।

kākā thakkiā hai par kākā kam kardā hai.

A boy is tired but a boy works.

| Punjabi | Roman Punjabi | Contextual meaning | Role |
| --- | --- | --- | --- |
| ਕਾਕਾ | kākā | a boy | subject |
| ਥੱਕਿਆ | thakkiā | tired | state |
| ਹੈ | hai | is | auxiliary |
| ਪਰ | par | but | connector |
| ਕਾਕਾ | kākā | a boy | subject |
| ਕੰਮ ਕਰਦਾ ਹੈ | kam kardā hai | works | verb |

Alternative dictionary meanings: kākā: child, baby; son; brother (affectionate address for any younger male peer).

Selection/form explanation: Direct subject with person/number agreement. Adjective agrees with the selected subject. Construction marker. Discourse marker placement belongs to this clause pattern. Habitual agreement follows the selected subject.

#### P74 — Purpose: so that

ਅਮੀਰ ਕੰਮ ਕਰਦਾ ਹੈ ਤਾਂ ਜੋ ਅਮੀਰ ਸੌਂ ਸਕੇ।

amīr kam kardā hai tā̃ jo amīr sau sake.

The rich man works so that the rich man can sleep.

| Punjabi | Roman Punjabi | Contextual meaning | Role |
| --- | --- | --- | --- |
| ਅਮੀਰ | amīr | the rich man | subject |
| ਕੰਮ ਕਰਦਾ ਹੈ | kam kardā hai | works | verb |
| ਤਾਂ ਜੋ | tā̃ jo | so that | connector |
| ਅਮੀਰ | amīr | the rich man | subject |
| ਸੌਂ ਸਕੇ | sau sake | can sleep | verb |

Alternative dictionary meanings: amīr: emir, chief, ruler.

Selection/form explanation: Direct subject with person/number agreement. Habitual agreement follows the selected subject. Discourse marker placement belongs to this clause pattern. Purpose clause uses the explicit person/number subjunctive of sak; it does not inflect for gender.

#### P75 — Condition: if … then

ਜੇ ਔਰਤ ਥੱਕੀ ਹੈ ਤਾਂ ਔਰਤ ਸੌਂਦੀ ਹੈ।

je aurat thakkī hai tā̃ aurat saundī hai.

If a woman is tired, then a woman sleeps.

| Punjabi | Roman Punjabi | Contextual meaning | Role |
| --- | --- | --- | --- |
| ਜੇ | je | if | connector |
| ਔਰਤ | aurat | a woman | subject |
| ਥੱਕੀ | thakkī | tired | state |
| ਹੈ | hai | is | auxiliary |
| ਤਾਂ | tā̃ | then | consequent |
| ਔਰਤ | aurat | a woman | subject |
| ਸੌਂਦੀ ਹੈ | saundī hai | sleeps | verb |

Selection/form explanation: Discourse marker placement belongs to this clause pattern. Direct subject with person/number agreement. Adjective agrees with the selected subject. Construction marker. Habitual agreement follows the selected subject.

#### P76 — Time: when

ਜਦੋਂ ਅਜ਼ਾਦ ਖਿਆਲ ਥੱਕਿਆ ਹੈ ਤਾਂ ਅਜ਼ਾਦ ਖਿਆਲ ਸੌਂਦਾ ਹੈ।

jadō̃ azād khiāla thakkiā hai tā̃ azād khiāla saundā hai.

When the freethinker is tired, then the freethinker sleeps.

| Punjabi | Roman Punjabi | Contextual meaning | Role |
| --- | --- | --- | --- |
| ਜਦੋਂ | jadō̃ | when | connector |
| ਅਜ਼ਾਦ ਖਿਆਲ | azād khiāla | the freethinker | subject |
| ਥੱਕਿਆ | thakkiā | tired | state |
| ਹੈ | hai | is | auxiliary |
| ਤਾਂ | tā̃ | then | consequent |
| ਅਜ਼ਾਦ ਖਿਆਲ | azād khiāla | the freethinker | subject |
| ਸੌਂਦਾ ਹੈ | saundā hai | sleeps | verb |

Selection/form explanation: Discourse marker placement belongs to this clause pattern. Direct subject with person/number agreement. Adjective agrees with the selected subject. Construction marker. Habitual agreement follows the selected subject.

#### P77 — Sequence: then

ਅਜ਼ਾਦ ਖਿਆਲ ਖੇਡਦਾ ਹੈ ਫਿਰ ਅਜ਼ਾਦ ਖਿਆਲ ਤਰਦਾ ਹੈ।

azād khiāla kheḍdā hai phir azād khiāla tardā hai.

The freethinker plays and then the freethinker swims.

| Punjabi | Roman Punjabi | Contextual meaning | Role |
| --- | --- | --- | --- |
| ਅਜ਼ਾਦ ਖਿਆਲ | azād khiāla | the freethinker | subject |
| ਖੇਡਦਾ ਹੈ | kheḍdā hai | plays | verb |
| ਫਿਰ | phir | then | connector |
| ਅਜ਼ਾਦ ਖਿਆਲ | azād khiāla | the freethinker | subject |
| ਤਰਦਾ ਹੈ | tardā hai | swims | verb |

Alternative dictionary meanings: kheḍṇā: To play / tarnā: to swim (across); to be liberated; (of debt) to be repaid.

Selection/form explanation: Direct subject with person/number agreement. Habitual agreement follows the selected subject. Discourse marker placement belongs to this clause pattern.

#### P78 — Contrast: however

ਅਦੀਬ ਥੱਕਿਆ ਹੈ ਲੇਕਿਨ ਅਦੀਬ ਕੰਮ ਕਰਦਾ ਹੈ।

adīb thakkiā hai lekin adīb kam kardā hai.

The litterateur is tired; however, the litterateur works.

| Punjabi | Roman Punjabi | Contextual meaning | Role |
| --- | --- | --- | --- |
| ਅਦੀਬ | adīb | the litterateur | subject |
| ਥੱਕਿਆ | thakkiā | tired | state |
| ਹੈ | hai | is | auxiliary |
| ਲੇਕਿਨ | lekin | however | connector |
| ਅਦੀਬ | adīb | the litterateur | subject |
| ਕੰਮ ਕਰਦਾ ਹੈ | kam kardā hai | works | verb |

Selection/form explanation: Direct subject with person/number agreement. Adjective agrees with the selected subject. Construction marker. Discourse marker placement belongs to this clause pattern. Habitual agreement follows the selected subject.

#### P79 — Alternative: or

ਅਫ਼ਸਰ ਕਰਾਹਦਾ ਹੈ ਜਾਂ ਅਫ਼ਸਰ ਤੁਰਦਾ ਹੈ।

afsar karāhdā hai jā̃ afsar turdā hai.

The officer groans or the officer strolls.

| Punjabi | Roman Punjabi | Contextual meaning | Role |
| --- | --- | --- | --- |
| ਅਫ਼ਸਰ | afsar | the officer | subject |
| ਕਰਾਹਦਾ ਹੈ | karāhdā hai | groans | verb |
| ਜਾਂ | jā̃ | or | connector |
| ਅਫ਼ਸਰ | afsar | the officer | subject |
| ਤੁਰਦਾ ਹੈ | turdā hai | strolls | verb |

Alternative dictionary meanings: turnā: to walk; to walk away, go away, depart.

Selection/form explanation: Direct subject with person/number agreement. Habitual agreement follows the selected subject. Discourse marker placement belongs to this clause pattern.

#### P80 — Reason: because

ਉਸਤਾਦ ਥੱਕਿਆ ਹੈ ਕਿਉਂਕਿ ਉਸਤਾਦ ਕੰਮ ਕਰਦਾ ਹੈ।

usatād thakkiā hai kiũki usatād kam kardā hai.

A teacher is tired because a teacher works.

| Punjabi | Roman Punjabi | Contextual meaning | Role |
| --- | --- | --- | --- |
| ਉਸਤਾਦ | usatād | a teacher | subject |
| ਥੱਕਿਆ | thakkiā | tired | state |
| ਹੈ | hai | is | auxiliary |
| ਕਿਉਂਕਿ | kiũki | because | connector |
| ਉਸਤਾਦ | usatād | a teacher | subject |
| ਕੰਮ ਕਰਦਾ ਹੈ | kam kardā hai | works | verb |

Alternative dictionary meanings: kiũki: because.

Selection/form explanation: Direct subject with person/number agreement. Adjective agrees with the selected subject. Construction marker. Discourse marker placement belongs to this clause pattern. Habitual agreement follows the selected subject.

#### P81 — Result: therefore

ਆੜੀ ਕੰਮ ਕਰਦਾ ਹੈ ਇਸ ਕਰਕੇ ਆੜੀ ਥੱਕਿਆ ਹੈ।

āṛī kam kardā hai is karke āṛī thakkiā hai.

A friend works; therefore, a friend is tired.

| Punjabi | Roman Punjabi | Contextual meaning | Role |
| --- | --- | --- | --- |
| ਆੜੀ | āṛī | a friend | subject |
| ਕੰਮ ਕਰਦਾ ਹੈ | kam kardā hai | works | verb |
| ਇਸ ਕਰਕੇ | is karke | therefore | connector |
| ਆੜੀ | āṛī | a friend | subject |
| ਥੱਕਿਆ | thakkiā | tired | state |
| ਹੈ | hai | is | auxiliary |

Alternative dictionary meanings: āṛī: friendship / is karke: because of this / therefore.

Selection/form explanation: Direct subject with person/number agreement. Habitual agreement follows the selected subject. Discourse marker placement belongs to this clause pattern. Adjective agrees with the selected subject. Construction marker.

#### P82 — Concession: although

ਭਾਵੇਂ ਤੂੰ ਥੱਕਿਆ ਹੈਂ ਪਰ ਤੂੰ ਕੰਮ ਕਰਦਾ ਹੈਂ।

bhāvē̃ tū̃ thakkiā haĩ par tū̃ kam kardā haĩ.

Although you are tired, you work.

| Punjabi | Roman Punjabi | Contextual meaning | Role |
| --- | --- | --- | --- |
| ਭਾਵੇਂ | bhāvē̃ | although | connector |
| ਤੂੰ | tū̃ | you | subject |
| ਥੱਕਿਆ | thakkiā | tired | state |
| ਹੈਂ | haĩ | are | auxiliary |
| ਪਰ | par | but | connector |
| ਤੂੰ | tū̃ | you | subject |
| ਕੰਮ ਕਰਦਾ ਹੈਂ | kam kardā haĩ | work | verb |

Selection/form explanation: Discourse marker placement belongs to this clause pattern. Direct subject with person/number agreement. Adjective agrees with the selected subject. Construction marker. Punjabi concessive pairing; natural English omits redundant but. Habitual agreement follows the selected subject.

#### P83 — Addition: also

ਕਾਕਾ ਵੀ ਚੱਲਦਾ ਹੈ।

kākā vī calldā hai.

The brother also walks.

| Punjabi | Roman Punjabi | Contextual meaning | Role |
| --- | --- | --- | --- |
| ਕਾਕਾ | kākā | the brother | subject |
| ਵੀ | vī | also | connector |
| ਚੱਲਦਾ ਹੈ | calldā hai | walks | verb |

Alternative dictionary meanings: kākā: child, baby; son; boy, lad (term of endearment for any young male).

Selection/form explanation: Direct subject with person/number agreement. Discourse marker placement belongs to this clause pattern. Habitual agreement follows the selected subject.

#### P84 — Sequence: first

ਪਹਿਲਾਂ ਕਾਕਾ ਡੁੱਬਦਾ ਹੈ।

pehlā̃ kākā ḍubbdā hai.

First, the brother dives.

| Punjabi | Roman Punjabi | Contextual meaning | Role |
| --- | --- | --- | --- |
| ਪਹਿਲਾਂ | pehlā̃ | first | connector |
| ਕਾਕਾ | kākā | the brother | subject |
| ਡੁੱਬਦਾ ਹੈ | ḍubbdā hai | dives | verb |

Alternative dictionary meanings: kākā: child, baby; son; boy, lad (term of endearment for any young male) / ḍubbaṇā: to set (of moon, sun, etc.); to be lost, unrecoverable.

Selection/form explanation: Discourse marker placement belongs to this clause pattern. Direct subject with person/number agreement. Habitual agreement follows the selected subject.

#### P85 — Sequence: after that

ਉਸ ਤੋਂ ਬਾਅਦ ਤੁਸੀਂ ਉਗਮਦੇ ਹੋ।

us tō̃ bāad tusī̃ ugamde ho.

After that, you rise.

| Punjabi | Roman Punjabi | Contextual meaning | Role |
| --- | --- | --- | --- |
| ਉਸ ਤੋਂ ਬਾਅਦ | us tō̃ bāad | after that | connector |
| ਤੁਸੀਂ | tusī̃ | you | subject |
| ਉਗਮਦੇ ਹੋ | ugamde ho | rise | verb |

Alternative dictionary meanings: ugamṇā: to appear,; to emerge; to emanate; to take birth.

Selection/form explanation: Discourse marker placement belongs to this clause pattern. Direct subject with person/number agreement. Habitual agreement follows the selected subject.

#### P86 — Sequence: finally

ਆਖ਼ਰ ਵਿੱਚ ਇਸਤਰੀ ਸੌਂਦੀ ਹੈ।

ākhar vich isatrī saundī hai.

Finally, a woman sleeps.

| Punjabi | Roman Punjabi | Contextual meaning | Role |
| --- | --- | --- | --- |
| ਆਖ਼ਰ ਵਿੱਚ | ākhar vich | finally | connector |
| ਇਸਤਰੀ | isatrī | a woman | subject |
| ਸੌਂਦੀ ਹੈ | saundī hai | sleeps | verb |

Alternative dictionary meanings: isatrī: clothes iron.

Selection/form explanation: Discourse marker placement belongs to this clause pattern. Direct subject with person/number agreement. Habitual agreement follows the selected subject.

#### P87 — Identify a number

ਇਹ ਨੌਂ ਹੈ।

eh naũ hai.

This is nine.

| Punjabi | Roman Punjabi | Contextual meaning | Role |
| --- | --- | --- | --- |
| ਇਹ | eh | this | demonstrative |
| ਨੌਂ | naũ | nine | quantity |
| ਹੈ | hai | is | auxiliary |

Selection/form explanation: Construction marker. Identifies the numeral itself; no counted-noun agreement is inferred.

#### P88 — Practice saying a word

“ਮੇਰੇ ਮਾਂ-ਪਿਓ” ਕਹੋ।

“mere mā̃-piō” kaho.

Say “mere mā̃-piō”.

| Punjabi | Roman Punjabi | Contextual meaning | Role |
| --- | --- | --- | --- |
| “ਮੇਰੇ ਮਾਂ-ਪਿਓ” | “mere mā̃-piō” | “mere mā̃-piō” | word |
| ਕਹੋ | kaho | say | imperative |

Selection/form explanation: Quoted dictionary form: no inflection or conversational argument structure is inferred. Construction marker.

#### P89 — Who is this?

ਇਹ ਕੌਣ ਹੈ?

eh kaun hai?

Who is this?

| Punjabi | Roman Punjabi | Contextual meaning | Role |
| --- | --- | --- | --- |
| ਇਹ | eh | this | demonstrative |
| ਕੌਣ | kaun | who | question |
| ਹੈ | hai | is | auxiliary |

Selection/form explanation: Construction marker. Personal identity question.

#### P90 — To whom?

ਤੁਸੀਂ ਕਿਸ ਨੂੰ ਬੋਤਲ ਦਿੰਦੇ ਹੋ?

tusī̃ kis nū̃ botal dinde ho?

To whom do you give a bottle?

| Punjabi | Roman Punjabi | Contextual meaning | Role |
| --- | --- | --- | --- |
| ਤੁਸੀਂ | tusī̃ | you | subject |
| ਕਿਸ ਨੂੰ | kis nū̃ | to whom | question |
| ਬੋਤਲ | botal | bottle | object |
| ਦਿੰਦੇ ਹੋ | dinde ho | give | verb |

Selection/form explanation: Polite second-person subject. Dative/recipient interrogative. Direct object of give. Polite subject controls gender and number agreement.

#### P91 — Whose object?

ਇਹ ਕਿਸ ਦੀ ਦਵਾਈ ਹੈ?

eh kis dī davāī hai?

Whose medicine is this?

| Punjabi | Roman Punjabi | Contextual meaning | Role |
| --- | --- | --- | --- |
| ਇਹ | eh | this | demonstrative |
| ਕਿਸ ਦੀ | kis dī | whose | question |
| ਦਵਾਈ | davāī | medicine | object |
| ਹੈ | hai | is | auxiliary |

Selection/form explanation: Construction marker. Possessive question agrees with possessed noun. Direct singular possessed noun.

#### P92 — What else?

ਹੋਰ ਕੀ ਚਾਹੀਦਾ ਹੈ?

hor kī chāhīdā hai?

What else is needed?

| Punjabi | Roman Punjabi | Contextual meaning | Role |
| --- | --- | --- | --- |
| ਹੋਰ ਕੀ | hor kī | what else | question |
| ਚਾਹੀਦਾ ਹੈ | chāhīdā hai | is needed | predicate |

Selection/form explanation: Additional-thing question. Construction marker.

#### P93 — How long?

ਤੁਸੀਂ ਕਿੰਨਾ ਚਿਰ ਇੰਤਜ਼ਾਰ ਕਰਦੇ ਹੋ?

tusī̃ kinnā cir intazār karde ho?

How long do you wait?

| Punjabi | Roman Punjabi | Contextual meaning | Role |
| --- | --- | --- | --- |
| ਤੁਸੀਂ | tusī̃ | you | subject |
| ਕਿੰਨਾ ਚਿਰ | kinnā cir | how long | question |
| ਇੰਤਜ਼ਾਰ ਕਰਦੇ ਹੋ | intazār karde ho | wait | verb |

Selection/form explanation: Polite second-person subject. Duration question uses masculine cir. Polite subject controls gender and number agreement.

#### P94 — How far?

ਤੁਸੀਂ ਕਿੰਨੀ ਦੂਰ ਜਾਂਦੇ ਹੋ?

tusī̃ kinnī dūr jānde ho?

How far do you go?

| Punjabi | Roman Punjabi | Contextual meaning | Role |
| --- | --- | --- | --- |
| ਤੁਸੀਂ | tusī̃ | you | subject |
| ਕਿੰਨੀ ਦੂਰ | kinnī dūr | how far | question |
| ਜਾਂਦੇ ਹੋ | jānde ho | go | verb |

Selection/form explanation: Polite second-person subject. Distance question. Polite subject controls gender and number agreement.

#### P95 — How many?

ਕਿੰਨੇ ਚਾਹੀਦੇ ਹਨ?

kinne chāhīde han?

How many are needed?

| Punjabi | Roman Punjabi | Contextual meaning | Role |
| --- | --- | --- | --- |
| ਕਿੰਨੇ | kinne | how many | question |
| ਚਾਹੀਦੇ ਹਨ | chāhīde han | are needed | predicate |

Selection/form explanation: Independent quantity interrogative. Construction marker.

#### P96 — Possess a counted set of books

ਮੇਰੇ ਕੋਲ ਤਿੰਨ ਕਿਤਾਬਾਂ ਹਨ।

mere kol tinn kitābā̃ han.

I have three books.

| Punjabi | Roman Punjabi | Contextual meaning | Role |
| --- | --- | --- | --- |
| ਮੇਰੇ ਕੋਲ | mere kol | I | possessor |
| ਤਿੰਨ | tinn | three | quantity |
| ਕਿਤਾਬਾਂ | kitābā̃ | books | object |
| ਹਨ | han | are | auxiliary |

Selection/form explanation: Checked oblique possessive phrase. Cardinal numeral in a counted noun phrase. Explicit regular feminine consonant-stem plural; reference grammar §5.4. Construction marker.

#### P97 — Result: for this reason

ਅਫ਼ਸਰ ਕੰਮ ਕਰਦਾ ਹੈ ਇਸ ਲਈ ਅਫ਼ਸਰ ਥੱਕਿਆ ਹੈ।

afsar kam kardā hai is laī afsar thakkiā hai.

The officer works; for this reason, the officer is tired.

| Punjabi | Roman Punjabi | Contextual meaning | Role |
| --- | --- | --- | --- |
| ਅਫ਼ਸਰ | afsar | the officer | subject |
| ਕੰਮ ਕਰਦਾ ਹੈ | kam kardā hai | works | verb |
| ਇਸ ਲਈ | is laī | for this reason | reason |
| ਅਫ਼ਸਰ | afsar | the officer | subject |
| ਥੱਕਿਆ | thakkiā | tired | state |
| ਹੈ | hai | is | auxiliary |

Selection/form explanation: Direct subject with person/number agreement. Habitual agreement follows the selected subject. Discourse marker placement belongs to this clause pattern. Adjective agrees with the selected subject. Construction marker.

## F. Validation, migrations, performance and limitations

| Validation | Result |
| --- | --- |
| Automated cases | 170 passed; 0 failed; 0 skipped |
| Whole active catalog | 3,111 assessed; 3,111 canonical-word citation constructions exercised |
| Template audit | Ten deterministic attempts for each of 97 enabled templates; every template succeeded |
| Connectors and questions | All 15 connectors / all 14 question blocks demonstrated |
| Browser/offline generation | Every available template exercised online/offline; templates with disabled required words tested for refusal |

The browser migration fixture deliberately disables P04 and the book block needed by P96. It exercises 96 enabled templates, with P96 checked for correct refusal rather than silently re-enabling a user-disabled word. The pristine template audit exercises all 97 successfully. Browser results below are automated Chromium/WebKit tests. iPhone uses an emulated viewport/user-agent, not a physical iPhone or installed PWA. Desktop WebKit is not a physical Safari installation. Real Google sign-in and production speech services were not exercised with a user account; their implementation is unchanged and speech regression cases pass.

| Browser | Words in edited migration fixture | Templates | Load ms | Search ms | Template sweep ms | Offline |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| desktop-chromium | 3112 | 96 | 10826 | 64 | 16219 | True |
| desktop-webkit | 3112 | 96 | 16473 | 172 | 25063 | True |
| iphone-webkit | 3112 | 96 | 16968 | 285 | 48909 | True |

Load measurements include migration and run in a shared cloud execution host; they are not physical-device performance guarantees. Initial migration can be slower than normal interaction. The cleanup batches index updates rather than rebuilding them per retired entry. Browser navigation allows up to 60 seconds while action controls retain their separate timeout; measured timings are exposed above rather than hidden by the timeout.

The pristine compact state occupies **1,423,219 characters / 1,458,334 UTF-8 bytes**. Separate historical backups use additional local storage. The new cleanup backup is compressed to avoid WebKit quota failures; derived retirement records and word-practice aliases are omitted from the compact state and reconstructed deterministically. If creating the cleanup backup fails, migration is blocked and the original catalog remains intact; the interface provides a notice. No backups are silently deleted to force the cleanup. Node VM initialization measurements in the audit are tooling costs, not browser measurements.

Browser fixtures preserve saved sentences/words, custom vocabulary/templates/settings, template edits, disabled role bindings, user translations, imported translations, nested verb/adjective forms, deletion tombstones, existing Word Game history and vocabulary mastery across reload. The cleanup backup key is `punjabi-app-state-before-sentence-catalog-v1`; existing schema backup keys remain untouched. The cleanup backup uses pinned, MIT-licensed LZ-String 1.5.0 with lossless UTF-16 compression and a round-trip check before migration. Recover it with `PunjabiCatalogBackup.decode(localStorage.getItem("punjabi-app-state-before-sentence-catalog-v1"))`; the decoder also accepts an older plain JSON backup. New libraries are vendored locally and cached offline; no API or paid service is used. Removed words do not reappear from the source import. Alias-backed histories retain answer totals and the latest memory card. Subsequent user disable choices are not reset by migration.

Known limitations:

- This is not exhaustive fluent-speaker verification: zero new native reviews are claimed. All 3,111 active entries still await independent review.
- Some retained vocabulary has only citation support or cannot be demonstrated by the constrained ordinary-construction sampler. Unknown genders, adjective paradigms, countability, obliques, argument structures and regional usage are not fabricated.
- Duplicate removal uses lexical identity evidence, not phonetic similarity or a measured frequency list. Different Punjabi synonyms and dialect forms may remain for later human decisions.
- A one-word heading can be less descriptive for compounds; Meaning retains the complete definitions and contextual sentence senses remain separate.
- Category diagnostics still include unresolved senses and authored learning-context differences. Retiring General entries is not counted as successful reclassification.
- Human review is needed for pragmatic naturalness, cause/effect examples, purpose clauses, rare senses, register and uncommon combinations. No physical Safari/iPhone or production authentication account was available for validation.

### Reproducing validation

Run `node scripts/run-tests.js`, `node scripts/audit-report.js --baseline-ref 499e191`, and `node scripts/translation-examples.js`. With Playwright and the browser runtimes installed, run `node scripts/browser-check.js` (set the browser cache path for the local environment). All three validation artifacts record the same source input hash:

`23445fcf57311aca2dc86fec2d0ae2309e61b988541a47a5e61627b3cf7a71d1`

Artifacts: [tests](../reports/automated-tests-summary.json), [browser results](../reports/browser-check.json), [complete audit](../reports/complete-integration-audit.json), [follow-up summary](../reports/connector-catalog-summary.json), [review queue](../reports/vocabulary-review-queue.json), and [generated samples](../reports/generated-validation-samples.json).

## G. GitHub delivery and preview

[PR #7](https://github.com/bulletgoose/punjabi-app/pull/7) contains the implementation and validation artifacts. Its merge commit and GitHub Pages build record the publication outcome. Main is the existing Pages publishing source; no new paid service or infrastructure was introduced. Live site: [punjabi.dockit.co.nz](https://punjabi.dockit.co.nz/).

Changed implementation areas: `data/sentence-catalog-policy.js`, `sentence-learning.js`, `linguistic-system.js`, `vocabulary-audit.js`, `grammar-engine.js`, `learning-context.js`, compact Vocabulary/rendering in `index.html`, `service-worker.js`, `catalog-backup.js`, the licensed compression vendor, migration/breakdown/catalog tests, browser/fixture/audit tooling and reports. Existing source-evidence and verb-profile files are retained unchanged.

For local preview, check out the feature branch and serve the repository root, for example `python3 -m http.server 8000`; open `http://localhost:8000`. Review the Connectors, Question words, Adjectives, States, Numbers and Word practice blocks. In Templates, select P72–P97 individually and generate examples. Check Meaning and mastery in Vocabulary, saved personal edits after reload, and generation after an online load followed by going offline. Existing installed PWAs should reopen online to receive the new worker/assets; an offline device keeps its previously cached version until it reconnects.
