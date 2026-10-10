'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const lexical=require('../linguistic-system');
const semantics=require('../lexical-semantics');
const source={id:'source-teacher',p:'adhiāpak',g:'ਅਧਿਆਪਕ',e:'teacher',partOfSpeech:'noun',gender:'m',number:null,categories:['general'],meanings:[{id:'teacher-sense',english:'teacher',tags:['masculine','countable']}],source:{name:'Dictionary fixture',url:'https://en.wiktionary.org/wiki/ਅਧਿਆਪਕ'},quality:{nativeReviewed:false},verifiedGrammar:false};
const audit={version:1,enrich(input){
  const row=structuredClone(input);
  row.senses=semantics.normalizeSenses(row).map(s=>({...s,contextualGloss:s.english,gender:'m',categories:['people']}));
  row.categories=['people'];row.number='sg';row.person='3sg';row.semanticTags=['human'];row.verifiedGrammar=true;
  row.assessment={schemaValidation:{status:'valid'},fluentSpeakerReview:{status:'pending'}};
  row.roleEligibility={WHO:{eligible:true,senseIds:['teacher-sense']},WHAT:{eligible:true,senseIds:['teacher-sense']}};
  return row;
}};
function create(){return lexical.install({vocab:{WHO:[],WHAT:[]},verbs:[],saved:[{id:'sentence'}],savedWords:[{id:'word'}],templates:[{id:'custom',enabled:false}],progress:{vocabulary:{x:4}}},{expansion:[source],audit});}

test('audit roles are central live views and compact hydration does not persist thousands of derived records',()=>{
  const state=create();
  assert.equal(state.vocab.WHO.length,1);assert.equal(state.vocab.WHAT.length,1);
  assert.equal(state.vocab.WHO[0].vocabularyId,state.vocab.WHAT[0].vocabularyId);
  assert.equal(state.vocab.WHO[0].selectedSenseId,'teacher-sense');
  const saved=lexical.snapshot(state,{compact:true});
  assert.equal(Object.keys(saved.linguistic.entries).length,0);
  assert.equal(saved.linguistic.bindings.WHO.length,0);assert.equal(saved.linguistic.bindings.WHAT.length,0);
  const reload=lexical.install(saved,{expansion:[source],audit});
  assert.equal(reload.vocab.WHO.length,1);assert.equal(reload.vocab.WHAT[0].selectedSenseId,'teacher-sense');
  assert.equal(lexical.get(reload,source.id).assessment.fluentSpeakerReview.status,'pending');
});

test('schema upgrade and re-assessment preserve settings, disabled words, deleted bindings and stable aliases',()=>{
  const state=create(),who=state.vocab.WHO[0];who.enabled=false;
  state.vocab.WHAT=[];
  const snapshot=lexical.snapshot(state,{compact:true});snapshot.linguistic.schemaVersion=1;
  const reload=lexical.install(snapshot,{expansion:[source],audit});
  assert.equal(reload.linguistic.schemaVersion,2);
  assert.equal(reload.vocab.WHO[0].enabled,false);assert.equal(reload.vocab.WHAT.length,0);
  assert.deepEqual(reload.saved,[{id:'sentence'}]);assert.deepEqual(reload.savedWords,[{id:'word'}]);
  assert.deepEqual(reload.templates,[{id:'custom',enabled:false}]);assert.deepEqual(reload.progress,{vocabulary:{x:4}});
  assert.equal(lexical.resolveId(reload,source.id),'lex:'+source.id);
});

test('source enrichment cannot reapprove learner-edited imports or overwrite selected English',()=>{
  const state=create();state.vocab.WHO[0].e='a tutor';lexical.sync(state);
  const entry=lexical.get(state,source.id);
  assert.equal(entry.translationOverride.english,'a tutor');assert.equal(entry.verifiedGrammar,false);
  assert.equal(state.vocab.WHO.length,0);assert.equal(state.vocab.WHAT.length,0);
  const reload=lexical.install(lexical.snapshot(state,{compact:true}),{expansion:[source],audit});
  assert.equal(lexical.get(reload,source.id).e,'a tutor');assert.equal(reload.vocab.WHO.length,0);
  assert.equal(lexical.vocabulary(reload).length,1);
});

test('learner category overrides and deleted entries survive fresh corpus classification',()=>{
  const state=create();lexical.upsert(state,{id:source.id,categories:['my-topic']});
  const reload=lexical.install(lexical.snapshot(state,{compact:true}),{expansion:[source],audit});
  assert.deepEqual(lexical.get(reload,source.id).categories,['my-topic']);
  lexical.remove(reload,source.id);
  const deleted=lexical.install(lexical.snapshot(reload,{compact:true}),{expansion:[source],audit});
  assert.equal(lexical.vocabulary(deleted).length,0);assert.equal(deleted.vocab.WHO.length,0);
});

test('source enrichment preserves authored grammatical edits while restricting their sentence roles',()=>{
  const state=create();
  state.vocab.WHO[0].gender='f';
  state.vocab.WHO[0].inflections={oblique:{p:'user-authored form',g:'ਅਧਿਆਪਕ'}};
  lexical.sync(state);
  const entry=lexical.get(state,source.id);
  assert.equal(entry.gender,'f');
  assert.deepEqual(entry.inflections,{oblique:{p:'user-authored form',g:'ਅਧਿਆਪਕ'}});
  assert.equal(entry.verifiedGrammar,false);
  assert.equal(state.vocab.WHO.length,0);assert.equal(state.vocab.WHAT.length,0);
  const reload=lexical.install(lexical.snapshot(state,{compact:true}),{expansion:[source],audit});
  assert.equal(lexical.get(reload,source.id).gender,'f');
  assert.deepEqual(lexical.get(reload,source.id).inflections,entry.inflections);
  assert.equal(reload.vocab.WHO.length,0);
});

test('v1 imported edits without new tracking fields are detected before the corpus audit',()=>{
  const state=lexical.install({vocab:{WHO:[],WHAT:[]},verbs:[]},{expansion:[source]});
  const entry=lexical.get(state,source.id);
  entry.gender='f';entry.e='tutor';entry.categories=['my-topic'];
  const saved=lexical.snapshot(state,{compact:true});
  saved.linguistic.schemaVersion=1;
  assert.equal(saved.linguistic.entries[entry.id].userModifiedLexicalFields,undefined);
  const reload=lexical.install(saved,{expansion:[source],audit});
  const migrated=lexical.get(reload,source.id);
  assert.equal(migrated.gender,'f');assert.equal(migrated.e,'tutor');
  assert.deepEqual(migrated.categories,['my-topic']);
  assert.ok(migrated.userModifiedLexicalFields.includes('gender'));
  assert.ok(migrated.userModifiedLexicalFields.includes('e'));
  assert.equal(migrated.translationOverride.english,'tutor');
  assert.equal(migrated.verifiedGrammar,false);
  assert.equal(reload.vocab.WHO.length,0);assert.equal(reload.vocab.WHAT.length,0);
});

test('an edited article-bearing role binding cannot bypass lexical revalidation',()=>{
  const state=create();
  state.vocab.WHO.push({id:'article-teacher',vocabularyId:'lex:'+source.id,p:source.p,g:source.g,e:'a teacher'});
  const row=state.vocab.WHO.find(value=>value.id==='article-teacher');
  assert.equal(row.e,'a teacher');
  row.e='a tutor';lexical.sync(state);
  const entry=lexical.get(state,source.id);
  assert.equal(entry.e,'a tutor');
  assert.ok(entry.userModifiedLexicalFields.includes('e'));
  assert.equal(entry.verifiedGrammar,false);
  assert.equal(state.vocab.WHO.length,0);assert.equal(state.vocab.WHAT.length,0);
  const reload=lexical.install(lexical.snapshot(state,{compact:true}),{expansion:[source],audit});
  assert.equal(lexical.get(reload,source.id).e,'a tutor');
  assert.equal(reload.vocab.WHO.length,0);
});

test('verb enrichment owns nested forms and cannot mutate the shipped morphology evidence',()=>{
  const grammar=require('../grammar-engine');
  const profiles=require('../data/verb-morphology-profiles');
  const profile=profiles.profiles.find(value=>value.verifiedGrammar&&value.future&&value.perfective);
  assert.ok(profile,'A source-supported verb profile is required for this regression.');
  const before=structuredClone(profile);
  let after;
  try{
    const enriched=grammar.enrichVerb({id:'lex:'+profile.id,primaryId:profile.id,p:profile.p,g:profile.g,e:profile.sourceEnglish,partOfSpeech:'verb'});
    assert.ok(enriched);
    enriched.forms['1sg']='learner-edited habitual';
    enriched.gScript.forms['1sg']='ਸੋਧਿਆ';
    enriched.future.m['1sg']='learner-edited future';
    enriched.perfective.m='learner-edited perfective';
    enriched.eligibleSenses[0].base='learner-edited gloss';
    after=structuredClone(profile);
  }finally{
    // A failing isolation regression must not contaminate other test cases.
    for(const key of Object.keys(profile))delete profile[key];
    Object.assign(profile,before);
  }
  assert.deepEqual(after,before);
});

test('learner imperative edits survive source verb enrichment and compact reloading',()=>{
  const grammar=require('../grammar-engine'),profiles=require('../data/verb-morphology-profiles');
  const profile=profiles.profiles.find(value=>value.verifiedGrammar&&value.imperative);
  assert.ok(profile);
  const row={id:profile.id,p:profile.p,g:profile.g,e:profile.sourceEnglish,partOfSpeech:'verb',verifiedGrammar:false};
  const options={expansion:[row],grammar};
  const state=lexical.install({vocab:{},verbs:[]},options);
  assert.equal(state.verbs.length,1);
  state.verbs[0].imperative='learner-authored command';
  lexical.sync(state);
  let entry=lexical.get(state,row.id);
  assert.equal(entry.imperative,'learner-authored command');
  assert.ok(entry.userModifiedLexicalFields.includes('imperative'));
  assert.equal(entry.verifiedGrammar,false);assert.equal(state.verbs.length,0);
  const reload=lexical.install(lexical.snapshot(state,{compact:true}),options);
  entry=lexical.get(reload,row.id);
  assert.equal(entry.imperative,'learner-authored command');
  assert.equal(entry.verifiedGrammar,false);assert.equal(reload.verbs.length,0);
});

test('untracked legacy future and perfective edits survive source enrichment and two compact reloads',()=>{
  const grammar=require('../grammar-engine'),profiles=require('../data/verb-morphology-profiles');
  const profile=profiles.profiles.find(value=>value.g==='ਹੱਸਣਾ');
  assert.ok(profile&&profile.future&&profile.perfective);
  const row={id:'v-hasna',p:'hasṇā',g:'ਹੱਸਣਾ',e:'to laugh',partOfSpeech:'verb',infinitive:'hasṇā',root:'has',
    base:'laugh',transitive:false,subjectClass:'human',gScript:{infinitive:'ਹੱਸਣਾ'}};
  const fresh=grammar.enrichVerb(row);
  assert.deepEqual(fresh.future,profile.future);assert.deepEqual(fresh.gScript.future,profile.gFuture);
  assert.deepEqual(fresh.perfective,profile.perfective);assert.deepEqual(fresh.gScript.perfective,profile.gPerfective);
  row.future=structuredClone(profile.future);row.future.m['1sg']='learner-authored future';
  row.perfective=structuredClone(profile.perfective);row.perfective.m='learner-authored perfective';
  row.gScript.future=structuredClone(profile.gFuture);row.gScript.future.m['1sg']='ਸੋਧਿਆ ਭਵਿੱਖ';
  row.gScript.perfective=structuredClone(profile.gPerfective);row.gScript.perfective.m='ਸੋਧਿਆ ਭੂਤਕਾਲ';
  const expected={future:row.future,perfective:row.perfective,gScript:row.gScript};
  const direct={...structuredClone(row),...grammar.enrichVerb(row)};
  assert.deepEqual({future:direct.future,perfective:direct.perfective,gScript:direct.gScript},expected);
  let state=lexical.install({vocab:{},verbs:[row]},{grammar});
  for(let cycle=0;cycle<3;cycle++){
    const entry=lexical.get(state,row.id);
    assert.deepEqual({future:entry.future,perfective:entry.perfective,gScript:entry.gScript},expected);
    assert.equal(entry.userModifiedLexicalFields,undefined,'This regression covers data saved before edit tracking existed.');
    if(cycle<2)state=lexical.install(lexical.snapshot(state,{compact:true}),{grammar});
  }
});

test('a complete explicitly authored noun updates central vocabulary and role assessment in one upsert',()=>{
  const corpusAudit=require('../vocabulary-audit');
  const state=lexical.install({vocab:{WHAT:[]},verbs:[]},{audit:corpusAudit});
  const entry=lexical.upsert(state,{id:'user-authored-cup',p:'kapp',g:'ਕੱਪ',e:'cup',partOfSpeech:'noun',gender:'m',number:'sg',
    semanticTags:['concrete','giveable'],verifiedGrammar:true,categories:['objects'],source:{name:'User vocabulary',verification:'user-authored'}});
  assert.equal(lexical.vocabulary(state).length,1);
  assert.equal(state.vocab.WHAT.length,1);
  assert.equal(state.vocab.WHAT[0].vocabularyId,entry.id);
  assert.equal(entry.roleEligibility.WHAT.eligible,true);
  assert.equal(entry.assessment.sentenceGenerationEligibility.eligible,true);
  assert.equal(entry.assessment.fluentSpeakerReview.status,'pending');
  assert.notEqual(entry.assessment.sourceVerification.status,'snapshot-aligned');
});

test('multiple supported senses retain separate role forms and agreement after compact hydration',()=>{
  const row={id:'multi-sense-fixture',p:'base',g:'ਬੇਸ',e:'pen; ink',partOfSpeech:'noun',gender:'m',number:'sg',semanticTags:[],categories:['general']};
  const senses=[{id:'pen-fixture',english:'pen',contextualGloss:'pen',gender:'m',number:'sg',countability:'countable',semanticTags:['tool']},
    {id:'ink-fixture',english:'ink',contextualGloss:'ink',gender:'f',number:'sg',countability:'uncountable',semanticTags:['material']}];
  const construction=(senseId,p,g)=>({type:'postpositional-phrase',case:'oblique',senseId,form:{p,g},postposition:{p:'bāre',g:'ਬਾਰੇ'},englishPrefix:'about'});
  const multiAudit={version:1,enrich(input){return {...structuredClone(input),senses:structuredClone(senses),verifiedGrammar:true,assessment:{assessed:true},
    roleEligibility:{WHAT:{eligible:true,senseIds:senses.map(s=>s.id)},ABOUT:{eligible:true,senseIds:senses.map(s=>s.id),
      constructionsBySense:{'pen-fixture':construction('pen-fixture','pen-oblique','ਪੈਨ'),'ink-fixture':construction('ink-fixture','ink-oblique','ਸਿਆਹੀ')}}}};}};
  const state=lexical.install({vocab:{WHAT:[],ABOUT:[]},verbs:[]},{expansion:[row],audit:multiAudit});
  assert.equal(state.vocab.WHAT.length,2);assert.equal(state.vocab.ABOUT.length,2);
  const describe=entries=>Array.from(entries).map(value=>({id:value.id,senseId:value.selectedSenseId,vocabularyId:value.vocabularyId,
    p:value.p,g:value.g,e:value.e,gender:value.gender,tags:value.tags,countability:value.countability}));
  const before={what:describe(state.vocab.WHAT),about:describe(state.vocab.ABOUT)};
  assert.equal(before.what[0].vocabularyId,before.what[1].vocabularyId);
  assert.equal(before.what[0].gender,'m');assert.equal(before.what[1].gender,'f');
  assert.deepEqual(before.what[0].tags,['tool']);assert.deepEqual(before.what[1].tags,['material']);
  assert.equal(before.about[0].p,'pen-oblique bāre');assert.equal(before.about[1].p,'ink-oblique bāre');
  assert.equal(before.about[0].e,'about pen');assert.equal(before.about[1].e,'about ink');
  const reload=lexical.install(lexical.snapshot(state,{compact:true}),{expansion:[row],audit:multiAudit});
  assert.deepEqual({what:describe(reload.vocab.WHAT),about:describe(reload.vocab.ABOUT)},before);
});

test('audited pronoun bindings preserve first-person plural agreement across compact reloading',()=>{
  const grammar=require('../grammar-engine');
  const row={id:'who-asi',p:'asī̃',g:'ਅਸੀਂ',e:'we',partOfSpeech:'pronoun',person:'1pl',gender:'m',number:'pl',semanticTags:['human']};
  const pronounAudit={version:1,enrich(input){return {...structuredClone(input),verifiedGrammar:true,
    senses:[{id:'we-sense',english:'we',number:'pl',compatibleRoles:['subject']}],roleEligibility:{WHO:{eligible:true,senseIds:['we-sense']}}};}};
  let state=lexical.install({vocab:{WHO:[row]},verbs:[]},{audit:pronounAudit});
  for(let cycle=0;cycle<2;cycle++){
    const subject=state.vocab.WHO[0];
    assert.equal(subject.person,'1pl');
    const verb={id:'v-likhna',infinitive:'likhṇā',base:'write',subjectClass:'human',transitive:false,
      habitual:{m:'likhdā',f:'likhdī',pl:'likhde',fpl:'likhdīā̃'},gScript:{infinitive:'ਲਿਖਣਾ',habitual:{m:'ਲਿਖਦਾ',f:'ਲਿਖਦੀ',pl:'ਲਿਖਦੇ',fpl:'ਲਿਖਦੀਆਂ'}}};
    const roman=grammar.conjugate({verb,subject}),gurmukhi=grammar.conjugate({verb,subject,script:'gurmukhi'});
    assert.equal(roman.text,'likhde hā̃');assert.equal(gurmukhi.text,'ਲਿਖਦੇ ਹਾਂ');
    const go={id:'v-jana',infinitive:'jāṇā',base:'go',subjectClass:'human',transitive:false,gScript:{infinitive:'ਜਾਣਾ'}};
    assert.equal(grammar.conjugate({verb:go,subject,aspect:'future'}).text,'jāvā̃ge');
    assert.equal(grammar.conjugate({verb:go,subject,aspect:'future',script:'gurmukhi'}).text,'ਜਾਵਾਂਗੇ');
    if(!cycle)state=lexical.install(lexical.snapshot(state,{compact:true}),{audit:pronounAudit});
  }
});

test('real corpus nested verb edits survive compact migration and remain outside sentence roles',()=>{
  const {applicationFixture}=require('../scripts/application-fixture');
  const fixture=applicationFixture({generation:false});
  const {state,lexical:registry,window}=fixture;
  const row=state.verbs.find(value=>value.id.startsWith('wt-pa-')&&value.future&&value.perfective);
  assert.ok(row,'The expanded corpus must include supported imported verb paradigms.');
  const id=row.vocabularyId;
  row.forms['1sg']='learner-authored habitual form';
  row.gScript.forms['1sg']='ਮੇਰੀ ਸੋਧ';
  row.future.m['1sg']='learner-authored future form';
  const saved=registry.snapshot(state,{compact:true});
  const reload=registry.install(saved,{expansion:fixture.context.bundled,audit:window.PunjabiVocabularyAudit,grammar:window.PunjabiGrammarEngine});
  const entry=registry.get(reload,id);
  assert.equal(entry.forms['1sg'],'learner-authored habitual form');
  assert.equal(entry.gScript.forms['1sg'],'ਮੇਰੀ ਸੋਧ');
  assert.equal(entry.future.m['1sg'],'learner-authored future form');
  assert.equal(entry.verifiedGrammar,false);
  assert.ok(entry.userModifiedLexicalFields.includes('forms'));
  assert.ok(entry.userModifiedLexicalFields.includes('gScript'));
  assert.ok(entry.userModifiedLexicalFields.includes('future'));
  assert.equal(reload.verbs.some(value=>value.vocabularyId===id),false);
  assert.equal(entry.assessment.sentenceGenerationEligibility.eligible,false);
});

test('real corpus compact hydration keeps derived metadata out of persistence and preserves role settings',()=>{
  const {applicationFixture}=require('../scripts/application-fixture');
  const fixture=applicationFixture({generation:false});
  const {state,lexical:registry,window}=fixture;
  const options={expansion:fixture.context.bundled,audit:window.PunjabiVocabularyAudit,grammar:window.PunjabiGrammarEngine};
  const saved=registry.snapshot(state,{compact:true});
  const expected=structuredClone(saved);
  const imported=central=>Object.values(central.entries).filter(entry=>entry.importedDataset);
  assert.equal(imported(saved.linguistic).length,0);
  const reload=registry.install(saved,options);
  const again=registry.snapshot(reload,{compact:true});
  assert.equal(imported(again.linguistic).length,0);
  assert.equal(JSON.stringify(again).length,JSON.stringify(expected).length);
  assert.equal(JSON.stringify(again)===JSON.stringify(expected),true,'Compact corpus JSON must stay stable across hydration.');
  assert.deepEqual(Object.keys(reload.linguistic.entries).sort(),Object.keys(state.linguistic.entries).sort());
  const word=reload.vocab.WHAT.find(value=>value.id.startsWith('wt-pa-'));
  assert.ok(word);const id=word.id,vocabularyId=word.vocabularyId;
  word.enabled=false;
  const final=registry.install(registry.snapshot(reload,{compact:true}),options);
  const retained=final.vocab.WHAT.find(value=>value.id===id);
  assert.ok(retained);assert.equal(retained.enabled,false);
  assert.equal(registry.get(final,vocabularyId).verifiedGrammar,true);
  assert.equal(registry.get(final,vocabularyId).userModifiedLexicalFields,undefined);
});

function runUnchangedVocabularySave(fixture,item,category){
  const vm=require('node:vm'),html=fixture.read('index.html');
  const helpers=html.slice(html.indexOf('  function vocabGrammar('),html.indexOf('  function habitualForSubject('))+
    html.slice(html.indexOf('  function validateGrammarMetadata('),html.indexOf('  /* ---------------- Templates screen'));
  vm.runInContext(helpers,fixture.context);
  fixture.context.editorItem=item;
  const roman=vm.runInContext('vocabGrammar(editorItem)',fixture.context);
  const fields={'.f-rmeta':JSON.stringify(roman),'.f-gmeta':JSON.stringify(item.gScript||{}),'.f-p':item.p,'.f-g':item.g||'',
    '.f-e':item.e,'.f-game-category':item.gameCategory||'', '.f-person':item.person||'3sg','.f-gender':item.gender||'m',
    '.f-number':item.number||'sg','.f-tags':(item.tags||[]).join(', ')};
  fixture.context.editorRow={querySelector(selector){return {value:fields[selector],checked:item.enabled};}};
  fixture.context.editorErrors=[];
  fixture.context.showEditorError=(_,message)=>fixture.context.editorErrors.push(message);
  const start=html.indexOf('        let rmeta,gmeta;',html.indexOf('  function renderVocabPanel('));
  const body=html.slice(start,html.indexOf('        save();',start));
  vm.runInContext('(function(){const item=editorItem,row=editorRow,showTags='+JSON.stringify(category==='WHAT')+',showPerson='+JSON.stringify(category==='WHO')+';'+body+'}).call(this);',fixture.context);
  fixture.lexical.sync(fixture.state);
  assert.deepEqual(fixture.context.editorErrors,[]);
}

function runUnchangedVerbSave(fixture,item){
  const vm=require('node:vm'),html=fixture.read('index.html');
  const fields={'.f-gverb':JSON.stringify(item.gScript||{}),'.f-ginf':item.gScript&&item.gScript.infinitive||'',
    '.f-inf':item.infinitive,'.f-eng':item.english,'.f-base':item.base,'.f-root':item.root||'',
    '.f-imp':item.imperative||'', '.f-type':item.type||'simple','.f-tag':(item.takesTags||[]).join(', ')};
  for(const person of ['1sg','2sg','2pl','3sg','1pl','3pl'])fields['.f-f'+person]=item.forms[person]||'';
  fixture.context.editorItem=item;
  fixture.context.editorRow={querySelector(selector){return {value:fields[selector],checked:selector==='.f-comp'?!!item.isModalComplement:item.enabled};}};
  fixture.context.editorErrors=[];
  const start=html.indexOf('        const v = state.verbs.find(',html.indexOf('  function renderVerbsPanel('));
  const body=html.slice(start,html.indexOf('        save();',start));
  vm.runInContext('(function(){const row=editorRow,id=editorItem.id;'+body+'}).call(this);',fixture.context);
  fixture.lexical.sync(fixture.state);
  assert.deepEqual(fixture.context.editorErrors,[]);
}

test('saving unchanged real noun and adjective editor values preserves imported eligibility',()=>{
  const {applicationFixture}=require('../scripts/application-fixture');
  const fixture=applicationFixture({generation:false});
  const noun=fixture.state.vocab.WHAT.find(value=>value.id.startsWith('wt-pa-'));
  const adjective=fixture.state.vocab.ADJECTIVE.find(value=>value.id.startsWith('wt-pa-'));
  assert.ok(noun);assert.ok(adjective);
  for(const [category,item] of [['WHAT',noun],['ADJECTIVE',adjective]]){
    const before=JSON.stringify(fixture.lexical.get(fixture.state,item.vocabularyId));
    runUnchangedVocabularySave(fixture,item,category);
    const entry=fixture.lexical.get(fixture.state,item.vocabularyId);
    assert.equal(entry.verifiedGrammar,true);
    assert.equal(entry.userModifiedLexicalFields,undefined);
    assert.equal(JSON.stringify(entry),before);
    assert.ok(fixture.state.vocab[category].some(value=>value.id===item.id));
  }
  const verb=fixture.state.verbs.find(value=>value.id.startsWith('wt-pa-')&&!value.id.includes('@')&&value.future&&value.perfective);
  assert.ok(verb);
  runUnchangedVerbSave(fixture,verb);
  const entry=fixture.lexical.get(fixture.state,verb.vocabularyId);
  assert.equal(entry.verifiedGrammar,true);
  assert.equal(entry.userModifiedLexicalFields,undefined);
  assert.ok(fixture.state.verbs.some(value=>value.id===verb.id));
});
