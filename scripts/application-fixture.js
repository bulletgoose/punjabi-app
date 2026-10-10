'use strict';
// Evaluate the app's actual data setup and sentence helpers without a DOM.
// Optional ref reads a committed version, rather than mixing baseline code
// with current modules. No saved user data or network is accessed.
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
function applicationFixture(options={}){
  const ref=options.ref;
  const directory=options.directory||root;
  const read=file=>{
    if(!ref)return fs.readFileSync(path.join(directory,file),'utf8');
    try{return execFileSync('git',['show',ref+':'+file],{cwd:directory,encoding:'utf8',maxBuffer:32*1024*1024});}
    catch(error){
      // Some managed process supervisors report EPERM while collecting a
      // successfully completed child. Accept only a zero exit plus output.
      if(error.status===0&&typeof error.stdout==='string')return error.stdout;
      throw error;
    }
  };
  const cache=new Map();
  function load(file){
    file=path.posix.normalize(file);if(!file.endsWith('.js'))file+='.js';
    if(cache.has(file))return cache.get(file).exports;
    const module={exports:{}};cache.set(file,module);
    const requireLocal=request=>request.startsWith('.')?load(path.posix.join(path.posix.dirname(file),request)):require(request);
    vm.runInNewContext(read(file),{module,exports:module.exports,require:requireLocal,console,performance,structuredClone},{filename:(ref||'working')+':'+file});
    return module.exports;
  }
  const lexical=load('linguistic-system.js'),grammar=load('grammar-engine.js'),learning=load('learning-context.js');
  const window={PunjabiLinguisticSystem:lexical,PunjabiGrammarEngine:grammar,PunjabiLearningContext:learning};
  const html=read('index.html');
  const modules={'lexical-semantics.js':'PunjabiLexicalSemantics','data/verb-morphology-profiles.js':'PUNJABI_VERB_MORPHOLOGY_PROFILES','data/source-evidence.js':null,'data/authored-category-baselines.js':null,'vocabulary-audit.js':'PunjabiVocabularyAudit','data/vocabulary-expansion.js':'PUNJABI_VOCABULARY_EXPANSION','data/grammar-ready-vocabulary.js':'PUNJABI_GRAMMAR_READY_VOCABULARY'};
  for(const [file,global] of Object.entries(modules)){
    if(html.includes(file)){
      const name=global||(read(file).match(/root\.(\w+)\s*=/)||[])[1];
      if(!name)throw Error('Missing browser export name for '+file);
      const value=load(file);window[name]=file==='data/vocabulary-expansion.js'?value.entries:value;
    }
  }
  vm.runInNewContext(read('game-vocabulary.js'),{window});
  const storage=new Map(options.storage||[]);
  const quiet={...console,debug(){},warn(...args){if(options.verbose)console.warn(...args);}};
  const math=Object.create(Math);
  let seed=options.seed||314159265;
  math.random=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};
  const context=vm.createContext({window,console:quiet,performance,structuredClone,Math:math,localStorage:{getItem:key=>storage.get(key)||null,setItem(key,value){storage.set(key,value);}}});
  function range(start,end){
    const from=html.indexOf(start),to=html.indexOf(end,from);
    if(from<0||to<0)throw Error('Missing fixture marker '+start+' / '+end);
    return html.slice(from,to);
  }
  const vocabularySetup=html.slice(html.indexOf('  const grammarReady='),html.indexOf('  /* ---------------- Default data'));
  vm.runInContext(vocabularySetup+range('  function defaultData(){','  /* ---------------- State load/save')+range('  const STORAGE_KEY =','  /* ---------------- Generation engine')+range('  const gurmukhiSeeds =','  let scriptG=')+range('  function installScriptData(){','  function scriptProjection('),context);
  // Use initializeLearning's actual integration sequence but stop before UI.
  const initialize=range('  function initializeLearning(){','    if(!linguisticMigrationAllowed)');
  vm.runInContext(initialize+'\n}\ninitializeLearning();this.fixtureState=state;this.bundled=bundledVocabulary;',context);
  if(options.generation!==false){
    const instrument='\nthis.assemble=assembleFromTemplate;this.assembleWithState=function(template,projection){const original=state,lexical=window.PunjabiLinguisticSystem;try{window.PunjabiLinguisticSystem=Object.assign({},lexical,{resolveId:function(_,id){return lexical.resolveId(original,id);},get:function(_,id){return lexical.get(original,id);}});state=projection;return assembleFromTemplate(template);}finally{state=original;window.PunjabiLinguisticSystem=lexical;}};';
    // Force a role list while resolving lexical IDs against the real registry;
    // the temporary projected state must not be reinstalled as learner data.
    vm.runInContext(range('  let scriptG=','  function installScriptData(){')+range('  /* ---------------- Generation engine','  /* ---------------- Rendering: Generate screen')+range('  function habitualForSubject(','  function validateGrammarMetadata(')+range('  function scriptProjection(',"  const LEARNING_KEY=")+instrument,context);
  }
  return {context,lexical,grammar,learning,state:context.fixtureState,storage,load,read,window};
}
module.exports={applicationFixture};
