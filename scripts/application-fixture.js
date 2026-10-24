'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
function applicationFixture(options={}){
 const directory=options.directory||root,read=file=>fs.readFileSync(path.join(directory,file),'utf8'),cache=new Map();
 function load(file){file=path.posix.normalize(file);if(!file.endsWith('.js'))file+='.js';if(cache.has(file))return cache.get(file).exports;const module={exports:{}};cache.set(file,module);const local=r=>r.startsWith('.')?load(path.posix.join(path.posix.dirname(file),r)):require(r);vm.runInNewContext(read(file),{module,exports:module.exports,require:local,console,performance,structuredClone},{filename:file});return module.exports;}
 const lexical=load('linguistic-system.js'),grammar=load('grammar-engine.js'),learning=load('learning-context.js');
 const window={PunjabiLinguisticSystem:lexical,PunjabiGrammarEngine:grammar,PunjabiLearningContext:learning,PUNJABI_VOCABULARY_CATALOG:load('data/vocabulary-catalog.js'),PunjabiCatalogState:load('catalog-state.js'),PunjabiStorageCleanup:load('storage-cleanup.js'),PunjabiSentenceLearning:load('sentence-learning.js'),PunjabiLexicalSemantics:load('lexical-semantics.js')};
 const html=read('index.html'),storage=new Map(options.storage||[]),quiet={...console,warn(...args){if(options.verbose)console.warn(...args);},debug(){}};
 const localStorage={getItem:k=>storage.get(k)||null,setItem(k,v){storage.set(k,v);},removeItem(k){storage.delete(k);},key:i=>[...storage.keys()][i],get length(){return storage.size;}};
 const math=Object.create(Math);let seed=options.seed||314159265;math.random=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};
 const context=vm.createContext({window,console:quiet,performance,structuredClone,Math:math,localStorage});
 function range(start,end){const a=html.indexOf(start),b=html.indexOf(end,a);if(a<0||b<0)throw Error('Missing fixture marker '+start+' / '+end);return html.slice(a,b);}
 vm.runInContext(range('  /* ---------------- Default data','  /* ---------------- Generation engine')+range('  function installScriptData(){','  function scriptProjection('),context);
 const initialize=range('  function initializeLearning(){','    initializeFlashcardEvents();');vm.runInContext(initialize+'\n}\ninitializeLearning();this.fixtureState=state;this.bundled=keptCatalog;',context);
 if(options.generation!==false){const instrument='\nthis.assemble=assembleFromTemplate;this.assembleWithState=function(template,projection){const original=state,lexical=window.PunjabiLinguisticSystem;try{window.PunjabiLinguisticSystem=Object.assign({},lexical,{resolveId:function(_,id){return lexical.resolveId(original,id);},get:function(_,id){return lexical.get(original,id);}});state=projection;return assembleFromTemplate(template);}finally{state=original;window.PunjabiLinguisticSystem=lexical;}};';vm.runInContext(range('  const grammarG =','  function installScriptData(){')+range('  /* ---------------- Generation engine','  /* ---------------- Rendering: Generate screen')+range('  function habitualForSubject(','  function validateGrammarMetadata(')+range('  function scriptProjection(',"  const LEARNING_KEY=")+instrument,context);}
 return {context,lexical,grammar,learning,state:context.fixtureState,storage,load,read,window};
}
module.exports={applicationFixture};
