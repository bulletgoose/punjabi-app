# Complete vocabulary and grammar integration — implementation report

Date: 2026-10-10. Repository: `bulletgoose/punjabi-app`. Feature branch: `feature/complete-vocabulary-grammar-integration`.

All **5,659 canonical entries** have been assessed. **2,943** have metadata supporting bounded grammatical constructions, compared with the previous implementation's small imported noun subset. The actual generator demonstrated **2,939 unique lexical entries** through enabled templates. Categories, contextual English and the existing sentence breakdown now share stable sense data. Independent fluent-speaker review remains **0 entries**; this release does not claim comprehensive linguistic verification.

The interrupted work was resumed in place. The 5,184-record/8,190-sense source evidence and 254 morphology profiles were retained. Git history, current changes, source data, previous reports, migrations and actual generator behavior were inspected before further integration. The previous report is preserved in [IMPLEMENTATION_REPORT_PREVIOUS.md](IMPLEMENTATION_REPORT_PREVIOUS.md). Baseline measurements initialize the actual application at commit `49ded7b`, whose code tree was merged into main by PR #5; they do not assume its report is authoritative.

Delivery: Pull request URL will be recorded after creation.

Feature implementation and validation complete; GitHub delivery in progress. The user's latest instruction on 2026-10-10 authorizes merging after validation, superseding the earlier instruction to leave the pull request unmerged.

## A. Vocabulary validation and evidence

The central lexical registry remains the source for Vocabulary, Word Game, word Flashcards, Building Blocks and sentence generation. Original lexical IDs and aliases remain stable. Separate sense IDs retain complete dictionary definitions, selected sentence meanings, categories, grammatical information, source sense IDs and usage information. The total corpus remains unchanged; this release expands participation rather than importing a second database.

| Measurement | Canonical entries |
| --- | --- |
| Total entries assessed | 5,659 |
| Complete grammatical metadata for supported constructions | 2,943 |
| Complete semantic classification for all retained senses | 2,709 |
| Source-supported, checksum-aligned entries | 5,184 |
| Source-cell or reference-supported morphological behavior | 1,302 |
| Actual qualified fluent-speaker reviews | 0 |
| Still awaiting independent fluent-speaker review | 5,659 |
| Restricted from supported constructions | 2,716 |
| Incomplete semantic assessment | 2,950 |

“Complete grammatical metadata” means the fields required by an explicitly supported construction are present. It does not mean every tense, plural, case, dialect or possible use is verified. A noun can participate in a direct-form description without a verified oblique; that does not authorize a postpositional phrase. Morphology-supported entries can have other unresolved senses. Semantic completeness counts classification coverage; it does not establish every modifier restriction, pragmatic/register distinction, countability property or alternative usage. Source verification verifies alignment with the retained dictionary snapshot, not an independent correction of that dictionary.

All 5,659 entries have separate data-completeness, schema, source, morphology, construction, linguistic-confidence, fluent-review and eligibility states. The pristine corpus has valid core schemas; this is separate from grammatical and semantic completeness. Source evidence is aligned for 5,184 entries (including 54 original-ID matches); 475 remaining authored entries have no snapshot-aligned source. There are 8,665 canonical sense records: 8,190 retained dictionary senses plus legacy meanings. Canonical vocabulary comprises 529 original entries and 5,130 newly imported entries.

The retained Kaikki/Wiktextract snapshot checksum is `8bbee081aa826ba360edeec75fd3cace1d0971b172569c33631cadcea5a250a2`. Source tags, topics, linked definitions and acceptable noun/adjective cells are preserved in `data/source-evidence.js`. Original imported text remains in `data/vocabulary-expansion.js`. See [VOCABULARY_SOURCES.md](VOCABULARY_SOURCES.md) for attribution, licensing, exact matching and reproducible extraction.

Classification uses actual sense definition heads, bounded reviewed mappings, source links and unambiguous topics. It does not search every English gloss for a broad word such as “body.” Gender conflicts stay sense-specific; number, human/animate properties, countability and semantic restrictions are populated only within the evidence's scope. English determiner hints are separate from Punjabi countability. Unknown spelling, transliteration, forms and argument structure are not silently guessed.

### Reasons for restrictions or further metadata review

Counts overlap because one entry can have several issues. Entries with some usable senses can still appear here. Every canonical entry, its assessment, role permissions and senses is present in [the review queue](../reports/vocabulary-review-queue.json).

| Recorded reason | Entries |
| --- | --- |
| Conjugation/argument profile not supported. | 284 |
| No supported inflection/placement construction profile. | 1,128 |
| No unrestricted, source-gendered sense with a concise contextual meaning. | 1,304 |
| Some adjective senses have limiting source contexts without supported modifier-target constructions. | 160 |
| Some dictionary glosses require contextual translation review. | 2,697 |
| Some senses lack a verified semantic definition head or unambiguous source topic. | 2,950 |

The full audit covers nouns, verbs, adjectives, adverbs, pronouns, numerals, functional words and expressions. Unsupported forms remain available for dictionary learning, games and word flashcards. New valid authored entries and completed source metadata update compatible role views through the registry; user-edited source fields require renewed grammatical validation. No blanket fluent-review approval is applied.

## B. Category corrections

Category memberships are attached to senses; an entry can belong to several categories because its senses differ. Topic-filtered Vocabulary, Word Game and word Flashcards use the central sense-category view, displaying the matching sense and its gender/meaning while preserving canonical progress IDs and full definitions. Parent memberships remain useful learning filters and counts therefore overlap.

| Measurement | Result |
| --- | --- |
| Canonical entries with changed category memberships | 3,612 |
| Entries moved out of General | 1,470 |
| Unsupported previous memberships moved into General | 955 |
| General before / after | 2,600 / 2,085 |
| New category IDs | 16 |
| Unchanged authored default category corrections | 225 |

The stricter audit also moves 955 entries into General when their earlier thematic assignment lacks support; the net reduction in General is 515. This avoids artificial category coverage.

The default-category migration only changes a legacy row when its lexical fingerprint and original category membership still match the previous authored defaults. Explicit user changes and historical category choices are preserved. The separate baseline artifact contains fingerprints and old categories, not a duplicate vocabulary database.

New categories: Human Anatomy, Physical Appearance, Materials & Substances, Tools & Equipment, Construction & Infrastructure, Plants & Trees, Animals & Wildlife, Geography & Landscapes, Objects & Everyday Items, Communication & Language, Movement & Actions, Personality & Character, Cause & Effect, Quantities & Measurements, Properties & Descriptions, Colors.

### Representative corrections

- **ਕਾਠ — kāṭh**: the ordinary “wood, timber” sense is feminine and belongs to Materials & Substances / Nature & Environment. It does not belong to Body & Appearance. The dictionary also records a distinct masculine “physique, body, build, frame” sense, which legitimately belongs to Physical Appearance / Body & Appearance. The two senses retain one lexical entry. Removing the appearance category from the entire lexeme would lose a real dictionary sense.
- **ਲੱਕੜ — lakkaṛ**: “wood, timber, firewood” is organized with materials, using the actual natural-material meaning.
- **ਹੁਕਮ — hukam**: “order, instruction” belongs to Communication & Language; its separately identified playing-card “spades” sense belongs to Entertainment & Culture. Giving an order selects the directive sense.
- **ਪੱਥਰ — patthar**: the noun “stone, rock” belongs to Materials & Substances / Nature & Environment. The adjective record “stony” remains distinct by part of speech; it is not a duplicate noun.

Representative memberships: ordinary ਕਾਠ wood **Body/Health → Materials/Nature**; ਲੱਕੜ wood **General → Materials/Nature**; ਹੁਕਮ directive **General → Communication** (playing-card sense → Culture); ਪੱਥਰ stone **General → Materials/Nature**; ਸੋਨਾ gold **General → Materials/Nature**; ਜਹਾਜ਼ ship **Airports/Travel → Travel**, avoiding an airport assumption for a ship.

The complete before/after memberships, including retained unresolved decisions, are in [complete-integration-audit.json](../reports/complete-integration-audit.json). Unknown semantic categories remain explicit in General rather than being over-tagged.

### Category validation

The validator checks missing/duplicate labels, invalid parents, cycles, missing categories, uncategorized entries, unsupported assignments and semantic conflicts. Retained empty legacy categories are reserved learning contexts; their IDs are preserved for saved filters and future unlocks. They are visible in the count table rather than silently deleted.

| Finding | Count |
| --- | --- |
| learning-context-assignment | 16 |
| possible-internal-polysemy | 1 |
| unresolved-sense-category | 4,526 |
| unsupported-category-assignment | 10 |

Unresolved sense classifications require further evidence. Retained authored learning contexts are informational, not assertions about lexical semantic types. Unsupported assignments and the internal polysemy warning remain review work rather than being reported as corrected facts.

### All category memberships

Counts include parent memberships, overlap between senses and retained empty categories.

| ID | Category | Parent ID | Entries |
| --- | --- | --- | --- |
| abstract | Abstract Concepts | — | 96 |
| accommodation | Accommodation | travel | 0 |
| actions | Actions & Verbs | — | 397 |
| activities | Everyday Activities | — | 35 |
| airports | Airports & Flights | travel | 0 |
| anatomy | Human Anatomy | body | 175 |
| animals | Animals & Wildlife | nature | 207 |
| appearance | Physical Appearance | body | 8 |
| body | Body & Appearance | health | 183 |
| business | Business & Commerce | work | 59 |
| causality | Cause & Effect | abstract | 14 |
| celebrations | Celebrations & Traditions | culture | 5 |
| clothing | Clothing & Accessories | — | 96 |
| colors | Colors | descriptions | 35 |
| communication | Communication & Language | — | 153 |
| construction | Construction & Infrastructure | places | 44 |
| culture | Entertainment & Culture | — | 210 |
| descriptions | Properties & Descriptions | — | 749 |
| directions | Directions & Navigation | places | 0 |
| disasters | Natural Events & Disasters | nature | 0 |
| education | Education & Learning | — | 115 |
| emotions | Emotions & Personality | — | 179 |
| essential | Essential Communication | — | 41 |
| family | Family & Relationships | — | 92 |
| food | Food & Drink | — | 260 |
| functional | Grammar & Functional Words | — | 117 |
| general | General Vocabulary | — | 2,085 |
| geography | Geography & Landscapes | places | 100 |
| goals | Goals & Aspirations | — | 0 |
| health | Health & Wellbeing | — | 270 |
| home | Home & Living | — | 167 |
| kitchen | Cooking & Kitchen | food | 59 |
| materials | Materials & Substances | nature | 90 |
| medical | Medical & Healthcare | health | 51 |
| movement | Movement & Actions | actions | 21 |
| nature | Nature & Environment | — | 602 |
| numbers | Numbers & Measurements | — | 178 |
| objects | Objects & Everyday Items | home | 93 |
| opinions | Opinions & Reasoning | — | 29 |
| people | People & Identity | — | 286 |
| personality | Personality & Character | emotions | 68 |
| places | Places & Locations | — | 224 |
| plants | Plants & Trees | nature | 149 |
| problems | Problem Solving | — | 0 |
| produce | Fruits & Vegetables | food | 181 |
| professional | Professional Communication | work | 0 |
| quantities | Quantities & Measurements | numbers | 48 |
| restaurants | Restaurants & Cafés | food | 0 |
| romance | Dating & Romance | family | 0 |
| safety | Safety & Emergencies | — | 0 |
| shopping | Shopping & Money | — | 59 |
| social-media | Social Media & Communication | technology | 0 |
| society | Society & Community | — | 99 |
| sport | Sport & Fitness | — | 33 |
| storytelling | Conversation & Storytelling | — | 30 |
| technology | Technology & Digital Life | — | 16 |
| time | Time & Dates | — | 148 |
| tools | Tools & Equipment | home | 55 |
| tourism | Tourism & Sightseeing | travel | 0 |
| travel | Transport & Travel | — | 36 |
| weather | Weather & Climate | nature | 78 |
| work | Work & Occupations | — | 135 |

## C. Building Block integration

WHO, WHEN, WHERE, WHAT, HOW, WHY, ABOUT and VERB retain their user-facing framework. They query the central lexical registry using grammatical role/sense bindings. A category alone does not authorize a role. Source obliques and checked postpositions build locatives, calendar phrases, reasons and topics; subjects and destinations retain their specific constraints.

| Role | Enabled lexical entries before | Enabled lexical entries after | Sentence-demonstrated after | Phrase/sense bindings after | Constructed phrase bindings |
| --- | --- | --- | --- | --- | --- |
| WHO | 18 | 188 | 188 | 212 | 0 |
| WHEN | 33 | 75 | 74 | 83 | 12 |
| WHERE | 27 | 81 | 81 | 86 | 56 |
| WHAT | 84 | 2,522 | 2,521 | 3,296 | 0 |
| HOW | 27 | 42 | 33 | 42 | 0 |
| WHY | 8 | 27 | 25 | 27 | 17 |
| ABOUT | 15 | 935 | 935 | 1,247 | 1,232 |
| VERB | 36 | 124 | 124 | 144 | 0 |

Unique enabled lexical entries bound to at least one of the eight roles: **248 → 2,825**. These union counts do not add overlapping roles or alternate senses together.

Actual template demonstrations: **246 → 2,939 unique canonical entries**, including checked adjective/state descriptions and explicit question/connector dependencies. The eight main roles alone demonstrate **2,812 entries**. Each proof forces a lexical binding into its role, requires a bilingual output, checks the emitted role and sense ID, and tries compatible enabled templates. Every enabled lexical entry is attempted; failures remain explicit in the machine report. This proves software reachability, not the naturalness of every possible combination.

The additional adjective/state roles remain grammatical support for the eight-block interface, not a second vocabulary corpus. Descriptions enforce compatibility such as flavor with food/drink, physical properties with suitable nouns and animate states with animate entities. Building Block lists use search and bounded pages; the full corpus is not inserted into the DOM at once. Word Game and word Flashcards continue using the complete shared lexicon. The word-flashcard setup now retains the selected word mode, category and existing preferences; it no longer replaces them when starting a deck.

### Bound entries not demonstrated in a supported role

Some authored legacy bindings remain visible for compatibility with saved customizations but cannot safely appear in the tested supported constructions. Counts below are per role and can overlap.

| Role | Bound but not demonstrated |
| --- | --- |
| WHO | 0 |
| WHEN | 1 |
| WHERE | 0 |
| WHAT | 1 |
| HOW | 9 |
| WHY | 2 |
| ABOUT | 0 |
| VERB | 0 |
| ADJECTIVE | 1 |
| STATE | 0 |
| QUESTION | 7 |
| CONNECTOR | 12 |

The remaining gaps include ambiguous ਕੱਲ੍ਹ (yesterday/tomorrow), ਭੁਰਜੀ without a concise approved sentence gloss, nine manner items, two reason items, the authored ਤੇਜ਼ adjective and unconsumed functional dependencies. All 124 bound verbs have a compatible sentence demonstration. The exact unreached IDs/reasons are retained in `after.templateReachability.byRole` in the audit. They are not counted as successful template integration. Completing an unknown argument profile, oblique or contextual meaning can expand this coverage without duplicating entries.

## D. Grammar and templates

The evidence overlay retains **254 productive consonantal verb morphology profiles**, with 254 future and 251 productive-perfective paradigms. Only **89 source profiles** also have bounded argument/sense permissions. A morphology-only verb with unknown argument structure remains restricted. The application has a different number of canonical bound verbs because source records can match authored entries and one verb can have several sense bindings.

| Actual canonical verb coverage | Before | After |
| --- | --- | --- |
| Complete habitual agreement | 36 | 124 |
| Complete present progressive agreement | 36 | 124 |
| Complete past progressive agreement | 36 | 124 |
| Complete finite future agreement | 3 | 104 |
| Complete perfective agreement | 14 | 110 |

Coverage checks all six person/respect distinctions, masculine/feminine agreement and both scripts. Transitive perfectives also exercise four object gender/number agreement controllers as morphology units. These cell tests are separate from meaningful sentence generation; they do not authorize semantically inappropriate noun/verb combinations.

Reusable rules support checked consonantal habitual, finite-future, productive-perfective and respectful/plural imperative forms. Irregular existing paradigms remain explicit. Vowel-final, unsupported multiword/compound predicates, contradictory or extraction-error cells and unknown valency are not guessed. Future/perfective enrichment preserves existing authored and user-edited paradigms. The generator retains SOV order, agreement, postpositions, source obliques, auxiliary selection, negation, questions and the documented Eastern Punjabi split-ergative boundary. Source adjective qualifiers are retained as modifier restrictions: a rain-specific heavy sense cannot describe iron, and an unused-earthen-pot or unwashed-cloth sense of new cannot describe a chair or door. The adjective-context scan covers parenthetical limitations, explicit usage markers and figurative contexts; unmapped specialized targets remain restricted with reasons. The scan records 186 unresolved-target adjective senses (many already restricted before this fix), ten explicitly supported context mappings and zero unresolved-target senses enabled for generation; these unresolved contexts affect 160 entries. Supported rain, cattle/horse-color and economic-human targets stay bounded. Object affordances close the previously missing cutting, digging, counting, mending, wiping and sowing/watering pairings using exact source sense heads: **63 lexical entries / 67 eligible noun senses** supply checked objects for **12 additional verb lemmas / 13 predicate senses**. Affordance coverage by unique entries/senses is cuttable 4/4, diggable 7/8, countable-object 31/32, repairable 15/16, cleanable 13/15 and plantable 1/1; these counts overlap. Shared verb classes stay narrow: seed serves sow/water, cloth serves mending, and physical floor/table surfaces serve wiping. These tags do not imply Punjabi countability or authorize whole thematic categories. Figurative senses and established conflicts are excluded. See [GRAMMAR_SOURCES.md](GRAMMAR_SOURCES.md) for primary references and exact sections.

Finite future is distinct from an intention construction. English reflects tense, aspect, person and negation. Punjabi grammatical noun gender does not establish English sex: an ambiguous pronoun remains “he or she.” Source subjects receive appropriate English noun phrases; countable nouns, mass nouns, explicit determiners and proper names are handled separately.

Templates: **65 total / 58 enabled → 78 total / 71 enabled**. Thirteen new reusable constructions complement the previous patterns:

| ID | Construction |
| --- | --- |
| P59 | Identify an object |
| P60 | Describe an object with a compatible adjective |
| P61 | State a location |
| P62 | Ask where an object is |
| P63 | Identify an occupation |
| P64 | Bare finite future |
| P65 | Bare completed action |
| P66 | Current time + manner + progressive action |
| P67 | Past object description |
| P68 | Negative object description |
| P69 | Express possession |
| P70 | Express a preference |
| P71 | Explain waiting with a checked causal noun phrase |

Every template carries grammatical role constraints, semantic requirements, agreement/tense information and grammar concept references. Existing enabled flags, probabilities, custom names and user-created templates survive migration. The seven previously disabled default patterns remain disabled. P36 keeps complete authored because-clauses; source causal noun phrases use P71 rather than being inserted as malformed clauses. A disabled prerequisite such as the where-question word prevents its dependent template from silently reintroducing it.

## E. Contextual translation and enhanced breakdown

[CONTEXTUAL_TRANSLATION_EXAMPLES.md](CONTEXTUAL_TRANSLATION_EXAMPLES.md) is the accompanying detailed translation section of this report. It contains **24 actual bilingual generator examples**, with Punjabi, Roman Punjabi, natural English, phrase/word breakdown, full alternative definitions and evidence for the chosen sense. All 24 link to canonical entries; 14 exercise imported meanings containing multiple dictionary alternatives. They span 18 category IDs including parents. These are deterministic software examples backed by lexical/reference data, not newly claimed fluent-speaker-verified examples.

The translation system distinguishes:

1. Full dictionary definitions and separately identified senses in Vocabulary.
2. A concise selected sense in the natural English sentence and default breakdown.
3. Alternative meanings, shared Meaning & Usage, source details and supported grammatical explanations inside expandable details.

It never chooses a comma-separated alternative simply because it occurs first. Ambiguous/unusable meanings remain restricted unless an explicit construction sense or supported contextual match resolves them. The previously authored verb base can be used only when it matches a complete dictionary alternative. User translation overrides are retained and attributed as user data requiring review.

Examples include selecting **order** from ਹੁਕਮ's “order, instruction” directive sense for giving an order, **wood** from ਕਾਠ's material sense for a physical description, a source-gendered book with a finite future, location statements/questions, mass-noun possession of tea/gold, and food versus specific-object preferences. Full forms and all contextual components are shown in the linked example report.

The existing Enhanced Sentence Breakdown toggle and controls remain in place. Each default row shows Gurmukhi, Roman Punjabi, contextual meaning and grammatical role. Native expandable details reuse the Vocabulary Meaning & Usage component and disclose base form, selected/other senses, categories, grammatical features, inflected forms, source-backed form notes and pronunciation/save controls. Inflected verbs retain their canonical infinitive ID. Postpositions and compound predicates stay grouped where one-to-one English words would be misleading. Functional markers are attributed to their grammatical concepts rather than invented lexical meanings. Review metadata is nested to keep the default view concise.

The layout wraps long forms and details at mobile widths. The speech controls keep using the existing speech client and authored Gurmukhi; no new speech backend or paid API is introduced.

## F. Testing, persistence, performance and remaining limitations

### Automated results

**153/153 test cases passed; 0 failed, 0 skipped.** The runner records actual case-level TAP counts from every test file, not opaque file counts. Tests include corpus/schema/category regressions, stable senses/aliases, reviewed morphology and valency, semantic compatibility, inflections and agreement, contextual translation/breakdown consistency, dynamic lexical integration, migration/reload preservation, compact snapshots, user edits/deletions, and existing FSRS/audio/backend authentication/cache behavior. [Summary](../reports/automated-tests-summary.json) and [full TAP output](../reports/automated-tests.txt).

All **71 enabled pristine templates** generated bilingual output in the deterministic audit; each was attempted ten times with supporting alternatives preserving semantic/person/gender/number/time classes. Full per-entry role demonstrations run separately. See [generated-validation-samples.json](../reports/generated-validation-samples.json) and the complete audit. The audit recorded **707 successful assemblies / 710 attempts**; rejected incompatible draws remain visible, and the application retains its existing retry handling. This combination is broad automated validation, not an exhaustive linguistic proof of all cross-products.

The final source/data/harness SHA-256 is `ca14d00f22bc75f3e883ad648a6d677babbdd2c0dafd25b80a1a062f4f5a816e`. Source-hashed reports distinguish this version from earlier interrupted validation. Browser runs exercise full live role lists; audit support sampling does not substitute for browser performance measurements.

### Browser and offline checks

Automated Playwright results:

| Target | Engine | Viewport | Templates online / offline | Load ms | Search ms | Online template sweep ms | Uncaught page errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| desktop-chromium | 151.0.7922.34 | 1280×720 | 70 / 70 | 3183 | 78 | 8765 | 0 |
| desktop-webkit | 26.5 | 1280×720 | 70 / 70 | 4563 | 201 | 15247 | 0 |
| iphone-webkit | 26.5 | 390×664 | 70 / 70 | 4400 | 250 | 31590 | 0 |

The browser migration fixture disables P04 and preserves a disabled custom template, so its enabled-template count is one below the pristine audit's count. Each target checks migrated source/user translations, nested verb/adjective edits, disabled words/templates, saved sentences/words, custom vocabulary/templates, deletion tombstones, prior Word Game progress, custom settings, vocabulary mastery, an actual word-flashcard deck, topic-specific word/game sense consistency (including the wood/physique regression), a written-game exposure, reload and expanded breakdown. No horizontal overflow occurred in the tested viewports. Screenshots are stored under [reports/screenshots](../reports/screenshots).

Chromium offline testing uses browser offline mode. WebKit testing stops the origin server and reloads from the service worker. All local application scripts, including source evidence, category baselines, semantics and morphology, are verified precached under the new service-worker cache version. Saved custom data remains available offline.

These targets are desktop browser engines and an emulated iPhone viewport. They are **not physical desktop Safari, a physical iPhone, or an installed standalone PWA**. Physical Safari/iPhone/PWA, live Google sign-in and real device/cloud pronunciation still require manual checks on the user's configured origin/account. No paid speech calls or production deployment were used for validation. Existing speech/backend tests pass; authentication, Firebase configuration, profile/sign-in, IndexedDB audio caching and hosting arrangements were not replaced.

### Data migration and performance

Persistence uses schema version 2 and makes a `punjabi-app-state-before-linguistic-v2` backup before writing migrated state; the original v1 backup is retained. If a backup cannot be written, migration avoids an unsafe overwrite and exposes the limitation. Historical v1/v2 source edits are detected against the source evidence and preserved, including nested authored/user forms. Edited imports lose unsupported automatic role permissions rather than being overwritten. Defaults change only when their legacy fingerprint still matches. Reload tests verify compact snapshot stability and prevent duplicate derived bindings.

Unmodified dictionary entries and derived metadata are reconstructed from bundled evidence instead of being copied into localStorage. The pristine compact snapshot is **645,733 characters / 665,596 UTF-8 bytes**. The Node fixture measured initialization at 7665.67 ms and full-library discovery at 44.65 ms. Browser timings above are from the shared managed test environment, not physical-device benchmarks or guarantees. A paired full-corpus run across all 78 shipped templates measured generation at **31.52s before → 18.78s after** the projection used during sentence assembly (about 40% faster in that environment). Punjabi/English text, selected senses and visible breakdown stayed unchanged; P34/P35 additionally retained correct ABOUT phrase metadata. The projection excludes unrelated role pools and audit/source fields from hot loops, while user edits remain live and writes stay local.

Category and Building Block rendering remain paginated/searchable; cache and asset costs remain visible tradeoffs of retaining thousands of offline entries.

### Explicit remaining work

- Independent fluent-speaker review is pending for all 5,659 entries and new constructions. Native verification is never inferred from source matching, a grammar rule or passing tests.
- 2,716 entries have no currently supported construction profile; 2,950 have incomplete semantic assessment across their senses. Unknown obliques, gender, meaning, placement, valency and compound/irregular morphology remain explicit. Counts overlap.
- General still contains 2,085 entries. Remaining sense-category uncertainty, ten retained unsupported category assignments and the internal polysemy warning need further evidence/reviewer decisions. The validator/report exposes them; this release does not call taxonomy exhaustive or perfect.
- A specific source-review question remains for **ਨਨਾਣ — nanāṇ**, canonical `lex:wt-pa-fb61b465709c31e50eea`, sense `wt-sense-56a9b88d58b8fef28c1a` (`en-ਨਨਾਣ-pa-noun-qJL-wKfK`). Both retained source artifacts gloss it as “aunt”; a possible distinction from husband's sister / sister-in-law needs an independent dictionary and qualified Punjabi reviewer. Its source alignment is verified, but the gloss has not been independently adjudicated; the current metadata has blanket pending human review, not a specific adjudicated discrepancy. No replacement gloss is asserted. This illustrates why snapshot alignment must not be described as comprehensive linguistic verification.
- Corpus transliteration follows retained source conventions; comprehensive phonetic normalization, regional/register choices and rare/literary senses require review. No general noun declension or arbitrary compound-verb rule is claimed.
- Randomly combining individually compatible words can still produce pragmatically odd statements. Bounded semantic restrictions reject established conflicts, but full naturalness requires actual Punjabi speakers and broader sense/argument examples.
- New examples are generator/reference demonstrations. The release does not invent a bank of native-verified usage sentences. Where existing/source examples are absent, the interface does not manufacture them.
- Remaining per-role reachability limitations are listed by exact lexical ID in the audit. Unsupported entries continue to work in lookup, games and word flashcards.
- Learning progression remains prepared through stable vocabulary/sense, grammar concept, template and communication-scenario IDs. This release does not implement full unlocks, adaptive recommendations or mastery of practical communication.
- Physical Safari/iPhone/PWA, live sign-in and pronunciation review remains manual as described above.

Completed: full-corpus assessment; preserved source/morphology evidence; substantial supported metadata and role expansion; sense-aware category corrections; additional grammar/templates; contextual translation; enhanced shared breakdown; safe persistence; automated integration/offline checks. Remaining: exhaustive semantic/morphological completion and human linguistic/device verification. Coverage is reported explicitly rather than labeled 100% sentence-ready.

## G. GitHub delivery and preview

The pull request targets `main` from `feature/complete-vocabulary-grammar-integration`. The user's latest request authorizes its merge after validation. The earlier unmerged instruction has been superseded. No additional hosting configuration, paid infrastructure or automatic production deployment is introduced.

Changed implementation groups:

- `lexical-semantics.js`, `vocabulary-audit.js`, `linguistic-system.js`: senses, assessments, taxonomy decisions, role bindings, migration, user overrides and compact persistence.
- `data/source-evidence.js`, `data/verb-morphology-profiles.js`, `data/authored-category-baselines.js`: retained source/provenance, supported morphology and safe default migration baselines.
- `grammar-engine.js`, `learning-context.js`, `index.html`: grammar/template expansion, generation/translation integration, shared Meaning & Usage and the existing enhanced breakdown/Building Block interface.
- `service-worker.js`: offline precaching/cache update for new local assets.
- `scripts/`, `tests/`, `reports/`: reproducible extraction/profile/audit/example tools, migrations and regression tests, exact queues, generated examples and browser evidence.
- `docs/`: this report, archived previous report, source/reference documentation, 24 contextual examples and preview instructions.

[PREVIEW.md](PREVIEW.md) gives local checkout/static server instructions, migration/offline scenarios and manual physical-device/account checks. No build or new cloud service is required. Review the source/grammar scope and unresolved queue alongside generated examples.

```sh
node scripts/run-tests.js
node scripts/audit-report.js
node scripts/translation-examples.js
# Optional, with Playwright and its browser runtimes installed:
node scripts/browser-check.js
```

For a manual preview, serve a separate checkout on localhost. Preserve production browser data and exercise the backup/migration with a copy rather than clearing existing saved state.
