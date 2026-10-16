'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const semantics=require('../lexical-semantics'),audit=require('../vocabulary-audit');
const dictionary=require('../data/vocabulary-expansion').entries;
const noun=(head,tags=[])=>({id:head,e:head,partOfSpeech:'noun',semanticTags:tags,senses:[{id:head,english:head,contextualGloss:head,semanticTags:tags,classification:{head}}],selectedSenseId:head});
const verb=(base,extra={})=>({id:base,base,partOfSpeech:'verb',senses:[{id:base,english:'to '+base,contextualGloss:'to '+base,...extra}],selectedSenseId:base});
const human=noun('teacher',['human']);

test('unclassified senses cannot inherit human eligibility from another sense of a homograph',()=>{
  const entry={id:'homograph',partOfSpeech:'noun',semanticTags:['human'],senses:[{id:'person',english:'husband',classification:{head:'husband'},semanticTags:['human']},{id:'object',english:'sheath',contextualGloss:'sheath',classification:{head:null,status:'unresolved'},semanticTags:[],sentenceEligible:true}],selectedSenseId:'object'};
  assert.equal(semantics.propertiesOf(entry).human,false);
  assert.equal(semantics.semanticMetadata(entry.senses[1],entry).properties.human,false);
  assert.equal(semantics.propertiesOf({...entry,selectedSenseId:'person'}, {...entry.senses[0],semanticProperties:{human:true}}).human,true);
  assert.equal(semantics.propertiesOf(entry,{english:'people',contextualGloss:'people',classification:{head:null,status:'unresolved'},semanticTags:['human']}).human,false,'Unresolved imported tags cannot create new person bindings; audited definition evidence is required.');
  const sentence={sentenceBreakdown:[{category:'WHO',role:'subject',lexicalSelections:[{vocabularyId:entry.id,senseId:'object',contextualMeaning:'sheath'}]}]};
  assert.equal(semantics.validateGeneratedSentence(sentence,()=>entry,{}).rule,'human-role-evidence');
});

test('measurement/manipulation frames distinguish goods, fixed places, and digital content',()=>{
  const desert=noun('desert',['place','geographical','physical-object']),apple=noun('apple',['edible','concrete']),gold=noun('gold',['material']),email=noun('email',['readable','physical-object']);
  for(const object of [apple,gold,noun('water',['drinkable'])])assert.ok(semantics.predicateCompatibility(verb('weigh'),{subject:human,object}).ok);
  for(const base of ['weigh','lift','carry','pull','hold'])assert.equal(semantics.predicateCompatibility(verb(base),{subject:human,object:desert}).ok,false,base);
  assert.equal(semantics.predicateCompatibility(verb('hold'),{object:email}).ok,false);
  assert.equal(semantics.predicateCompatibility(verb('keep'),{object:email}).ok,true,'digital storage is distinct from holding paper');
  assert.equal(semantics.predicateCompatibility(verb('give'),{object:noun('help',['giveable'])}).ok,true,'authored light-verb expressions remain supported');
});

test('source qualifiers, natural-process agents, and complement requirements are enforced',()=>{
  const solar=verb('rise',{qualifiers:['for sun']});
  assert.equal(semantics.predicateCompatibility(solar,{subject:human}).ok,false);
  assert.equal(semantics.predicateCompatibility(solar,{subject:noun('sun',['natural'])}).ok,true);
  assert.equal(semantics.predicateCompatibility(verb('fall',{english:'to fall, flow'}),{subject:human}).ok,false);
  assert.equal(semantics.predicateCompatibility(verb('look',{english:'to appear; seem; look; be felt'}),{subject:human}).ok,false);
  assert.equal(semantics.predicateCompatibility(verb('consider'),{subject:human,complete:true}).ok,false);
});

test('adjective dimensions reject unsupported interpretations and retain valid ones',()=>{
  const source={id:'height',partOfSpeech:'adjective',senses:[{id:'height',english:'high; lofty',contextualGloss:'high',modifierTargets:['heightBearing']}]};
  assert.equal(semantics.selectSense(source,{role:'ADJECTIVE',described:human}).contextualMeaning,'tall');
  assert.equal(semantics.selectSense(source,{role:'ADJECTIVE',described:noun('cauliflower',['edible','concrete'])}).ok,false);
  assert.equal(semantics.modifierCompatibility({english:'deep',contextualGloss:'deep'},null,noun('river',['place','geographical'])) ,true);
  assert.equal(semantics.modifierCompatibility({english:'deep',contextualGloss:'deep'},null,noun('onion',['edible'])) ,false);
  assert.equal(semantics.modifierCompatibility({english:'golden',contextualGloss:'golden'},null,noun('email',['physical-object','readable'])) ,false);
  assert.equal(semantics.modifierCompatibility({english:'long',contextualGloss:'long'},null,noun('carrot',['edible'])) ,true);
  assert.equal(semantics.modifierCompatibility({english:'priceless',contextualGloss:'priceless'},null,human),true,'ordinary figurative value of a person is preserved');
});

test('aspect and number select source-supported predicate realizations',()=>{
  const distribution=verb('distribute',{english:'to divide, give away, distribute'});
  assert.equal(semantics.contextualEntry(distribution,{role:'VERB',object:{...noun('book',['readable','giveable']),number:'sg'}}).base,'give away');
  assert.equal(semantics.contextualEntry(distribution,{role:'VERB',object:{...noun('book',['readable','giveable']),number:'pl'}}).base,'distribute');
  const search=verb('find',{english:'to find, search, seek'});
  assert.equal(semantics.contextualEntry(search,{role:'VERB',object:noun('key',['findable']),aspect:'progressive'}).base,'search for');
  assert.equal(semantics.contextualEntry(verb('understand'),{role:'VERB',object:noun('question',['understandable']),aspect:'progressive'}),null);
  assert.ok(semantics.contextualEntry(verb('understand'),{role:'VERB',object:noun('question',['understandable']),aspect:'habitual'}));
});

test('English mass/number hints are independent of Punjabi number and preserve dictionary text',()=>{
  const entry=dictionary.find(w=>w.g==='ਮੁੰਗਫਲੀ'),before=JSON.stringify(entry),enriched=audit.enrich(entry);
  const projected=semantics.contextualEntry(enriched,{role:'WHAT',senseId:enriched.senses[0].id});
  assert.equal(semantics.englishNounPhrase(projected),'a peanut');assert.equal(JSON.stringify(entry),before);
  assert.equal(semantics.semanticMetadata({english:'money',semanticTags:['economic'],classification:{head:'money'}},{partOfSpeech:'noun'}).englishNumber,'sg');
  assert.equal(semantics.semanticMetadata({english:'trousers',semanticTags:['wearable'],classification:{head:'trousers'}},{partOfSpeech:'noun'}).englishNumber,'pl');
});

test('writing instruments cannot be paired with digital email; unknown morphology remains conservative',()=>{
  assert.equal(semantics.predicateCompatibility(verb('write'),{object:noun('email',['writable']),instrument:noun('pen',['tool'])}).ok,false);
  assert.equal(semantics.predicateCompatibility(verb('write'),{object:noun('letter',['writable','readable']),instrument:noun('pen',['tool'])}).ok,true);
});

test('dictionary homographs and reviewed source corrections do not change original definitions',()=>{
  const drill={id:'drill',e:'drill, parade',partOfSpeech:'noun',senses:[{id:'drill',english:'drill, parade',contextualGloss:'drill',semanticTags:['tool','concrete'],classification:{head:'drill'}}],selectedSenseId:'drill'};
  assert.equal(semantics.predicateCompatibility(verb('weigh'),{object:drill}).ok,false);
  const original=dictionary.find(w=>w.g==='ਦੇਵਰ'),before=JSON.stringify(original),entry=audit.enrich(original);
  assert.equal(entry.senses[0].gender,'m');assert.ok(entry.senses[0].tags.includes('feminine'),'source label is retained');assert.equal(entry.senses[0].verification.nativeReviewed,false);assert.equal(JSON.stringify(original),before);
});

test('authored function-word constructions retain their validated meanings when a dictionary gloss needs display review',()=>{
  const entry={id:'lex:or',partOfSpeech:'conjunction',senses:[{id:'or',english:'or',sentenceEligible:false}]};
  const sentence={sentenceBreakdown:[{category:'CONNECTOR',role:'connector',lexicalSelections:[{vocabularyId:entry.id,senseId:'or',contextualMeaning:'or',evidence:['authored-construction-context']}]}]};
  assert.equal(semantics.validateGeneratedSentence(sentence,()=>entry,{pattern:'connector:or'}).ok,true);
  const content={id:'lex:bad-adjective',partOfSpeech:'adjective',senses:[{id:'bad',english:'renown',sentenceEligible:false}]};
  const invalid={sentenceBreakdown:[{category:'DESCRIPTION',lexicalSelections:[{vocabularyId:content.id,senseId:'bad',contextualMeaning:'renown',evidence:['authored-construction-context']}]}]};
  assert.equal(semantics.validateGeneratedSentence(invalid,()=>content,{pattern:'nominalDescription'}).ok,false);
});
