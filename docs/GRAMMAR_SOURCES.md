# Grammar reference evidence

The main primary reference is Harjeet Singh Gill and Henry A. Gleason Jr., *A Reference Grammar of Punjabi*, 2013 revision by Mukhtiar Singh Gill, [hosted by Punjabi University](https://pt.learnpunjabi.org/assets/a%20reference%20grammar_final.pdf). The university's [verb overview](https://www.learnpunjabi.org/Verb.html) provides auxiliary paradigms. These are consulted as references; university text, tables and audio are not distributed as application assets. The person split is independently described in Chandra and Kaur's [The Perfect Nominative, section 2](https://ojs.ub.uni-konstanz.de/jsal/index.php/fasal/article/download/105/63), published in the 2016 FASAL proceedings.

Relevant reference sections and printed pages:

| Feature | Reference location | Implementation consequence |
| --- | --- | --- |
| Noun declension | §§5.4–5.5, pp.67–70 | Store authored direct/oblique forms; do not derive every noun from its spelling. |
| Present participles | §5.18, pp.88–89 | Habitual forms inflect for gender and number. Keep habitual and progressive constructions separate. |
| Perfective irregular stems | §5.19, pp.90–92 | Check forms such as ਕੀਤਾ, ਗਿਆ, ਖਾਧਾ and ਦਿੱਤਾ independently. |
| Finite future | §5.20, pp.92–94 | Select complete person, number and gender forms; respect source alternatives. |
| Postpositions and dative | §8.2, pp.149–150 | Nouns precede ਨੂੰ in the oblique; marked objects do not govern ordinary agreement. |
| Eastern Punjabi person split | §8.4, pp.150–151 | First/second person pronouns omit ਨੇ; careful third-person perfective transitives use appropriate ergative forms. |
| Agreement | §8.5, pp.152–153 | In supported perfective transitives, agree with the unmarked object; otherwise use the conventional masculine singular. |

These references support a constrained model, not a claim that every dialect or compound predicate follows the same rule. Every authored template must specify its intended construction and agreement controller. Raw imported dictionary tables do not bypass reference-rule validation or automatically authorize sentence argument structures; the checked overlay applies only within its documented source-cell and construction scope. Native review remains a separate, explicit provenance state.

## Corpus construction expansion (2026-10-09)

The exact retained Kaikki snapshot was downloaded again and checksum matched
`8bbee081aa826ba360edeec75fd3cace1d0971b172569c33631cadcea5a250a2`.
`node scripts/build-verb-profiles.js SOURCE.jsonl` creates the separately licensed
`data/verb-morphology-profiles.js` evidence overlay. It compares dictionary stem
and participle cells with the primary grammar's consonant-final productive
patterns (§§5.16–5.20). It does **not** interpret every dictionary conjugation
cell as verified grammar: dialectal, uncommon, extraction-error and unsuitable
stem classes are excluded.

There are 254 supported consonantal morphology models. The models supply full
habitual agreement, 254 finite-future paradigms and 251 productive-perfective
paradigms. Only 89 models also receive explicitly bounded argument/sense
permissions. These model counts are not canonical application verb counts:
some models merge with original entries, and a model with unknown argument
structure remains outside the sentence roles. Actual registry and template
coverage is measured separately in the implementation report.

The future first/third singular cells are crosschecked against the snapshot;
remaining person/number/gender suffixes use §5.20. The third plural preserves
the source infinitive's ਨ/ਣ distinction. Perfective forms require four matching
source participle cells; known exceptional stems listed in §5.19 are blocked
from the productive rule and retain the previously authored irregular forms.
No vowel-final or multiword compound profile receives this consonantal rule.

Respectful/plural imperatives use the explicitly identified consonantal stem
and the regular -o ending in §5.23. This is a reference-rule validation, **not** a
claim that the snapshot's extraction-error-tagged imperative cells were
verified or that every pragmatic request has fluent-speaker approval.

P59–P71 add identification, compatible noun descriptions, location and location
questions, occupation identification, bare finite future and perfective,
present time and manner, past/negative descriptions, possession, preferences,
and a causal waiting clause. Functional demonstratives, auxiliaries and
question/negative markers carry grammar-concept references; they are not
falsely attributed to the adjacent noun's lexical ID. Source nouns participate
only through checked role/sense bindings. Postpositional subject and topic
forms still require explicit source/authored obliques.

Adjective targets are sense-specific. Flavor predicates require food/drink;
empty/full/hollow require container/space; young/aged/hungry/thirsty require
animate entities. The noun's gender and number select the adjective form.
The same selected sense supplies English and breakdown details. Source gender
is a grammatical feature and does not silently establish English he/she.

The evidence overlay records `nativeReviewed:false`. Independent qualified
Punjabi review remains pending for all automatically assessed records and
new constructions. Source tables and deterministic software tests provide
bounded evidence; they do not establish native naturalness of every possible
combination, sociolinguistic register or regional form.

## Object affordance constraints

Supported transitive source profiles also require an appropriate object sense.
The corpus audit adds bounded affordances from exact dictionary definition heads,
not from a whole entry's categories or an arbitrary physical-object tag. Literal
wood/paper/cloth can receive a cutting permission; literal soil a digging
permission; specific discrete objects a counting permission; cloth a mending
permission; floor/table surfaces a wiping permission. Seed is a common object
for the currently shared sow/water argument class; trees are not admitted to
that shared class because sowing a tree would need a different predicate sense.

The evidence records the actual definition head and the bounded construction
rule at sense level. Figurative/restricted senses, Earth as a planet, abstract
fields and table-of-contents senses are excluded. A semantic counting permission
does not populate Punjabi grammatical countability. These are source-supported
semantic constraints with fluent review pending, not independently verified
usage examples or a general claim that every member of a category has every
physical affordance.

## Source-context modifier restrictions

Adjective assessment retains parenthetical limitations, explicit usage markers
and figurative source contexts before authorizing a modifier target. Exact
sense-ID mappings distinguish an explanatory contrast from a limiting context.
A rain-specific sense of “heavy” can describe rain; it cannot describe iron.
Unrestricted ਭਾਰਾ supplies the physical-weight sense. The “new/unused” sense
of ਕੋਰਾ restricted to an earthen pot, and its separate unwashed/unbleached-cloth
sense, remain outside generic descriptions because a noun's container or
wearable tag does not establish material or use history. Unrestricted ਨਵਾਂ
supplies the chair/door examples.

Known rain, cattle/horse-color and economic-human contexts use narrow source
meaning classes. Unmapped specialized targets remain restricted at sense level
with explicit reasons; other supported senses of the same lexical entry remain
available. These constraints reflect the retained dictionary's usage wording.
They do not constitute newly obtained fluent-speaker verification.
