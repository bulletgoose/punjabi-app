/* Punjabi grammar rules are separate from the lexical registry. Every output
   keeps the lexical ID of the word whose grammatical form it represents.
   Reference: Gill & Gleason, A Reference Grammar of Punjabi (2013 revision),
   §§5.4–5.5, 5.18–5.25, 8.2–8.5. This is a bounded learner grammar, not a
   claim that arbitrary imported dictionary entries can generate sentences. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./lexical-semantics'), require('./data/verb-morphology-profiles'));
  else root.PunjabiGrammarEngine = factory(root.PunjabiLexicalSemantics, root.PUNJABI_VERB_MORPHOLOGY_PROFILES);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (semantics, profileDataset) {
  'use strict';
  const REFERENCE = 'https://pt.learnpunjabi.org/assets/a%20reference%20grammar_final.pdf';
  const PERSONS = ['1sg', '2sg', '3sg', '1pl', '2pl', '3pl'];
  const auxiliary = {
    roman: { present: { '1sg': 'hā̃', '2sg': 'haĩ', '3sg': 'hai', '1pl': 'hā̃', '2pl': 'ho', '3pl': 'han' }, past: { '1sg': 'sī', '2sg': 'sī', '3sg': 'sī', '1pl': 'sī', '2pl': 'sī', '3pl': 'san' } },
    gurmukhi: { present: { '1sg': 'ਹਾਂ', '2sg': 'ਹੈਂ', '3sg': 'ਹੈ', '1pl': 'ਹਾਂ', '2pl': 'ਹੋ', '3pl': 'ਹਨ' }, past: { '1sg': 'ਸੀ', '2sg': 'ਸੀ', '3sg': 'ਸੀ', '1pl': 'ਸੀ', '2pl': 'ਸੀ', '3pl': 'ਸਨ' } }
  };
  const functional = {
    roman: { negative: 'nahī̃', question: 'kī', ergative: 'ne', recipient: 'nū̃', location: 'vich', origin: 'tō̃', instrument: 'nāl', accompaniment: 'nāl', comparison: 'tō̃', degree: 'ziādā' },
    gurmukhi: { negative: 'ਨਹੀਂ', question: 'ਕੀ', ergative: 'ਨੇ', recipient: 'ਨੂੰ', location: 'ਵਿੱਚ', origin: 'ਤੋਂ', instrument: 'ਨਾਲ', accompaniment: 'ਨਾਲ', comparison: 'ਤੋਂ', degree: 'ਜ਼ਿਆਦਾ' }
  };
  const agreed = (m, f, pl, fpl) => ({ m, f, pl, fpl });
  const progressive = { roman: agreed('rihā', 'rahī', 'rahe', 'rahīā̃'), gurmukhi: agreed('ਰਿਹਾ', 'ਰਹੀ', 'ਰਹੇ', 'ਰਹੀਆਂ') };
  const ability = { roman: agreed('sakdā', 'sakdī', 'sakde', 'sakdīā̃'), gurmukhi: agreed('ਸਕਦਾ', 'ਸਕਦੀ', 'ਸਕਦੇ', 'ਸਕਦੀਆਂ') };
  const planned = { roman: agreed('vālā', 'vālī', 'vāle', 'vālīā̃'), gurmukhi: agreed('ਵਾਲਾ', 'ਵਾਲੀ', 'ਵਾਲੇ', 'ਵਾਲੀਆਂ') };

  // Irregular past stems must be lexical facts. In particular, ਖਾਧਾ is never
  // obtained by attaching a regular past suffix to ਖਾ. All four forms below
  // are authored, and no unlisted verb receives a guessed perfective/future.
  const morphology = {};
  function register(id, roman, gurmukhi, transitive, rPast, gPast) {
    morphology[id] = { id, infinitive: { roman, gurmukhi }, transitive, subjectClass: 'human', perfective: rPast ? { roman: agreed(...rPast.split('|')), gurmukhi: agreed(...gPast.split('|')) } : null, source: REFERENCE, reviewStatus: 'curated-grammar; native-review-pending' };
  }
  register('v-khana', 'khāṇā', 'ਖਾਣਾ', true, 'khādhā|khādhī|khādhe|khādhīā̃', 'ਖਾਧਾ|ਖਾਧੀ|ਖਾਧੇ|ਖਾਧੀਆਂ');
  register('v-pina', 'pīṇā', 'ਪੀਣਾ', true, 'pītā|pītī|pīte|pītīā̃', 'ਪੀਤਾ|ਪੀਤੀ|ਪੀਤੇ|ਪੀਤੀਆਂ');
  register('v-jana', 'jāṇā', 'ਜਾਣਾ', false, 'giā|gaī|gae|gaīā̃', 'ਗਿਆ|ਗਈ|ਗਏ|ਗਈਆਂ');
  register('v-auna', 'āuṇā', 'ਆਉਣਾ', false, 'āiā|āī|āe|āīā̃', 'ਆਇਆ|ਆਈ|ਆਏ|ਆਈਆਂ');
  register('v-karna', 'karṇā', 'ਕਰਨਾ', true, 'kītā|kītī|kīte|kītīā̃', 'ਕੀਤਾ|ਕੀਤੀ|ਕੀਤੇ|ਕੀਤੀਆਂ');
  register('v-dena', 'deṇā', 'ਦੇਣਾ', true, 'dittā|dittī|ditte|dittīā̃', 'ਦਿੱਤਾ|ਦਿੱਤੀ|ਦਿੱਤੇ|ਦਿੱਤੀਆਂ');
  register('v-laina', 'laiṇā', 'ਲੈਣਾ', true, 'liā|laī|lae|laīā̃', 'ਲਿਆ|ਲਈ|ਲਏ|ਲਈਆਂ');
  register('v-parhna', 'paṛhṇā', 'ਪੜ੍ਹਨਾ', true, 'paṛhiā|paṛhī|paṛhe|paṛhīā̃', 'ਪੜ੍ਹਿਆ|ਪੜ੍ਹੀ|ਪੜ੍ਹੇ|ਪੜ੍ਹੀਆਂ');
  register('v-likhna', 'likhṇā', 'ਲਿਖਣਾ', true, 'likhiā|likhī|likhe|likhīā̃', 'ਲਿਖਿਆ|ਲਿਖੀ|ਲਿਖੇ|ਲਿਖੀਆਂ');
  register('v-vekna', 'vekhṇā', 'ਵੇਖਣਾ', true, 'vekhiā|vekhī|vekhe|vekhīā̃', 'ਵੇਖਿਆ|ਵੇਖੀ|ਵੇਖੇ|ਵੇਖੀਆਂ');
  register('v-sunna', 'suṇṇā', 'ਸੁਣਨਾ', true, 'suṇiā|suṇī|suṇe|suṇīā̃', 'ਸੁਣਿਆ|ਸੁਣੀ|ਸੁਣੇ|ਸੁਣੀਆਂ');
  register('v-bhejna', 'bhejṇā', 'ਭੇਜਣਾ', true, 'bhejiā|bhejī|bheje|bhejīā̃', 'ਭੇਜਿਆ|ਭੇਜੀ|ਭੇਜੇ|ਭੇਜੀਆਂ');
  register('v-kharidna', 'kharīdṇā', 'ਖ਼ਰੀਦਣਾ', true, 'kharīdiā|kharīdī|kharīde|kharīdīā̃', 'ਖ਼ਰੀਦਿਆ|ਖ਼ਰੀਦੀ|ਖ਼ਰੀਦੇ|ਖ਼ਰੀਦੀਆਂ');
  register('v-pakauna', 'pakāuṇā', 'ਪਕਾਉਣਾ', true, 'pakāiā|pakāī|pakāe|pakāīā̃', 'ਪਕਾਇਆ|ਪਕਾਈ|ਪਕਾਏ|ਪਕਾਈਆਂ');
  ['v-khana', 'v-pina', 'v-jana', 'v-auna', 'v-vekna', 'v-sunna'].forEach(id => { morphology[id].subjectClass = 'animate'; });
  const futureRows = {
    'v-jana': [['jāvā̃gā', 'jāvẽgā', 'jāvegā', 'jāvā̃ge', 'jāoge', 'jāṇge'], ['jāvā̃gī', 'jāvẽgī', 'jāvegī', 'jāvā̃gīā̃', 'jāogīā̃', 'jāṇgīā̃'], ['ਜਾਵਾਂਗਾ', 'ਜਾਵੇਂਗਾ', 'ਜਾਵੇਗਾ', 'ਜਾਵਾਂਗੇ', 'ਜਾਓਗੇ', 'ਜਾਣਗੇ'], ['ਜਾਵਾਂਗੀ', 'ਜਾਵੇਂਗੀ', 'ਜਾਵੇਗੀ', 'ਜਾਵਾਂਗੀਆਂ', 'ਜਾਓਗੀਆਂ', 'ਜਾਣਗੀਆਂ']],
    'v-khana': [['khāvā̃gā', 'khāvẽgā', 'khāvegā', 'khāvā̃ge', 'khāoge', 'khāṇge'], ['khāvā̃gī', 'khāvẽgī', 'khāvegī', 'khāvā̃gīā̃', 'khāogīā̃', 'khāṇgīā̃'], ['ਖਾਵਾਂਗਾ', 'ਖਾਵੇਂਗਾ', 'ਖਾਵੇਗਾ', 'ਖਾਵਾਂਗੇ', 'ਖਾਓਗੇ', 'ਖਾਣਗੇ'], ['ਖਾਵਾਂਗੀ', 'ਖਾਵੇਂਗੀ', 'ਖਾਵੇਗੀ', 'ਖਾਵਾਂਗੀਆਂ', 'ਖਾਓਗੀਆਂ', 'ਖਾਣਗੀਆਂ']],
    'v-karna': [['karā̃gā', 'karẽgā', 'karegā', 'karā̃ge', 'karoge', 'karange'], ['karā̃gī', 'karẽgī', 'karegī', 'karā̃gīā̃', 'karogīā̃', 'karangīā̃'], ['ਕਰਾਂਗਾ', 'ਕਰੇਂਗਾ', 'ਕਰੇਗਾ', 'ਕਰਾਂਗੇ', 'ਕਰੋਗੇ', 'ਕਰਨਗੇ'], ['ਕਰਾਂਗੀ', 'ਕਰੇਂਗੀ', 'ਕਰੇਗੀ', 'ਕਰਾਂਗੀਆਂ', 'ਕਰੋਗੀਆਂ', 'ਕਰਨਗੀਆਂ']]
  };
  Object.keys(futureRows).forEach(id => {
    const [rm, rf, gm, gf] = futureRows[id];
    const personMap = values => Object.fromEntries(PERSONS.map((p, i) => [p, values[i]]));
    morphology[id].future = { roman: { m: personMap(rm), f: personMap(rf) }, gurmukhi: { m: personMap(gm), f: personMap(gf) } };
  });
  const sourceProfiles = new Map((profileDataset && profileDataset.profiles || []).map(p => [p.g, p]));
  function enrichVerb(entry) {
    if (!entry || entry.partOfSpeech !== 'verb') return null;
    const profile = sourceProfiles.get(entry.g);
    if (!profile) return null;
    const imported = /^wt-pa-/.test(entry.primaryId || entry.id || '');
    // Only untouched dictionary identities are authorized by an imported
    // profile. User-edited stems, translations and inflections are preserved.
    if (imported && (entry.p !== profile.p || entry.e !== profile.sourceEnglish)) return null;
    const result = { grammarReview: JSON.parse(JSON.stringify(profile.grammarReview)) };
    if (imported) {
      Object.assign(result, { root: profile.root, infinitive: entry.p, imperative: profile.imperative, forms: profile.forms, habitual: profile.habitual,
        gScript: { ...profile.gScript }, verifiedGrammar: profile.verifiedGrammar === true,
        eligibleSenses: profile.eligibleSenses, morphologicalValidation: { status: 'source-crosschecked-rule', habitual: true, future: !!profile.future, perfective: !!profile.perfective, imperative: 'reference-rule-consonantal-plural' } });
      if (profile.verifiedGrammar) Object.assign(result, { base: profile.base, selectedSenseId: profile.selectedSenseId,
        transitive: profile.transitive, takesTags: profile.takesTags, subjectClass: profile.subjectClass });
    } else {
      // Seed entries already contain authored valency and habitual paradigms.
      // Crosscheck the same Gurmukhi lemma before extending tense coverage.
      if (!entry.gScript || entry.gScript.infinitive !== profile.g || !entry.infinitive) return null;
      result.gScript = { ...entry.gScript };
    }
    // An existing seed paradigm may have been edited before lexical edit
    // tracking existed. Extend missing tense fields without replacing it.
    const owns = (value, field) => Object.prototype.hasOwnProperty.call(value || {}, field);
    if (profile.future) {
      if (imported || !owns(entry, 'future')) result.future = profile.future;
      if (imported || !owns(entry.gScript, 'future')) result.gScript.future = profile.gFuture;
    }
    if (profile.perfective && !(morphology[entry.primaryId || entry.id] && morphology[entry.primaryId || entry.id].perfective)) {
      if (imported || !owns(entry, 'perfective')) result.perfective = profile.perfective;
      if (imported || !owns(entry.gScript, 'perfective')) result.gScript.perfective = profile.gPerfective;
    }
    if (result.verifiedGrammar) { result.type = 'simple'; result.isModalComplement = true; }
    return JSON.parse(JSON.stringify(result));
  }
  function profileForEntry(entry) { return enrichVerb(entry); }
  const subjectCases = {
    'who-main': ['main', 'ਮੈਂ', 'main', 'ਮੈਂ'], 'who-tu': ['tū̃', 'ਤੂੰ', 'tū̃', 'ਤੂੰ'], 'who-tusi': ['tusī̃', 'ਤੁਸੀਂ', 'tusī̃', 'ਤੁਸੀਂ'], 'who-asi': ['asī̃', 'ਅਸੀਂ', 'asī̃', 'ਅਸੀਂ'],
    'who-oh': ['oh', 'ਉਹ', 'us', 'ਉਸ'], 'who-ohlok': ['oh lok', 'ਉਹ ਲੋਕ', 'ohnā̃', 'ਉਨ੍ਹਾਂ'], 'who-lok': ['lok', 'ਲੋਕ', 'lokā̃', 'ਲੋਕਾਂ'],
    'who-bhai': ['merā bhāī', 'ਮੇਰਾ ਭਾਈ', 'mere bhāī', 'ਮੇਰੇ ਭਾਈ'], 'who-bhain': ['merī bhaiṇ', 'ਮੇਰੀ ਭੈਣ', 'merī bhaiṇ', 'ਮੇਰੀ ਭੈਣ'],
    'who-ma': ['merī mā̃', 'ਮੇਰੀ ਮਾਂ', 'merī mā̃', 'ਮੇਰੀ ਮਾਂ'], 'who-pio': ['mere piō', 'ਮੇਰੇ ਪਿਓ', 'mere piō', 'ਮੇਰੇ ਪਿਓ'],
    'who-mape': ['mere mā̃-piō', 'ਮੇਰੇ ਮਾਂ-ਪਿਓ', 'mere mā̃-piō', 'ਮੇਰੇ ਮਾਂ-ਪਿਓ'], 'who-bacce': ['bacce', 'ਬੱਚੇ', 'bacciā̃', 'ਬੱਚਿਆਂ'],
    'who-sathi': ['merā sāthī', 'ਮੇਰਾ ਸਾਥੀ', 'mere sāthī', 'ਮੇਰੇ ਸਾਥੀ'], 'who-dost': ['merā dost', 'ਮੇਰਾ ਦੋਸਤ', 'mere dost', 'ਮੇਰੇ ਦੋਸਤ'],
    'who-parivar': ['merā parivār', 'ਮੇਰਾ ਪਰਿਵਾਰ', 'mere parivār', 'ਮੇਰੇ ਪਰਿਵਾਰ'], 'who-koi': ['koī', 'ਕੋਈ', 'kisē', 'ਕਿਸੇ'], 'who-harkoi': ['har koī', 'ਹਰ ਕੋਈ', 'har kisē', 'ਹਰ ਕਿਸੇ']
  };
  const placeCases = {
    'where-ghar': ['ghar', 'ਘਰ'], 'where-dafter': ['dafter', 'ਦਫ਼ਤਰ'], 'where-school': ['school', 'ਸਕੂਲ'], 'where-college': ['college', 'ਕਾਲਜ'],
    'where-hospital': ['haspatāl', 'ਹਸਪਤਾਲ'], 'where-park': ['park', 'ਪਾਰਕ'], 'where-gym': ['gym', 'ਜਿਮ'], 'where-punjab': ['Punjab', 'ਪੰਜਾਬ'], 'where-sahar': ['shehar', 'ਸ਼ਹਿਰ']
  };
  const nounCases = {
    'what-pani': ['pāṇī', 'ਪਾਣੀ', 'pāṇī', 'ਪਾਣੀ'], 'what-cah': ['cāh', 'ਚਾਹ', 'cāh', 'ਚਾਹ'],
    'what-roti': ['roṭī', 'ਰੋਟੀ', 'roṭī', 'ਰੋਟੀ'], 'what-dudh': ['dudh', 'ਦੁੱਧ', 'dudh', 'ਦੁੱਧ'],
    'what-phal': ['phal', 'ਫਲ', 'phal', 'ਫਲ'], 'what-khana': ['khāṇā', 'ਖਾਣਾ', 'khāṇe', 'ਖਾਣੇ'],
    'game-education-9': ['kalam', 'ਕਲਮ', 'kalam', 'ਕਲਮ'], 'game-education-10': ['painsil', 'ਪੈਂਸਿਲ', 'painsil', 'ਪੈਂਸਿਲ']
  };
  function scriptName(script) { return script === 'gurmukhi' || script === 'Gurmukhi' ? 'gurmukhi' : 'roman'; }
  function textOf(item, script) { return script === 'gurmukhi' ? item.g || (/^[^A-Za-z]*[\u0a00-\u0a7f]/.test(item.p || '') ? item.p : '') : item.p || item.roman || ''; }
  function lexicalId(item) { return item && (item.vocabularyId || item.id); }
  function bad(reason) { return { ok: false, reason }; }
  function presentText(value) { return typeof value === 'string' && value.trim() && !/⟦|⟧/.test(value); }
  function validText(value, script) { return presentText(value) && (script !== 'gurmukhi' || /[\u0a00-\u0a7f]/.test(value)); }
  function numberOf(subject) { return subject.number === 'pl' || ['1pl', '2pl', '3pl'].includes(subject.person) ? 'pl' : 'sg'; }
  function agreementKey(item) { return numberOf(item) === 'pl' ? (item.gender === 'f' ? 'fpl' : 'pl') : (item.gender === 'f' ? 'f' : 'm'); }
  function semanticValue(item, name) {
    for (const field of ['semantic', 'semantics', 'semanticProperties']) {
      const value = item && item[field];
      if (value && typeof value === 'object' && !Array.isArray(value) && typeof value[name] === 'boolean') return value[name];
      if (Array.isArray(value) && value.includes(name)) return true;
    }
    const tags = item && (item.semanticTags || item.tags) || [];
    return tags.includes(name) ? true : undefined;
  }
  function subjectMatchesReviewed(item) {
    const row = subjectCases[item.id];
    return !!row && [row[0], row[1]].includes(item.p) && (!item.g || item.g === row[1]);
  }
  function nounMatchesReviewed(item) {
    const row = nounCases[item.id];
    return !!row && item.p === row[0] && item.g === row[1];
  }
  function writingInstrument(item) { return tagsOf(item).includes('writing-instrument') || nounMatchesReviewed(item) && ['game-education-9', 'game-education-10'].includes(item.id); }
  function human(item) {
    if (semanticValue(item, 'human') !== undefined) return semanticValue(item, 'human');
    return subjectMatchesReviewed(item);
  }
  function tagsOf(item) { return item.semanticTags || item.tags || []; }
  function requiredTags(verb) { return verb.takesTags && verb.takesTags.length ? verb.takesTags : verb.takesTag ? [verb.takesTag] : []; }
  function compatible(verb, object) {
    const required = requiredTags(verb);
    if (!object) return !required.length;
    return required.length > 0 && required.some(tag => tagsOf(object).includes(tag));
  }
  function reviewedMorphology(verb) {
    const row = morphology[verb.id];
    if (!row || !Object.values(row.infinitive).includes(verb.infinitive)) return null;
    if (verb.gScript && verb.gScript.infinitive && verb.gScript.infinitive !== row.infinitive.gurmukhi) return null;
    return row;
  }
  function morphologyFor(verb) { const row = reviewedMorphology(verb); return row ? JSON.parse(JSON.stringify(row)) : null; }
  function verbRulesFor(verb) { const row = reviewedMorphology(verb); return { transitive: typeof verb.transitive === 'boolean' ? verb.transitive : row ? row.transitive : requiredTags(verb).length > 0, requiredObjectTags: requiredTags(verb), subjectClass: verb.subjectClass || (row && row.subjectClass) || 'human' }; }

  // Case phrases require an authored oblique or an explicitly invariant noun.
  // We never turn an already postpositional phrase into "... ਵਿੱਚ ਤੋਂ".
  function nounPhrase(item, options) {
    options = options || {};
    const script = scriptName(options.script), role = options.case || 'direct';
    if (!item) return bad('A noun phrase needs a lexical entry.');
    const data = script === 'gurmukhi' ? item.gScript || item : item;
    const direct = textOf(item, script);
    if (role === 'direct' && !options.postposition) return validText(direct, script) ? { ok: true, text: direct, vocabularyId: lexicalId(item), case: 'direct' } : bad('The dictionary form is missing in this script.');
    const pronounFirstSecond = /^[12]/.test(item.person || '') && subjectMatchesReviewed(item);
    if (role === 'ergative' && pronounFirstSecond) return { ok: true, text: direct, vocabularyId: lexicalId(item), case: 'ergative', surfaceMarker: false };
    if (role === 'recipient' && validText(data.dative, script)) return { ok: true, text: data.dative, vocabularyId: lexicalId(item), case: 'oblique', postposition: 'recipient' };
    const noun = data.inflections || data.nounForms || {};
    let oblique = numberOf(item) === 'pl' ? noun.pluralOblique || noun.oblique : noun.oblique;
    if (oblique && typeof oblique === 'object') oblique = oblique[script === 'gurmukhi' ? 'g' : 'p'];
    if (!oblique && data.indeclinable === true) oblique = direct;
    if (!oblique && subjectMatchesReviewed(item)) oblique = subjectCases[item.id][script === 'gurmukhi' ? 3 : 2];
    if (!oblique && nounMatchesReviewed(item)) oblique = nounCases[item.id][script === 'gurmukhi' ? 3 : 2];
    const place = placeCases[item.id];
    const placeUnedited = place && [place[0], place[0] + ' vich'].includes(item.p) && [place[1], place[1] + ' ਵਿੱਚ'].includes(item.g);
    if (!oblique && placeUnedited && [item.dest, item.gScript && item.gScript.dest].includes(place[script === 'gurmukhi' ? 1 : 0])) oblique = place[script === 'gurmukhi' ? 1 : 0];
    if (!validText(oblique, script)) return bad('An authored oblique form is required for this postposition.');
    const marker = options.postposition || functional[script][role];
    if (!marker) return role === 'oblique' ? { ok: true, text: oblique, vocabularyId: lexicalId(item), case: role } : bad('This case or postposition is unsupported.');
    if (!validText(marker, script)) return bad('An authored postposition is required in this script.');
    return { ok: true, text: oblique + ' ' + marker, vocabularyId: lexicalId(item), case: 'oblique', postposition: role };
  }

  function validateSentenceContext(context) {
    const { subject, verb, object } = context || {};
    if (!subject || !PERSONS.includes(subject.person)) return bad('A reviewed subject needs person metadata.');
    if (!['m', 'f'].includes(subject.gender) || !['sg', 'pl'].includes(subject.number)) return bad('A subject needs gender and number metadata.');
    if (!verb) return bad('An action is required.');
    const subjectClass = verbRulesFor(verb).subjectClass;
    const subjectSense=(subject.senses||[]).find(s=>s.id===subject.selectedSenseId), ageClass=subject.ageClass||subject.semanticProperties&&subject.semanticProperties.ageClass||subjectSense&&subjectSense.semanticProperties&&subjectSense.semanticProperties.ageClass;
    if(ageClass==='infant'&&!['sleep','cry','weep','laugh','smile','breathe','yawn','come','go'].includes(verb.base))return bad('This action requires capabilities not established for an infant subject.');
    if (subjectClass === 'human' && !human(subject)) return bad('This action requires a human subject.');
    if (subjectClass === 'animate' && semanticValue(subject, 'animate') !== true && !human(subject)) return bad('This action requires an animate subject.');
    if (object && !compatible(verb, object)) return bad('The object does not satisfy the action’s semantic constraints.');
    if (object && (!['m', 'f'].includes(object.gender) || !['sg', 'pl'].includes(object.number))) return bad('An object needs gender and number metadata.');
    if (context.recipient && !human(context.recipient)) return bad('This recipient must be human.');
    return { ok: true };
  }

  function conjugate(args) {
    args = args || {};
    const verb = args.verb, subject = args.subject, script = scriptName(args.script);
    if (!verb) return bad('A lexical verb is required.');
    const data = script === 'gurmukhi' ? verb.gScript || verb : verb;
    const aspect = args.aspect || args.tense || 'habitual';
    if (aspect === 'infinitive') {
      const key = args.object && agreementKey(args.object), inflections = data.inflections || {};
      let value = key && key !== 'm' ? inflections[{ f: 'f', pl: 'plm', fpl: 'plf' }[key]] : data.infinitive;
      // Infinitives ending in the productive -ṇā/-nā class inflect for noun
      // gender/number. This rule never derives a past stem or finite future.
      if (!value && key && (script === 'gurmukhi' ? /[ਣਨ]ਾ$/u : /[ṇn]ā$/u).test(data.infinitive || '')) {
        value = data.infinitive.replace(script === 'gurmukhi' ? /ਾ$/u : /ā$/u, script === 'gurmukhi' ? { f: 'ੀ', pl: 'ੇ', fpl: 'ੀਆਂ' }[key] : { f: 'ī', pl: 'e', fpl: 'īā̃' }[key]);
      }
      return validText(value, script) ? { ok: true, text: value, vocabularyId: lexicalId(verb), agreementTarget: args.object ? 'object' : 'none', aspect } : bad('This infinitive form has not been authored.');
    }
    if (aspect === 'imperative') return validText(data.imperative, script) ? { ok: true, text: data.imperative, vocabularyId: lexicalId(verb), aspect } : bad('No reviewed imperative is available.');
    const validation = validateSentenceContext(args);
    if (!validation.ok) return validation;
    const person = subject.person, key = agreementKey(subject);
    let text, subjectText = textOf(subject, script), agreementTarget = 'subject', grammarNote;
    const past = args.tense === 'past' || aspect === 'pastHabitual' || aspect === 'pastProgressive';
    const aux = auxiliary[script][past ? 'past' : 'present'][person];
    if (aspect === 'habitual' || aspect === 'pastHabitual') {
      const explicit = data.habitual && data.habitual[key];
      let participle = explicit;
      if (!participle) {
        const form = data.forms && data.forms[person];
        if (!validText(form, script)) return bad('No authored habitual form is available for this person.');
        const tail = script === 'gurmukhi' ? /\s+(ਹਾਂ|ਹੈਂ|ਹੋ|ਹੈ|ਹਨ)$/u : /\s+(hā̃|hāṃ|haĩ|ho|hai|han)$/u;
        if (!tail.test(form)) return bad('An authored auxiliary is required in the habitual form.');
        participle = form.replace(tail, '');
        const ending = script === 'gurmukhi' ? /ਦ[ਾੇ]$/u : /d[āe]$/u;
        if (!ending.test(participle)) return bad('Supply an explicit habitual agreement paradigm for this verb.');
        participle = participle.replace(ending, script === 'gurmukhi' ? { m: 'ਦਾ', f: 'ਦੀ', pl: 'ਦੇ', fpl: 'ਦੀਆਂ' }[key] : { m: 'dā', f: 'dī', pl: 'de', fpl: 'dīā̃' }[key]);
        if (data.prefix && !participle.startsWith(data.prefix + ' ')) participle = data.prefix + ' ' + participle;
      }
      text = participle + ' ' + aux;
      grammarNote = (past ? 'Past habitual' : 'Habitual present') + '; the participle agrees with the subject in gender and number, and the auxiliary in person.';
    } else if (['progressive', 'pastProgressive', 'ability', 'plannedFuture'].includes(aspect)) {
      if (!validText(data.root, script)) return bad('An authored action root is required.');
      if (aspect === 'plannedFuture') {
        // The final gender vowel can be removed from an authored infinitive;
        // deriving this from the action root loses irregular infinitive stems.
        const infinitiveOblique = data.inflections && data.inflections.oblique || (presentText(data.infinitive) && data.infinitive.replace(script === 'gurmukhi' ? /ਾ$/u : /ā$/u, ''));
        if (!validText(infinitiveOblique, script)) return bad('The planned-future construction requires an authored oblique infinitive.');
        text = infinitiveOblique + ' ' + planned[script][key] + ' ' + aux;
        grammarNote = 'Intention expressed with an oblique infinitive and vālā; this is distinct from the finite future.';
      } else {
        text = data.root + ' ' + (aspect === 'ability' ? ability : progressive)[script][key] + ' ' + aux;
        grammarNote = (aspect === 'ability' ? 'Ability' : past ? 'Past progressive' : 'Present progressive') + '; agreement follows the subject.';
      }
    } else if (aspect === 'future') {
      const reviewed = reviewedMorphology(verb);
      const future = data.future || reviewed && reviewed.future && reviewed.future[script];
      text = future && future[subject.gender] && future[subject.gender][person];
      if (!validText(text, script)) return bad('This finite future form has not been reviewed; choose a supported verb.');
      grammarNote = 'Finite future; the verb agrees with the subject in person, number and gender.';
    } else if (aspect === 'perfective') {
      const reviewed = reviewedMorphology(verb);
      const forms = data.perfective || reviewed && reviewed.perfective && reviewed.perfective[script];
      if (!forms) return bad('This perfective paradigm has not been reviewed.');
      const transitive = verbRulesFor(verb).transitive;
      let target = subject;
      if (transitive) {
        const ergative = nounPhrase(subject, { case: 'ergative', script });
        if (!ergative.ok) return ergative;
        subjectText = ergative.text;
        const marked = args.objectCase === 'marked' || args.object && args.object.case === 'marked';
        target = args.object && !marked ? args.object : { gender: 'm', number: 'sg' };
        agreementTarget = args.object && !marked ? 'object' : 'default';
      }
      text = forms[agreementKey(target)];
      if (!validText(text, script)) return bad('This perfective agreement form has not been authored.');
      if (args.auxiliary === 'past') text += ' ' + (numberOf(target) === 'pl' ? auxiliary[script].past['3pl'] : auxiliary[script].past['3sg']);
      grammarNote = transitive ? 'Transitive perfective: agreement follows the unmarked direct object; with a marked/absent object it is masculine singular. Standard first- and second-person pronouns have no overt ne.' : 'Intransitive perfective: gender and number agreement follows the subject.';
    } else return bad('This tense or aspect is not supported.');
    if (!validText(subjectText, script)) return bad('The subject is missing in this script.');
    if (args.negative) text = functional[script].negative + ' ' + text;
    return { ok: true, text, subjectText, vocabularyId: lexicalId(verb), agreementTarget, aspect, grammarNote, questionMarker: args.question ? functional[script].question : '' };
  }

  const concepts = [
    ['word-order', 'Subject, object, verb order'], ['pronouns', 'Person and respectful agreement'], ['gender-agreement', 'Gender and number agreement'],
    ['habitual-present', 'Habitual present'], ['progressive', 'Progressive aspect'], ['past', 'Past auxiliaries'], ['perfective', 'Perfective aspect'],
    ['ergativity', 'Transitive perfective and object agreement'], ['future', 'Finite future'], ['planned-future', 'Planned future'], ['infinitives', 'Infinitive agreement'],
    ['imperatives', 'Polite requests'], ['modals', 'Ability construction'], ['dative', 'Dative experiencers'], ['possession', 'Possession with kol'],
    ['oblique', 'Oblique noun phrases'], ['postpositions', 'Postpositions'], ['negation', 'Negation'], ['questions', 'Questions'],
    ['connected-clauses', 'Connected clauses'], ['reasons', 'Reason clauses'], ['conditions', 'Conditions'], ['comparisons', 'Comparative constructions']
  ].map(([id, name]) => ({ id, name, prerequisiteConceptIds: id === 'word-order' ? [] : ['word-order'], source: REFERENCE }));
  const templateRows = [
    ['P47', 'Will do something', 'Future plans', 3, 'finiteFutureObject', ['subject', 'object', 'verb'], 'future', ['future'], 'daily-routine'],
    ['P48', 'Will go somewhere', 'Travel and directions', 3, 'finiteFutureMotion', ['subject', 'destination', 'verb'], 'future', ['future', 'postpositions'], 'directions'],
    ['P49', 'Will not do it', 'Negatives', 3, 'finiteFutureNegative', ['subject', 'object', 'verb'], 'future', ['future', 'negation'], 'future-plans'],
    ['P50', 'Will you do it?', 'Questions', 3, 'finiteFutureQuestion', ['subject', 'object', 'verb'], 'future', ['future', 'questions'], 'future-plans'],
    ['P51', 'Completed an action', 'Past experiences', 4, 'perfectiveObject', ['subject', 'object', 'verb'], 'perfective', ['perfective', 'ergativity'], 'past-experience'],
    ['P52', 'Came from somewhere', 'Travel and directions', 4, 'perfectiveOrigin', ['subject', 'origin', 'verb'], 'perfective', ['perfective', 'oblique', 'postpositions'], 'directions'],
    ['P53', 'Give something to someone', 'Family and relationships', 3, 'giveRecipient', ['subject', 'recipient', 'object', 'verb'], 'habitual', ['dative', 'postpositions'], 'family-discussions'],
    ['P54', 'Gave something to someone', 'Past experiences', 4, 'perfectiveRecipient', ['subject', 'recipient', 'object', 'verb'], 'perfective', ['perfective', 'ergativity', 'dative'], 'past-experience'],
    ['P55', 'Come from somewhere', 'Travel and directions', 3, 'originProgressive', ['subject', 'origin', 'verb'], 'progressive', ['progressive', 'oblique', 'postpositions'], 'directions'],
    ['P56', 'Go with someone', 'Family and relationships', 3, 'accompaniment', ['subject', 'companion', 'destination', 'verb'], 'progressive', ['progressive', 'oblique', 'postpositions'], 'family-discussions'],
    ['P57', 'Compare two things', 'Opinions', 4, 'comparison', ['object', 'comparison', 'description'], 'state', ['comparisons', 'oblique', 'gender-agreement'], 'opinions-reasoning'],
    ['P58', 'Do something with a tool', 'Everyday activities', 4, 'instrument', ['subject', 'object', 'instrument', 'verb'], 'habitual', ['oblique', 'postpositions', 'habitual-present'], 'daily-routine'],
    ['P59', 'Identify a thing', 'Descriptions', 1, 'nominalIdentity', ['object'], 'state', ['auxiliaries'], 'daily-routine'],
    ['P60', 'Describe a thing', 'Descriptions', 2, 'nominalDescription', ['object', 'description'], 'state', ['gender-agreement'], 'daily-routine'],
    ['P61', 'Locate a thing', 'Travel and directions', 2, 'nominalLocation', ['object', 'location'], 'state', ['postpositions'], 'directions'],
    ['P62', 'Where is a thing?', 'Questions', 2, 'nominalWhereQuestion', ['object'], 'state', ['questions'], 'directions'],
    ['P63', 'Identify an occupation', 'People and identity', 2, 'occupationIdentity', ['subject', 'occupation'], 'state', ['auxiliaries'], 'family-discussions'],
    ['P64', 'Future action without an object', 'Future plans', 3, 'finiteFutureBare', ['subject', 'verb'], 'future', ['future'], 'future-plans'],
    ['P65', 'Completed action without an object', 'Past experiences', 3, 'perfectiveBare', ['subject', 'verb'], 'perfective', ['perfective'], 'past-experience'],
    ['P66', 'How an action is happening', 'Everyday activities', 3, 'mannerProgressive', ['subject', 'time', 'manner', 'verb'], 'progressive', ['progressive'], 'daily-routine'],
    ['P67', 'Describe a thing in the past', 'Past experiences', 3, 'nominalPastDescription', ['object', 'description'], 'state', ['past', 'gender-agreement'], 'past-experience'],
    ['P68', 'A thing is not like that', 'Negatives', 2, 'nominalNegativeDescription', ['object', 'description'], 'state', ['negation', 'gender-agreement'], 'daily-routine'],
    ['P69', 'Possess a thing', 'Everyday activities', 2, 'nominalPossession', ['subject', 'object'], 'state', ['possession','oblique'], 'daily-routine'],
    ['P70', 'Like a thing', 'Opinions', 2, 'nominalPreference', ['subject', 'object'], 'state', ['dative','gender-agreement'], 'opinions-reasoning'],
    ['P71', 'Wait because of a reason', 'Explanations', 3, 'causalProgressive', ['subject', 'reason', 'verb'], 'progressive', ['reasons','oblique','progressive'], 'opinions-reasoning']
  ];
  const examples = {
    P47: ['main khāṇā khāvā̃gā', 'ਮੈਂ ਖਾਣਾ ਖਾਵਾਂਗਾ', 'I will eat food.'], P48: ['oh ghar jāvegī', 'ਉਹ ਘਰ ਜਾਵੇਗੀ', 'She will go home.'],
    P49: ['main khāṇā nahī̃ khāvā̃gā', 'ਮੈਂ ਖਾਣਾ ਨਹੀਂ ਖਾਵਾਂਗਾ', 'I will not eat food.'], P50: ['kī tusī̃ khāṇā khāoge', 'ਕੀ ਤੁਸੀਂ ਖਾਣਾ ਖਾਓਗੇ', 'Will you eat food?'],
    P51: ['us ne roṭī khādhī', 'ਉਸ ਨੇ ਰੋਟੀ ਖਾਧੀ', 'She ate flatbread.'], P52: ['oh ghar tō̃ āī', 'ਉਹ ਘਰ ਤੋਂ ਆਈ', 'She came from home.'],
    P53: ['main merī bhaiṇ nū̃ pāṇī dindā hā̃', 'ਮੈਂ ਮੇਰੀ ਭੈਣ ਨੂੰ ਪਾਣੀ ਦਿੰਦਾ ਹਾਂ', 'I give water to my sister.'], P54: ['main merī bhaiṇ nū̃ pāṇī dittā', 'ਮੈਂ ਮੇਰੀ ਭੈਣ ਨੂੰ ਪਾਣੀ ਦਿੱਤਾ', 'I gave water to my sister.'],
    P55: ['oh ghar tō̃ ā rahī hai', 'ਉਹ ਘਰ ਤੋਂ ਆ ਰਹੀ ਹੈ', 'She is coming from home.'], P56: ['main mere dost nāl ghar jā rihā hā̃', 'ਮੈਂ ਮੇਰੇ ਦੋਸਤ ਨਾਲ ਘਰ ਜਾ ਰਿਹਾ ਹਾਂ', 'I am going home with my friend.'],
    P59: ['eh kitāb hai', 'ਇਹ ਕਿਤਾਬ ਹੈ', 'This is a book.'],
    P60: ['kitāb navī̃ hai', 'ਕਿਤਾਬ ਨਵੀਂ ਹੈ', 'The book is new.'],
    P61: ['kitāb ghar vich hai', 'ਕਿਤਾਬ ਘਰ ਵਿੱਚ ਹੈ', 'The book is at home.'],
    P62: ['kitāb kithē hai', 'ਕਿਤਾਬ ਕਿੱਥੇ ਹੈ', 'Where is the book?'],
    P63: ['oh ḍākṭar hai', 'ਉਹ ਡਾਕਟਰ ਹੈ', 'He or she is a doctor.'],
    P64: ['main hassā̃gā', 'ਮੈਂ ਹੱਸਾਂਗਾ', 'I will laugh.'],
    P65: ['oh hassī', 'ਉਹ ਹੱਸੀ', 'He or she laughed.'],
    P66: ['main hun dhīre dhīre paṛh rihā hā̃', 'ਮੈਂ ਹੁਣ ਧੀਰੇ ਧੀਰੇ ਪੜ੍ਹ ਰਿਹਾ ਹਾਂ', 'I am reading slowly now.'],
    P67: ['kitāb navī̃ sī', 'ਕਿਤਾਬ ਨਵੀਂ ਸੀ', 'The book was new.'],
    P68: ['kitāb navī̃ nahī̃ hai', 'ਕਿਤਾਬ ਨਵੀਂ ਨਹੀਂ ਹੈ', 'The book is not new.'],
    P69: ['mere kol kitāb hai', 'ਮੇਰੇ ਕੋਲ ਕਿਤਾਬ ਹੈ', 'I have a book.'],
    P70: ['mainū̃ cāh pasand hai', 'ਮੈਨੂੰ ਚਾਹ ਪਸੰਦ ਹੈ', 'I like tea.'],
    P71: ['main samassiā karke intazār kar rihā hā̃', 'ਮੈਂ ਸਮੱਸਿਆ ਕਰਕੇ ਇੰਤਜ਼ਾਰ ਕਰ ਰਿਹਾ ਹਾਂ', 'I am waiting because of the problem.'],
    P57: ['cāh pāṇī tō̃ ziādā garam hai', 'ਚਾਹ ਪਾਣੀ ਤੋਂ ਜ਼ਿਆਦਾ ਗਰਮ ਹੈ', 'Tea is hotter than water.'], P58: ['main kalam nāl sunehā likhdā hā̃', 'ਮੈਂ ਕਲਮ ਨਾਲ ਸੁਨੇਹਾ ਲਿਖਦਾ ਹਾਂ', 'I write a message with a pen.']
  };
  const templates = templateRows.map(([id, name, family, difficulty, pattern, roles, aspect, prerequisiteGrammarConceptIds, scenario]) => ({
    id, name, family, difficulty, probability: 5, pattern, engine: 'structured-v1', enabled: true, slots: [], description: roles.join(' + ').toUpperCase(), structure: roles,
    requiredRoles: roles, optionalRoles: aspect === 'future' ? ['time'] : [], compatibleWordClasses: { subject: ['pronoun', 'noun'], object: ['noun', 'nounPhrase'], recipient: ['pronoun', 'noun'], verb: ['verb'], description: ['adjective'] },
    agreementRules: aspect === 'perfective' ? ['intransitive-subject', 'transitive-unmarked-object', 'marked-object-default-masculine-singular'] : ['subject-person-gender-number'],
    semanticRestrictions: { subject: 'human', object: 'verb-required-tags', recipient: 'human', origin: 'place-with-authored-oblique', instrument: 'compatible-authored-instrument' },
    tense: aspect === 'future' ? 'future' : aspect === 'perfective' ? 'past' : 'present', aspect, prerequisiteGrammarConceptIds: ['word-order', 'pronouns', 'gender-agreement'].concat(prerequisiteGrammarConceptIds),
    grammarConceptIds: ['word-order', 'pronouns', 'gender-agreement', 'number-agreement'].concat(prerequisiteGrammarConceptIds), scenarioIds: [scenario], example: { roman: examples[id][0] + (id === 'P50' ? '?' : '.'), gurmukhi: examples[id][1] + (id === 'P50' ? '?' : '।'), english: examples[id][2], reviewStatus: 'illustrative; native-review-pending' }, source: REFERENCE
  }));
  const newById = Object.fromEntries(templates.map(t => [t.id, t]));
  const legacyDependencies = {
    habitQuestion: ['q-ki'], whatDoing: ['q-ki', 'v-karna'], whereGoing: ['q-kithe', 'v-jana'], whenComing: ['q-kado', 'v-auna'], whyDoing: ['q-kiu'], howDoing: ['q-kive'],
    wantObject: ['v-chahuna'], wantNegative: ['v-chahuna'], wantGo: ['v-chahuna', 'v-jana'], canYou: ['q-ki', 'who-tusi'], haveQuestion: ['q-ki'], stateQuestion: ['q-ki'],
    talkAbout: ['v-gallkarna'], askAbout: ['v-gallkarna', 'v-chahuna'], andActions: ['c-ate'], butContrast: ['c-par'], conditional: ['c-je', 'v-chahuna'],
    choiceQuestion: ['who-tusi', 'c-ja', 'q-ki', 'v-chahuna'], whichWant: ['who-tusi', 'q-kehra', 'v-chahuna'], amountQuestion: ['who-tusi', 'q-kinna'], pastWent: ['v-jana']
  };
  const legacyRoles = {
    habitObject: ['subject', 'object', 'verb'], habitBare: ['subject', 'verb'], habitDetailed: ['subject', 'time', 'location', 'object', 'verb'], habitNegative: ['subject', 'object', 'verb'], habitQuestion: ['questionMarker', 'subject', 'object', 'verb'],
    progressObject: ['subject', 'object', 'verb'], progressBare: ['subject', 'verb'], progressNegative: ['subject', 'object', 'verb'], whatDoing: ['subject', 'question', 'verb'], whereGoing: ['subject', 'question', 'verb'], whenComing: ['subject', 'question', 'verb'], whyDoing: ['subject', 'object', 'question', 'verb'], howDoing: ['subject', 'object', 'question', 'verb'],
    wantObject: ['subject', 'object', 'action', 'modal'], wantNegative: ['subject', 'object', 'action', 'modal'], wantGo: ['subject', 'destination', 'action', 'modal'], canObject: ['subject', 'object', 'action', 'modal'], cannotObject: ['subject', 'object', 'action', 'modal'], canYou: ['questionMarker', 'addressee', 'object', 'action', 'modal'], politeRequest: ['politeness', 'object', 'imperative'],
    needTo: ['experiencer', 'object', 'action', 'obligation'], shouldDo: ['experiencer', 'object', 'action', 'advice'], likes: ['experiencer', 'object', 'preference'], dislikes: ['experiencer', 'object', 'preference'], hasObject: ['possessor', 'object', 'predicate'], hasNegative: ['possessor', 'object', 'predicate'], haveQuestion: ['questionMarker', 'possessor', 'object', 'predicate'],
    state: ['subject', 'description', 'auxiliary'], stateNegative: ['subject', 'description', 'auxiliary'], stateQuestion: ['questionMarker', 'subject', 'description', 'auxiliary'], thereIs: ['location', 'object', 'auxiliary'], thereIsNot: ['location', 'object', 'auxiliary'], plannedFuture: ['subject', 'time', 'object', 'verb'],
    talkAbout: ['subject', 'topic', 'verb'], askAbout: ['subject', 'topic', 'action', 'modal'], because: ['subject', 'object', 'verb', 'reasonClause'], andActions: ['subject', 'object', 'verb', 'connector', 'secondObject', 'secondVerb'], butContrast: ['subject', 'object', 'verb', 'connector', 'secondObject', 'secondVerb'], conditional: ['conditionClause', 'subject', 'object', 'action', 'modal'],
    choiceQuestion: ['addressee', 'choice', 'connector', 'secondChoice', 'question'], whichWant: ['addressee', 'question', 'modal'], amountQuestion: ['experiencer', 'quantityQuestion', 'object', 'need'], pastState: ['subject', 'time', 'description', 'auxiliary'], pastProgressObject: ['subject', 'time', 'object', 'verb'], pastHabit: ['subject', 'time', 'object', 'verb'], pastWent: ['subject', 'time', 'destination', 'verb']
  };
  const legacyExamples = {
    habitObject: ['main khāṇā khāndā hā̃', 'ਮੈਂ ਖਾਣਾ ਖਾਂਦਾ ਹਾਂ', 'I eat food.'], habitBare: ['main kam kardā hā̃', 'ਮੈਂ ਕੰਮ ਕਰਦਾ ਹਾਂ', 'I work.'],
    habitDetailed: ['main har roz ghar vich khāṇā khāndā hā̃', 'ਮੈਂ ਹਰ ਰੋਜ਼ ਘਰ ਵਿੱਚ ਖਾਣਾ ਖਾਂਦਾ ਹਾਂ', 'I eat food at home every day.'], habitNegative: ['main khāṇā nahī̃ khāndā hā̃', 'ਮੈਂ ਖਾਣਾ ਨਹੀਂ ਖਾਂਦਾ ਹਾਂ', 'I do not eat food.'],
    habitQuestion: ['kī tusī̃ khāṇā khānde ho', 'ਕੀ ਤੁਸੀਂ ਖਾਣਾ ਖਾਂਦੇ ਹੋ', 'Do you eat food?'], progressObject: ['main khāṇā khā rihā hā̃', 'ਮੈਂ ਖਾਣਾ ਖਾ ਰਿਹਾ ਹਾਂ', 'I am eating food.'], progressBare: ['oh saũ rahī hai', 'ਉਹ ਸੌਂ ਰਹੀ ਹੈ', 'She is sleeping.'],
    progressNegative: ['main khāṇā nahī̃ khā rihā hā̃', 'ਮੈਂ ਖਾਣਾ ਨਹੀਂ ਖਾ ਰਿਹਾ ਹਾਂ', 'I am not eating food.'], whatDoing: ['tusī̃ kī kar rahe ho', 'ਤੁਸੀਂ ਕੀ ਕਰ ਰਹੇ ਹੋ', 'What are you doing?'], whereGoing: ['tusī̃ kithē jā rahe ho', 'ਤੁਸੀਂ ਕਿੱਥੇ ਜਾ ਰਹੇ ਹੋ', 'Where are you going?'],
    whenComing: ['tusī̃ kadō̃ ā rahe ho', 'ਤੁਸੀਂ ਕਦੋਂ ਆ ਰਹੇ ਹੋ', 'When are you coming?'], whyDoing: ['tusī̃ khāṇā kiũ khā rahe ho', 'ਤੁਸੀਂ ਖਾਣਾ ਕਿਉਂ ਖਾ ਰਹੇ ਹੋ', 'Why are you eating food?'], howDoing: ['tusī̃ khāṇā kivẽ pakāũde ho', 'ਤੁਸੀਂ ਖਾਣਾ ਕਿਵੇਂ ਪਕਾਉਂਦੇ ਹੋ', 'How do you cook food?'],
    wantObject: ['main roṭī khāṇī chāhũdā hā̃', 'ਮੈਂ ਰੋਟੀ ਖਾਣੀ ਚਾਹੁੰਦਾ ਹਾਂ', 'I want to eat flatbread.'], wantNegative: ['main roṭī khāṇī nahī̃ chāhũdā hā̃', 'ਮੈਂ ਰੋਟੀ ਖਾਣੀ ਨਹੀਂ ਚਾਹੁੰਦਾ ਹਾਂ', 'I do not want to eat flatbread.'], wantGo: ['main ghar jāṇā chāhũdā hā̃', 'ਮੈਂ ਘਰ ਜਾਣਾ ਚਾਹੁੰਦਾ ਹਾਂ', 'I want to go home.'],
    canObject: ['main roṭī pakā sakdā hā̃', 'ਮੈਂ ਰੋਟੀ ਪਕਾ ਸਕਦਾ ਹਾਂ', 'I can cook flatbread.'], cannotObject: ['main kitāb nahī̃ paṛh sakdā hā̃', 'ਮੈਂ ਕਿਤਾਬ ਨਹੀਂ ਪੜ੍ਹ ਸਕਦਾ ਹਾਂ', 'I cannot read a book.'], canYou: ['kī tusī̃ kitāb paṛh sakde ho', 'ਕੀ ਤੁਸੀਂ ਕਿਤਾਬ ਪੜ੍ਹ ਸਕਦੇ ਹੋ', 'Can you read a book?'],
    politeRequest: ['kirpā karke kitāb deo', 'ਕਿਰਪਾ ਕਰਕੇ ਕਿਤਾਬ ਦਿਓ', 'Please give a book.'], needTo: ['mainū̃ roṭī pakāuṇī paiṇdī hai', 'ਮੈਨੂੰ ਰੋਟੀ ਪਕਾਉਣੀ ਪੈਂਦੀ ਹੈ', 'I have to cook flatbread.'], shouldDo: ['mainū̃ kitāb paṛhṇī chāhīdī hai', 'ਮੈਨੂੰ ਕਿਤਾਬ ਪੜ੍ਹਨੀ ਚਾਹੀਦੀ ਹੈ', 'I should read a book.'],
    likes: ['mainū̃ cāh pasand hai', 'ਮੈਨੂੰ ਚਾਹ ਪਸੰਦ ਹੈ', 'I like tea.'], dislikes: ['mainū̃ cāh pasand nahī̃ hai', 'ਮੈਨੂੰ ਚਾਹ ਪਸੰਦ ਨਹੀਂ ਹੈ', 'I do not like tea.'], hasObject: ['mere kol kitāb hai', 'ਮੇਰੇ ਕੋਲ ਕਿਤਾਬ ਹੈ', 'I have a book.'], hasNegative: ['mere kol kitāb nahī̃ hai', 'ਮੇਰੇ ਕੋਲ ਕਿਤਾਬ ਨਹੀਂ ਹੈ', 'I do not have a book.'],
    haveQuestion: ['kī tuhāḍe kol kitāb hai', 'ਕੀ ਤੁਹਾਡੇ ਕੋਲ ਕਿਤਾਬ ਹੈ', 'Do you have a book?'], state: ['oh khush hai', 'ਉਹ ਖ਼ੁਸ਼ ਹੈ', 'She is happy.'], stateNegative: ['oh khush nahī̃ hai', 'ਉਹ ਖ਼ੁਸ਼ ਨਹੀਂ ਹੈ', 'She is not happy.'], stateQuestion: ['kī tusī̃ khush ho', 'ਕੀ ਤੁਸੀਂ ਖ਼ੁਸ਼ ਹੋ', 'Are you happy?'],
    thereIs: ['ghar vich kitāb hai', 'ਘਰ ਵਿੱਚ ਕਿਤਾਬ ਹੈ', 'There is a book at home.'], thereIsNot: ['ghar vich kitāb nahī̃ hai', 'ਘਰ ਵਿੱਚ ਕਿਤਾਬ ਨਹੀਂ ਹੈ', 'There is no book at home.'], plannedFuture: ['main kal khāṇā khāṇ vālā hā̃', 'ਮੈਂ ਕੱਲ੍ਹ ਖਾਣਾ ਖਾਣ ਵਾਲਾ ਹਾਂ', 'I am going to eat food tomorrow.'],
    talkAbout: ['main parivār bāre gall kardā hā̃', 'ਮੈਂ ਪਰਿਵਾਰ ਬਾਰੇ ਗੱਲ ਕਰਦਾ ਹਾਂ', 'I talk about family.'], askAbout: ['main parivār bāre gall karṇā chāhũdā hā̃', 'ਮੈਂ ਪਰਿਵਾਰ ਬਾਰੇ ਗੱਲ ਕਰਨਾ ਚਾਹੁੰਦਾ ਹਾਂ', 'I want to talk about family.'], because: ['main kitāb paṛhdā hā̃ kiũki eh faidemand hai', 'ਮੈਂ ਕਿਤਾਬ ਪੜ੍ਹਦਾ ਹਾਂ ਕਿਉਂਕਿ ਇਹ ਫ਼ਾਇਦੇਮੰਦ ਹੈ', 'I read a book because it is useful.'],
    andActions: ['main khāṇā khāndā hā̃ ate pāṇī pīndā hā̃', 'ਮੈਂ ਖਾਣਾ ਖਾਂਦਾ ਹਾਂ ਅਤੇ ਪਾਣੀ ਪੀਂਦਾ ਹਾਂ', 'I eat food and drink water.'], butContrast: ['main cāh pīndā hā̃ par kāfī nahī̃ pīndā hā̃', 'ਮੈਂ ਚਾਹ ਪੀਂਦਾ ਹਾਂ ਪਰ ਕੌਫ਼ੀ ਨਹੀਂ ਪੀਂਦਾ ਹਾਂ', 'I drink tea but do not drink coffee.'],
    conditional: ['je mere kol samā̃ hovē, tā̃ main kitāb paṛhṇī chāhũdā hā̃', 'ਜੇ ਮੇਰੇ ਕੋਲ ਸਮਾਂ ਹੋਵੇ, ਤਾਂ ਮੈਂ ਕਿਤਾਬ ਪੜ੍ਹਨੀ ਚਾਹੁੰਦਾ ਹਾਂ', 'If I have time, then I want to read a book.'], choiceQuestion: ['tusī̃ cāh jā̃ pāṇī vichõ kī chāhũde ho', 'ਤੁਸੀਂ ਚਾਹ ਜਾਂ ਪਾਣੀ ਵਿੱਚੋਂ ਕੀ ਚਾਹੁੰਦੇ ਹੋ', 'Which do you want, tea or water?'],
    whichWant: ['tusī̃ kehṛī cīz chāhũde ho', 'ਤੁਸੀਂ ਕਿਹੜੀ ਚੀਜ਼ ਚਾਹੁੰਦੇ ਹੋ', 'Which thing do you want?'], amountQuestion: ['tuhānū̃ kinnā pāṇī chāhīdā hai', 'ਤੁਹਾਨੂੰ ਕਿੰਨਾ ਪਾਣੀ ਚਾਹੀਦਾ ਹੈ', 'How much water do you need?'],
    pastState: ['oh kal khush sī', 'ਉਹ ਕੱਲ੍ਹ ਖ਼ੁਸ਼ ਸੀ', 'She was happy yesterday.'], pastProgressObject: ['oh kal kitāb paṛh rahī sī', 'ਉਹ ਕੱਲ੍ਹ ਕਿਤਾਬ ਪੜ੍ਹ ਰਹੀ ਸੀ', 'She was reading a book yesterday.'], pastHabit: ['main pehlā̃ kitāb paṛhdā sī', 'ਮੈਂ ਪਹਿਲਾਂ ਕਿਤਾਬ ਪੜ੍ਹਦਾ ਸੀ', 'I used to read a book.'], pastWent: ['oh kal ghar gaī sī', 'ਉਹ ਕੱਲ੍ਹ ਘਰ ਗਈ ਸੀ', 'She went home yesterday.']
  };
  function metadataFor(template) {
    if (newById[template.id]) {
      const metadata = JSON.parse(JSON.stringify(newById[template.id]));
      // Connecting registries must preserve the learner's template settings.
      for (const key of ['id', 'name', 'family', 'difficulty', 'probability', 'pattern', 'enabled', 'slots', 'description']) delete metadata[key];
      metadata.requiredVocabularyIds = dependenciesFor(template);
      if (metadata.aspect === 'state') { metadata.agreementRules = ['described-noun-gender-number']; delete metadata.semanticRestrictions.subject; }
      if (/^nominal/.test(newById[template.id].pattern)) metadata.semanticRestrictions = {object: newById[template.id].pattern==='nominalIdentity'?'source-supported-direct-noun-sense':newById[template.id].pattern==='nominalWhereQuestion'||newById[template.id].pattern==='nominalLocation'?'locatable-physical-entity':'predicate-compatible-reviewed-noun',description:'sense-modifier-targets'};
      if (newById[template.id].pattern==='causalProgressive') metadata.semanticRestrictions={subject:'human',reason:'source-supported-oblique-causal-phrase',verb:'authored-wait-predicate'};
      return metadata;
    }
    const pattern = template.pattern || '';
    const past = /^past/.test(pattern), progress = ['progressObject', 'progressBare', 'progressNegative', 'whatDoing', 'whereGoing', 'whenComing', 'whyDoing', 'pastProgressObject'].includes(pattern);
    const question = /Question$/.test(pattern) || ['whatDoing', 'whereGoing', 'whenComing', 'whyDoing', 'howDoing', 'canYou', 'whichWant'].includes(pattern);
    const roles = legacyRoles[pattern] || (template.slots || []).map(slot => ({ WHO: 'subject', WHAT: 'object', WHERE: 'location', WHEN: 'time', VERB: 'verb', ABOUT: 'topic', WHY: 'reasonClause', HOW: 'manner', QUESTION: 'question' }[slot.t] || slot.t.toLowerCase()));
    const ids = ['word-order', 'pronouns', 'gender-agreement', 'number-agreement', 'auxiliaries'];
    if (past) ids.push('past');
    if (progress) ids.push('progressive'); else if (/habit/i.test(pattern) || ['howDoing', 'talkAbout', 'because', 'andActions', 'butContrast'].includes(pattern)) ids.push('habitual-present');
    if (pattern === 'pastWent') ids.push('perfective');
    if (question) ids.push('questions');
    if (/Negative|cannot|dislikes|thereIsNot/.test(pattern)) ids.push('negation');
    if (/want|Want|needTo|shouldDo/.test(pattern)) ids.push('infinitives');
    if (/needTo|shouldDo|likes|dislikes|amountQuestion/.test(pattern)) ids.push('dative');
    if (/has|have|conditional/.test(pattern)) ids.push('possession', 'postpositions');
    if (/can|cannot/.test(pattern)) ids.push('modals');
    if (pattern === 'politeRequest') ids.push('imperatives');
    if (pattern === 'plannedFuture') ids.push('planned-future');
    if (pattern === 'conditional') ids.push('conditions');
    if (pattern === 'because') ids.push('reasons');
    if (/andActions|butContrast|choiceQuestion/.test(pattern)) ids.push('connected-clauses');
    const objectAgreement = ['needTo', 'shouldDo', 'likes', 'dislikes', 'hasObject', 'hasNegative', 'haveQuestion', 'thereIs', 'thereIsNot', 'amountQuestion'].includes(pattern);
    const semanticRestrictions = {};
    for (const role of ['subject', 'addressee', 'experiencer', 'possessor']) if (roles.includes(role)) semanticRestrictions[role] = 'human';
    if (roles.includes('object')) semanticRestrictions.object = ['hasObject', 'hasNegative', 'haveQuestion', 'thereIs', 'thereIsNot'].includes(pattern) ? 'possessable' : ['likes', 'dislikes'].includes(pattern) ? 'likeable' : 'verb-required-tags';
    if (pattern === 'amountQuestion') semanticRestrictions.object = 'authored-quantity-noun';
    if (roles.includes('location')) semanticRestrictions.location = 'authored-locative-phrase';
    if (roles.includes('destination')) semanticRestrictions.destination = 'authored-destination-phrase';
    let aspect = progress ? 'progressive' : ids.includes('habitual-present') ? 'habitual' : pattern === 'pastWent' ? 'perfective' : pattern === 'plannedFuture' ? 'plannedFuture' : /state/i.test(pattern) ? 'state' : /^has|have/.test(pattern) ? 'possession' : /^thereIs/.test(pattern) ? 'existence' : /^want|askAbout|whichWant|conditional/.test(pattern) ? 'desiderative' : /^can/.test(pattern) ? 'ability' : pattern === 'politeRequest' ? 'imperative' : ['likes', 'dislikes'].includes(pattern) ? 'preference' : pattern === 'needTo' ? 'obligation' : pattern === 'shouldDo' ? 'advice' : pattern === 'amountQuestion' ? 'need' : 'construction-specific';
    const example = legacyExamples[pattern];
    return { structure: roles, requiredRoles: roles, optionalRoles: [], compatibleWordClasses: { subject: ['pronoun', 'noun'], object: ['noun', 'nounPhrase'], verb: ['verb'], action: ['verb'], modal: ['verb'], description: ['adjective'], location: ['postpositionalPhrase'], destination: ['nounPhrase', 'adverb'] },
      agreementRules: objectAgreement ? ['object-gender-number', 'infinitive-object-agreement-where-present'] : pattern === 'politeRequest' ? ['authored-polite-second-person-imperative'] : ['subject-gender-number', 'auxiliary-person-number'], semanticRestrictions,
      tense: past ? 'past' : 'present', aspect, timeReference: pattern === 'plannedFuture' ? 'future' : past ? 'past' : 'present', mood: question ? 'interrogative' : pattern === 'politeRequest' ? 'imperative' : 'declarative',
      prerequisiteGrammarConceptIds: [...new Set(ids)], grammarConceptIds: [...new Set(ids)], requiredVocabularyIds: dependenciesFor(template), scenarioIds: [past ? 'past-experience' : /want|Future/.test(pattern) ? 'future-plans' : /Going|Coming|wantGo/.test(pattern) ? 'directions' : 'daily-routine'],
      example: example ? { roman: example[0] + (question ? '?' : '.'), gurmukhi: example[1] + (question ? '?' : '।'), english: example[2], reviewStatus: 'illustrative; native-review-pending' } : null, source: REFERENCE, reviewStatus: legacyRoles[pattern] ? 'curated-pattern; native-review-pending' : 'experimental-custom-slots' };
  }
  function dependenciesFor(template) {
    const pattern = newById[template && template.id] ? newById[template.id].pattern : template && template.pattern;
    const dependencies = { finiteFutureMotion: ['v-jana'], finiteFutureQuestion: ['q-ki'], perfectiveOrigin: ['v-auna'], originProgressive: ['v-auna'], accompaniment: ['v-jana'], giveRecipient: ['v-dena'], perfectiveRecipient: ['v-dena'], instrument: ['v-likhna'], causalProgressive: ['v-intazar'], nominalWhereQuestion: ['q-kithe'] };
    return (dependencies[pattern] || legacyDependencies[pattern] || []).slice();
  }
  templates.forEach(template => Object.assign(template, metadataFor(template)));

  const fallbackGerund = base => ({ go: 'going', come: 'coming', give: 'giving', write: 'writing', eat: 'eating', drink: 'drinking', do: 'doing', read: 'reading' }[base] || base + 'ing');
  const fallbackPast = base => ({ eat: 'ate', drink: 'drank', go: 'went', come: 'came', do: 'did', give: 'gave', take: 'took', read: 'read', write: 'wrote', watch: 'watched', 'listen to': 'listened to', send: 'sent', buy: 'bought', cook: 'cooked' }[base]);
  function fallbackSubject(subject) { return subject.e === 'he/she' ? subject.gender === 'f' ? 'she' : 'he' : String(subject.e || '').replace(/ \(informal\)$/, ''); }
  function englishBe(subject) { const person = subject.englishPerson || subject.person; return person === '1sg' ? 'am' : person === '3sg' ? 'is' : 'are'; }
  function fallbackHabit(base, subject) { return (subject.englishPerson || subject.person) === '3sg' ? (base === 'do' ? 'does' : base === 'go' ? 'goes' : base + 's') : base; }

  const englishGerund = base => semantics ? semantics.inflectEnglish(base, 'progressive') : fallbackGerund(base);
  const englishPast = base => semantics ? semantics.inflectEnglish(base, 'perfective') : fallbackPast(base);
  const englishSubject = item => semantics ? semantics.englishSubject(item) : fallbackSubject(item);
  const objectiveEnglish = item => semantics ? semantics.englishObjective(item) : englishSubject(item);
  const nounEnglish = (item, definite) => semantics ? semantics.englishNounPhrase(item, definite ? { article: 'definite' } : {}) : item.e;
  const englishHabit = (base, subject) => semantics ? semantics.inflectEnglish(base, 'habitual', subject.englishPerson || subject.person) : fallbackHabit(base, subject);
  function contextualize(item, context) { return semantics ? semantics.contextualEntry(item, context) : item; }
  function generateExpanded(template, definition, state, choose) {
    const pattern = definition.pattern, vocab = state.vocab || {}, enabled = rows => (rows || []).filter(x => x.enabled !== false);
    const select = (rows, role, extra) => {
      const candidates = rows.slice();
      while(candidates.length) {
        const item = choose(candidates), projected = contextualize(item, { role, template: definition, ...(extra || {}) });
        if(projected)return projected;
        const index=candidates.indexOf(item);if(index<0)return null;candidates.splice(index,1);
      }
      return null;
    };
    const bilingual = item => validText(textOf(item, 'roman'), 'roman') && validText(textOf(item, 'gurmukhi'), 'gurmukhi');
    const nominal = item => bilingual(item) && ['m','f'].includes(item.gender) && ['sg','pl'].includes(item.number);
    const parts = [], selected = {}, question = pattern === 'nominalWhereQuestion';
    function part(item, role, roman, gurmukhi, english, grammarNote, extra) {
      if (!validText(roman, 'roman') || !validText(gurmukhi, 'gurmukhi')) return false;
      const id = item && lexicalId(item);
      parts.push({ roman, gurmukhi, english, role, category: { object:'WHAT',subject:'WHO',verb:'VERB',description:'DESCRIPTION',location:'WHERE',time:'WHEN',manner:'HOW',occupation:'WHAT',reason:'WHY' }[role] || role.toUpperCase(),
        vocabularyId: id, vocabularyIds: id ? [id] : [], selectedSenseId: item && item.selectedSenseId,
        lexicalSelections: item && item.lexicalSelection ? [item.lexicalSelection] : [], dictionaryRoman:item && (item.infinitive || item.p), dictionaryGurmukhi:item && (item.gScript && item.gScript.infinitive || item.g),
        grammarNote, grammarConceptIds: definition.grammarConceptIds, ...(extra || {}) });
      if(item)selected[role]=item;
      return true;
    }
    function finish(english) {
      if(!english || /undefined|[,;/]/.test(english))return null;
      const roman=parts.map(p=>p.roman).join(' ')+(question?'?':'.'),gurmukhi=parts.map(p=>p.gurmukhi).join(' ')+(question?'?':'।');
      const breakdown=parts.map(p=>({label:p.role,value:p.roman,gurmukhi:p.gurmukhi,type:p.category,meaning:p.english,vocabularyId:p.vocabularyId,vocabularyIds:p.vocabularyIds}));
      return {punjabi:roman,roman,gurmukhi,english:english.charAt(0).toUpperCase()+english.slice(1)+(question?'?':'.'),templateId:template.id,template:template.id,templateName:template.name,difficulty:template.difficulty,
        signature:[template.id].concat(Object.keys(selected).map(role=>role+':'+lexicalId(selected[role])+'@'+(selected[role].selectedSenseId||''))).join('|'),breakdown,buildingBlocks:breakdown,sentenceBreakdown:parts,
        vocabularyIds:[...new Set(parts.flatMap(p=>p.vocabularyIds))],senseIds:[...new Set(parts.flatMap(p=>p.lexicalSelections.map(s=>s.senseId)))],grammarConceptIds:definition.grammarConceptIds,scenarioIds:definition.scenarioIds,scriptWarning:''};
    }
    const adjectiveCandidates=enabled(vocab.ADJECTIVE).filter(a=>a.forms&&a.gScript&&a.gScript.forms);
    const modifierCache=new Map();
    function adjectivesFor(object) {
      const objectTags=tagsOf(object),cacheKey=objectTags.slice().sort().join('|');if(modifierCache.has(cacheKey))return modifierCache.get(cacheKey);
      const physical=objectTags.some(t=>['physical-object','concrete','edible','drinkable','buyable','wearable','readable','material','plant','animal'].includes(t));
      const allowed=['new','old','big','small','clean','dirty','heavy','light','long','short','expensive','cheap','beautiful'];
      const candidates=adjectiveCandidates.filter(a=> {
        const gloss=semantics&&semantics.selectSense(a,{role:'ADJECTIVE'}).contextualMeaning||a.e;
        if(['sweet','salty','sour','bitter','tasteless','bland','tasty','spicy'].includes(gloss)&&!objectTags.some(t=>['edible','drinkable'].includes(t)))return false;
        if(['empty','full','hollow'].includes(gloss)&&!objectTags.some(t=>['container','place','space'].includes(t)))return false;
        if(['thorny','prickly'].includes(gloss)&&!objectTags.includes('plant'))return false;
        if(['young','aged','unmarried','hungry','thirsty'].includes(gloss)&&!objectTags.some(t=>['human','animal','animate'].includes(t)))return false;
        const sense=(a.senses||[]).find(s=>s.id===a.selectedSenseId),targets=a.modifierTargets||sense&&sense.modifierTargets;
        return targets&&targets.length?targets.some(t=>objectTags.includes(t)||t==='physical-object'&&physical||t==='entity'):physical&&allowed.includes(a.e);
      });modifierCache.set(cacheKey,candidates);return candidates;
    }
    const nominalPatterns=['nominalIdentity','nominalDescription','nominalLocation','nominalWhereQuestion','nominalPastDescription','nominalNegativeDescription'];
    if(nominalPatterns.includes(pattern)) {
      const descriptions=['nominalDescription','nominalPastDescription','nominalNegativeDescription'].includes(pattern);
      const objects=enabled(vocab.WHAT).filter(nominal).filter(o=>!['nominalLocation','nominalWhereQuestion'].includes(pattern)||tagsOf(o).some(t=>['physical-object','concrete','material','plant','animal','human','place'].includes(t))).filter(o=>!descriptions||adjectivesFor(o).length);
      const object=select(objects,'WHAT');if(!object)return null;
      const plural=object.number==='pl',auxR=pattern==='nominalPastDescription'?(plural?'san':'sī'):(plural?'han':'hai'),auxG=pattern==='nominalPastDescription'?(plural?'ਸਨ':'ਸੀ'):(plural?'ਹਨ':'ਹੈ');
      if(pattern==='nominalIdentity') {
        part(null,'demonstrative',plural?'eh':'eh','ਇਹ',plural?'these':'this','Near demonstrative; the copula agrees with the identified noun.');
        part(object,'object',object.p,object.g,object.e,'Canonical direct noun form in identification.');
        part(null,'auxiliary',auxR,auxG,plural?'are':'is','Third-person copula agrees in number.');
        return finish((plural?'these are ':'this is ')+nounEnglish(object,!object.countability&&!object.englishCountability));
      }
      part(object,'object',object.p,object.g,object.e,'Direct noun is the subject of this copular clause.');
      if(pattern==='nominalWhereQuestion') {
        const questionWord=select(enabled(vocab.QUESTION).filter(q=>q.id==='q-kithe'&&bilingual(q)),'question');if(!questionWord)return null;
        part(questionWord,'question',questionWord.p,questionWord.g,questionWord.e,'Locative question word.');part(null,'auxiliary',auxR,auxG,plural?'are':'is','Copula agrees with the noun.');
        return finish('where '+(plural?'are ':'is ')+nounEnglish(object,true));
      }
      if(pattern==='nominalLocation') {
        const location=select(enabled(vocab.WHERE).filter(bilingual),'WHERE');if(!location)return null;
        // Role bindings contain a checked locative phrase; raw nouns must pass
        // explicit oblique formation before being attached to ਵਿੱਚ.
        let r=location.p,g=location.g;
        if(!/\s(?:vich|te)$/u.test(r)&&!['here','there','inside','outside','nearby'].includes(location.e)) {
          const rp=nounPhrase(location,{case:'location'}),gp=nounPhrase(location,{case:'location',script:'gurmukhi'});if(!rp.ok||!gp.ok)return null;r=rp.text;g=gp.text;
        }
        part(location,'location',r,g,locationEnglish(location),'Checked locative noun phrase or locative adverb.');part(null,'auxiliary',auxR,auxG,plural?'are':'is','Copula agrees with the located noun.');
        return finish(nounEnglish(object,true)+' '+(plural?'are ':'is ')+locationEnglish(location));
      }
      const description=select(adjectivesFor(object),'ADJECTIVE');
      if(!description)return null;
      const key=agreementKey(object),r=description.forms[key]||(description.indeclinable?description.p:null),g=description.gScript.forms[key]||(description.indeclinable?description.g:null);
      if(!part(description,'description',r,g,description.e,'Adjective agrees with the described noun where its paradigm varies.'))return null;
      const negative=pattern==='nominalNegativeDescription';if(negative)part(null,'negation','nahī̃','ਨਹੀਂ','not','Clause negation before the copula.');
      part(null,'auxiliary',auxR,auxG,pattern==='nominalPastDescription'?(plural?'were':'was'):(plural?'are':'is'),'Copula agrees with the described noun in number.');
      return finish(nounEnglish(object,true)+' '+(pattern==='nominalPastDescription'?(plural?'were':'was'):(plural?'are':'is'))+' '+(negative?'not ':'')+description.e);
    }
    const subject=select(enabled(vocab.WHO).filter(p=> {
      if(!human(p)||!nominal(p)||!PERSONS.includes(p.person))return false;
      if(pattern==='occupationIdentity') {
        const sense=(p.senses||[]).find(s=>s.id===p.selectedSenseId);
        const ageClass=p.ageClass||p.semanticProperties&&p.semanticProperties.ageClass||sense&&sense.semanticProperties&&sense.semanticProperties.ageClass;
        if(ageClass==='infant')return false;
      }
      if(pattern==='nominalPreference')return ['roman','gurmukhi'].every(script=>nounPhrase(p,{case:'recipient',script}).ok);
      if(pattern==='nominalPossession')return !!(p.withPossession&&p.gScript&&p.gScript.withPossession)||p.partOfSpeech==='noun'&&['roman','gurmukhi'].every(script=>nounPhrase(p,{case:'oblique',script}).ok);
      return true;
    }),'WHO');if(!subject)return null;
    if (['nominalPossession','nominalPreference'].includes(pattern)) {
      const preference=pattern==='nominalPreference';
      const objects=enabled(vocab.WHAT).filter(o=>nominal(o)&&tagsOf(o).some(t=>preference?['likeable','edible','drinkable','readable','physical-object','abstract'].includes(t):['possessable','giveable','takeable','physical-object'].includes(t)));
      const object=select(objects,'WHAT');if(!object)return null;
      let rp,gp;
      if(preference){rp=nounPhrase(subject,{case:'recipient'});gp=nounPhrase(subject,{case:'recipient',script:'gurmukhi'});}
      else if(subject.withPossession&&subject.gScript&&subject.gScript.withPossession){rp={ok:true,text:subject.withPossession};gp={ok:true,text:subject.gScript.withPossession};}
      else if(subject.partOfSpeech==='noun'){rp=nounPhrase(subject,{case:'oblique',postposition:'kol'});gp=nounPhrase(subject,{case:'oblique',postposition:'ਕੋਲ',script:'gurmukhi'});}
      else return null;
      if(!rp.ok||!gp.ok)return null;
      part(subject,'subject',rp.text,gp.text,preference?'to '+objectiveEnglish(subject):'with '+objectiveEnglish(subject),preference?'Dative experiencer; the auxiliary agrees with the liked item.':'Possession expressed with an authored oblique noun phrase and kol.');
      const ingredientPreference=preference&&tagsOf(object).some(t=>['edible','drinkable'].includes(t));
      part(object,'object',object.p,object.g,object.e,'Direct noun; its number controls the copula.'+(ingredientPreference?' English uses the bare food or ingredient meaning for a general preference; Punjabi noun number is unchanged.':''));
      const plural=object.number==='pl';part(null,'predicate',(preference?'pasand ':'')+(plural?'han':'hai'),(preference?'ਪਸੰਦ ':'')+(plural?'ਹਨ':'ਹੈ'),preference?'like':'have','Copula agrees with the object in number.');
      return finish(englishSubject(subject)+' '+englishHabit(preference?'like':'have',subject)+' '+(preference?(ingredientPreference?nounEnglish({...object,englishCountability:'uncountable'}):nounEnglish(object,true)):nounEnglish(object)));
    }
    if(pattern==='occupationIdentity') {
      const occupations=enabled(vocab.WHAT).filter(o=>nominal(o)&&human(o)&&tagsOf(o).includes('occupation')&&o.number===subject.number);
      const occupation=select(occupations,'WHAT');if(!occupation)return null;
      part(subject,'subject',subject.p,subject.g,englishSubject(subject),'Subject of an identification clause.');part(occupation,'occupation',occupation.p,occupation.g,occupation.e,'Occupation noun in a copular predicate.');
      part(null,'auxiliary',auxiliary.roman.present[subject.person],auxiliary.gurmukhi.present[subject.person],englishBe(subject),'Copula agrees with the subject in person and number.');
      return finish(englishSubject(subject)+' '+englishBe(subject)+' '+nounEnglish({...occupation,countability:'count'}));
    }
    if(pattern==='causalProgressive') {
      const action=enabled(state.verbs).find(v=>v.id==='v-intazar');if(!action)return null;
      const verb=contextualize(action,{role:'VERB'}),reason=select(enabled(vocab.WHY).filter(r=>bilingual(r)&&/karke|kar ke$/u.test(r.p)&&/ਕਰਕੇ$/u.test(r.g)),'WHY');
      if(!verb||!reason)return null;
      const r=conjugate({verb,subject,aspect:'progressive'}),g=conjugate({verb,subject,aspect:'progressive',script:'gurmukhi'});if(!r.ok||!g.ok)return null;
      part(subject,'subject',r.subjectText,g.subjectText,englishSubject(subject),'Subject of the progressive clause.');
      const meaning=/^because of /i.test(reason.e)?reason.e:'because of '+nounEnglish(reason);
      part(reason,'reason',reason.p,reason.g,meaning,'Source-supported oblique causal noun phrase followed by karke.');
      part(verb,'verb',r.text,g.text,'waiting',r.grammarNote);
      return finish(englishSubject(subject)+' '+englishBe(subject)+' waiting '+meaning);
    }
    const aspect=definition.aspect;
    const verbs=enabled(state.verbs).filter(v=>!requiredTags(v).length&&verbRulesFor(v).transitive===false&&['roman','gurmukhi'].every(script=>conjugate({verb:v,subject,aspect,script}).ok));
    // A manner modifier is authorized for a bounded action family, rather
    // than inferred merely from being listed in HOW.
    const mannerActions=['read','write','speak','walk','run','dance','cook','eat','work'];
    const generalManners=['slowly','quickly','carefully','quietly','well','easily','with difficulty','happily','again','confidently','enthusiastically'];
    const specificManners={
      clearly:['read','speak'],loudly:['read','speak'],softly:['read','speak'],
      orally:['read','speak'],'by phone':['speak'],'face to face':['speak'],
      online:['read','write','speak','work'],directly:['speak'],
      kindly:['speak'],respectfully:['speak'],jokingly:['speak'],angrily:['speak'],gently:['speak'],
      patiently:['read','write','speak','cook','work'],temporarily:['work']
    };
    const mannerPool=pattern==='mannerProgressive'?enabled(vocab.HOW).map(t=>contextualize(t,{role:'HOW',template:definition})).filter(t=>t&&bilingual(t)):[];
    const fitsManner=(m,v)=>mannerActions.includes(v.base)&&(generalManners.includes(m.e)||(m.e==='together'||m.e==='separately')&&numberOf(subject)==='pl'||Array.isArray(specificManners[m.e])&&specificManners[m.e].includes(v.base));
    const mannerVerbs=enabled(state.verbs).filter(v=>mannerActions.includes(v.base)&&['roman','gurmukhi'].every(script=>conjugate({verb:v,subject,aspect,script}).ok)&&mannerPool.some(m=>fitsManner(m,v)));
    const verb=select(pattern==='mannerProgressive'?mannerVerbs:verbs,'VERB');if(!verb)return null;
    const args={verb,subject,aspect};const r=conjugate(args),g=conjugate({...args,script:'gurmukhi'});if(!r.ok||!g.ok)return null;
    part(subject,'subject',r.subjectText,g.subjectText,englishSubject(subject),r.grammarNote);
    let time,manner;
    if(pattern==='mannerProgressive') {
      time=select(enabled(vocab.WHEN).filter(t=>bilingual(t)&&(['now','today','right now'].includes(t.e)||t.time==='present'||(t.timeContexts||[]).includes('present'))),'WHEN',{tense:'present'});
      const mannerCandidates=mannerPool.filter(m=>fitsManner(m,verb));
      manner=select(mannerCandidates,'HOW',{verb});
      if(!time||!manner)return null;
      part(time,'time',time.p,time.g,time.e,'Temporal modifier compatible with the present progressive.');
      part(manner,'manner',manner.p,manner.g,manner.e,'Manner adverb modifying this action.');
    }
    part(verb,'verb',r.text,g.text,aspect==='future'?'will '+verb.base:aspect==='perfective'?englishPast(verb.base):englishGerund(verb.base),r.grammarNote,{aspect,agreementTarget:r.agreementTarget});
    return finish(englishSubject(subject)+' '+(aspect==='future'?'will '+verb.base:aspect==='perfective'?englishPast(verb.base):englishBe(subject)+' '+englishGerund(verb.base))+(manner?' '+manner.e:'')+(time?' '+time.e:''));
  }
  // Only candidate pools are random. The same selected lexical records supply
  // both scripts, English, the breakdown, and future learning dimensions.
  function generate(template, state, choose) {
    const definition = newById[template && template.id];
    if (!definition || template.enabled === false) return null;
    choose = choose || (items => items[Math.floor(Math.random() * items.length)]);
    if (['nominalIdentity','nominalDescription','nominalLocation','nominalWhereQuestion','occupationIdentity','finiteFutureBare','perfectiveBare','mannerProgressive','nominalPastDescription','nominalNegativeDescription','nominalPossession','nominalPreference','causalProgressive'].includes(definition.pattern)) return generateExpanded(template, definition, state, choose);
    const enabled = items => (items || []).filter(x => x.enabled !== false);
    const vocab = state.vocab || {}, people = enabled(vocab.WHO).filter(human);
    const verbs = enabled(state.verbs), objects = enabled(vocab.WHAT), places = enabled(vocab.WHERE);
    const definitionPattern = definition.pattern;
    const question = definitionPattern === 'finiteFutureQuestion', negative = definitionPattern === 'finiteFutureNegative';
    const selected = {}, aspect = definition.aspect;
    function pick(role, pool) { if (!pool.length) return false; selected[role] = choose(pool); return !!selected[role]; }
    function dualPhrase(item, role) { return ['roman', 'gurmukhi'].every(script => nounPhrase(item, { case: role, script }).ok); }
    const isComparison = definitionPattern === 'comparison';
    if (!isComparison && !pick('subject', people.filter(p => validText(textOf(p, 'roman'), 'roman') && validText(textOf(p, 'gurmukhi'), 'gurmukhi') && PERSONS.includes(p.person) && ['m', 'f'].includes(p.gender) && ['sg', 'pl'].includes(p.number) && (!['perfectiveObject','perfectiveRecipient'].includes(definitionPattern)||['roman','gurmukhi'].every(script=>nounPhrase(p,{case:'ergative',script}).ok))))) return null;
    let phraseRoles, english;
    if (['finiteFutureObject', 'finiteFutureNegative', 'finiteFutureQuestion', 'perfectiveObject'].includes(definitionPattern)) {
      const candidatePairs = [];
      verbs.forEach(verb => {
        const support = new Map();
        objects.forEach(object => {
          if (!compatible(verb, object) || !['m','f'].includes(object.gender) || !['sg','pl'].includes(object.number) || !validText(textOf(object,'roman'),'roman') || !validText(textOf(object,'gurmukhi'),'gurmukhi')) return;
          const key = aspect === 'perfective' ? agreementKey(object) : 'subject';
          if (!support.has(key)) support.set(key, ['roman','gurmukhi'].every(script => conjugate({verb,object,subject:selected.subject,aspect,negative,question,script}).ok));
          if (support.get(key)) candidatePairs.push({verb,object});
        });
      });
      if (!candidatePairs.length) return null;
      Object.assign(selected, choose(candidatePairs));
      phraseRoles = ['subject', 'object', 'verb'];
    } else if (['finiteFutureMotion', 'perfectiveOrigin', 'originProgressive', 'accompaniment'].includes(definitionPattern)) {
      const going = ['finiteFutureMotion', 'accompaniment'].includes(definitionPattern);
      selected.verb = verbs.find(v => v.id === (going ? 'v-jana' : 'v-auna'));
      if (!selected.verb) return null;
      if (going) {
        if (!pick('destination', places.filter(p => validText(p.dest, 'roman') && validText(p.gScript && p.gScript.dest, 'gurmukhi')))) return null;
      } else if (!pick('origin', places.filter(p => dualPhrase(p, 'origin')))) return null;
      if (definitionPattern === 'accompaniment' && !pick('companion', people.filter(p => p.id !== selected.subject.id && dualPhrase(p, 'accompaniment')))) return null;
      phraseRoles = going ? ['subject', 'companion', 'destination', 'verb'] : ['subject', 'origin', 'verb'];
    } else if (['giveRecipient', 'perfectiveRecipient'].includes(definitionPattern)) {
      selected.verb = verbs.find(v => v.id === 'v-dena');
      if (!selected.verb || !pick('object', objects.filter(o => compatible(selected.verb, o) && ['m', 'f'].includes(o.gender) && ['sg', 'pl'].includes(o.number) && validText(o.g, 'gurmukhi')))) return null;
      if (!pick('recipient', people.filter(p => p.id !== selected.subject.id && dualPhrase(p, 'recipient')))) return null;
      phraseRoles = ['subject', 'recipient', 'object', 'verb'];
    } else if (isComparison) {
      const comparables = objects.filter(o => tagsOf(o).some(t => ['drinkable', 'edible'].includes(t)) && validText(o.g, 'gurmukhi'));
      if (!pick('object', comparables)) return null;
      if (!pick('comparison', comparables.filter(o => o.id !== selected.object.id && dualPhrase(o, 'comparison')))) return null;
      const adjectives = enabled(vocab.ADJECTIVE).filter(a => ['state-extra-hot', 'state-extra-cold', 'state-extra-sweet', 'state-extra-expensive', 'state-extra-cheap'].includes(a.id) && a.forms && a.gScript && a.gScript.forms);
      if (!pick('description', adjectives)) return null;
      phraseRoles = ['object', 'comparison', 'description'];
    } else if (definitionPattern === 'instrument') {
      selected.verb = verbs.find(v => v.id === 'v-likhna');
      if (!selected.verb || !pick('object', objects.filter(o => compatible(selected.verb, o) && validText(o.g, 'gurmukhi')))) return null;
      const all = Object.values(vocab).flat();
      if (!pick('instrument', all.filter(o => writingInstrument(o) && dualPhrase(o, 'instrument')))) return null;
      phraseRoles = ['subject', 'instrument', 'object', 'verb'];
    } else return null;
    if (question && !enabled(vocab.QUESTION).some(q => q.id === 'q-ki')) return null;
    const conjugations = {};
    if (!isComparison) {
      for (const script of ['roman', 'gurmukhi']) {
        conjugations[script] = conjugate({ verb: selected.verb, subject: selected.subject, object: selected.object, aspect, recipient: selected.recipient, question, negative, script });
        if (!conjugations[script].ok) return null;
      }
    }
    for (const role of Object.keys(selected)) {
      if (!selected[role]) continue;
      const projection = contextualize(selected[role], { role: ({subject:'WHO',object:'WHAT',verb:'VERB',recipient:'WHO',companion:'WHO',comparison:'WHAT',instrument:'WHAT',description:'ADJECTIVE',origin:'WHERE',destination:'WHERE'}[role] || role), verb: selected.verb, template: definition, transitive: role === 'verb' ? verbRulesFor(selected.verb).transitive : undefined });
      if (!projection) return null;
      selected[role] = projection;
    }
    const s = selected.subject && englishSubject(selected.subject), objectEnglish = selected.object && nounEnglish(selected.object, true);
    if (/^finiteFuture/.test(definitionPattern)) english = (question ? 'will ' + s + ' ' : s + ' will ' + (negative ? 'not ' : '')) + selected.verb.base + (objectEnglish ? ' ' + objectEnglish : '') + (selected.destination ? ' ' + destinationEnglish(selected.destination) : '');
    else if (['perfectiveObject', 'perfectiveRecipient'].includes(definitionPattern)) english = s + ' ' + englishPast(selected.verb.base) + ' ' + objectEnglish + (selected.recipient ? ' to ' + objectiveEnglish(selected.recipient) : '');
    else if (definitionPattern === 'perfectiveOrigin') english = s + ' came from ' + originEnglish(selected.origin);
    else if (definitionPattern === 'originProgressive') english = s + ' ' + englishBe(selected.subject) + ' coming from ' + originEnglish(selected.origin);
    else if (definitionPattern === 'accompaniment') english = s + ' ' + englishBe(selected.subject) + ' going ' + destinationEnglish(selected.destination) + ' with ' + objectiveEnglish(selected.companion);
    else if (definitionPattern === 'giveRecipient') english = s + ' ' + englishHabit('give', selected.subject) + ' ' + objectEnglish + ' to ' + objectiveEnglish(selected.recipient);
    else if (definitionPattern === 'comparison') english = objectEnglish + ' ' + (selected.object.number === 'pl' ? 'are' : 'is') + ' ' + ({ hot: 'hotter', cold: 'colder', sweet: 'sweeter', cheap: 'cheaper', expensive: 'more expensive' }[selected.description.e]) + ' than ' + selected.comparison.e;
    else if (definitionPattern === 'instrument') english = s + ' ' + englishHabit('write', selected.subject) + ' ' + objectEnglish + ' with ' + nounEnglish(selected.instrument,true);
    if (!english || /undefined/.test(english)) return null;
    const sentenceBreakdown = [];
    if (question) {
      const questionWord=enabled(vocab.QUESTION).find(q=>q.id==='q-ki'),selection=semantics&&semantics.lexicalSelection(questionWord,{senseId:questionWord.selectedSenseId});
      const markerSelection=selection?{...selection,contextualMeaning:'polar question marker',meaningKind:'construction-translation',constructionId:template.id+':yes-no-question',evidence:(selection.evidence||[]).concat('authored-polar-question-marker')}:null;
      sentenceBreakdown.push({ roman: functional.roman.question, gurmukhi: functional.gurmukhi.question, english: 'polar question marker', category: 'QUESTION', role:'question',vocabularyId:lexicalId(questionWord),vocabularyIds: [lexicalId(questionWord)], selectedSenseId:markerSelection&&markerSelection.senseId,lexicalSelections:markerSelection?[markerSelection]:[], grammarConceptIds: ['questions'], grammarNote: 'Marks the whole sentence as a yes/no question.' });
    }
    for (const role of phraseRoles) {
      const item = selected[role];
      if (!item) continue;
      let roman = textOf(item, 'roman'), gurmukhi = textOf(item, 'gurmukhi'), grammarNote = '', meaning = item.e || item.english;
      if (role === 'subject') { roman = conjugations.roman.subjectText; gurmukhi = conjugations.gurmukhi.subjectText; meaning = englishSubject(item); grammarNote = aspect === 'perfective' ? conjugations.roman.grammarNote : 'Subject of the clause.'; }
      else if (role === 'verb') { roman = conjugations.roman.text; gurmukhi = conjugations.gurmukhi.text; meaning = aspect === 'future' ? 'will ' + (negative ? 'not ' : '') + item.base : aspect === 'perfective' ? englishPast(item.base) : aspect === 'progressive' ? englishGerund(item.base) : item.base; grammarNote = conjugations.roman.grammarNote; }
      else if (role === 'destination') { roman = item.dest; gurmukhi = item.gScript.dest; meaning = destinationEnglish(item); grammarNote = 'Authored destination phrase for a movement verb.'; }
      else if (['recipient', 'origin', 'companion', 'comparison', 'instrument'].includes(role)) {
        const nounRole = role === 'companion' ? 'accompaniment' : role;
        roman = nounPhrase(item, { case: nounRole, script: 'roman' }).text; gurmukhi = nounPhrase(item, { case: nounRole, script: 'gurmukhi' }).text;
        meaning = ({ recipient: 'to ', origin: 'from ', companion: 'with ', comparison: 'than ', instrument: 'with ' }[role]) + (['companion', 'recipient'].includes(role) ? objectiveEnglish(item) : role === 'origin' ? originEnglish(item) : nounEnglish(item,true));
        grammarNote = 'Oblique noun phrase followed by its postposition.';
      } else if (role === 'description') {
        const key = agreementKey(selected.object), aux = selected.object.number === 'pl' ? '3pl' : '3sg';
        roman = functional.roman.degree + ' ' + item.forms[key] + ' ' + auxiliary.roman.present[aux];
        gurmukhi = functional.gurmukhi.degree + ' ' + item.gScript.forms[key] + ' ' + auxiliary.gurmukhi.present[aux];
        meaning = 'more ' + item.e; grammarNote = 'The adjective and auxiliary agree with the item being described.';
      }
      if (!validText(roman, 'roman') || !validText(gurmukhi, 'gurmukhi')) return null;
      sentenceBreakdown.push({ roman, gurmukhi, english: meaning, category: ({ subject: 'WHO', object: 'WHAT', verb: 'VERB', recipient: 'RECIPIENT', companion: 'ACCOMPANIMENT', description: 'DESCRIPTION',reason:'WHY' }[role] || role.toUpperCase()), role, vocabularyId: lexicalId(item), vocabularyIds: [lexicalId(item)], dictionaryRoman: item.infinitive || item.p, dictionaryGurmukhi: item.gScript && item.gScript.infinitive || item.g, grammarNote, grammarConceptIds: definition.grammarConceptIds, selectedSenseId: item.selectedSenseId, lexicalSelections: item.lexicalSelection ? [item.lexicalSelection] : [] });
    }
    const roman = sentenceBreakdown.map(p => p.roman).join(' ') + (question ? '?' : '.');
    const gurmukhi = sentenceBreakdown.map(p => p.gurmukhi).join(' ') + (question ? '?' : '।');
    const breakdown = sentenceBreakdown.map(p => ({ label: p.role || p.category, value: p.roman, gurmukhi: p.gurmukhi, type: p.category, meaning: p.english, vocabularyId: p.vocabularyId, vocabularyIds: p.vocabularyIds }));
    return { punjabi: roman, roman, gurmukhi, english: english.charAt(0).toUpperCase() + english.slice(1) + (question ? '?' : '.'), templateId: template.id, template: template.id, templateName: template.name, difficulty: template.difficulty, signature: [template.id].concat(Object.keys(selected).map(role => role + ':' + lexicalId(selected[role]))).join('|'), breakdown, buildingBlocks: breakdown, sentenceBreakdown, vocabularyIds: [...new Set(sentenceBreakdown.flatMap(p => p.vocabularyIds))], senseIds: [...new Set(sentenceBreakdown.flatMap(p => (p.lexicalSelections||[]).map(s=>s.senseId)))], grammarConceptIds: definition.grammarConceptIds, scenarioIds: definition.scenarioIds, scriptWarning: '' };
  }
  function locationEnglish(item) {
    const meaning=String(item.e||''),match=meaning.match(/^(at|in|on) (.+)$/u);
    if(!match||['home','school','work','bed'].includes(match[2]))return meaning;
    return match[1]+' '+nounEnglish({...item,e:match[2]},true);
  }
  function destinationEnglish(item) { const meaning = String(item.e || '').replace(/^(at|in|on) /, ''); return meaning === 'home' || ['outside', 'inside', 'here', 'there', 'nearby'].includes(meaning) ? meaning : 'to ' + nounEnglish({...item,e:meaning},true); }
  function originEnglish(item) { const meaning=String(item.e || '').replace(/^(at|in|on) /, '');return meaning==='home'?meaning:nounEnglish({...item,e:meaning},true); }
  return { version: 2, enrichVerb, profileForEntry, profileMetadata: profileDataset && profileDataset.metadata, reference: REFERENCE, concepts, templates, metadataFor, dependenciesFor, conjugate, nounPhrase, compatible, validateSentenceContext, morphologyFor, verbRulesFor, generate, isHumanSubject: human, isStructuredTemplate: template => !!newById[template && template.id], lexicalId };
});
