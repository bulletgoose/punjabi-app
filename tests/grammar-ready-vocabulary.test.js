'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {entries}=require('../data/vocabulary-expansion');
const reviews=require('../data/grammar-ready-vocabulary');
const lexical=require('../linguistic-system');

function reviewedEntries(){
  const byId=new Map(reviews.map(review=>[review.id,review]));
  return entries.map(entry=>byId.has(entry.id)?Object.assign({},entry,byId.get(entry.id)):entry);
}

test('construction reviews reference thirty existing single-sense nouns with source-backed gender',()=>{
  assert.equal(reviews.length,30);
  assert.equal(new Set(reviews.map(review=>review.id)).size,30);
  for(const review of reviews){
    const entry=entries.find(entry=>entry.id===review.id);
    assert(entry,'Review must reference an existing imported ID.');
    assert.equal(entry.partOfSpeech,'noun');
    assert.equal(entry.meanings.length,1);
    assert.equal(review.gender,entry.gender);
    assert(entry.meanings[0].tags.includes(review.gender==='m'?'masculine':'feminine'));
    assert.equal(review.number,'sg');
    assert.equal(review.grammarReview.nativeReviewed,false);
    assert.equal(review.grammarReview.status,'source-crosschecked;native-review-pending');
    assert.equal('p' in review,false);
    assert.equal('g' in review,false);
    assert.equal('e' in review,false);
    assert.equal('forms' in review,false);
    assert.equal('gScript' in review,false);
  }
});

test('only the reviewed subset joins WHAT while original source spelling, romanization and IDs stay intact',()=>{
  const expanded=reviewedEntries();
  const state=lexical.install({vocab:{WHAT:[]},verbs:[]},{expansion:expanded});
  assert.equal(state.vocab.WHAT.length,30);
  for(const review of reviews){
    const base=entries.find(entry=>entry.id===review.id);
    const live=lexical.get(state,review.id);
    assert.equal(live.p,base.p);
    assert.equal(live.g,base.g);
    assert.equal(live.e,base.e);
    assert.equal(live.primaryId,base.id);
    assert.deepEqual(live.source,base.source);
    assert.equal(live.verifiedGrammar,true);
    assert.equal(live.grammarReview.nativeReviewed,false);
    assert(state.vocab.WHAT.some(row=>row.vocabularyId===live.id));
    assert.equal(base.verifiedGrammar,false,'Imported source must remain unchanged.');
  }
  const tea=entries.find(entry=>entry.g==='ਚਾਹ'&&entry.partOfSpeech==='noun');
  assert(tea);
  assert.equal(tea.gender,null);
  assert.equal(state.vocab.WHAT.some(row=>row.vocabularyId===lexical.resolveId(state,tea.id)),false);
});
