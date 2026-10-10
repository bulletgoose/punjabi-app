'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {applicationFixture}=require('../scripts/application-fixture');

const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const fixture=applicationFixture({generation:false});
function range(start,end){const from=html.indexOf(start),to=html.indexOf(end,from);assert.ok(from>=0&&to>from);return html.slice(from,to);}
function viewHelpers(){
  const queries=[],controls={flashContent:{value:'words'},flashCategory:{value:'body'},flashCount:{value:'1'},flashDirection:{value:'en-pa'},flashMode:{value:'specific'},flashRoman:{checked:true},flashGurmukhi:{checked:true},flashAudio:{checked:false},flashError:{textContent:''}};
  const context=vm.createContext({state:fixture.state,window:{PunjabiLinguisticSystem:{vocabulary(state,options){queries.push(options);return fixture.lexical.vocabulary(state,options);}}},
    document:{getElementById:id=>controls[id],querySelectorAll:()=>[]},flashPrefs:{content:'sentences',category:'materials',count:5,templates:[],futurePreference:'preserved'},flashSession:{phase:'setup'},
    gamePrefs:{categories:[fixture.state.linguistic.categories.body.label],script:'gurmukhi',promptScript:'roman',challenge:'text'},
    Math:Object.create(Math),stopSpeech(){},persistLearning(){},renderFlashCard(){},focusFlashContent(){},uid:prefix=>prefix+'-test',
    enabledOf:rows=>rows.filter(row=>row.enabled!==false),assembleFromTemplate(){throw Error('Word practice must not generate sentence templates.');},showFlashcardSetup(){throw Error('The selected dictionary deck should be available.');}});
  vm.runInContext(range('  function startFlashFromSetup(){','  function punjabiSide(')+range('  function gameVocabulary(','  function recordWordResult(')+range('  function thematicLabels(','  function filterVocabulary(')+range('  function gamePool(){','  function gameTileCount('),context);
  return {context,queries,controls};
}

test('word flash setup preserves mode, topic and other preferences and builds the requested dictionary sense',()=>{
  const {context,queries}=viewHelpers();
  const words=fixture.lexical.vocabulary(fixture.state,{senseCategoryIds:['body']}).filter(word=>word.categories.includes('body'));
  const index=words.findIndex(word=>word.gurmukhi==='ਕਾਠ');assert.ok(index>=0);
  const original=fixture.lexical.get(fixture.state,words[index].vocabularyId).e;
  context.Math.random=()=>((index+0.01)/words.length);
  context.startFlashFromSetup();
  assert.equal(context.flashPrefs.content,'words');assert.equal(context.flashPrefs.category,'body');assert.equal(context.flashPrefs.futurePreference,'preserved');
  assert.equal(context.flashSession.options.content,'words');assert.equal(context.flashSession.options.category,'body');
  assert.equal(context.flashSession.deck.length,1);
  const sentence=context.flashSession.deck[0].sentence;
  assert.equal(sentence.templateId,'vocabulary');assert.equal(sentence.vocabularyId,words[index].vocabularyId);
  assert.equal(sentence.english,'physique');assert.equal(sentence.selectedSenseId,words[index].displaySenseId);
  assert.equal(sentence.sentenceBreakdown[0].english,sentence.english);assert.equal(sentence.sentenceBreakdown[0].selectedSenseId,sentence.selectedSenseId);
  assert.ok(queries.some(options=>options&&options.senseCategoryIds.includes('body')));
  assert.equal(fixture.lexical.get(fixture.state,sentence.vocabularyId).e,original);
});

test('Word Game thematic labels request the matching sense while keeping canonical learning IDs',()=>{
  const {context,queries}=viewHelpers();
  const pool=context.gamePool(),word=pool.find(item=>item.gurmukhi==='ਕਾਠ');
  assert.ok(word);assert.equal(word.english,'physique');assert.ok(word.categories.includes('body'));assert.ok(!word.categories.includes('materials'));
  const base=fixture.lexical.vocabulary(fixture.state).find(item=>item.gurmukhi==='ਕਾਠ');
  assert.equal(word.id,base.id);assert.equal(word.vocabularyId,base.vocabularyId);assert.equal(word.gurmukhi,base.gurmukhi);
  assert.ok(queries.some(options=>options&&options.senseCategoryIds.includes('body')));
});

test('legacy Word Game category labels remain selectable without remapping saved preferences',()=>{
  const {context,queries}=viewHelpers();
  context.gamePrefs.categories=['Parts of the body'];
  const pool=context.gamePool();
  assert.ok(pool.length>0);assert.ok(pool.every(item=>item.category==='Parts of the body'));
  assert.equal(queries[0],undefined);assert.deepEqual(context.gamePrefs.categories,['Parts of the body']);
});
