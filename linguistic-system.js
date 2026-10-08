/* One persisted lexicon, with live compatibility views for the original editor.
 * Browser: PunjabiLinguisticSystem. Node: require('./linguistic-system').
 * No network, DOM, storage, or learner-progress mutations occur in this module. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PunjabiLinguisticSystem = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const SCHEMA_VERSION = 1;
  const BUNDLED_DATASET = 'punjabi-bundled-expansion-v1';
  const runtimes = new WeakMap();
  const rowReferences = new WeakMap();
  const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
  const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const text = value => typeof value === 'string' ? value : '';
  const unique = values => Array.from(new Set(values));
  const list = value => Array.isArray(value) ? value.filter(x => typeof x === 'string' && x.trim()).map(x => x.trim()) : [];
  const dictionary = value => Object.assign(Object.create(null), record(value) ? value : {});
  const normalized = value => text(value).normalize('NFC').trim().replace(/\s+/g, ' ');
  const meaningKey = value => normalized(value).toLowerCase().replace(/^(?:a|an|the)\s+/, '');
  const clone = value => JSON.parse(JSON.stringify(value));
  const CATEGORY_LABELS = {
    WHO: 'People', WHEN: 'Time', WHERE: 'Places', WHAT: 'Things', HOW: 'Tone & manner',
    WHY: 'Reasons', ABOUT: 'Topics', QUESTION: 'Questions', CONNECTOR: 'Connectors',
    STATE: 'Adjectives', ADJECTIVE: 'Adjectives', NUMBER: 'Numbers', VERBS: 'Verbs', LEXICON: 'Vocabulary',
    GAME_VEGETABLES: 'Vegetables', GAME_FRUITS: 'Fruits', GAME_SPICES: 'Spices',
    GAME_EDUCATION: 'Education', GAME_CLOTHES: 'Clothes', GAME_BODY: 'Parts of the body',
    GAME_NATURE: 'Nature', GAME_EVERYDAY: 'Everyday items'
  };
  const THEMATIC_DEFAULTS = {
    WHO: 'people', WHEN: 'time', WHERE: 'places', WHAT: 'activities', HOW: 'essential',
    WHY: 'opinions', ABOUT: 'storytelling', QUESTION: 'essential', CONNECTOR: 'storytelling',
    STATE: 'emotions', ADJECTIVE: 'people', NUMBER: 'numbers', VERBS: 'actions',
    GAME_VEGETABLES: 'produce', GAME_FRUITS: 'produce', GAME_SPICES: 'kitchen',
    GAME_EDUCATION: 'education', GAME_CLOTHES: 'clothing', GAME_BODY: 'body',
    GAME_NATURE: 'nature', GAME_EVERYDAY: 'home'
  };
  const CONTEXT_FIELDS = new Set(['id', 'vocabularyId', 'enabled', 'gameCategory', 'category', 'categories']);
  const SYNONYMS = { tags: 'semanticTags', roman: 'p', gurmukhi: 'g', primaryTranslation: 'e' };
  const GRAMMAR_FIELDS = new Set(['p', 'g', 'e', 'partOfSpeech', 'gender', 'number', 'semanticTags', 'verifiedGrammar']);
  const KNOWN_CONSTRUCTIONS = {
    'where-ghar': { surface: { p: 'ghar vich', g: 'ਘਰ ਵਿੱਚ', e: 'at home' }, lemma: { p: 'ghar', g: 'ਘਰ', e: 'home' },
      postposition: { p: 'vich', g: 'ਵਿੱਚ' }, case: 'locative' }
  };

  function inferPartOfSpeech(row, category) {
    if (row.partOfSpeech || row.pos) return row.partOfSpeech || row.pos;
    if (category === 'VERBS' || row.infinitive) return 'verb';
    if (category === 'WHAT' || /^GAME_/.test(category)) return 'noun';
    if (category === 'STATE' || category === 'ADJECTIVE') return 'adjective';
    if (category === 'NUMBER') return 'numeral';
    if (category === 'CONNECTOR') return 'conjunction';
    if (category === 'HOW' || category === 'WHEN') return 'adverb';
    if (category === 'WHO') return /^who-(main|tusi|oh|asi|tu|ohlok|koi|harkoi)$/.test(row.id || '') ? 'pronoun' : 'noun';
    return 'expression';
  }
  function fingerprint(entry) {
    if (!normalized(entry.g) || !meaningKey(entry.e)) return null;
    return [normalized(entry.g), meaningKey(entry.e), entry.partOfSpeech, normalized(entry.p)].join('\u001f');
  }
  function mergeSafe(left, right) {
    // Unknown gender/number does not contradict authored metadata. Known
    // disagreements and distinct senses must survive as separate records.
    for (const field of ['gender', 'number', 'senseId', 'person', 'root', 'type', 'objectPostposition']) {
      if (left[field] != null && right[field] != null && left[field] !== right[field]) return false;
    }
    for (const field of ['forms', 'gScript', 'inflections', 'takesTags']) {
      if (left[field] && right[field] && JSON.stringify(left[field]) !== JSON.stringify(right[field])) return false;
    }
    if (left.semanticTags.length && right.semanticTags.length &&
        JSON.stringify(left.semanticTags.slice().sort()) !== JSON.stringify(right.semanticTags.slice().sort())) return false;
    if (left.meanings.length > 1 || right.meanings.length > 1) {
      if (JSON.stringify(left.meanings) !== JSON.stringify(right.meanings)) return false;
    }
    return true;
  }
  function aliasProperties(entry) {
    // Compatibility aliases are accessors, never second persisted datasets.
    for (const [alias, field] of Object.entries(SYNONYMS)) {
      if (own(entry, alias)) { if (!own(entry, field)) entry[field] = entry[alias]; delete entry[alias]; }
      Object.defineProperty(entry, alias, { configurable: true, enumerable: false,
        get() { return entry[field]; }, set(value) { entry[field] = value; } });
    }
    let translation = entry.e;
    Object.defineProperty(entry, 'e', { configurable: true, enumerable: true,
      get() { return translation; }, set(value) {
        if (Array.isArray(entry.meanings) && entry.meanings[0] === translation) entry.meanings[0] = value;
        else if (Array.isArray(entry.meanings) && record(entry.meanings[0]) && entry.meanings[0].english === translation) entry.meanings[0].english = value;
        translation = value;
      } });
    if (entry.partOfSpeech === 'verb') {
      let script = entry.g;
      Object.defineProperty(entry, 'g', { configurable: true, enumerable: true,
        get() { return entry.gScript && entry.gScript.infinitive || script; },
        set(value) { script = value; if (entry.gScript) entry.gScript.infinitive = value; } });
      for (const [alias, field] of [['infinitive', 'p'], ['english', 'e']]) {
        if (own(entry, alias)) { if (!entry[field]) entry[field] = entry[alias]; delete entry[alias]; }
        Object.defineProperty(entry, alias, { configurable: true, enumerable: false,
          get() { return entry[field]; }, set(value) { entry[field] = value; } });
      }
    }
    return entry;
  }
  function canonicalRow(row, category, id) {
    // Authored forms/source objects must be owned by the runtime entry. Editing
    // a nested form cannot mutate the shipped import used for later hydration.
    row = clone(row);
    const entry = {};
    for (const key of Object.keys(row)) {
      if (CONTEXT_FIELDS.has(key) || ['p', 'g', 'e', 'roman', 'gurmukhi', 'english', 'infinitive', 'tags', 'pos'].includes(key)) continue;
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
      entry[key] = row[key];
    }
    entry.id = id;
    entry.primaryId = text(row.primaryId) || text(row.id) || id.replace(/^lex:/, '');
    entry.p = text(row.p || row.roman || row.infinitive);
    entry.g = text(row.g || row.gurmukhi || (row.gScript && row.gScript.infinitive)).normalize('NFC');
    entry.e = text(row.e || row.english || row.primaryTranslation);
    entry.partOfSpeech = inferPartOfSpeech(row, category);
    entry.gender = own(row, 'gender') ? row.gender : null;
    entry.number = own(row, 'number') ? row.number : null;
    entry.semanticTags = unique(list(row.semanticTags || row.tags));
    entry.meanings = Array.isArray(row.meanings) && row.meanings.length ? row.meanings : (entry.e ? [entry.e] : []);
    entry.frequency = own(row, 'frequency') ? row.frequency : null;
    entry.difficulty = own(row, 'difficulty') ? row.difficulty : null;
    entry.categories = unique(list(row.categories).concat(THEMATIC_DEFAULTS[category] || []));
    entry.source = row.source || { type: 'legacy', status: 'unreviewed', note: 'Preserved from the existing application; grammatical metadata is not independently verified.' };
    entry.enabled = true;
    return aliasProperties(entry);
  }
  function runtime(state) {
    if (!record(state)) throw new TypeError('A state object is required.');
    if (!runtimes.has(state)) install(state);
    return runtimes.get(state);
  }
  function resolveId(state, id) {
    const linguistic = runtime(state).linguistic;
    const key = text(id);
    if (own(linguistic.entries, key)) return key;
    return own(linguistic.aliases, key) ? linguistic.aliases[key] : null;
  }
  function get(state, id) {
    const key = resolveId(state, id);
    return key ? runtime(state).linguistic.entries[key] : null;
  }
  function reject(rt, category, value, reason) {
    rt.linguistic.migrationRejected.push({ category, value, reason });
  }
  function safeId(row, category, index) {
    if (text(row.id).trim()) return row.id.trim();
    const input = [category, index, row.p || row.infinitive, row.g, row.e || row.english].join('|');
    let hash = 2166136261;
    for (let i = 0; i < input.length; i++) hash = Math.imul(hash ^ input.charCodeAt(i), 16777619);
    return 'migrated-' + category.toLowerCase() + '-' + (hash >>> 0).toString(36);
  }
  function newCanonicalId(rt, legacyId) {
    const base = legacyId.startsWith('lex:') ? legacyId : 'lex:' + legacyId;
    let id = base, serial = 2;
    while (own(rt.linguistic.entries, id)) id = base + ':' + serial++;
    return id;
  }
  function indexEntry(rt, entry) {
    const previous = rt.entryCategories.get(entry.id) || new Set();
    const next = new Set(entry.deleted ? [] : list(entry.categories));
    for (const id of previous) {
      if (!next.has(id)) { rt.categoryMembers.get(id).delete(entry.id); rt.categoryDirty.add(id); }
    }
    for (const id of next) {
      if (!own(rt.linguistic.categories, id)) rt.linguistic.categories[id] = { id, label: id.replace(/[-_]/g, ' '), vocabularyIds: [] };
      if (!rt.categoryMembers.has(id)) rt.categoryMembers.set(id, new Set());
      if (!previous.has(id)) { rt.categoryMembers.get(id).add(entry.id); rt.categoryDirty.add(id); }
    }
    rt.entryCategories.set(entry.id, next);
  }
  function addBinding(rt, category, row, options) {
    options = options || {};
    if (!record(row)) { reject(rt, category, row, 'Vocabulary row must be an object.'); return null; }
    const existingRef = rowReferences.get(row);
    const legacyId = safeId(row, category, (rt.linguistic.bindings[category] || []).length);
    if (!options.restore && (own(rt.linguistic.tombstones, legacyId) || own(rt.linguistic.tombstones, category + ':' + legacyId))) return null;
    if (!own(rt.linguistic.bindings, category)) rt.linguistic.bindings[category] = [];
    const bindings = rt.linguistic.bindings[category];
    if (!rt.bindingIndexes.has(category)) rt.bindingIndexes.set(category, new Map());
    const previous = rt.bindingIndexes.get(category).get(legacyId);
    if (previous) return rt.linguistic.entries[previous.vocabularyId];
    const known = category === 'WHERE' && KNOWN_CONSTRUCTIONS[legacyId];
    const construction = known && ['p', 'g', 'e'].every(field => normalized(row[field]) === normalized(known.surface[field])) ? known : null;
    const lexicalRow = construction ? Object.assign({}, row, construction.lemma, {
      partOfSpeech: 'noun', semanticTags: ['place'], categories: unique(list(row.categories).concat('home', 'places'))
    }) : row;
    let entry = existingRef && existingRef.rt === rt ? rt.linguistic.entries[existingRef.binding.vocabularyId] : null;
    if (!entry && text(row.vocabularyId) && own(rt.linguistic.entries, row.vocabularyId)) entry = rt.linguistic.entries[row.vocabularyId];
    if (!entry && own(rt.linguistic.aliases, legacyId)) entry = rt.linguistic.entries[rt.linguistic.aliases[legacyId]];
    if (!entry) {
      const candidate = canonicalRow(lexicalRow, category, newCanonicalId(rt, legacyId));
      const key = fingerprint(candidate);
      entry = key && (rt.fingerprints.get(key) || []).map(id => rt.linguistic.entries[id]).find(other => !other.deleted && mergeSafe(other, candidate));
      if (entry) {
        if (entry.gender == null) entry.gender = candidate.gender;
        if (entry.number == null) entry.number = candidate.number;
        entry.semanticTags = unique(entry.semanticTags.concat(candidate.semanticTags));
        entry.categories = unique(entry.categories.concat(candidate.categories));
        for (const [field, value] of Object.entries(candidate)) {
          if (!['id', 'primaryId', 'p', 'g', 'e', 'meanings'].includes(field) && entry[field] == null && value != null) entry[field] = value;
        }
        if (JSON.stringify(entry.source) !== JSON.stringify(candidate.source)) entry.sources = unique((entry.sources || [entry.source]).concat(candidate.source));
      } else {
        entry = candidate;
        rt.linguistic.entries[entry.id] = entry;
        if (key) rt.fingerprints.set(key, (rt.fingerprints.get(key) || []).concat(entry.id));
      }
    }
    if (entry.deleted && !options.restore) return null;
    if (options.restore) {
      delete entry.deleted;
      delete rt.linguistic.tombstones[legacyId];
      delete rt.linguistic.tombstones[category + ':' + legacyId];
      delete rt.linguistic.tombstones[entry.id];
    }
    const binding = { id: legacyId, vocabularyId: entry.id, enabled: row.enabled !== false };
    if (construction) binding.construction = { type: 'postpositional-phrase', case: construction.case,
      vocabularyId: entry.id, postposition: construction.postposition };
    if (row.gameCategory) binding.gameCategory = row.gameCategory;
    // Articles and contextual translations remain on a role binding, while
    // spelling and every linguistic property come from the authoritative entry.
    if (text(row.e || row.english) && text(row.e || row.english) !== entry.e) binding.e = text(row.e || row.english);
    if (existingRef && existingRef.rt === rt) {
      for (const [key, value] of Object.entries(existingRef.binding)) {
        if (!['id', 'vocabularyId'].includes(key)) binding[key] = value;
      }
    }
    bindings.push(binding);
    rt.bindingIndexes.get(category).set(legacyId, binding);
    if (!rt.roleEntries.has(category)) rt.roleEntries.set(category, new Set());
    rt.roleEntries.get(category).add(entry.id);
    rt.linguistic.aliases[legacyId] = entry.id;
    if (category === 'VERBS' && !rt.linguistic.verbIds.includes(entry.id)) rt.linguistic.verbIds.push(entry.id);
    indexEntry(rt, entry);
    rt.dirty.add(entry.id);
    return entry;
  }
  function markRemoved(rt, category, binding) {
    rt.linguistic.tombstones[category + ':' + binding.id] = { id: binding.id, vocabularyId: binding.vocabularyId, category, reason: 'removed-binding' };
    rt.dirty.add(binding.vocabularyId);
  }
  function replaceBindings(rt, category, rows) {
    if (!Array.isArray(rows)) throw new TypeError('A vocabulary category must be an array.');
    const previous = rt.linguistic.bindings[category] || [];
    const wanted = new Set(rows.filter(record).map((row, index) => safeId(row, category, index)));
    previous.filter(binding => !wanted.has(binding.id)).forEach(binding => markRemoved(rt, category, binding));
    rt.linguistic.bindings[category] = [];
    rt.bindingIndexes.set(category, new Map());
    rt.roleEntries.set(category, new Set());
    rows.forEach(row => addBinding(rt, category, row, { restore: wanted.has(text(row && row.id)) && previous.some(b => b.id === row.id) }));
    syncRuntime(rt);
  }
  function rowView(rt, category, binding) {
    if (rt.rows.has(binding)) return rt.rows.get(binding);
    const proxy = new Proxy({}, {
      get(target, key) {
        const entry = rt.linguistic.entries[binding.vocabularyId];
        if (key === 'id') return binding.id;
        if (key === 'vocabularyId') return binding.vocabularyId;
        if (key === 'enabled') return binding.enabled !== false && entry.enabled !== false && !entry.deleted;
        if (key === 'category') return category;
        if (key === 'toJSON') return () => Object.fromEntries(Reflect.ownKeys(proxy).map(k => [k, proxy[k]]));
        if (own(binding, key)) return binding[key];
        if (binding.construction && binding.construction.type === 'postpositional-phrase') {
          if (key === 'p' || key === 'g') return [entry[key], binding.construction.postposition[key]].filter(Boolean).join(' ');
        }
        if (key === 'infinitive' && entry.partOfSpeech === 'verb') return entry.p;
        if (key === 'english' && entry.partOfSpeech === 'verb') return binding.e || entry.e;
        if (key === 'g' && entry.partOfSpeech === 'verb' && entry.gScript && entry.gScript.infinitive) return entry.gScript.infinitive;
        return entry[SYNONYMS[key] || key];
      },
      set(target, key, value) {
        const entry = rt.linguistic.entries[binding.vocabularyId];
        if (key === 'id' || key === 'vocabularyId') throw new TypeError('Vocabulary identifiers are immutable.');
        if (key === 'enabled' || key === 'gameCategory') binding[key] = value;
        else if (binding.construction && ['p', 'g', 'e'].includes(key)) {
          // A contextual phrase has its own surface. Editing it must not turn
          // the dictionary noun into an unrelated phrase or erase user text.
          if (value !== proxy[key]) binding[key] = value;
        }
        else if (key === 'e' && own(binding, 'e')) {
          if (entry.importedDataset && entry.verifiedGrammar === true && meaningKey(value) !== meaningKey(entry.e)) entry.verifiedGrammar = false;
          binding.e = value; entry.e = value; rt.validateRoles.add(entry.id);
        }
        else {
          const field = key === 'infinitive' ? 'p' : key === 'english' ? 'e' : SYNONYMS[key] || key;
          if (GRAMMAR_FIELDS.has(field)) {
            if (entry.importedDataset && field !== 'verifiedGrammar' && JSON.stringify(value) !== JSON.stringify(entry[field]) && entry.verifiedGrammar === true) entry.verifiedGrammar = false;
            rt.validateRoles.add(entry.id);
          }
          entry[field] = value;
          if (field === 'gScript' && entry.partOfSpeech === 'verb' && value && value.infinitive) entry.g = value.infinitive;
        }
        rt.dirty.add(entry.id);
        return true;
      },
      deleteProperty(target, key) {
        if (key === 'id' || key === 'vocabularyId') return false;
        const entry = rt.linguistic.entries[binding.vocabularyId];
        if (own(binding, key)) delete binding[key];
        else delete entry[SYNONYMS[key] || key];
        if (GRAMMAR_FIELDS.has(SYNONYMS[key] || key)) rt.validateRoles.add(entry.id);
        rt.dirty.add(entry.id);
        return true;
      },
      ownKeys() {
        const entry = rt.linguistic.entries[binding.vocabularyId];
        const keys = Object.keys(entry).filter(k => !['id', 'primaryId', 'enabled', 'deleted'].includes(k));
        if (entry.partOfSpeech === 'verb') keys.push('infinitive', 'english');
        return unique(['id', 'vocabularyId', 'enabled'].concat(keys, Object.keys(binding), ['tags']));
      },
      getOwnPropertyDescriptor(target, key) { return { configurable: true, enumerable: true, writable: true, value: proxy[key] }; },
      has(target, key) { return Reflect.ownKeys(proxy).includes(key); }
    });
    rowReferences.set(proxy, { rt, category, binding });
    rt.rows.set(binding, proxy);
    return proxy;
  }
  function arrayView(rt, category) {
    if (rt.arrays.has(category)) return rt.arrays.get(category);
    const rows = () => (rt.linguistic.bindings[category] || []).map(binding => rowView(rt, category, binding));
    const proxy = new Proxy([], {
      get(target, key) {
        if (key === 'length') return (rt.linguistic.bindings[category] || []).length;
        if (key === Symbol.iterator) return () => rows()[Symbol.iterator]();
        if (key === 'push') return (...items) => { items.forEach(item => addBinding(rt, category, item)); return proxy.length; };
        if (key === 'pop') return () => { const result = rows(), removed = result.pop(); replaceBindings(rt, category, result); return removed; };
        if (key === 'shift') return () => { const result = rows(), removed = result.shift(); replaceBindings(rt, category, result); return removed; };
        if (['unshift', 'splice', 'sort', 'reverse', 'fill', 'copyWithin'].includes(key)) return (...args) => {
          const result = rows(), returned = Array.prototype[key].apply(result, args); replaceBindings(rt, category, result); return returned === result ? proxy : returned;
        };
        if (key === 'toJSON') return rows;
        if (typeof key === 'string' && /^\d+$/.test(key)) {
          const binding = (rt.linguistic.bindings[category] || [])[Number(key)];
          return binding ? rowView(rt, category, binding) : undefined;
        }
        const value = Array.prototype[key];
        return typeof value === 'function' ? (...args) => value.apply(rows(), args) : value;
      },
      set(target, key, value) {
        const result = rows();
        if (key === 'length') { result.length = value; replaceBindings(rt, category, result.filter(Boolean)); return true; }
        if (typeof key === 'string' && /^\d+$/.test(key)) { result[Number(key)] = value; replaceBindings(rt, category, result.filter(Boolean)); return true; }
        return Reflect.set(target, key, value);
      },
      deleteProperty(target, key) {
        if (typeof key === 'string' && /^\d+$/.test(key)) { const result = rows(); result.splice(Number(key), 1); replaceBindings(rt, category, result); return true; }
        return Reflect.deleteProperty(target, key);
      },
      has(target, key) { return key === 'length' || (typeof key === 'string' && /^\d+$/.test(key) && Number(key) < proxy.length) || key in Array.prototype; }
    });
    rt.arrays.set(category, proxy);
    return proxy;
  }
  function attachViews(state, rt) {
    const vocab = new Proxy({}, {
      get(target, category) { return typeof category === 'string' && own(rt.linguistic.bindings, category) && category !== 'VERBS' ? arrayView(rt, category) : undefined; },
      set(target, category, rows) { replaceBindings(rt, category, rows); return true; },
      deleteProperty(target, category) { replaceBindings(rt, category, []); delete rt.linguistic.bindings[category]; return true; },
      ownKeys() { return Object.keys(rt.linguistic.bindings).filter(category => category !== 'VERBS'); },
      getOwnPropertyDescriptor(target, category) { return own(rt.linguistic.bindings, category) && category !== 'VERBS' ? { configurable: true, enumerable: true, value: arrayView(rt, category) } : undefined; },
      has(target, category) { return own(rt.linguistic.bindings, category) && category !== 'VERBS'; }
    });
    Object.defineProperty(state, 'vocab', { configurable: true, enumerable: false, get() { return vocab; }, set(value) {
      if (!record(value)) throw new TypeError('Vocabulary must be an object of arrays.');
      for (const category of Object.keys(rt.linguistic.bindings).filter(c => c !== 'VERBS')) if (!own(value, category)) replaceBindings(rt, category, []);
      for (const [category, rows] of Object.entries(value)) replaceBindings(rt, category, rows);
    } });
    Object.defineProperty(state, 'verbs', { configurable: true, enumerable: false, get() { return arrayView(rt, 'VERBS'); }, set(value) { replaceBindings(rt, 'VERBS', value); } });
  }
  function syncRuntime(rt) {
    for (const id of rt.validateRoles) {
      const entry = rt.linguistic.entries[id];
      if (entry) revokeInvalidRoles(rt, entry);
    }
    rt.validateRoles.clear();
    const active = new Set();
    for (const bindings of Object.values(rt.linguistic.bindings)) {
      for (const binding of bindings) active.add(binding.vocabularyId);
    }
    rt.linguistic.verbIds = unique((rt.linguistic.bindings.VERBS || []).map(binding => binding.vocabularyId));
    for (const id of rt.dirty) {
      const entry = rt.linguistic.entries[id];
      if (!entry) continue;
      if (!active.has(id)) { entry.deleted = true; rt.linguistic.tombstones[id] = { vocabularyId: id, reason: 'no-remaining-bindings' }; }
      if (entry.partOfSpeech === 'verb' && entry.gScript && entry.gScript.infinitive) entry.g = entry.gScript.infinitive;
      entry.semanticTags = unique(list(entry.semanticTags));
      entry.categories = unique(list(entry.categories));
      indexEntry(rt, entry);
    }
    rt.dirty.clear();
    flushCategories(rt);
  }
  function flushCategories(rt) {
    for (const id of rt.categoryDirty) rt.linguistic.categories[id].vocabularyIds = Array.from(rt.categoryMembers.get(id));
    rt.categoryDirty.clear();
  }
  function sync(state) { syncRuntime(runtime(state)); return state; }
  function install(state, options) {
    if (!record(state)) throw new TypeError('A state object is required.');
    options = options || {};
    let rt = runtimes.get(state);
    if (!rt) {
      const legacyVocab = state.vocab, legacyVerbs = state.verbs;
      const existing = record(state.linguistic) && record(state.linguistic.entries);
      const linguistic = existing ? state.linguistic : {};
      if (linguistic.schemaVersion > SCHEMA_VERSION) throw new Error('This vocabulary schema is newer than this app supports.');
      linguistic.schemaVersion = SCHEMA_VERSION;
      for (const key of ['entries', 'bindings', 'aliases', 'tombstones', 'categories']) linguistic[key] = dictionary(linguistic[key]);
      linguistic.verbIds = list(linguistic.verbIds);
      linguistic.migrationRejected = Array.isArray(linguistic.migrationRejected) ? linguistic.migrationRejected : [];
      linguistic.progression = record(linguistic.progression) ? linguistic.progression : {};
      for (const dimension of ['vocabulary', 'grammar', 'communication']) if (!record(linguistic.progression[dimension])) linguistic.progression[dimension] = {};
      rt = { state, linguistic, arrays: new Map(), rows: new WeakMap(), fingerprints: new Map(), dirty: new Set(),
        entryCategories: new Map(), categoryMembers: new Map(), categoryDirty: new Set(), bindingIndexes: new Map(), roleEntries: new Map(),
        importedBaselines: new Map(), importedBindings: new Map(), importedAliases: new Set(), validateRoles: new Set() };
      state.linguistic = linguistic;
      runtimes.set(state, rt);
      for (const [id, entry] of Object.entries(linguistic.entries)) {
        if (!record(entry)) { reject(rt, 'entries', entry, 'Invalid central vocabulary record: ' + id); delete linguistic.entries[id]; continue; }
        entry.id = id;
        entry.primaryId = text(entry.primaryId) || id.replace(/^lex:/, '');
        linguistic.aliases[entry.primaryId] = id;
        entry.semanticTags = unique(list(entry.semanticTags || entry.tags));
        entry.categories = unique(list(entry.categories));
        entry.meanings = Array.isArray(entry.meanings) ? entry.meanings : (entry.e ? [entry.e] : []);
        entry.partOfSpeech = entry.partOfSpeech || 'expression';
        aliasProperties(entry);
        indexEntry(rt, entry);
        const key = fingerprint(entry);
        if (key) rt.fingerprints.set(key, (rt.fingerprints.get(key) || []).concat(id));
      }
      for (const [category, bindings] of Object.entries(linguistic.bindings)) {
        if (!Array.isArray(bindings)) { reject(rt, category, bindings, 'Central bindings must be an array.'); linguistic.bindings[category] = []; continue; }
        linguistic.bindings[category] = bindings.filter(binding => {
          if (record(binding) && text(binding.id) && own(linguistic.entries, binding.vocabularyId)) return true;
          reject(rt, category, binding, 'Invalid or dangling vocabulary binding.'); return false;
        });
        rt.bindingIndexes.set(category, new Map(linguistic.bindings[category].map(binding => [binding.id, binding])));
        rt.roleEntries.set(category, new Set(linguistic.bindings[category].map(binding => binding.vocabularyId)));
      }
      if (!existing) {
        if (record(legacyVocab)) {
          for (const [category, rows] of Object.entries(legacyVocab)) {
            linguistic.bindings[category] = [];
            if (!Array.isArray(rows)) { reject(rt, category, rows, 'Legacy vocabulary category must be an array.'); continue; }
            rows.forEach(row => addBinding(rt, category, row));
          }
        } else if (legacyVocab != null) reject(rt, 'vocab', legacyVocab, 'Legacy vocabulary must be an object.');
        linguistic.bindings.VERBS = [];
        if (Array.isArray(legacyVerbs)) legacyVerbs.forEach(row => addBinding(rt, 'VERBS', row));
        else if (legacyVerbs != null) reject(rt, 'VERBS', legacyVerbs, 'Legacy verbs must be an array.');
        linguistic.migratedFrom = { stateSchemaVersion: state.schemaVersion || null, format: 'legacy-vocab-and-verbs' };
      }
      if (!own(linguistic.bindings, 'LEXICON')) linguistic.bindings.LEXICON = [];
      if (!own(linguistic.bindings, 'VERBS')) linguistic.bindings.VERBS = [];
      attachViews(state, rt);
    }
    const categoryDefinitions = record(options.categories) ? options.categories : {};
    for (const [id, category] of Object.entries(categoryDefinitions)) {
      if (!record(category)) continue;
      const references = rt.linguistic.categories[id] && rt.linguistic.categories[id].vocabularyIds || [];
      rt.linguistic.categories[id] = Object.assign({}, category, { id, label: category.label || category.name || id, vocabularyIds: references });
    }
    if (Array.isArray(options.expansion)) options.expansion.forEach(row => upsert(state, row, { imported: true }));
    syncRuntime(rt);
    return state;
  }
  function upsert(state, row, options) {
    const rt = runtime(state);
    options = options || {};
    if (!record(row)) throw new TypeError('A vocabulary entry must be an object.');
    const id = text(row.vocabularyId || row.id);
    if (options.imported && id) rt.importedAliases.add(id);
    const existing = id && get(state, id);
    if (options.imported && existing) {
      if (existing.deleted || own(rt.linguistic.tombstones, id)) return null;
      if (existing.importedDataset === BUNDLED_DATASET) {
        attachBundledBindings(rt, row, existing);
        recordBundledBaseline(rt, row, existing, false);
      }
      return existing;
    }
    if (options.imported && own(rt.linguistic.tombstones, id)) return null;
    let entry;
    if (existing) {
      if (existing.deleted && !options.restore) return null;
      entry = existing;
      const grammarChanged = Array.from(GRAMMAR_FIELDS).filter(field => field !== 'verifiedGrammar').some(field => own(row, field) && JSON.stringify(row[field]) !== JSON.stringify(entry[field]));
      for (const [key, value] of Object.entries(row)) {
        if (['id', 'primaryId', 'vocabularyId', 'enabled', 'category', 'gameCategory'].includes(key)) continue;
        const field = key === 'infinitive' ? 'p' : key === 'english' ? 'e' : SYNONYMS[key] || key;
        if (field === '__proto__' || field === 'constructor' || field === 'prototype') continue;
        entry[field] = value;
      }
      if (own(row, 'enabled')) entry.enabled = row.enabled !== false;
      if (grammarChanged && entry.importedDataset && entry.verifiedGrammar === true && options.reviewed !== true) entry.verifiedGrammar = false;
      if (options.restore) delete entry.deleted;
      rt.dirty.add(entry.id);
    } else {
      const entryRow = Object.assign({}, row);
      if (!entryRow.id) entryRow.id = safeId(entryRow, 'LEXICON', Object.keys(rt.linguistic.entries).length);
      entry = addBinding(rt, 'LEXICON', entryRow, options);
    }
    if (!entry) return null;
    if (options.imported && !existing && entry.primaryId === text(row.id)) entry.importedDataset = BUNDLED_DATASET;
    if (!(rt.roleEntries.get('LEXICON') || new Set()).has(entry.id)) {
      addBinding(rt, 'LEXICON', Object.assign({}, row, { id: entry.primaryId, vocabularyId: entry.id }), options);
    }
    const tags = list(entry.semanticTags);
    if (!options.imported) {
      revokeInvalidRoles(rt, entry);
      // A role revoked for incomplete grammar can return after an explicit
      // authoring update. A user's Delete action remains a persistent tombstone.
      if (entry.verifiedGrammar === true) {
        for (const category of bundledRoles(entry).filter(role => role !== 'LEXICON')) {
          const key = category + ':' + entry.primaryId;
          if (rt.linguistic.tombstones[key] && rt.linguistic.tombstones[key].reason === 'grammar-role-revoked') delete rt.linguistic.tombstones[key];
        }
      }
    }
    // Importing a noun cannot make it a random sentence object. Every piece of
    // agreement/compatibility metadata must be authored and explicitly reviewed.
    if (entry.partOfSpeech === 'noun' && entry.verifiedGrammar === true && ['m', 'f'].includes(entry.gender) &&
        ['sg', 'pl'].includes(entry.number) && tags.length) {
      addBinding(rt, 'WHAT', Object.assign({}, row, { id: entry.primaryId, vocabularyId: entry.id, enabled: entry.enabled }), options);
    }
    if (entry.partOfSpeech === 'adjective' && entry.verifiedGrammar === true && record(entry.forms) && record(entry.gScript) && record(entry.gScript.forms)) {
      addBinding(rt, 'ADJECTIVE', Object.assign({}, row, { id: entry.primaryId, vocabularyId: entry.id }), options);
    }
    if (entry.partOfSpeech === 'verb' && entry.verifiedGrammar === true && entry.root && record(entry.forms) && record(entry.gScript) && entry.gScript.infinitive) {
      addBinding(rt, 'VERBS', Object.assign({}, row, { id: entry.primaryId, vocabularyId: entry.id }), options);
    }
    indexEntry(rt, entry);
    if (options.imported && entry.importedDataset === BUNDLED_DATASET) recordBundledBaseline(rt, row, entry, true);
    if (!options.imported) flushCategories(rt);
    return entry;
  }
  function bundledRoles(entry) {
    const roles = ['LEXICON'];
    if (entry.partOfSpeech === 'noun' && entry.verifiedGrammar === true && ['m', 'f'].includes(entry.gender) &&
        ['sg', 'pl'].includes(entry.number) && list(entry.semanticTags).length) roles.push('WHAT');
    if (entry.partOfSpeech === 'adjective' && entry.verifiedGrammar === true && record(entry.forms) && record(entry.gScript) && record(entry.gScript.forms)) roles.push('ADJECTIVE');
    if (entry.partOfSpeech === 'verb' && entry.verifiedGrammar === true && entry.root && record(entry.forms) && record(entry.gScript) && entry.gScript.infinitive) roles.push('VERBS');
    return roles;
  }
  function revokeInvalidRoles(rt, entry) {
    const invalid = [];
    if (entry.partOfSpeech !== 'noun' || entry.verifiedGrammar === false || !['m', 'f'].includes(entry.gender) ||
        !['sg', 'pl'].includes(entry.number) || !list(entry.semanticTags).length) invalid.push('WHAT');
    if (entry.partOfSpeech !== 'verb' || entry.verifiedGrammar === false) invalid.push('VERBS');
    if (entry.partOfSpeech !== 'adjective' || entry.verifiedGrammar === false) invalid.push('ADJECTIVE');
    for (const category of invalid) {
      const bindings = rt.linguistic.bindings[category] || [];
      const removed = bindings.filter(binding => binding.vocabularyId === entry.id);
      if (!removed.length) continue;
      if (!(rt.roleEntries.get('LEXICON') || new Set()).has(entry.id)) {
        addBinding(rt, 'LEXICON', { id: entry.primaryId, vocabularyId: entry.id, enabled: entry.enabled });
      }
      rt.linguistic.bindings[category] = bindings.filter(binding => binding.vocabularyId !== entry.id);
      for (const binding of removed) {
        rt.linguistic.tombstones[category + ':' + binding.id] = { id: binding.id, vocabularyId: entry.id, category, reason: 'grammar-role-revoked' };
        rt.bindingIndexes.get(category).delete(binding.id);
      }
      rt.roleEntries.get(category).delete(entry.id);
      rt.dirty.add(entry.id);
    }
  }
  function attachBundledBindings(rt, row, entry) {
    const baseline = canonicalRow(row, 'LEXICON', entry.id);
    // Rehydrate only omitted base bindings. Existing bindings and category
    // tombstones carry user choices and must not be reset by the shipped data.
    for (const category of bundledRoles(baseline)) {
      addBinding(rt, category, Object.assign({}, row, { id: entry.primaryId, vocabularyId: entry.id,
        p: entry.p, g: entry.g, e: entry.e, english: entry.e }), { imported: true });
    }
  }
  function recordBundledBaseline(rt, row, entry, newlyImported) {
    rt.importedAliases.add(text(row.id));
    if (!rt.importedBaselines.has(entry.id)) {
      const original = newlyImported ? entry : canonicalRow(row, 'LEXICON', entry.id);
      original.importedDataset = BUNDLED_DATASET;
      rt.importedBaselines.set(entry.id, JSON.stringify(original));
      for (const category of bundledRoles(original)) {
        const binding = { id: original.primaryId, vocabularyId: entry.id, enabled: row.enabled !== false };
        if (row.gameCategory) binding.gameCategory = row.gameCategory;
        rt.importedBindings.set(category + ':' + binding.id, JSON.stringify(binding));
      }
    }
  }
  function remove(state, id) {
    const rt = runtime(state), entry = get(state, id);
    if (!entry) return false;
    for (const [category, bindings] of Object.entries(rt.linguistic.bindings)) {
      rt.linguistic.bindings[category] = bindings.filter(binding => {
        if (binding.vocabularyId !== entry.id) return true;
        markRemoved(rt, category, binding);
        rt.linguistic.tombstones[binding.id] = { id: binding.id, vocabularyId: entry.id, reason: 'removed-entry' };
        return false;
      });
      rt.bindingIndexes.set(category, new Map(rt.linguistic.bindings[category].map(binding => [binding.id, binding])));
      rt.roleEntries.set(category, new Set(rt.linguistic.bindings[category].map(binding => binding.vocabularyId)));
    }
    entry.deleted = true;
    rt.linguistic.tombstones[entry.id] = { vocabularyId: entry.id, reason: 'removed-entry' };
    rt.dirty.add(entry.id);
    syncRuntime(rt);
    return true;
  }
  function vocabulary(state, options) {
    const rt = runtime(state);
    options = options || {};
    const bindingsByEntry = new Map();
    for (const [category, bindings] of Object.entries(rt.linguistic.bindings)) {
      for (const binding of bindings) {
        const entry = rt.linguistic.entries[binding.vocabularyId];
        if (!entry || entry.deleted || entry.enabled === false || (binding.enabled === false && !options.includeDisabled)) continue;
        if (!bindingsByEntry.has(entry.id)) bindingsByEntry.set(entry.id, []);
        bindingsByEntry.get(entry.id).push({ category, binding });
      }
    }
    const output = [];
    const aliasesByEntry = new Map();
    for (const [alias, id] of Object.entries(rt.linguistic.aliases)) {
      if (!aliasesByEntry.has(id)) aliasesByEntry.set(id, []);
      aliasesByEntry.get(id).push(alias);
    }
    for (const [id, bindings] of bindingsByEntry) {
      const entry = rt.linguistic.entries[id];
      const g = entry.partOfSpeech === 'verb' && entry.gScript && entry.gScript.infinitive || entry.g;
      if (!options.includeIncomplete && (!entry.p || !g || !/[\u0a00-\u0a7f]/.test(g) || !entry.e)) continue;
      const primary = bindings.find(({ binding }) => binding.id === entry.primaryId) || bindings[0];
      output.push({
        id: entry.primaryId, vocabularyId: id, roman: entry.p, gurmukhi: normalized(g), english: entry.e,
        category: primary.binding.gameCategory || CATEGORY_LABELS[primary.category] || primary.category,
        categories: entry.categories.slice(), roles: unique(bindings.map(b => b.category)),
        legacyIds: aliasesByEntry.get(id) || [],
        partOfSpeech: entry.partOfSpeech, gender: entry.gender, number: entry.number,
        semanticTags: entry.semanticTags.slice(), frequency: entry.frequency, difficulty: entry.difficulty,
        meanings: entry.meanings, source: entry.source
      });
    }
    return output;
  }
  function snapshot(state, options) {
    sync(state);
    if (options && options.compact) {
      const rt = runtime(state), linguistic = rt.linguistic;
      const persisted = Object.assign({}, state);
      const central = Object.assign({}, linguistic, { entries: dictionary(), bindings: dictionary(), aliases: dictionary(), categories: dictionary() });
      const required = new Set();
      for (const [category, bindings] of Object.entries(linguistic.bindings)) {
        central.bindings[category] = bindings.filter(binding => {
          const baseline = rt.importedBindings.get(category + ':' + binding.id);
          const changed = !baseline || JSON.stringify(binding) !== baseline;
          if (changed) required.add(binding.vocabularyId);
          return changed;
        });
      }
      for (const [id, entry] of Object.entries(linguistic.entries)) {
        const baseline = rt.importedBaselines.get(id);
        if (!baseline || required.has(id) || JSON.stringify(entry) !== baseline) central.entries[id] = entry;
      }
      for (const [id, vocabularyId] of Object.entries(linguistic.aliases)) {
        if (!rt.importedAliases.has(id)) central.aliases[id] = vocabularyId;
      }
      for (const [id, category] of Object.entries(linguistic.categories)) {
        central.categories[id] = Object.assign({}, category, { vocabularyIds: [] });
      }
      central.verbIds = linguistic.verbIds.filter(id => own(central.entries, id));
      central.bundledDataset = { id: BUNDLED_DATASET, schemaVersion: SCHEMA_VERSION };
      persisted.linguistic = central;
      return clone(persisted);
    }
    return clone(state);
  }
  return Object.freeze({ SCHEMA_VERSION, install, sync, get, resolveId, upsert, remove, vocabulary, snapshot, toJSON: snapshot });
});
