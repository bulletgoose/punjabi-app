'use strict';
// Run with Playwright and Chromium/WebKit runtimes installed.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium,webkit,devices}=require('playwright');
const {applicationFixture}=require('./application-fixture');
const {provenance}=require('./report-provenance');
const repo=path.resolve(__dirname,'..');
function server(){return new Promise((resolve,reject)=>{
  const app=http.createServer((req,res)=>{
    const requested=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const file=path.resolve(repo,'.'+(requested==='/'?'/index.html':requested));
    if(!file.startsWith(repo+path.sep)){res.writeHead(403).end();return;}
    fs.readFile(file,(error,data)=>{
      if(error){res.writeHead(404).end();return;}
      const types={'.html':'text/html','.js':'text/javascript','.png':'image/png','.webmanifest':'application/manifest+json','.json':'application/json'};
      res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(data);
    });
  });app.once('error',reject);app.listen(0,'127.0.0.1',()=>resolve({app,url:'http://127.0.0.1:'+app.address().port}));
});}
async function stop(app){if(!app.listening)return;app.closeAllConnections();await new Promise(resolve=>app.close(resolve));}
function migrationFixture(){
  const {state,lexical}=applicationFixture({ref:process.env.BASELINE_REF||'49ded7b',generation:false});
  state.saved.push({id:'saved-regression',roman:'test',gurmukhi:'ਟੈਸਟ',english:'Existing saved sentence'});
  state.savedWords.push({id:'saved-word-regression',roman:'pāṇī',gurmukhi:'ਪਾਣੀ',english:'water'});
  state.templates.find(t=>t.id==='P03').name='My existing template title';
  state.templates.find(t=>t.id==='P04').enabled=false;
  state.templates.push({id:'user-template-regression',name:'My custom template',enabled:false,probability:3,slots:[{t:'WHO'},{t:'VERB',mode:'simple'}]});
  state.vocab.WHAT.find(w=>w.id==='what-pani').e='my edited water';
  state.vocab.WHAT.find(w=>w.id==='what-kitab').enabled=false;
  const drink=state.verbs.find(verb=>verb.id==='v-pina');drink.forms['1sg']='my custom drink form';drink.gScript.forms['1sg']='ਮੇਰਾ ਸੋਧਿਆ ਰੂਪ';drink.enabled=false;
  const adjective=state.vocab.ADJECTIVE.find(word=>word.id==='state-extra-clean');adjective.forms.m='my custom adjective';adjective.gScript.forms.m='ਮੇਰਾ ਸੋਧਿਆ ਵਿਸ਼ੇਸ਼ਣ';adjective.enabled=false;
  state.vocab.WHAT.push({id:'custom-regression',p:'seb',g:'ਸੇਬ',e:'my apple',gender:'m',number:'sg',tags:['edible'],enabled:true});
  const imports=Object.values(state.linguistic.entries).filter(e=>e.importedDataset);
  const edited=imports.find(e=>e.partOfSpeech==='noun'&&e.e==='tree')||imports.find(e=>e.partOfSpeech==='noun');
  lexical.upsert(state,{id:edited.id,e:'my imported translation'});
  const deleted=imports.find(e=>e.id!==edited.id&&e.e==='stone')||imports.find(e=>e.id!==edited.id);lexical.remove(state,deleted.id);
  state.customSettings={keep:'user setting'};
  state.linguistic.progression.vocabulary[lexical.resolveId(state,'what-pani')]={mastery:.5,exposures:12};
  return {snapshot:JSON.parse(JSON.stringify(lexical.snapshot(state,{compact:true}))),editedId:edited.id,deletedId:deleted.id};
}
async function readState(page){return page.evaluate(()=>JSON.parse(localStorage.getItem('punjabi-app-state-v1')));}
async function hasPunjabi(locator){
  const text=await locator.textContent();return /[\u0a00-\u0a7f]/.test(text||'')&&!/unavailable|missing|⟦|undefined/.test(text||'');
}
async function observeCategoryVocabulary(page){
  await page.evaluate(()=>{
    const api=window.PunjabiLinguisticSystem,original=api.vocabulary,random=Math.random;
    const observation=window.__qaCategoryVocabulary={calls:[],forceNextBodyCard:false};
    const observe=function(state,options){
      const rows=original.call(this,state,options),ids=options&&options.senseCategoryIds||[];
      if(ids.length){
        const wood=rows.find(row=>row.gurmukhi==='ਕਾਠ');
        observation.calls.push({ids:ids.slice(),bodyLabel:state.linguistic.categories.body.label,wood:wood&&{
          id:wood.id,vocabularyId:wood.vocabularyId,english:wood.english,gurmukhi:wood.gurmukhi,
          selectedSenseId:wood.selectedSenseId,displaySenseId:wood.displaySenseId,categories:wood.categories,
          dictionaryEnglish:api.get(state,wood.vocabularyId).e
        }});
        if(observation.forceNextBodyCard&&ids.includes('body')){
          const pool=rows.filter(row=>(row.categories||[]).includes('body'));
          const index=pool.findIndex(row=>row.gurmukhi==='ਕਾਠ');
          if(index<0)throw Error('Body-topic vocabulary view omitted the verified physique sense of ਕਾਠ.');
          // Control one choice, while leaving the returned central vocabulary unchanged.
          Math.random=()=>((index+0.25)/pool.length);observation.forceNextBodyCard=false;
        }
      }
      return rows;
    };
    window.PunjabiLinguisticSystem=Object.assign({},api,{vocabulary:observe});
    window.__qaRestoreRandom=()=>{Math.random=random;};
    window.__qaStopCategoryObservation=()=>{window.PunjabiLinguisticSystem=api;Math.random=random;};
  });
}
async function run(){
  const inputProvenance=provenance();
  const fixture=migrationFixture(),reports=[];
  for(const [name,type,options] of [['desktop-chromium',chromium,{}],['desktop-webkit',webkit,{}],['iphone-webkit',webkit,devices['iPhone 13']]]){
    const active=await server();let browser;
    try{
      console.log('Checking '+name);browser=await type.launch();const context=await browser.newContext(options),page=await context.newPage();
      const errors=[];page.setDefaultTimeout(20000);page.on('pageerror',e=>errors.push(e.message));
      await page.addInitScript(({state})=>{if(!localStorage.getItem('punjabi-app-state-v1')){
        localStorage.setItem('punjabi-app-state-v1',JSON.stringify(state));
        localStorage.setItem('punjabi-learning-v1',JSON.stringify({wordProgress:{'what-pani':{correct:12,wrong:3,streak:4}},game:{bestScore:42}}));
      }},{state:fixture.snapshot});
      const started=Date.now();await page.goto(active.url,{waitUntil:'domcontentloaded'});await page.waitForSelector('#blocksSubnav button',{state:'attached'});const loadMs=Date.now()-started;
      const state=await readState(page),entries=Object.values(state.linguistic.entries);
      assert.ok(state.linguistic);assert.equal(state.vocab,undefined);assert.equal(state.verbs,undefined);assert.ok(state.linguistic.auditVersion);
      assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('punjabi-app-state-before-linguistic-v2'))),fixture.snapshot);
      assert.ok(state.saved.some(s=>s.id==='saved-regression'));assert.ok(state.savedWords.some(s=>s.id==='saved-word-regression'));
      assert.ok(entries.some(e=>e.e==='my edited water'));assert.ok(entries.some(e=>e.e==='my apple'));
      assert.equal(entries.find(e=>e.id===fixture.editedId).e,'my imported translation');assert.equal(entries.find(e=>e.id===fixture.deletedId).deleted,true);
      assert.equal(state.linguistic.bindings.WHAT.find(binding=>binding.id==='what-kitab').enabled,false);
      assert.equal(state.linguistic.entries['lex:v-pina'].forms['1sg'],'my custom drink form');assert.equal(state.linguistic.entries['lex:v-pina'].gScript.forms['1sg'],'ਮੇਰਾ ਸੋਧਿਆ ਰੂਪ');assert.equal(state.linguistic.entries['lex:state-extra-clean'].forms.m,'my custom adjective');assert.equal(state.linguistic.entries['lex:state-extra-clean'].gScript.forms.m,'ਮੇਰਾ ਸੋਧਿਆ ਵਿਸ਼ੇਸ਼ਣ');
      assert.equal(state.templates.find(t=>t.id==='P03').name,'My existing template title');assert.equal(state.templates.find(t=>t.id==='P04').enabled,false);assert.equal(state.templates.find(t=>t.id==='user-template-regression').enabled,false);assert.equal(state.customSettings.keep,'user setting');
      assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('punjabi-learning-v1')).wordProgress['what-pani'].correct),12);
      assert.equal(state.linguistic.progression.vocabulary['lex:what-pani'].mastery,.5);
      await page.locator('#generateBtn').click();assert.ok(await hasPunjabi(page.locator('#outputCard .gurmukhi-line')));if((await page.locator('#toggleMainBreakdown').textContent()).startsWith('Show'))await page.locator('#toggleMainBreakdown').click();
      const part=page.locator('#breakdownBox details.sentence-breakdown-part').first();assert.ok(await part.count());await part.locator(':scope > summary').click();assert.equal(await part.evaluate(el=>el.open),true);assert.ok(await part.locator('.breakdown-part-details').textContent());await page.locator('#saveMainBtn').click();
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'Expanded breakdown fits tested viewport');
      fs.mkdirSync(path.join(repo,'reports','screenshots'),{recursive:true});await page.screenshot({path:path.join(repo,'reports','screenshots',name+'-breakdown.png')});
      const templateIds=await page.locator('#batchTemplateSelect option').evaluateAll(rows=>rows.map(r=>r.value).filter(id=>id!=='__random__'));
      await page.locator('#batchCountSlider').evaluate(el=>{el.value='1';el.dispatchEvent(new Event('input',{bubbles:true}));});
      console.log(name+': compact migration and breakdown passed; checking '+templateIds.length+' templates');const failedTemplates=[],templateStart=Date.now();
      for(const id of templateIds){await page.locator('#batchTemplateSelect').selectOption(id);await page.locator('#batchGenerateBtn').click();const result=page.locator('#batchResults .gurmukhi-line').first();if(!await result.count()||!await hasPunjabi(result))failedTemplates.push(id);}
      assert.deepEqual(failedTemplates,[]);const templateMs=Date.now()-templateStart;
      await page.locator('[data-screen="vocabulary"]').click();const libraryCount=Number((await page.locator('#vocabularyCount').textContent()).match(/of (\d+)/)[1]);assert.ok(libraryCount>5600);
      const renderStarted=Date.now();await page.locator('#vocabularySearch').fill('water');assert.ok(await page.locator('.vocabulary-word').count());const searchMs=Date.now()-renderStarted;
      await page.locator('#addVocabularyWord').click();await page.locator('[name="roman"]').fill('nava test');await page.locator('[name="gurmukhi"]').fill('ਨਵਾਂ ਟੈਸਟ');await page.locator('[name="english"]').fill('integration sentinel');await page.locator('#vocabularyEditForm [type="submit"]').click();await page.locator('#vocabularySearch').fill('integration sentinel');assert.equal(await page.locator('.vocabulary-word').count(),1);
      const custom=Object.values((await readState(page)).linguistic.entries).find(e=>e.e==='integration sentinel');assert.ok(custom);
      await observeCategoryVocabulary(page);
      await page.locator('[data-screen="flashcards"]').click();await page.locator('#flashContent').selectOption('words');await page.locator('#flashCategory').selectOption('body');await page.locator('#flashCount').fill('1');await page.locator('#flashDirection').selectOption('en-pa');await page.locator('#flashAudio').uncheck();
      await page.evaluate(()=>{window.__qaCategoryVocabulary.forceNextBodyCard=true;});await page.locator('#startFlash').click();await page.evaluate(()=>window.__qaRestoreRandom());
      const flashTopic=await page.evaluate(()=>window.__qaCategoryVocabulary.calls.find(call=>call.ids.includes('body')));
      assert.ok(flashTopic&&flashTopic.wood);assert.equal(flashTopic.wood.english,'physique');assert.ok(flashTopic.wood.selectedSenseId);assert.equal(flashTopic.wood.selectedSenseId,flashTopic.wood.displaySenseId);assert.ok(flashTopic.wood.categories.includes('body'));assert.ok(!flashTopic.wood.categories.includes('materials'));
      assert.equal(await page.locator('.flash-front .flash-english').textContent(),'physique');
      const flashPreferences=await page.evaluate(()=>JSON.parse(localStorage.getItem('punjabi-learning-v1')).flash);assert.equal(flashPreferences.content,'words');assert.equal(flashPreferences.category,'body');assert.equal(flashPreferences.count,1);
      await page.locator('#revealFlash').click();assert.equal((await page.locator('.flash-answer .gurmukhi-line').textContent()).trim(),'ਕਾਠ');await page.locator('#toggleFlashBreakdown').click();
      const wordPart=page.locator('#flashBreakdown details.sentence-breakdown-part');assert.equal(await wordPart.count(),1);assert.equal(await wordPart.getAttribute('data-english'),'physique');assert.equal(await wordPart.getAttribute('data-gurmukhi'),'ਕਾਠ');
      await page.locator('#saveFlashCard').click();const savedWordCard=(await readState(page)).saved.find(sentence=>sentence.templateId==='vocabulary'&&sentence.gurmukhi==='ਕਾਠ'&&sentence.english==='physique');assert.ok(savedWordCard,'Word practice saves a dictionary card rather than a generated sentence');assert.equal(savedWordCard.sentenceBreakdown.length,1);assert.equal(savedWordCard.sentenceBreakdown[0].vocabularyId,flashTopic.wood.vocabularyId);assert.equal(savedWordCard.sentenceBreakdown[0].selectedSenseId,flashTopic.wood.selectedSenseId);assert.equal(savedWordCard.sentenceBreakdown[0].english,savedWordCard.english);
      await page.locator('[data-rating="good"]').click();
      await page.locator('[data-screen="vocab-game"]').click();await page.locator('#gameContent').selectOption('words');await page.locator('#gameChallenge').selectOption('text');await page.locator('#gameGridSize').selectOption('4');await page.locator('#gamePromptScript').selectOption('english');await page.locator('#gameScript').selectOption('gurmukhi');await page.locator('#gameTimed').uncheck();await page.locator('#gameMaxStrikes').fill('0');await page.locator('#gameRounds').evaluate(el=>{el.value='1';el.dispatchEvent(new Event('input',{bubbles:true}));});
      const selectedBodyCategories=await page.locator('[name="gameCategory"]').evaluateAll((inputs,label)=>{for(const input of inputs){input.checked=input.value===label;input.dispatchEvent(new Event('change',{bubbles:true}));}return inputs.filter(input=>input.checked).map(input=>input.value);},flashTopic.bodyLabel);assert.deepEqual(selectedBodyCategories,[flashTopic.bodyLabel]);
      await page.evaluate(()=>{window.__qaCategoryVocabulary.calls=[];});await page.locator('#startWordGame').click();await page.waitForSelector('.game-tile');
      const gameTopic=await page.evaluate(()=>window.__qaCategoryVocabulary.calls.find(call=>call.ids.includes('body')));assert.ok(gameTopic&&gameTopic.wood,'Actual Word Game pool requests the Body sense projection');assert.equal(gameTopic.wood.english,'physique');assert.equal(gameTopic.wood.vocabularyId,flashTopic.wood.vocabularyId);assert.equal(gameTopic.wood.selectedSenseId,flashTopic.wood.selectedSenseId);assert.equal(gameTopic.wood.dictionaryEnglish,flashTopic.wood.dictionaryEnglish);assert.ok(!gameTopic.wood.categories.includes('materials'));
      // Any answer must create an exposure record, independently of random selection.
      const priorEvents=await page.evaluate(()=>((JSON.parse(localStorage.getItem('punjabi-learning-v1')).progression||{}).events||[]).length);
      await page.locator('.game-tile').first().click();
      assert.ok(await page.evaluate(prior=>((JSON.parse(localStorage.getItem('punjabi-learning-v1')).progression||{}).events||[]).length>prior,priorEvents));
      await page.evaluate(()=>window.__qaStopCategoryObservation());
      await page.reload({waitUntil:'domcontentloaded'});await page.waitForSelector('#blocksSubnav button',{state:'attached'});
      const reloaded=await readState(page);assert.ok(Object.values(reloaded.linguistic.entries).some(e=>e.id===custom.id));assert.equal(reloaded.linguistic.entries[fixture.editedId].e,'my imported translation');assert.equal(reloaded.linguistic.entries[fixture.deletedId].deleted,true);assert.equal(reloaded.linguistic.bindings.WHAT.find(binding=>binding.id==='what-kitab').enabled,false);assert.equal(reloaded.templates.find(t=>t.id==='P04').enabled,false);assert.equal(reloaded.templates.find(t=>t.id==='P03').name,'My existing template title');assert.ok(reloaded.templates.some(t=>t.id==='user-template-regression'));assert.ok(reloaded.saved.some(s=>s.id==='saved-regression'));assert.ok(reloaded.savedWords.some(s=>s.id==='saved-word-regression'));assert.equal(reloaded.linguistic.progression.vocabulary['lex:what-pani'].mastery,.5);assert.ok(await page.evaluate(()=>JSON.parse(localStorage.getItem('punjabi-learning-v1')).wordProgress['what-pani'].correct>=12));
      assert.equal(reloaded.linguistic.entries['lex:v-pina'].forms['1sg'],'my custom drink form');assert.equal(reloaded.linguistic.entries['lex:state-extra-clean'].forms.m,'my custom adjective');
      console.log(name+': templates, vocabulary, flashcards, game and reload passed; checking offline');
      await page.evaluate(async()=>{await Promise.race([navigator.serviceWorker.ready,new Promise((_,reject)=>setTimeout(()=>reject(Error('Service worker did not finish installation')),20000))]);});await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
      const cached=await page.evaluate(async()=>{const keys=await caches.keys(),cache=await caches.open(keys.find(k=>k.startsWith('punjabi-sentence-builder-')));return (await cache.keys()).map(r=>new URL(r.url).pathname);});
      const requiredAssets=await page.locator('script[src]').evaluateAll(scripts=>scripts.map(script=>new URL(script.src)).filter(url=>url.origin===location.origin).map(url=>url.pathname));
      for(const asset of requiredAssets)assert.ok(cached.includes(asset),asset+' precached');
      const offlineMethod=type===webkit?'origin-server-stopped':'browser-offline';if(type===webkit)await stop(active.app);else await context.setOffline(true);
      await page.reload({waitUntil:'domcontentloaded'});await page.waitForSelector('#blocksSubnav button',{state:'attached'});await page.locator('#generateBtn').click();assert.ok(await hasPunjabi(page.locator('#outputCard .gurmukhi-line')));
      const offlineFailedTemplates=[];for(const id of templateIds){await page.locator('#batchTemplateSelect').selectOption(id);await page.locator('#batchGenerateBtn').click();const result=page.locator('#batchResults .gurmukhi-line').first();if(!await result.count()||!await hasPunjabi(result))offlineFailedTemplates.push(id);}assert.deepEqual(offlineFailedTemplates,[]);
      await page.locator('[data-screen="vocabulary"]').click();await page.locator('#vocabularySearch').fill('integration sentinel');assert.equal(await page.locator('.vocabulary-word').count(),1);
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);assert.equal(overflow,false,'No horizontal overflow at tested viewport');assert.deepEqual(errors,[]);
      reports.push({browser:name,engineVersion:browser.version(),physicalDevice:false,viewport:await page.evaluate(()=>({width:innerWidth,height:innerHeight})),discoverableEntries:libraryCount,templates:templateIds.length,failedTemplates,offlineFailedTemplates,loadMs,searchMs,templateMs,totalMs:Date.now()-started,offline:true,offlineMethod,cachedScriptAssets:requiredAssets,migration:{previousFeatureCompactSnapshot:true,backupMatchesOriginal:true,savedSentences:true,savedWords:true,customWords:true,customTemplates:true,templateEdits:true,disabledRoleBindings:true,translationEdits:true,importedTranslationEdits:true,nestedVerbForms:true,nestedAdjectiveForms:true,deletionTombstones:true,priorWordGameProgress:true,customSettings:true,vocabularyMastery:true,reloadSentinelsPreserved:true},expandedBreakdown:true,wordFlashcards:{dictionaryTemplate:true,persistedWordMode:true,persistedBodyTopic:true,selectedSenseMatchesBreakdown:true,savedCanonicalIdPreserved:true,bodyKaathMeaning:flashTopic.wood.english},wordGame:{actualBodySenseQuery:true,bodyKaathMeaning:gameTopic.wood.english,sharedCanonicalAndSenseIds:true,dictionaryMeaningUnchanged:true},horizontalOverflow:overflow,pageErrors:errors});
    }finally{if(browser)await browser.close();await stop(active.app);}
  }
  assert.equal(provenance().inputSha256,inputProvenance.inputSha256,'Source inputs changed during browser checks; rerun against frozen sources.');
  fs.mkdirSync(path.join(repo,'reports'),{recursive:true});fs.writeFileSync(path.join(repo,'reports','browser-check.json'),JSON.stringify({provenance:inputProvenance,completedAt:new Date().toISOString(),success:true,reports},null,2)+'\n');console.log(JSON.stringify(reports,null,2));
}
run().catch(error=>{fs.mkdirSync(path.join(repo,'reports'),{recursive:true});fs.writeFileSync(path.join(repo,'reports','browser-check.json'),JSON.stringify({provenance:provenance(),success:false,error:error.message},null,2)+'\n');console.error(error);process.exitCode=1;});
