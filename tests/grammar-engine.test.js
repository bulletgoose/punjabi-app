'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {applicationFixture}=require('../scripts/application-fixture');
const f=applicationFixture(),engine=f.grammar;
const subject=(id,extra={})=>({...f.state.vocab.WHO.find(w=>w.id===id),...extra});
const verb=id=>f.state.verbs.find(v=>v.id===id);
test('retained verbs preserve singular feminine and plural agreement',()=>{
 for(const [id,extra,expected]of [['who-main',{},'ਖਾਂਦਾ ਹਾਂ'],['who-oh',{gender:'f'},'ਖਾਂਦੀ ਹੈ'],['who-asi',{},'ਖਾਂਦੇ ਹਾਂ']]){
  const result=engine.conjugate({verb:verb('v-khana'),subject:subject(id,extra),aspect:'habitual',script:'gurmukhi'});assert.equal(result.text,expected);
 }
});
test('retained irregular perfective and future forms remain available',()=>{
 for(const id of ['v-khana','v-jana','v-dena','v-likhna']){
  const v=verb(id);assert.ok(v,id);assert.ok(v.root&&v.gScript,id);
  for(const aspect of (id==='v-dena'?['perfective']:['perfective','future'])){const result=engine.conjugate({verb:v,subject:subject('who-main'),aspect,script:'gurmukhi'});assert.ok(result.text&&/[\u0a00-\u0a7f]/.test(result.text),id+' '+aspect);}
 }
});
test('all current template contracts refer to the shipped vocabulary',()=>{
 const rows=Object.values(f.state.vocab).flatMap(v=>Array.from(v)).concat(Array.from(f.state.verbs));
 for(const t of f.state.templates)for(const id of [...engine.dependenciesFor(t),...(t.requiredVocabularyIds||[])])assert.ok(rows.some(row=>row.id===id),t.id+' '+id);
});
test('existing action, recipient, question and possession patterns stay bilingual',()=>{
 for(const id of ['P01','P31','P53','P58','P60','P88','P90','P91','P96']){
  let sentence;for(let i=0;i<12&&!sentence;i++)sentence=f.context.assemble(f.state.templates.find(t=>t.id===id));
  assert.ok(sentence?.gurmukhi&&sentence.english,id);assert.doesNotMatch(sentence.english,/undefined|NaN/);
 }
});
