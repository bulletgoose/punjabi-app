'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const semantics=require('../lexical-semantics');
const audit=require('../vocabulary-audit');
const dictionary=require('../data/vocabulary-expansion').entries;
const {applicationFixture}=require('../scripts/application-fixture');

test('adjective senses use the described noun, independently of dictionary order or binding',()=>{
  const source=dictionary.find(w=>w.g==='ਕੰਡਿਆਲ਼ਾ'&&w.partOfSpeech==='adjective');
  const before=JSON.stringify(source),entry=audit.enrich(source);
  const plant={semanticTags:['plant']},task={semanticTags:['abstract','task']};
  for(const senses of [entry.senses,entry.senses.slice().reverse()]){
    assert.equal(semantics.selectSense({...entry,senses},{role:'ADJECTIVE',described:plant}).contextualMeaning,'thorny');
    assert.equal(semantics.selectSense({...entry,senses},{role:'ADJECTIVE',described:task}).contextualMeaning,'difficult');
  }
  const difficult=entry.senses.find(s=>s.contextualGloss==='difficult');
  assert.equal(semantics.selectSense({...entry,selectedSenseId:difficult.id},{role:'ADJECTIVE',described:plant}).ok,false);
  assert.equal(JSON.stringify(source),before);
});

test('predicate selection checks actual arguments and keeps distribution and allocation distinct',()=>{
  const entry={id:'distribution',partOfSpeech:'verb',senses:[
    {id:'allocation',english:'to allocate, to allot',contextualGloss:'to allocate'},
    {id:'distribution',english:'to divide, give away, distribute',contextualGloss:'to distribute'}
  ]};
  const food={semanticTags:['edible','giveable']};
  const result=semantics.selectSense(entry,{role:'VERB',object:food});
  assert.equal(result.senseId,'distribution');assert.equal(result.contextualMeaning,'to share');
  assert.equal(semantics.selectSense(entry,{role:'VERB',object:food,senseId:'allocation'}).ok,false);
  assert.equal(semantics.selectSense(entry,{role:'VERB',object:{semanticTags:['economic']},senseId:'allocation'}).contextualMeaning,'to allocate');
  assert.equal(semantics.selectSense(entry,{role:'VERB'}).ok,false,'unresolved polysemy stays unavailable');
  const restricted={id:'custom',senses:[{id:'sense',english:'give',semanticRestrictions:{subjectTags:['human'],objectTags:['giveable'],recipientTags:['human']}}]};
  assert.equal(semantics.selectSense(restricted,{role:'VERB',subject:{semanticTags:['plant']},object:food}).ok,false);
  assert.equal(semantics.selectSense(restricted,{role:'VERB',subject:{semanticTags:['human']},object:food,recipient:{semanticTags:['plant']}}).ok,false);
});

test('sentence glosses remove corroborated dictionary labels and retain meaningful parentheses',()=>{
  for(const [e,tags,expected] of [
    ['ginger (plant)',['edible'],'ginger'],['orange (fruit)',['edible'],'orange'],
    ['pupil (of the eye)',['anatomical'],'pupil (of the eye)'],['ginger (plant)',[],'ginger (plant)'],
    ['the event (if needed)',['abstract'],'the event (if needed)']
  ]){
    const entry={id:'label',partOfSpeech:'noun',e,semanticTags:tags};
    assert.equal(semantics.contextualEntry(entry,{role:'WHAT'}).e,expected);assert.equal(entry.e,e);
  }
});

test('article hints distinguish identifiable, indefinite, generic, mass and plural nouns',()=>{
  const table={e:'table',englishCountability:'countable',number:'sg'};
  assert.equal(semantics.englishNounPhrase(table),'a table');
  assert.equal(semantics.englishNounPhrase(table,{definite:true}),'the table');
  assert.equal(semantics.englishNounPhrase({...table,englishArticle:'indefinite'},{article:'definite'}),'a table');
  assert.equal(semantics.englishNounPhrase({...table,e:'tables',englishNumber:'pl'}),'tables');
  assert.equal(semantics.englishNounPhrase({...table,e:'tables',englishNumber:'pl'},{article:'definite'}),'the tables');
  assert.equal(semantics.englishNounPhrase({e:'ginger',englishCountability:'uncountable'},{article:'indefinite'}),'ginger');
  assert.equal(semantics.englishNounPhrase({...table,e:'fruit',englishArticle:'generic'},{article:'definite'}),'fruit');
  assert.equal(semantics.englishNounPhrase({...table,e:'orange'}),'an orange');
});

test('real app generation covers the reported cases and representative existing patterns',async t=>{
  // One integrated setup, bounded examples, no corpus/permutation sweep.
  const f=applicationFixture({seed:42}),state=f.state;
  f.context.Math.random=()=>0;
  const find=(role,g,gloss)=>state.vocab[role].find(w=>w.g===g&&(!gloss||semantics.selectSense(w,{role}).contextualMeaning===gloss));
  const render=(pattern,roles,verbs)=>{
    const template=state.templates.find(t=>t.pattern===pattern);
    assert.ok(template,pattern);
    const result=f.context.assembleWithState(template,{vocab:{...state.vocab,...roles},verbs:verbs||state.verbs});
    assert.ok(result,pattern+' remains available');assert.ok(result.gurmukhi,pattern+' has both scripts');
    return result;
  };
  await t.test('contextual adjective',()=>{
  const plant=find('WHAT','ਪੌਦਾ'),adjectives=state.vocab.ADJECTIVE.filter(w=>w.g==='ਕੰਡਿਆਲ਼ਾ');
  assert.ok(plant);assert.equal(adjectives.length,2);
  const a=render('nominalDescription',{WHAT:[plant],ADJECTIVE:adjectives});
  assert.equal(a.gurmukhi,'ਪੌਦਾ ਕੰਡਿਆਲ਼ਾ ਹੈ।');assert.equal(a.english,'The plant is thorny.');
  assert.equal(a.sentenceBreakdown.find(p=>p.role==='description').lexicalSelections[0].contextualMeaning,'thorny');
  });

  await t.test('sharing preserves the dative advice subject',()=>{
  const stranger=find('WHO','ਬਿਗਾਨਾ'),orange=find('WHAT','ਸੰਤਰਾ');
  const distribution=state.verbs.filter(w=>w.g==='ਵੰਡਣਾ');
  assert.ok(stranger);assert.ok(orange);assert.equal(distribution.length,2);
  const source=JSON.stringify(f.lexical.get(state,distribution[0].vocabularyId));
  const b=render('shouldDo',{WHO:[stranger],WHAT:[orange]},distribution);
  assert.equal(b.gurmukhi,'ਬਿਗਾਨੇ ਨੂੰ ਸੰਤਰਾ ਵੰਡਣਾ ਚਾਹੀਦਾ ਹੈ।');
  assert.match(b.english,/^(?:A|The) stranger should share an orange\.$/);
  assert.doesNotMatch(b.english,/with a stranger|allocate/,'the dative advice subject is still the actor');
  assert.equal(b.sentenceBreakdown.find(p=>p.category==='VERB').lexicalSelections[0].contextualMeaning,'to share');
  assert.equal(JSON.stringify(f.lexical.get(state,distribution[0].vocabularyId)),source);
  });

  const you=state.vocab.WHO.find(w=>w.id==='who-tusi');
  await t.test('recipient questions and article context',()=>{
  const table=find('WHAT','ਮੇਜ਼');
  const c=render('question:whom',{WHO:[you],WHAT:[table]});
  assert.equal(c.gurmukhi,'ਤੁਸੀਂ ਕਿਸ ਨੂੰ ਮੇਜ਼ ਦਿੰਦੇ ਹੋ?');assert.equal(c.english,'Who do you give the table to?');
  const indefinite=render('question:whom',{WHO:[you],WHAT:[{...table,englishArticle:'indefinite'}]});
  assert.equal(indefinite.english,'Who do you give a table to?');
  });

  await t.test('dictionary label in a negative modal sentence',()=>{
  const girl=find('WHO','ਕੁੜੀ','girl'),gingerBase=state.vocab.WHAT.find(w=>/\bginger\b/.test(w.e));
  assert.ok(gingerBase);
  // Exercise a dictionary-annotation input using the existing ginger forms.
  const ginger={...gingerBase,e:'ginger (plant)',senses:[{id:gingerBase.selectedSenseId,english:'ginger (plant)',semanticTags:['edible'],englishCountability:'uncountable'}]};
  const chew=state.verbs.filter(w=>w.base==='chew'),want=state.verbs.find(w=>w.id==='v-chahuna');
  assert.ok(girl);assert.ok(ginger);assert.ok(chew.length);
  const d=render('wantNegative',{WHO:[girl],WHAT:[ginger]},chew.concat(want));
  assert.equal(d.english,'A girl does not want to chew ginger.');assert.equal(ginger.e,'ginger (plant)');
  });

  await t.test('existing aspect, possession and recipient patterns',()=>{
  const main=state.vocab.WHO.find(w=>w.id==='who-main'),book=state.vocab.WHAT.find(w=>w.id==='what-kitab');
  const read=state.verbs.find(w=>w.id==='v-parhna');
  for(const [pattern,english] of [['habitObject','I read a book.'],['habitNegative','I do not read a book.'],['habitQuestion','Do I read a book?'],['progressObject','I am reading a book.'],['hasObject','I have a book.']]){
    assert.equal(render(pattern,{WHO:[main],WHAT:[book]},[read]).english,english);
  }
  assert.equal(render('giveRecipient',{WHO:[main,you],WHAT:[book]},[state.verbs.find(w=>w.id==='v-dena')]).english,'I give a book to you.');
  });
});
