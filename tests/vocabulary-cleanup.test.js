'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {applicationFixture}=require('../scripts/application-fixture');
const audit=require('../scripts/audit-vocabulary-cleanup'),cleanup=require('../vocabulary-cleanup'),lexical=require('../linguistic-system');
const baseline=audit.read('baseline.inventory.json.gz'),f=applicationFixture(),{state}=f;
const active=()=>Object.values(state.linguistic.entries).filter(e=>!e.deleted&&!e.cleanupArchived);
const stored=()=>JSON.parse(JSON.stringify(f.lexical.snapshot(state,{compact:true})));
const reload=s=>applicationFixture({generation:false,storage:[['punjabi-app-state-v1',JSON.stringify(s)]]});

test('every original lexical record, dictionary sense, semantic parameter and grammatical form remains addressable',()=>{
  for(const old of baseline){
    const e=f.lexical.get(state,old.id);assert.ok(e,old.id);assert.equal(e.g,old.gurmukhi);assert.equal(e.p,old.roman);assert.equal(e.e,old.english);
    for(const [k,v]of Object.entries(old.morphology))if(v!=null)assert.deepEqual(JSON.parse(JSON.stringify(cleanup.morphology(e)[k])),v,old.id+' '+k);
    for(const sense of old.senses){const next=e.senses.find(s=>s.id===sense.id);assert.ok(next,old.id+' '+sense.id);assert.equal(audit.sha(next),sense.metadataSha256,old.id+' '+sense.id);}
    for(const id of old.aliases)assert.ok(f.lexical.resolveId(state,id),id);
  }
  assert.equal(audit.exactGroups(active()).length,0);
  assert.equal(new Set(active().map(e=>e.id)).size,active().length);
});

test('redundant sense bindings consolidate while distinct meanings and functional metadata survive',()=>{
  const entry=active().find(e=>e.g==='ਅਦਬ'),rows=Array.from(state.vocab.WHAT).filter(b=>b.vocabularyId===entry.id);
  assert.equal(entry.senses.length,8);assert.equal(rows.filter(b=>cleanup.concept(entry.senses.find(s=>s.id===b.selectedSenseId).contextualGloss)==='politeness').length,1);
  for(const meaning of ['discipline','literature','respect','reverence'])assert.ok(rows.some(b=>b.e===meaning),meaning);
  for(const [category,bindings]of Object.entries(state.linguistic.bindings))for(const b of bindings){
    const e=state.linguistic.entries[b.vocabularyId];assert.ok(e&&!e.cleanupArchived&&!e.deleted,category+' '+b.id);
    if(b.selectedSenseId)assert.ok(e.senses.some(s=>s.id===b.selectedSenseId),b.id);
  }
});

test('gender/number forms, polysemy, useful cultural distinctions and all game reference rows are retained',()=>{
  for(const g of ['ਵਿਦਿਆਰਥਣ','ਪੈਸਾ','ਪੈਸੇ','ਨਿਹਾਰੀ','ਦਸਤਾਰ','ਭਾਈ','ਕਾਫ਼ੀ','ਖ਼ੁਰਾਕ','ਗੱਭਰੂ','ਨਾਮ'])assert.ok(active().some(e=>e.g===g),g);
  for(const [category,rows]of Object.entries(state.linguistic.bindings).filter(([c])=>c.startsWith('GAME_'))){assert.equal(rows.length,30,category);for(const b of rows)assert.ok(f.lexical.get(state,b.id));}
  const tree=active().find(e=>e.g==='ਰੁੱਖ');assert.ok(tree.vocabularyAlternatives?.length||tree.senses.length);
  for(const id of Object.keys(state.linguistic.vocabularyCleanup.fringe))assert.equal(f.lexical.get(state,id).cleanupArchived.status,'fringe-reference');
});

test('compact deployment hydration is idempotent and does not recreate hidden imports',()=>{
  const snap=stored(),ids=active().map(e=>e.id).sort(),counts=Object.fromEntries(Object.entries(state.linguistic.bindings).map(([c,v])=>[c,v.length]));
  snap.saved=[{id:'keep-sentence',roman:'merī kitāb',english:'my book'}];snap.savedWords=[{id:'keep-word',roman:'purāṇā',english:'old'}];
  snap.linguistic.progression.vocabulary['keep-progress']={mastery:5,exposures:9};
  let next=reload(snap);
  for(let i=0;i<2;i++){
    assert.deepEqual(Object.values(next.state.linguistic.entries).filter(e=>!e.deleted&&!e.cleanupArchived).map(e=>e.id).sort(),ids);
    for(const old of baseline){const e=next.lexical.get(next.state,old.id);assert.ok(e,old.id);for(const s of old.senses)assert.ok(e.senses.some(v=>v.id===s.id),old.id+' '+s.id);}
    assert.deepEqual(Object.fromEntries(Object.entries(next.state.linguistic.bindings).map(([c,v])=>[c,v.length])),counts);
    assert.deepEqual(JSON.parse(JSON.stringify(next.state.saved)),snap.saved);assert.deepEqual(JSON.parse(JSON.stringify(next.state.savedWords)),snap.savedWords);assert.equal(next.state.linguistic.progression.vocabulary['keep-progress'].mastery,5);
    assert.ok(JSON.stringify(next.lexical.snapshot(next.state,{compact:true})).length<4*1024*1024,'Compact storage should not persist a second expanded dictionary.');
    if(i===0)next=reload(next.lexical.snapshot(next.state,{compact:true}));
  }
});

test('PR9-style binding deletion migrates to a stable meaning exclusion without deleting other senses',()=>{
  const snap=stored(),word=baseline.find(e=>e.gurmukhi==='ਅਦਬ'),old=word.bindings.find(b=>b.category==='WHAT'&&word.senses.find(s=>s.id===b.selectedSenseId)?.english==='courtesy');
  snap.linguistic.tombstones['WHAT:'+old.id]={id:old.id,vocabularyId:word.id,category:'WHAT',reason:'removed-binding'};
  const next=reload(snap),entry=next.lexical.get(next.state,word.id),rows=Array.from(next.state.vocab.WHAT).filter(b=>b.vocabularyId===word.id);
  assert.equal(rows.some(b=>cleanup.concept(entry.senses.find(s=>s.id===b.selectedSenseId).contextualGloss)==='politeness'),false);
  assert.ok(rows.some(b=>b.e==='literature'));assert.ok(next.state.linguistic.tombstones['WHAT:'+old.id].lexicalKeys.length);
  const again=reload(next.lexical.snapshot(next.state,{compact:true}));assert.equal(Array.from(again.state.vocab.WHAT).some(b=>b.vocabularyId===word.id&&cleanup.concept(b.e)==='politeness'),false);
});

test('whole-word deletion survives a later import with a new ID for the same lexical meaning',()=>{
  const policy={version:1,signatures:{},excluded:[],merges:{},labels:{}},source={id:'original-source',p:'parakh',g:'ਪਰਖ',e:'test',partOfSpeech:'noun',gender:'f',number:'sg',semanticTags:['abstract'],verifiedGrammar:true};
  const options={expansion:[source],catalogPolicy:policy};
  const s=lexical.install({vocab:{WHAT:[]},verbs:[],templates:[]},options);lexical.remove(s,source.id);
  const next=lexical.install(JSON.parse(JSON.stringify(lexical.snapshot(s,{compact:true}))),{...options,expansion:[{...source,id:'new-source-id'}]});
  assert.equal(lexical.vocabulary(next).length,0);assert.equal(next.vocab.WHAT.length,0);
});

test('learner edits override curation and are never replaced by a synonym or source refresh',()=>{
  const snap=stored(),row=baseline.find(r=>r.gurmukhi==='ਆਕਾਸ਼'),original=state.linguistic.entries[row.id];
  snap.linguistic.entries[row.id]={...JSON.parse(JSON.stringify(original)),e:'my edited sky meaning',userModifiedLexicalFields:['e']};
  const next=reload(snap),entry=next.lexical.get(next.state,row.id);
  assert.equal(entry.e,'my edited sky meaning');assert.equal(entry.cleanupArchived,undefined);assert.ok(next.lexical.vocabulary(next.state).some(w=>w.vocabularyId===row.id));
});

test('template contracts resolve and representative existing sentence patterns still work',()=>{
  const rows=Object.values(state.vocab).flatMap(v=>Array.from(v)).concat(Array.from(state.verbs));
  for(const t of state.templates)for(const id of [...(t.requiredVocabularyIds||[]),...f.grammar.dependenciesFor(t)])assert.ok(rows.some(b=>b.id===id),t.id+' '+id);
  for(const id of ['P01','P31','P53','P58','P60','P88','P90','P91','P96']){
    const t=state.templates.find(t=>t.id===id);let s;for(let n=0;n<8&&!s;n++)s=f.context.assemble(t);assert.ok(s&&s.gurmukhi&&s.english,id);assert.doesNotMatch(s.english,/undefined|NaN/);
  }
});

test('sense labels preserve the existing unqualified water/extract translation guard',()=>{
  const rows=Array.from(state.vocab.WHAT).filter(b=>f.lexical.get(state,b.vocabularyId).e==='water'&&b.senses.find(s=>s.id===b.selectedSenseId)?.classification?.head==='juice');
  assert.ok(rows.length);
  for(const row of rows)assert.equal(f.window.PunjabiLexicalSemantics.selectSense(row,{role:'WHAT'}).ok,false);
});
