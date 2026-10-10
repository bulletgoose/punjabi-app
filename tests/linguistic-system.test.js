const test = require('node:test');
const assert = require('node:assert/strict');
const system = require('../linguistic-system');

function starter() {
  return { schemaVersion: 6, vocab: {
    WHAT: [{ id: 'what-kitab', p: 'kitāb', g: 'ਕਿਤਾਬ', e: 'a book', gender: 'f', number: 'sg', tags: ['readable'], enabled: false }],
    GAME_EDUCATION: [{ id: 'game-education-7', p: 'kitāb', g: 'ਕਿਤਾਬ', e: 'book', enabled: true, gameCategory: 'Education' }],
    WHERE: [],
    WHO: [{ id: 'who-main', p: 'main', g: 'ਮੈਂ', e: 'I', person: '1sg', gender: 'f', enabled: true }]
  }, verbs: [{ id: 'v-parhna', infinitive: 'paṛhṇā', english: 'to read', root: 'paṛh', type: 'simple', forms: { '3sg': 'paṛhdā hai' },
    gScript: { infinitive: 'ਪੜ੍ਹਨਾ', forms: { '3sg': 'ਪੜ੍ਹਦਾ ਹੈ' } }, takesTags: ['readable'], enabled: true }],
    templates: [{ id: 'custom-template', enabled: false }], saved: [{ id: 'saved-one', english: 'My sentence' }],
    savedWords: [{ id: 'my-word', roman: 'custom' }], customSettings: { roman: false },
    wordProgress: { 'game-education-7': { correct: 8 } }
  };
}

test('legacy sources become one central store while every feature retains live role views', () => {
  const state = starter();
  system.install(state);
  assert.equal(Object.keys(state.linguistic.entries).length, 3);
  assert.equal(state.vocab.WHAT[0].vocabularyId, state.vocab.GAME_EDUCATION[0].vocabularyId);
  assert.equal(state.vocab.WHAT[0].enabled, false);
  assert.equal(state.vocab.GAME_EDUCATION[0].enabled, true);
  assert.equal(state.vocab.WHAT[0].e, 'a book');
  assert.equal(state.vocab.GAME_EDUCATION[0].e, 'book');
  assert.equal(system.get(state, 'game-education-7').gender, 'f');
  assert.deepEqual(state.vocab.GAME_EDUCATION[0].tags, ['readable']);
  assert.equal(system.get(state, 'what-kitab').source.status, 'unreviewed');
  assert.equal(system.get(state, 'v-parhna').partOfSpeech, 'verb');
  assert.equal(state.verbs[0].infinitive, 'paṛhṇā');
  assert.equal(state.verbs[0].english, 'to read');
});

test('persistence excludes duplicated legacy words and restores all compatibility views', () => {
  const state = starter();
  system.install(state);
  state.vocab.GAME_EDUCATION[0].p = 'edited kitāb';
  state.verbs[0].english = 'to read carefully';
  const saved = system.snapshot(state);
  assert.equal('vocab' in saved, false);
  assert.equal('verbs' in saved, false);
  assert.equal(saved.linguistic.entries['lex:v-parhna'].e, 'to read carefully');
  assert.equal('english' in saved.linguistic.entries['lex:v-parhna'], false);
  const fresh = system.install(JSON.parse(JSON.stringify(saved)));
  assert.equal(fresh.vocab.WHAT[0].p, 'edited kitāb');
  assert.equal(fresh.verbs[0].english, 'to read carefully');
  assert.equal(fresh.vocab.WHAT[0].enabled, false);
  assert.equal(system.resolveId(fresh, 'game-education-7'), 'lex:what-kitab');
  assert.deepEqual(fresh.wordProgress, { 'game-education-7': { correct: 8 } });
});

test('migration preserves unrelated settings, sentences, templates, saved words and progress', () => {
  const state = starter();
  const before = structuredClone(state);
  system.install(state);
  for (const field of ['saved', 'savedWords', 'templates', 'customSettings', 'wordProgress']) assert.deepEqual(state[field], before[field]);
  assert.equal(state.schemaVersion, 6);
});

test('install is idempotent and imported expansion never overwrites user changes or disabled bindings', () => {
  const state = system.install(starter());
  state.vocab.WHAT[0].p = 'my pronunciation';
  const expanded = [{ id: 'what-kitab', p: 'kitāb', g: 'ਕਿਤਾਬ', e: 'book', enabled: true }];
  system.install(state, { expansion: expanded });
  const first = system.snapshot(state);
  system.install(state, { expansion: expanded });
  assert.deepEqual(system.snapshot(state), first);
  assert.equal(state.vocab.WHAT[0].p, 'my pronunciation');
  assert.equal(state.vocab.WHAT[0].enabled, false);
});

test('homographs, gender, number, separate senses, grammar edits and changed spelling remain distinct', () => {
  const rows = [
    { id: 'food', p: 'khāṇā', g: 'ਖਾਣਾ', e: 'food', partOfSpeech: 'noun', gender: 'm' },
    { id: 'eat', p: 'khāṇā', g: 'ਖਾਣਾ', e: 'to eat', partOfSpeech: 'verb' },
    { id: 'male', p: 'x', g: 'ਕਲ', e: 'same', gender: 'm', number: 'sg' },
    { id: 'female', p: 'x', g: 'ਕਲ', e: 'same', gender: 'f', number: 'sg' },
    { id: 'plural', p: 'x', g: 'ਕਲ', e: 'same', gender: 'm', number: 'pl' },
    { id: 'sense-a', p: 'y', g: 'ਕਲ', e: 'same', senseId: 'yesterday' },
    { id: 'sense-b', p: 'y', g: 'ਕਲ', e: 'same', senseId: 'tomorrow' },
    { id: 'edited', p: 'other', g: 'ਕਲ', e: 'same', gender: 'm', number: 'sg' },
    { id: 'forms-one', p: 'a', g: 'ਕਲ', e: 'same', forms: { oblique: 'x' } },
    { id: 'forms-two', p: 'a', g: 'ਕਲ', e: 'same', forms: { oblique: 'z' } }
  ];
  const state = system.install({ vocab: { WHAT: rows }, verbs: [] });
  assert.equal(Object.keys(state.linguistic.entries).length, rows.length);
});

test('editor push, filter assignment, splice, nested forms, enable and delete are persisted centrally', () => {
  const state = system.install(starter());
  state.vocab.WHAT.push({ id: 'custom', p: 'custom', g: 'ਪਾਣੀ', e: 'custom water', gender: 'm', tags: ['drinkable'], enabled: true });
  assert.equal(state.vocab.WHAT.length, 2);
  state.vocab.WHAT[1].tags.push('bringable');
  state.verbs[0].forms['3sg'] = 'user form';
  state.verbs[0].gScript.infinitive = 'ਪੜ੍ਹਣਾ';
  state.vocab.WHAT = state.vocab.WHAT.filter(row => row.id !== 'custom');
  assert.equal(state.vocab.WHAT.length, 1);
  assert.equal(system.get(state, 'custom').deleted, true);
  state.verbs.splice(0, 1);
  assert.equal(state.verbs.length, 0);
  assert.deepEqual(state.linguistic.verbIds, []);
  assert.equal(system.get(state, 'v-parhna').deleted, true);
  const fresh = system.install(system.snapshot(state));
  assert.equal(fresh.vocab.WHAT.length, 1);
  assert.equal(fresh.verbs.length, 0);
});

test('deleting a binding keeps its other category and alias, deleting an entry prevents import resurrection', () => {
  const state = system.install(starter());
  state.vocab.WHAT = [];
  assert.equal(system.get(state, 'what-kitab').deleted, undefined);
  assert.equal(system.vocabulary(state).find(row => row.vocabularyId === 'lex:what-kitab').id, 'what-kitab');
  system.remove(state, 'game-education-7');
  assert.equal(state.vocab.GAME_EDUCATION.length, 0);
  assert.equal(system.get(state, 'what-kitab').deleted, true);
  system.install(state, { expansion: [{ id: 'game-education-7', p: 'kitāb', g: 'ਕਿਤਾਬ', e: 'book' }] });
  assert.equal(system.vocabulary(state).some(row => row.vocabularyId === 'lex:what-kitab'), false);
  const fresh = system.install(system.snapshot(state));
  system.install(fresh, { expansion: [{ id: 'game-education-7', p: 'kitāb', g: 'ਕਿਤਾਬ', e: 'book' }] });
  assert.equal(fresh.vocab.GAME_EDUCATION.length, 0);
});

test('new entries are immediately discoverable in vocabulary and games; only reviewed nouns enter WHAT', () => {
  const state = system.install(starter(), { categories: { food: { name: 'Food & drink' } } });
  const base = { p: 'pāṇī', g: 'ਪਾਣੀ', e: 'water', partOfSpeech: 'noun', gender: 'm', number: 'sg', semanticTags: ['drinkable'], categories: ['food'] };
  const user = system.upsert(state, Object.assign({ id: 'user-water' }, base));
  assert.equal(system.vocabulary(state).find(row => row.id === 'user-water').vocabularyId, user.id);
  assert.equal(state.vocab.LEXICON.some(row => row.id === 'user-water'), true);
  assert.equal(state.vocab.WHAT.some(row => row.id === 'user-water'), false);
  system.upsert(state, { id: 'user-water', verifiedGrammar: true });
  assert.equal(state.vocab.WHAT.some(row => row.id === 'user-water'), true);
  assert.ok(state.linguistic.categories.food.vocabularyIds.includes(user.id));
  assert.equal(state.linguistic.categories.food.label, 'Food & drink');
  system.upsert(state, { id: 'unknown-gender', p: 'x', g: 'ਪਾਣੀ', e: 'different water', partOfSpeech: 'noun', number: 'sg', semanticTags: ['drinkable'], verifiedGrammar: true });
  assert.equal(state.vocab.WHAT.some(row => row.id === 'unknown-gender'), false);
});

test('verbs join the game store and retain edit compatibility without guessing conjugations for new verbs', () => {
  const state = system.install(starter());
  const known = system.vocabulary(state).find(row => row.id === 'v-parhna');
  assert.equal(known.roman, 'paṛhṇā');
  assert.equal(known.gurmukhi, 'ਪੜ੍ਹਨਾ');
  state.verbs[0].infinitive = 'new infinitive';
  state.verbs[0].english = 'new meaning';
  assert.equal(system.get(state, 'v-parhna').p, 'new infinitive');
  assert.equal(system.get(state, 'v-parhna').e, 'new meaning');
  const added = system.upsert(state, { id: 'custom-verb', p: 'karṇā', g: 'ਕਰਨਾ', e: 'to do', partOfSpeech: 'verb' });
  assert.ok(system.vocabulary(state).some(row => row.vocabularyId === added.id));
  assert.equal(state.verbs.some(row => row.id === 'custom-verb'), false);
});

test('verb spelling has one authoritative value even after nested script edits and persistence', () => {
  const state = system.install(starter());
  state.verbs[0].gScript.infinitive = 'ਪੜ੍ਹਣਾ';
  assert.equal(system.get(state, 'v-parhna').g, 'ਪੜ੍ਹਣਾ');
  system.get(state, 'v-parhna').g = 'ਪੜ੍ਹਨਾ';
  assert.equal(state.verbs[0].gScript.infinitive, 'ਪੜ੍ਹਨਾ');
  assert.equal(system.snapshot(state).linguistic.entries['lex:v-parhna'].g, 'ਪੜ੍ਹਨਾ');
});

test('authored home locative migrates to a noun plus a postposition binding and derives its surface', () => {
  const state = system.install({ vocab: { WHERE: [{ id: 'where-ghar', p: 'ghar vich', g: 'ਘਰ ਵਿੱਚ', e: 'at home', dest: 'ghar', enabled: true }] }, verbs: [] });
  const noun = system.get(state, 'where-ghar');
  assert.equal(noun.p, 'ghar');
  assert.equal(noun.g, 'ਘਰ');
  assert.equal(noun.e, 'home');
  assert.equal(noun.partOfSpeech, 'noun');
  assert.equal(state.vocab.WHERE[0].p, 'ghar vich');
  assert.equal(state.vocab.WHERE[0].g, 'ਘਰ ਵਿੱਚ');
  assert.equal(state.vocab.WHERE[0].e, 'at home');
  assert.equal(state.vocab.WHERE[0].construction.vocabularyId, noun.id);
  noun.p = 'new home';
  assert.equal(state.vocab.WHERE[0].p, 'new home vich');
  const fresh = system.install(system.snapshot(state));
  assert.equal(fresh.vocab.WHERE[0].p, 'new home vich');
  fresh.vocab.WHERE[0].p = 'my custom locative';
  assert.equal(fresh.vocab.WHERE[0].p, 'my custom locative');
  assert.equal(system.get(fresh, 'where-ghar').p, 'new home');
});

test('custom location spellings are preserved instead of guessed to be standard home constructions', () => {
  const state = system.install({ vocab: { WHERE: [{ id: 'where-ghar', p: 'my custom home', g: 'ਘਰ ਵਿੱਚ', e: 'at home', enabled: false }] }, verbs: [] });
  assert.equal(system.get(state, 'where-ghar').p, 'my custom home');
  assert.equal(system.get(state, 'where-ghar').partOfSpeech, 'expression');
  assert.equal(state.vocab.WHERE[0].construction, undefined);
  assert.equal(state.vocab.WHERE[0].enabled, false);
});

test('missing legacy rows stay missing; central reload never runs default imports', () => {
  const state = system.install({ vocab: { WHAT: [] }, verbs: [], saved: [] });
  const fresh = system.install(system.snapshot(state));
  assert.equal(Object.keys(fresh.linguistic.entries).length, 0);
  assert.equal(fresh.vocab.WHAT.length, 0);
});

test('malformed legacy fields are retained for recovery instead of silently dropped', () => {
  const state = { vocab: { WHAT: [null, 'bad', { p: 'unknown', g: '', e: 'custom' }], WHEN: 'bad category' }, verbs: false, saved: [1] };
  system.install(state);
  assert.equal(state.linguistic.migrationRejected.length, 4);
  assert.equal(state.vocab.WHAT.length, 1);
  assert.ok(state.vocab.WHAT[0].id.startsWith('migrated-what-'));
  const id = state.vocab.WHAT[0].vocabularyId;
  assert.equal(system.install(system.snapshot(state)).vocab.WHAT[0].vocabularyId, id);
  assert.deepEqual(state.saved, [1]);
  assert.throws(() => system.install(null), /state object/);
});

test('newer schemas fail visibly without modifying the saved state', () => {
  const state = { linguistic: { schemaVersion: 999, entries: {}, bindings: {} }, saved: [1] };
  const before = structuredClone(state);
  assert.throws(() => system.install(state), /newer/);
  assert.deepEqual(state, before);
});

test('vocabulary, grammar and communication progression are independent and preserved', () => {
  const state = system.install(starter());
  state.linguistic.progression.vocabulary['lex:what-kitab'] = { mastery: .5 };
  state.linguistic.progression.grammar['agreement-gender'] = { mastery: .2 };
  state.linguistic.progression.communication['restaurant-ordering'] = { mastery: .1 };
  const fresh = system.install(system.snapshot(state));
  assert.deepEqual(fresh.linguistic.progression, state.linguistic.progression);
  assert.notEqual(fresh.linguistic.progression.vocabulary, fresh.linguistic.progression.grammar);
});

test('adding 5,000 entries preserves identity and supports fast discovery', () => {
  const state = system.install({ vocab: { WHAT: [] }, verbs: [] });
  const rows = Array.from({ length: 5000 }, (_, i) => ({ id: 'scale-' + i, p: 'word ' + i, g: 'ਸ਼ਬਦ ' + i, e: 'meaning ' + i, categories: ['scale'], partOfSpeech: 'noun' }));
  const start = performance.now();
  system.install(state, { expansion: rows });
  assert.equal(system.vocabulary(state).length, 5000);
  assert.ok(performance.now() - start < 5000, '5k migration/discovery should fit within five seconds');
  const entry = system.get(state, 'scale-1');
  state.vocab.LEXICON[1].e = 'edited';
  system.sync(state);
  assert.equal(system.get(state, 'scale-1'), entry, 'Saving should not recreate the central entries');
  const flatStart = performance.now();
  const flattened = Object.values(state.vocab).flat();
  assert.equal(flattened.length, 5000);
  assert.equal(flattened[4999].id, 'scale-4999');
  assert.ok(performance.now() - flatStart < 1000, 'Legacy dependency scans should flatten 5k entries within one second');
});

test('compact snapshots persist import edits, nested form edits, disabled bindings and deletions', () => {
  const expansion = [
    { id: 'bundled-water', p: 'pāṇī', g: 'ਪਾਣੀ', e: 'water', partOfSpeech: 'noun', gender: 'm', number: 'sg', semanticTags: ['drinkable'], categories: ['food'], verifiedGrammar: true },
    { id: 'bundled-cat', p: 'billī', g: 'ਬਿੱਲੀ', e: 'cat', partOfSpeech: 'noun', gender: 'f', number: 'sg', categories: ['animals'] },
    { id: 'bundled-good', p: 'changā', g: 'ਚੰਗਾ', e: 'good', partOfSpeech: 'adjective', categories: ['people'], forms: { m: 'changā' }, gScript: { forms: { m: 'ਚੰਗਾ' } } },
    { id: 'bundled-tree', p: 'rukh', g: 'ਰੁੱਖ', e: 'tree', partOfSpeech: 'noun', categories: ['nature'] },
    { id: 'bundled-disabled', p: 'ghar', g: 'ਘਰ', e: 'house', partOfSpeech: 'noun', categories: ['home'] }
  ];
  const state = system.install(starter(), { expansion });
  system.upsert(state, { id: 'bundled-water', e: 'user water' });
  system.get(state, 'bundled-good').forms.m = 'custom form';
  state.vocab.LEXICON.find(row => row.id === 'bundled-disabled').enabled = false;
  state.vocab.WHAT = state.vocab.WHAT.filter(row => row.id !== 'bundled-water');
  system.remove(state, 'bundled-tree');
  const saved = system.snapshot(state, { compact: true });
  assert.equal('lex:bundled-cat' in saved.linguistic.entries, false, 'pristine shipped entry should be regenerated');
  assert.equal(saved.linguistic.entries['lex:bundled-water'].e, 'user water');
  assert.equal(saved.linguistic.entries['lex:bundled-good'].forms.m, 'custom form');
  assert.ok(saved.linguistic.entries['lex:what-kitab'], 'legacy rows are always persisted');
  const fresh = system.install(JSON.parse(JSON.stringify(saved)), { expansion });
  assert.equal(system.get(fresh, 'bundled-cat').e, 'cat');
  assert.equal(system.get(fresh, 'bundled-water').e, 'user water');
  assert.equal(system.get(fresh, 'bundled-good').forms.m, 'custom form');
  assert.equal(fresh.vocab.LEXICON.find(row => row.id === 'bundled-disabled').enabled, false);
  assert.equal(fresh.vocab.WHAT.some(row => row.id === 'bundled-water'), false);
  assert.equal(system.get(fresh, 'bundled-tree').deleted, true);
  assert.equal(system.vocabulary(fresh).some(row => row.id === 'bundled-tree'), false);
  assert.ok(fresh.linguistic.categories.food.vocabularyIds.includes('lex:bundled-water'));
  assert.deepEqual(system.snapshot(fresh, { compact: true }), saved, 'rehydration should produce a stable compact representation');
});

test('compact 5,000-entry persistence stays within browser storage and rehydrates all IDs', () => {
  const expansion = Array.from({ length: 5000 }, (_, i) => ({ id: 'compact-' + i, p: 'word ' + i, g: 'ਸ਼ਬਦ ' + i,
    e: 'meaning ' + i, partOfSpeech: 'noun', categories: ['scale'], source: { type: 'reference', citation: 'x'.repeat(1000) } }));
  const state = system.install(starter(), { expansion });
  const compact = system.snapshot(state, { compact: true });
  assert.ok(JSON.stringify(compact).length < 500000, 'UTF-16 persisted text should fit comfortably within one MB');
  assert.equal(Object.keys(compact.linguistic.entries).length, 3);
  const fresh = system.install(compact, { expansion });
  assert.equal(system.vocabulary(fresh).length, 5003);
  assert.equal(system.resolveId(fresh, 'compact-4999'), 'lex:compact-4999');
});

test('editing a reviewed import revokes unsafe grammatical roles without losing its word or progress', () => {
  const expansion = [{ id: 'reviewed-water', p: 'pāṇī', g: 'ਪਾਣੀ', e: 'water', partOfSpeech: 'noun', gender: 'm', number: 'sg',
    semanticTags: ['drinkable'], verifiedGrammar: true, meanings: [{ english: 'water', source: 'dictionary' }] }];
  const state = system.install(starter(), { expansion });
  assert.ok(state.vocab.WHAT.some(row => row.id === 'reviewed-water'));
  const entry = system.get(state, 'reviewed-water');
  system.upsert(state, Object.assign({}, entry, { p: 'different pronunciation' }));
  assert.equal(entry.verifiedGrammar, false);
  assert.equal(state.vocab.WHAT.some(row => row.id === 'reviewed-water'), false);
  assert.ok(system.vocabulary(state).some(row => row.id === 'reviewed-water'));
  const restored = system.install(system.snapshot(state, { compact: true }), { expansion });
  assert.equal(restored.vocab.WHAT.some(row => row.id === 'reviewed-water'), false, 'a shipped review cannot approve an edited lemma again');
  system.upsert(restored, { id: 'reviewed-water', verifiedGrammar: true }, { reviewed: true });
  assert.equal(restored.vocab.WHAT.some(row => row.id === 'reviewed-water'), true);
  system.upsert(restored, { id: 'reviewed-water', partOfSpeech: 'expression' });
  assert.equal(restored.vocab.WHAT.some(row => row.id === 'reviewed-water'), false);
  system.upsert(restored, { id: 'reviewed-water', e: 'new translation' });
  assert.equal(system.get(restored, 'reviewed-water').meanings[0].english, 'new translation');
  assert.deepEqual(restored.wordProgress, state.wordProgress);
});

test('explicitly authored legacy role spelling edits retain their category while POS changes revoke it', () => {
  const state = system.install(starter());
  const entry = system.get(state, 'what-kitab');
  system.upsert(state, Object.assign({}, entry, { p: 'custom pronunciation' }));
  assert.equal(state.vocab.WHAT.some(row => row.id === 'what-kitab'), true);
  system.upsert(state, { id: 'what-kitab', partOfSpeech: 'adjective' });
  assert.equal(state.vocab.WHAT.some(row => row.id === 'what-kitab'), false);
  assert.ok(system.vocabulary(state).some(row => row.id === 'what-kitab'));
});

test('category learning views select the matching wood and hukam senses without changing lexical IDs or source data', () => {
  const audit = require('../vocabulary-audit'), learning = require('../learning-context');
  const expansion = require('../data/vocabulary-expansion').entries.filter(row => ['ਕਾਠ', 'ਹੁਕਮ'].includes(row.g));
  const state = system.install({ vocab: {}, verbs: [] }, { expansion, audit, categories: learning.categories });
  const ordinary = system.vocabulary(state), before = JSON.stringify(system.snapshot(state, { compact: true }));
  const find = (category, g) => system.vocabulary(state, { senseCategoryIds: [category] }).find(row => row.gurmukhi === g);
  const body = find('body', 'ਕਾਠ'), material = find('materials', 'ਕਾਠ');
  assert.equal(body.english, 'physique');assert.equal(body.gender, 'm');assert.ok(body.categories.includes('body'));
  assert.equal(material.english, 'wood');assert.equal(material.gender, 'f');assert.ok(material.categories.includes('materials'));
  assert.equal(body.id, material.id);assert.equal(body.vocabularyId, material.vocabularyId);
  assert.notEqual(body.displaySenseId, material.displaySenseId);assert.equal(body.selectedSenseId, body.displaySenseId);
  const culture = find('culture', 'ਹੁਕਮ'), communication = find('communication', 'ਹੁਕਮ');
  assert.equal(culture.english, 'spades');assert.equal(communication.english, 'order');
  assert.notEqual(culture.displaySenseId, communication.displaySenseId);
  assert.deepEqual(system.vocabulary(state), ordinary);
  assert.equal(JSON.stringify(system.snapshot(state, { compact: true })), before);
  assert.equal(system.vocabulary(state, { senseCategoryIds: ['body'] }).length, ordinary.length, 'Unmatched legacy rows keep their ordinary view.');
});

test('category learning views preserve stable-sense translation edits and manual category overrides', () => {
  const audit = require('../vocabulary-audit'), learning = require('../learning-context');
  const expansion = require('../data/vocabulary-expansion').entries.filter(row => row.g === 'ਕਾਠ');
  let state = system.install({ vocab: {}, verbs: [] }, { expansion, audit, categories: learning.categories });
  const entry = system.get(state, expansion[0].id);
  system.upsert(state, { id: expansion[0].id, e: 'my timber meaning' });
  assert.equal(system.vocabulary(state, { senseCategoryIds: ['materials'] })[0].english, 'my timber meaning');
  assert.equal(system.vocabulary(state)[0].english, 'my timber meaning');
  assert.equal(system.vocabulary(state, { senseCategoryIds: ['body'] })[0].english, 'physique', 'Editing the wood sense does not replace a separate physique sense.');
  system.upsert(state, { id: entry.id, categories: ['body', 'my-topic'] });
  const manual = system.vocabulary(state, { senseCategoryIds: ['body'] })[0];
  assert.equal(manual.english, 'my timber meaning');assert.deepEqual(manual.categories, ['body', 'my-topic']);
  assert.equal(manual.displaySenseId, undefined, 'Manual category assignment does not authorize another dictionary sense.');
  state = system.install(system.snapshot(state, { compact: true }), { expansion, audit, categories: learning.categories });
  const restored = system.vocabulary(state, { senseCategoryIds: ['body'] })[0];
  assert.equal(restored.english, 'my timber meaning');assert.deepEqual(restored.categories, ['body', 'my-topic']);
});
