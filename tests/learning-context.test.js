'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const context=require('../learning-context');
const lexical=require('../linguistic-system');
const grammar=require('../grammar-engine');
test('grammar prerequisites and thematic parents reference existing independent objects',()=>{
  for(const category of Object.values(context.categories))if(category.parentId)assert.ok(context.categories[category.parentId]);
  function visit(id,trail=[]){assert.ok(context.grammarConcepts[id]);assert.ok(!trail.includes(id),'prerequisites must be acyclic');for(const prerequisite of context.grammarConcepts[id].prerequisites)visit(prerequisite,trail.concat(id));}
  for(const id of Object.keys(context.grammarConcepts))visit(id);
});
test('connecting learning metadata preserves disabled templates and edited probabilities',()=>{
  const template=Object.assign({},grammar.templates[0],{enabled:false,probability:0,name:'My future practice'});
  const state={vocab:{WHAT:[{id:'what-pani',p:'pāṇī',g:'ਪਾਣੀ',e:'water'}]},verbs:[],templates:[template]};
  lexical.install(state,{categories:context.categories});context.connect(state,grammar,lexical);
  assert.equal(template.enabled,false);assert.equal(template.probability,0);assert.equal(template.name,'My future practice');
  for(const id of template.grammarConceptIds)assert.ok(state.linguistic.grammarConcepts[id]);
  const restaurant=state.linguistic.scenarios.find(s=>s.id==='restaurant-order');
  assert.ok(restaurant.requiredVocabulary.includes(lexical.resolveId(state,'what-pani')));
  assert.ok(!restaurant.requiredGrammar.includes('food'));
});
test('review evidence is independent across vocabulary, grammar and communication',()=>{
  const progress=context.progress();
  context.record(progress,'vocabulary','lex:water',{correct:true,at:1});
  context.record(progress,'grammar','habitual-present',{correct:false,at:2});
  assert.equal(progress.vocabulary['lex:water'].correct,1);
  assert.equal(progress.grammar['habitual-present'].incorrect,1);
  assert.deepEqual(progress.communication,{});
  assert.equal(progress.vocabulary['lex:water'].mastery,'new');
});
test('consolidated words retain all alias answer history and the latest scheduler card',()=>{
  const records={one:{correct:3,wrong:1,lastSeen:1,fsrsCard:{last_review:1,reps:3}},two:{correct:8,wrong:2,lastSeen:2,fsrsCard:{last_review:2,reps:8}}};
  const before=JSON.stringify(records);
  const combined=context.wordProgress({id:'one',legacyIds:['one','two']},records);
  assert.equal(combined.correct,11);assert.equal(combined.wrong,3);assert.equal(combined.fsrsCard.reps,8);
  assert.equal(JSON.stringify(records),before);
});
test('future custom concepts, scenarios and template prerequisites survive reconnecting',()=>{
  const state={vocab:{},verbs:[],templates:[{id:'user-pattern',enabled:false,grammarConceptIds:['custom-grammar'],prerequisiteGrammarConceptIds:['custom-grammar']} ]};
  lexical.install(state);
  state.linguistic.grammarConcepts={'custom-grammar':{id:'custom-grammar',name:'Custom rule',relatedTemplates:[]}};
  state.linguistic.scenarios=[{id:'custom-scenario',objective:'My communication goal'}];
  context.connect(state,grammar,lexical);context.connect(state,grammar,lexical);
  assert.ok(state.linguistic.grammarConcepts['custom-grammar']);
  assert.deepEqual(state.templates[0].grammarConceptIds,['custom-grammar']);
  assert.ok(state.linguistic.scenarios.some(s=>s.id==='custom-scenario'));
});
