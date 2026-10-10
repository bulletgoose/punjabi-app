'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const semantics=require('../lexical-semantics');
const grammar=require('../grammar-engine');

function helpers(){
  const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
  const from=html.indexOf('  function scriptProjection('),to=html.indexOf('  // Only the first pass chooses words.',from);
  assert.ok(from>=0&&to>from);
  const context=vm.createContext({window:{PunjabiLexicalSemantics:semantics,PunjabiGrammarEngine:grammar}});
  vm.runInContext(html.slice(from,to),context);
  return context;
}
function row(id,p,g,e,role,extra={}){
  return {id,p,g,e,enabled:true,partOfSpeech:'noun',gender:'m',number:'sg',
    senses:[{id:id+'-sense',english:e,compatibleRoles:[role]}],selectedSenseId:id+'-sense',...extra};
}

test('sentence projections avoid enumerating corpus records and skip unrelated role pools',()=>{
  const context=helpers();
  let metadataReads=0;
  function guarded(value){return new Proxy(value,{
    ownKeys(){throw Error('Sentence generation must not enumerate full lexical records.');},
    get(target,key){if(key==='assessment'||key==='learningContext'){metadataReads++;throw Error('Learning metadata is unrelated to sentence assembly.');}return target[key];}
  });}
  const who=guarded(row('teacher','adhiāpak','ਅਧਿਆਪਕ','teacher','subject',{person:'3sg',semanticTags:['human']}));
  const book=guarded(row('book','kitāb','ਕਿਤਾਬ','book','object',{
    translationOverride:{source:'user',senseId:'book-sense',english:'volume'},semanticTags:['readable'],countability:'countable'}));
  const unrelated=new Proxy({}, {get(){throw Error('An object pattern must not inspect the ABOUT pool.');}});
  const source={vocab:{WHO:[who],WHAT:Array.from({length:1000},()=>book),ABOUT:Array.from({length:1000},()=>unrelated),LEXICON:[unrelated],STATE:[],WHERE:[],WHEN:[],HOW:[],WHY:[],QUESTION:[],CONNECTOR:[],ADJECTIVE:[]},verbs:[]};
  const projected=context.contextualSentenceState(source,{id:'P01',pattern:'habitObject'});
  assert.equal(projected.vocab.WHAT.length,1000);
  assert.equal(projected.vocab.ABOUT.length,0);
  assert.equal(projected.vocab.WHAT[0].e,'volume');
  assert.equal(projected.vocab.WHAT[0].lexicalSelection.senseId,'book-sense');
  assert.equal(projected.vocab.WHAT[0].lexicalSelection.contextualMeaning,'volume');
  const script=context.scriptProjection(projected);
  assert.equal(script.vocab.WHAT[0].p,'ਕਿਤਾਬ');
  assert.equal(script.vocab.WHAT[0].e,'volume');
  assert.equal(metadataReads,0);
});

test('assembly-local case and script forms preserve source data and observe subsequent edits',()=>{
  const context=helpers();
  const who=row('teacher','adhiāpak','ਅਧਿਆਪਕ','teacher','subject',{person:'3sg',semanticTags:['human'],
    inflections:{oblique:'adhiāpak'},gScript:{inflections:{oblique:'ਅਧਿਆਪਕ'}}});
  const book=row('book','kitāb','ਕਿਤਾਬ','book','object',{semanticTags:['likeable'],countability:'countable'});
  const source={vocab:{WHO:[who],WHAT:[book],ABOUT:[],LEXICON:[],STATE:[],WHERE:[],WHEN:[],HOW:[],WHY:[],QUESTION:[],CONNECTOR:[],ADJECTIVE:[]},verbs:[]};
  const before=JSON.stringify(source);
  const projected=context.contextualSentenceState(source,{id:'P23',pattern:'likes'});
  assert.equal(projected.vocab.WHO[0].dative,'adhiāpak nū̃');
  assert.equal(projected.vocab.WHO[0].gScript.dative,'ਅਧਿਆਪਕ ਨੂੰ');
  const script=context.scriptProjection(projected);
  assert.equal(script.vocab.WHO[0].dative,'ਅਧਿਆਪਕ ਨੂੰ');
  assert.equal(JSON.stringify(source),before);
  book.translationOverride={source:'user',senseId:'book-sense',english:'volume'};
  who.dative='authored recipient';who.gScript.dative='ਸੋਧਿਆ ਨੂੰ';
  const edited=context.contextualSentenceState(source,{id:'P23',pattern:'likes'});
  assert.equal(edited.vocab.WHAT[0].e,'volume');
  assert.equal(edited.vocab.WHO[0].dative,'authored recipient');
  assert.equal(context.scriptProjection(edited).vocab.WHO[0].dative,'ਸੋਧਿਆ ਨੂੰ');
});
