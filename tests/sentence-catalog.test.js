'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {applicationFixture}=require('../scripts/application-fixture');
const f=applicationFixture(),{state,lexical,context,window}=f;
const policy=window.PUNJABI_SENTENCE_CATALOG_POLICY;
test('authorized catalog removes precisely the old No entries and consolidates breakfast without deleting nihari',()=>{
 assert.equal(state.linguistic.catalogMigration.removed,2469);assert.equal(state.linguistic.catalogMigration.merged,79);
 for(const id of policy.excluded)assert.equal(lexical.get(state,id),null);
 const breakfast=lexical.vocabulary(state).filter(w=>w.gurmukhi==='ਨਾਸ਼ਤਾ');assert.equal(breakfast.length,1);
 assert.equal(lexical.resolveId(state,'lex:wt-pa-af615c59cb56381cbd36'),'lex:what-nashta');
 assert.ok(lexical.vocabulary(state).some(w=>w.gurmukhi==='ਨਿਹਾਰੀ'));
 assert.equal(lexical.vocabulary(state).length,3111);
});
test('every retained entry has a valid explicit word-practice sentence without guessed morphology',()=>{
 const api=window.PunjabiSentenceLearning,t=api.templates.find(t=>t.id==='P88');
 let count=0;for(const word of state.vocab.WORD){
  const projected={vocab:{WORD:[word]},verbs:[]},sentence=api.generate(t,projected,rows=>rows[0],{lexical,grammar:f.grammar,semantics:window.PunjabiLexicalSemantics});
  assert.ok(sentence&&sentence.gurmukhi);assert.equal(sentence.sentenceBreakdown[0].vocabularyId,word.vocabularyId);assert.match(sentence.sentenceBreakdown[0].grammarNote,/no inflection/);count++;
 }assert.equal(count,3111);
});
test('all fifteen connectors occur as lexical parts in their actual generated constructions',()=>{
 for(const t of window.PunjabiSentenceLearning.templates.filter(t=>t.connectorId)){
  const s=context.assemble(t);assert.ok(s&&s.gurmukhi,t.id);assert.ok(s.sentenceBreakdown.some(p=>p.category==='CONNECTOR'&&p.vocabularyId===lexical.resolveId(state,t.connectorId)),t.id);
  assert.doesNotMatch(s.english,/undefined|NaN/);
  const connector=state.vocab.CONNECTOR.find(c=>c.id===t.connectorId);connector.enabled=false;assert.equal(context.assemble(t),null);connector.enabled=true;
 }
});
test('additional questions and numbers generate usable bilingual structures',()=>{
 for(const t of window.PunjabiSentenceLearning.templates.filter(t=>t.questionId||t.id==='P87')){
  let s;for(let attempt=0;attempt<12&&!s;attempt++)s=context.assemble(t);assert.ok(s&&s.gurmukhi,t.id);
  if(t.questionId)assert.ok(s.sentenceBreakdown.some(p=>p.vocabularyId===lexical.resolveId(state,t.questionId)),t.id);
 }
});
test('short labels never overwrite full definitions or verified review provenance',()=>{
 const entry=lexical.get(state,'lex:wt-pa-7d1acf8006463976c172');const before=JSON.stringify(entry);
 for(const w of lexical.vocabulary(state))assert.equal(w.english.trim().split(/\s+/).length,1,w.vocabularyId);
 assert.equal(JSON.stringify(entry),before);assert.equal(entry.assessment.fluentSpeakerReview.status,'pending');assert.equal(entry.senses.length,2);
});
test('cleanup hydration preserves saved data and stable compact IDs without recreating removed vocabulary',()=>{
 const snapshot=lexical.snapshot(state,{compact:true});snapshot.saved=[{id:'keep-sentence',roman:'meri kitāb',english:'my book'}];snapshot.savedWords=[{id:'keep-word',english:'my edited word',roman:'merā'}];
 snapshot.linguistic.bindings.WHY.find(b=>b.id==='why-islai').enabled=false;
 const next=applicationFixture({generation:false,storage:[['punjabi-app-state-v1',JSON.stringify(snapshot)]]});
 assert.equal(next.state.saved[0].id,'keep-sentence');assert.equal(next.state.savedWords[0].id,'keep-word');assert.equal(next.lexical.vocabulary(next.state).length,3111);
 assert.equal(next.state.vocab.WHY.find(b=>b.id==='why-islai').enabled,false);
 const again=next.lexical.snapshot(next.state,{compact:true});for(const [id,old] of Object.entries(snapshot.linguistic.entries)){const current=again.linguistic.entries[id];assert.ok(current,id);assert.equal(current.p,old.p,id);assert.equal(current.g,old.g,id);assert.equal(current.e,old.e,id);}
 for(const id of policy.excluded)assert.equal(next.lexical.get(next.state,id),null);
 assert.equal(next.lexical.resolveId(next.state,'lex:wt-pa-af615c59cb56381cbd36'),'lex:what-nashta');
});
test('connector clauses preserve feminine plural and respectful English agreement',()=>{
 const api=window.PunjabiSentenceLearning,tools={lexical,grammar:f.grammar,semantics:window.PunjabiLexicalSemantics};
 const female=Object.assign({},state.vocab.WHO.find(w=>w.id==='who-asi'),{gender:'f'}),vocab=Object.assign({},state.vocab,{WHO:[female]});
 const s=api.generate(api.templates.find(t=>t.id==='P73'),{vocab,verbs:state.verbs},rows=>rows[0],tools);assert.ok(s);assert.match(s.gurmukhi,/ਥੱਕੀਆਂ/);assert.match(s.english,/We are tired/);
 const purpose=api.generate(api.templates.find(t=>t.id==='P74'),{vocab,verbs:state.verbs},rows=>rows[0],tools);assert.match(purpose.gurmukhi,/ਸਕੀਏ/);assert.doesNotMatch(purpose.gurmukhi,/ਸਕਦੇ ਹਾਂ|ਸਕਦੀਆਂ ਹਾਂ/);
});
test('edited excluded imports survive cleanup with their saved translations and custom data',()=>{
 const before=applicationFixture({ref:'499e191',generation:false}),id=policy.excluded[0];
 before.lexical.upsert(before.state,{id,e:'my preserved translation'});before.state.customSettings={keep:'personal preference'};before.state.saved=[{id:'personal-sentence',roman:'mera',english:'mine'}];
 const stored=before.lexical.snapshot(before.state,{compact:true});const next=applicationFixture({generation:false,storage:[['punjabi-app-state-v1',JSON.stringify(stored)]]});
 assert.equal(next.lexical.get(next.state,id).e,'my preserved translation');assert.equal(next.state.customSettings.keep,'personal preference');assert.equal(next.state.saved[0].id,'personal-sentence');
 assert.ok(next.state.linguistic.catalogMigration.protected>0);
});
test('consolidated duplicate word histories retain both answer totals and the latest memory card',()=>{
 const word=lexical.vocabulary(state).find(w=>w.gurmukhi==='ਨਾਸ਼ਤਾ'),one={last_review:1},two={last_review:2};
 const progress=f.learning.wordProgress(word,{'what-nashta':{correct:4,wrong:1,fsrsCard:one},'wt-pa-af615c59cb56381cbd36':{correct:6,wrong:2,fsrsCard:two}});
 assert.equal(progress.correct,10);assert.equal(progress.wrong,3);assert.equal(progress.fsrsCard,two);
});
test('cardinal possession uses explicit singular/plural book forms and number agreement',()=>{
 const api=window.PunjabiSentenceLearning,t=api.templates.find(t=>t.id==='P96'),tools={lexical,grammar:f.grammar,semantics:window.PunjabiLexicalSemantics};
 assert.ok(t.requiredVocabularyIds.includes('what-kitab'));
 for(const n of state.vocab.NUMBER){const e=n.e,vocab=Object.assign({},state.vocab,{NUMBER:[n]});const identity=api.generate(api.templates.find(t=>t.id==='P87'),{vocab,verbs:state.verbs},rows=>rows[0],tools);assert.ok(identity);assert.equal(identity.english,'This is '+e+'.');assert.ok(identity.gurmukhi.includes(n.g));if(e==='zero')continue;const s=api.generate(t,{vocab,verbs:state.verbs},rows=>rows[0],tools);assert.ok(s);assert.match(s.english,new RegExp('I have '+e+' '+(e==='one'?'book':'books')));assert.match(s.gurmukhi,e==='one'?/ਕਿਤਾਬ ਹੈ/:/ਕਿਤਾਬਾਂ ਹਨ/);}
 const book=state.vocab.WHAT.find(row=>row.id==='what-kitab');book.enabled=false;
 assert.equal(api.generate(t,state,rows=>rows[0],tools),null);book.enabled=true;
});
test('eye pupil is anatomical and cannot act as the person in a connector clause',()=>{
 const entry=lexical.get(state,'lex:game-nature-3'),eye=entry.senses.find(s=>s.english==='pupil (of the eye)');
 assert.ok(eye);assert.ok(eye.semanticTags.includes('anatomical'));assert.equal(eye.semanticProperties.human,false);
 assert.ok(!state.vocab.WHO.some(row=>row.vocabularyId===entry.id&&row.selectedSenseId===eye.id));
 const fake=Object.assign({},state.vocab.WHO.find(row=>row.id==='who-oh'),{vocabularyId:entry.id,partOfSpeech:'noun',senses:entry.senses,selectedSenseId:eye.id});
 const api=window.PunjabiSentenceLearning,vocab=Object.assign({},state.vocab,{WHO:[fake]});
 assert.equal(api.generate(api.templates.find(t=>t.id==='P74'),{vocab,verbs:state.verbs},rows=>rows[0],{lexical,grammar:f.grammar,semantics:window.PunjabiLexicalSemantics}),null);
});
test('new vocabulary becomes usable in word practice immediately without a reload or copied dataset',()=>{
 const added=lexical.upsert(state,{id:'user-word-live-integration',p:'navā̃ śabad',g:'ਨਵਾਂ ਸ਼ਬਦ',e:'new learning word',partOfSpeech:'expression',source:{verification:'user-authored'}});
 const word=state.vocab.WORD.find(row=>row.vocabularyId===added.id);assert.ok(word);
 assert.ok(lexical.vocabulary(state).some(row=>row.vocabularyId===added.id));
 const api=window.PunjabiSentenceLearning,s=api.generate(api.templates.find(t=>t.id==='P88'),{vocab:{WORD:[word]},verbs:[]},rows=>rows[0],{lexical,grammar:f.grammar,semantics:window.PunjabiLexicalSemantics});
 assert.ok(s);assert.equal(s.vocabularyIds[0],added.id);assert.match(s.gurmukhi,/ਨਵਾਂ ਸ਼ਬਦ/);lexical.remove(state,added.id);
});
test('a disabled imported word-practice binding stays disabled across successive compact reloads',()=>{
 const word=state.vocab.WORD.find(row=>lexical.get(state,row.vocabularyId).importedDataset);word.enabled=false;
 let current=f;
 for(let i=0;i<2;i++){
  const stored=current.lexical.snapshot(current.state,{compact:true});
  current=applicationFixture({generation:false,storage:[['punjabi-app-state-v1',JSON.stringify(stored)]]});
  assert.equal(current.state.vocab.WORD.find(row=>row.id===word.id).enabled,false);
  assert.equal(current.lexical.resolveId(current.state,word.id),word.vocabularyId);
  assert.equal(current.lexical.vocabulary(current.state).length,3111);
 }
 word.enabled=true;
});

test('all three previously disabled reason entries have ordinary sentence constructions',()=>{
 for(const id of ['why-kiuki','why-iskarke','why-islai']){
  const canonical=lexical.resolveId(state,id),t=window.PunjabiSentenceLearning.templates.find(t=>[t.connectorId,t.reasonId].some(value=>value&&lexical.resolveId(state,value)===canonical));
  assert.ok(t,id);const s=context.assemble(t);assert.ok(s&&s.gurmukhi,id);assert.ok(s.vocabularyIds.includes(canonical),id);
 }
});
