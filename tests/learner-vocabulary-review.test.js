'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {applicationFixture}=require('../scripts/application-fixture');
const audit=require('../scripts/audit-vocabulary-cleanup'),cleanup=require('../vocabulary-cleanup');
const review=require('../data/vocabulary-review-decisions'),baseline=audit.read('final.inventory.json.gz');
const removed=new Set(review.removedIds),expected=baseline.filter(e=>e.active&&!removed.has(e.id)).map(e=>e.id).sort();
const f=applicationFixture(),active=state=>Object.values(state.linguistic.entries).filter(e=>!e.deleted&&!e.cleanupArchived).map(e=>e.id).sort();
const plain=value=>JSON.parse(JSON.stringify(value));

test('the completed review removes exactly its 1421 marked records and retains all 1562 Keep records',()=>{
  assert.equal(new Set(review.removedIds).size,1421);assert.equal(review.reviewedCount,2983);assert.equal(review.keptCount,1562);
  assert.deepEqual(active(f.state),expected);assert.equal(f.state.vocab.WORD.length,1562);
  const learning=new Set(f.lexical.vocabulary(f.state).map(w=>w.vocabularyId));assert.deepEqual([...learning].sort(),expected);
  for(const id of removed){const original=f.lexical.get(f.state,id);assert.ok(original,id);assert.equal(original.cleanupArchived.status,'learner-review-removed',id);}
  for(const [category,rows]of Object.entries(f.state.linguistic.bindings))for(const row of rows)assert.equal(removed.has(row.vocabularyId),false,category+' '+row.id);
});

test('all 49 approved labels are clean while original dictionary meanings, forms and senses survive',()=>{
  assert.equal(Object.keys(review.labels).length,49);
  for(const [id,edit]of Object.entries(review.labels)){
    const entry=f.lexical.get(f.state,id),old=baseline.find(e=>e.id===id);
    assert.equal(entry.e,edit.from);assert.equal(old.english,edit.from);
    for(const category of ['WORD','LEXICON'])assert.equal(Array.from(f.state.vocab[category]).find(row=>row.vocabularyId===id).e,edit.to,category+' '+id);
    assert.deepEqual(plain(cleanup.morphology(entry)),old.morphology,id);
    for(const original of old.senses)assert.equal(audit.sha(entry.senses.find(s=>s.id===original.id)),original.metadataSha256,id+' '+original.id);
    for(const rows of Object.values(f.state.vocab))for(const row of rows)if(row.vocabularyId===id)for(const annotation of edit.annotations)assert.equal(row.e.includes(annotation),false,id+' '+row.id);
    for(const [role,rows]of Object.entries(f.state.vocab))for(const row of rows)if(row.vocabularyId===id&&row.selectedSenseId){
      const before=f.window.PunjabiLexicalSemantics.selectSense({...row,omittedDictionaryAnnotations:[]},{role});
      const after=f.window.PunjabiLexicalSemantics.selectSense(row,{role});
      assert.equal(after.ok,before.ok,id+' compatibility');assert.equal(after.senseId,before.senseId,id+' selection');
      if(after.ok)for(const annotation of edit.annotations)assert.equal(after.contextualMeaning.includes(annotation),false,id+' translation');
    }
    assert.equal(entry.userModifiedLexicalFields,undefined,id);
  }
});

test('approved cleanup handles nested and inline annotations without stripping unrelated content',()=>{
  const worry=f.lexical.get(f.state,'lex:wt-pa-e5851e2263a83c434295'),now=f.lexical.get(f.state,'lex:wt-pa-bf04b34bf1364860ee3a');
  assert.equal(cleanup.reviewedLabel(worry,worry.e),'worry, anxiety, concern, to worry');
  assert.equal(cleanup.reviewedLabel(now,now.e),'for the time being, now, currently');
  assert.equal(cleanup.reviewedLabel({id:'not-reviewed'},'an explanation (needed here)'),'an explanation (needed here)');
  const bank=f.lexical.get(f.state,'lex:wt-pa-0b530d4576318453d60e');
  assert.equal(cleanup.reviewedLabel(bank,'river bank (of a river)'),'river bank (of a river)');
  assert.equal(cleanup.reviewedLabel(bank,'about a bank (financial institution)'),'about a bank');
  assert.equal(cleanup.reviewedLabel({...bank,userModifiedLexicalFields:['e']},'bank (financial institution)'),'bank (financial institution)');
  const row=Array.from(f.state.vocab.WHAT).find(row=>row.vocabularyId===bank.id),semantics=f.window.PunjabiLexicalSemantics;
  assert.equal(semantics.selectSense(row,{role:'WHAT'}).contextualMeaning,'bank');
  const custom={...row,translationOverride:{source:'user',senseId:row.selectedSenseId,english:'bank (my own explanation)'}};
  assert.equal(semantics.selectSense(custom,{role:'WHAT'}).contextualMeaning,'bank (my own explanation)');
});

test('a PR10 browser snapshot upgrades without restoring removals or losing saved IDs and progress',()=>{
  const previous=applicationFixture({ref:review.sourceRevision,generation:false});
  const saved=previous.lexical.snapshot(previous.state,{compact:true});
  saved.saved=[{id:'saved-before-review',vocabularyIds:['lex:v-parhna'],english:'Saved original sentence'}];
  saved.savedWords=[{id:'game-fruits-10',english:'Saved original word'}];
  saved.linguistic.progression.vocabulary['lex:v-parhna']={mastery:4,exposures:7};
  let current=applicationFixture({generation:false,storage:[['punjabi-app-state-v1',JSON.stringify(saved)]]});
  for(let i=0;i<2;i++){
    assert.deepEqual(active(current.state),expected);assert.deepEqual(plain(current.state.saved),saved.saved);assert.deepEqual(plain(current.state.savedWords),saved.savedWords);
    assert.equal(current.state.linguistic.progression.vocabulary['lex:v-parhna'].mastery,4);assert.ok(current.lexical.get(current.state,'lex:v-parhna'));
    for(const [id,edit]of Object.entries(review.labels))assert.equal(Array.from(current.state.vocab.WORD).find(row=>row.vocabularyId===id).e,edit.to,id);
    if(i===0)current=applicationFixture({generation:false,storage:[['punjabi-app-state-v1',JSON.stringify(current.lexical.snapshot(current.state,{compact:true}))]]});
  }
});

test('template contracts resolve against the retained vocabulary and representative patterns still generate',()=>{
  const rows=Object.values(f.state.vocab).flatMap(v=>Array.from(v)).concat(Array.from(f.state.verbs));
  for(const template of f.state.templates)for(const id of [...(template.requiredVocabularyIds||[]),...f.grammar.dependenciesFor(template)])assert.ok(rows.some(row=>row.id===id),template.id+' '+id);
  for(const id of ['P01','P31','P53','P58','P60','P88','P90','P91','P96']){
    const template=f.state.templates.find(t=>t.id===id);let sentence;for(let n=0;n<12&&!sentence;n++)sentence=f.context.assemble(template);
    assert.ok(sentence?.gurmukhi&&sentence.english,id);assert.equal((sentence.vocabularyIds||[]).some(id=>removed.has(id)),false,id);
  }
});
