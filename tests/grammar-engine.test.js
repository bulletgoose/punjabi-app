const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const engine = require('../grammar-engine');
const lexical = require('../linguistic-system');
const learning = require('../learning-context');

// Load the application's own seed definitions and upgrade paths, without a
// browser or a second test-only copy of its linguistic data.
function appState(returnContext) {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const defaults = html.slice(html.indexOf('  function defaultData(){'), html.indexOf('  /* ---------------- State load/save'));
  const startup = html.slice(html.indexOf('  const STORAGE_KEY ='), html.indexOf('  /* ---------------- Generation engine'));
  const scriptSeeds = html.slice(html.indexOf('  const gurmukhiSeeds ='), html.indexOf('  let scriptG='));
  const scriptInstaller = html.slice(html.indexOf('  function installScriptData(){'), html.indexOf('  function scriptProjection('));
  const window = { PunjabiLinguisticSystem: lexical, PunjabiLearningContext: learning, PunjabiGrammarEngine: engine };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'game-vocabulary.js'), 'utf8'), { window });
  const context = vm.createContext({ window, console, localStorage: { getItem: () => null, setItem() {} } });
  vm.runInContext(defaults + startup + scriptSeeds + scriptInstaller + '\ninstallScriptData(); this.fixtureState=state;', context);
  return returnContext ? context : context.fixtureState;
}
const seed = appState();
function verb(id) { return seed.verbs.find(v => v.id === id); }
function noun(id) { return seed.vocab.WHAT.find(v => v.id === id); }
function subject(id, changes) { return Object.assign({}, seed.vocab.WHO.find(v => v.id === id), changes || {}); }
function form(verbId, subjectId, changes, options) {
  return engine.conjugate(Object.assign({ verb: verb(verbId), subject: subject(subjectId, changes), aspect: 'habitual' }, options || {}));
}

test('required male, female and mixed-plural eating examples use the same lexical verb', () => {
  const examples = [['who-main', {}, 'khāndā hā̃', 'ਖਾਂਦਾ ਹਾਂ'], ['who-oh', { gender: 'f' }, 'khāndī hai', 'ਖਾਂਦੀ ਹੈ'], ['who-asi', {}, 'khānde hā̃', 'ਖਾਂਦੇ ਹਾਂ']];
  for (const [id, changes, roman, gurmukhi] of examples) {
    assert.equal(form('v-khana', id, changes).text, roman);
    assert.equal(form('v-khana', id, changes, { script: 'gurmukhi' }).text, gurmukhi);
  }
});

test('feminine plural agreement and past progressive retain number', () => {
  assert.equal(form('v-khana', 'who-asi', { gender: 'f' }).text, 'khāndīā̃ hā̃');
  assert.equal(form('v-khana', 'who-asi', { gender: 'f' }, { script: 'gurmukhi' }).text, 'ਖਾਂਦੀਆਂ ਹਾਂ');
  assert.equal(form('v-parhna', 'who-ohlok', { gender: 'f' }, { aspect: 'pastProgressive' }).text, 'paṛh rahīā̃ san');
  assert.equal(form('v-parhna', 'who-ohlok', { gender: 'f' }, { aspect: 'pastProgressive', script: 'gurmukhi' }).text, 'ਪੜ੍ਹ ਰਹੀਆਂ ਸਨ');
  assert.equal(form('v-khana', 'who-tu', {}, { aspect: 'pastHabitual', script: 'gurmukhi' }).text, 'ਖਾਂਦਾ ਸੀ');
});

test('transitive perfective agrees with the unmarked object in both scripts', () => {
  const args = { verb: verb('v-khana'), subject: subject('who-oh', { gender: 'f' }), object: noun('what-roti'), aspect: 'perfective' };
  const roman = engine.conjugate(args), gurmukhi = engine.conjugate({ ...args, script: 'gurmukhi' });
  assert.equal(roman.text, 'khādhī'); assert.equal(roman.subjectText, 'us ne');
  assert.equal(gurmukhi.text, 'ਖਾਧੀ'); assert.equal(gurmukhi.subjectText, 'ਉਸ ਨੇ');
  assert.equal(roman.agreementTarget, 'object');
  assert.equal(engine.conjugate({ ...args, object: noun('what-khana') }).text, 'khādhā');
});

test('standard Eastern Punjabi first/second-person subjects omit overt ne but keep object agreement', () => {
  for (const id of ['who-main', 'who-tu', 'who-asi', 'who-tusi']) {
    const args = { verb: verb('v-parhna'), subject: subject(id), object: noun('what-kitab'), aspect: 'perfective' };
    const result = engine.conjugate(args);
    assert.equal(result.text, 'paṛhī');
    assert.equal(result.subjectText, subject(id).p);
    assert.equal(result.agreementTarget, 'object');
  }
});

test('marked object blocks perfective agreement; intransitive past follows the subject', () => {
  const result = form('v-vekna', 'who-oh', { gender: 'f' }, { object: noun('what-film'), objectCase: 'marked', aspect: 'perfective' });
  assert.equal(result.text, 'vekhiā'); assert.equal(result.agreementTarget, 'default');
  assert.equal(form('v-jana', 'who-asi', { gender: 'f' }, { aspect: 'perfective', script: 'gurmukhi' }).text, 'ਗਈਆਂ');
  assert.equal(form('v-dena', 'who-main', {}, { object: noun('what-kitab'), aspect: 'perfective', script: 'gurmukhi' }).text, 'ਦਿੱਤੀ');
});

test('finite future is authored by person/gender and unsupported verbs fail safely', () => {
  assert.equal(form('v-jana', 'who-main', {}, { aspect: 'future' }).text, 'jāvā̃gā');
  assert.equal(form('v-jana', 'who-oh', { gender: 'f' }, { aspect: 'future', script: 'gurmukhi' }).text, 'ਜਾਵੇਗੀ');
  assert.equal(form('v-khana', 'who-tusi', { gender: 'f' }, { aspect: 'future', script: 'gurmukhi' }).text, 'ਖਾਓਗੀਆਂ');
  assert.equal(form('v-kharidna', 'who-main', {}, { aspect: 'future' }).ok, false);
  const edited = { ...verb('v-jana'), infinitive: 'custom lemma' };
  assert.equal(engine.conjugate({ verb: edited, subject: subject('who-main'), aspect: 'future' }).ok, false);
});

test('infinitives use authored object agreement and irregular action roots stay distinct', () => {
  assert.equal(engine.conjugate({ verb: verb('v-khana'), object: noun('what-roti'), aspect: 'infinitive' }).text, 'khāṇī');
  assert.equal(engine.conjugate({ verb: verb('v-khana'), object: noun('what-roti'), aspect: 'infinitive', script: 'gurmukhi' }).text, 'ਖਾਣੀ');
  assert.equal(form('v-khana', 'who-main', {}, { aspect: 'progressive', script: 'gurmukhi' }).text, 'ਖਾ ਰਿਹਾ ਹਾਂ');
  assert.equal(form('v-khana', 'who-main', {}, { aspect: 'plannedFuture', script: 'gurmukhi' }).text, 'ਖਾਣ ਵਾਲਾ ਹਾਂ');
  const custom = { id: 'custom', infinitive: 'x', root: 'x', forms: {} };
  assert.equal(engine.conjugate({ verb: custom, subject: subject('who-main') }).ok, false);
  assert.equal(engine.conjugate({ verb: custom, aspect: 'imperative' }).ok, false);
});

test('postpositions require oblique information and do not append to arbitrary phrases', () => {
  const boy = { id: 'boy', p: 'muṇḍā', g: 'ਮੁੰਡਾ', gender: 'm', number: 'sg', inflections: { oblique: 'muṇḍe' }, gScript: { inflections: { oblique: 'ਮੁੰਡੇ' } } };
  assert.equal(engine.nounPhrase(boy, { case: 'recipient' }).text, 'muṇḍe nū̃');
  assert.equal(engine.nounPhrase(boy, { case: 'recipient', script: 'gurmukhi' }).text, 'ਮੁੰਡੇ ਨੂੰ');
  assert.equal(engine.nounPhrase({ p: 'ghar vich', g: 'ਘਰ ਵਿੱਚ' }, { case: 'origin' }).ok, false);
  assert.equal(engine.nounPhrase(seed.vocab.WHERE.find(p => p.id === 'where-ghar'), { case: 'origin', script: 'gurmukhi' }).text, 'ਘਰ ਤੋਂ');
  const editedPlace = { ...seed.vocab.WHERE.find(p => p.id === 'where-ghar'), p: 'somewhere else' };
  assert.equal(engine.nounPhrase(editedPlace, { case: 'origin' }).ok, false);
});

test('semantic validation rejects inanimate agents and incompatible objects', () => {
  const agent = { id: 'water', p: 'pāṇī', g: 'ਪਾਣੀ', gender: 'm', number: 'sg', person: '3sg', semantic: { human: false, animate: false } };
  assert.equal(engine.conjugate({ verb: verb('v-parhna'), subject: agent }).ok, false);
  assert.equal(engine.conjugate({ verb: verb('v-khana'), subject: subject('who-main'), object: noun('what-kitab') }).ok, false);
  assert.equal(engine.conjugate({ verb: verb('v-jana'), subject: subject('who-main'), object: noun('what-pani') }).ok, false);
  assert.equal(engine.validateSentenceContext({ verb: { ...verb('v-jana'), subjectClass: 'animate' }, subject: { ...agent, semantic: { animate: true } } }).ok, true);
});

test('all new templates generate with the real default vocabulary and preserve canonical references', () => {
  const state = appState();
  lexical.install(state, { categories: learning.categories });
  for (const template of engine.templates) {
    for (const sample of [0, 0.35, 0.8]) {
      const sentence = engine.generate(template, state, values => values[Math.floor(sample * values.length)]);
      assert.ok(sentence, template.id + ' should be reachable from actual seeds');
      assert.ok(/[\u0a00-\u0a7f]/.test(sentence.gurmukhi));
      assert.ok(!/[A-Za-z]/.test(sentence.gurmukhi));
      assert.ok(!/undefined|⟦/.test(sentence.roman + sentence.gurmukhi + sentence.english));
      assert.ok(sentence.vocabularyIds.length > 1);
      sentence.vocabularyIds.forEach(id => assert.ok(lexical.get(state, id), id));
      sentence.sentenceBreakdown.forEach(part => assert.ok(part.vocabularyIds.length, template.id + ': every phrase references its lexical entry'));
    }
  }
});

test('disabled fixed dependencies and missing script forms prevent unsupported sentences', () => {
  const state = appState();
  state.vocab.QUESTION.find(q => q.id === 'q-ki').enabled = false;
  assert.equal(engine.generate(engine.templates.find(t => t.id === 'P50'), state), null);
  state.verbs.find(v => v.id === 'v-jana').enabled = false;
  assert.equal(engine.generate(engine.templates.find(t => t.id === 'P48'), state), null);
  state.vocab.WHO.forEach(p => { p.g = ''; });
  assert.equal(engine.generate(engine.templates.find(t => t.id === 'P47'), state), null);
});

test('template grammar metadata uses concepts and scenario identifiers', () => {
  for (const template of engine.templates) {
    assert.ok(template.requiredRoles.length);
    assert.ok(template.grammarConceptIds.includes('word-order'));
    assert.ok(template.scenarioIds.length);
    assert.ok(template.example.gurmukhi && template.example.english);
    assert.deepEqual(engine.metadataFor(template).grammarConceptIds, template.grammarConceptIds);
  }
  const legacy = engine.metadataFor({ id: 'P44', pattern: 'pastProgressObject' });
  assert.ok(legacy.grammarConceptIds.includes('past'));
  assert.ok(legacy.grammarConceptIds.includes('progressive'));
  const edited = { ...engine.templates[0], name: 'My edited name', difficulty: 8, probability: 0, enabled: false };
  Object.assign(edited, engine.metadataFor(edited));
  assert.equal(edited.name, 'My edited name');
  assert.equal(edited.difficulty, 8); assert.equal(edited.probability, 0); assert.equal(edited.enabled, false);
  for (const template of seed.templates.filter(t => /^P/.test(t.id))) {
    const metadata = engine.metadataFor(template);
    assert.ok(metadata.example && metadata.example.roman && metadata.example.gurmukhi && metadata.example.english, template.id + ' has a bilingual example');
    assert.ok(metadata.requiredRoles.length, template.id + ' has grammatical roles');
  }
  assert.equal(engine.metadataFor({ id: 'P20', pattern: 'politeRequest' }).requiredRoles.includes('subject'), false);
  assert.equal(engine.metadataFor({ id: 'P31', pattern: 'thereIs' }).requiredRoles.includes('subject'), false);
  assert.equal(engine.metadataFor({ id: 'P13', pattern: 'howDoing' }).aspect, 'habitual');
  assert.equal(engine.metadataFor({ id: 'P46', pattern: 'pastWent' }).aspect, 'perfective');
  assert.deepEqual(engine.dependenciesFor({ id: 'P14', pattern: 'wantObject' }), ['v-chahuna']);
});

test('existing patterns remain bilingual and separate action clauses retain the correct lemmas', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const context = appState(true);
  lexical.install(context.fixtureState, { categories: learning.categories });
  const generation = html.slice(html.indexOf('  /* ---------------- Generation engine'), html.indexOf('  /* ---------------- Rendering: Generate screen'));
  const agreementHelpers = html.slice(html.indexOf('  function habitualForSubject('), html.indexOf('  function validateGrammarMetadata('));
  const projection = html.slice(html.indexOf('  function scriptProjection('), html.indexOf("  const LEARNING_KEY="));
  const flags = html.slice(html.indexOf('  let scriptG='), html.indexOf('  function installScriptData(){'));
  vm.runInContext(flags + generation + agreementHelpers + projection + '\nthis.assembleFixture=assembleFromTemplate;', context);
  for (const template of context.fixtureState.templates.filter(t => /^P/.test(t.id))) {
    const sentence = context.assembleFixture(template);
    assert.ok(sentence, template.id);
    assert.ok(sentence.gurmukhi, template.id + ' has authored Gurmukhi');
    assert.ok(sentence.vocabularyIds.length, template.id + ' has canonical lexical IDs');
  }
  let connected;
  for (let attempts = 0; attempts < 50; attempts++) {
    const sentence = context.assembleFixture(context.fixtureState.templates.find(t => t.id === 'P37'));
    const actions = sentence.sentenceBreakdown.filter(p => p.category === 'VERB');
    if (actions.length === 2 && actions.every(p => p.vocabularyIds.length === 1) && actions[0].vocabularyIds[0] !== actions[1].vocabularyIds[0]) { connected = actions; break; }
  }
  assert.ok(connected, 'two distinct generated action clauses resolve distinct lexical verbs');
  connected.forEach(part => assert.equal(part.dictionaryForms.length, 1));
});
