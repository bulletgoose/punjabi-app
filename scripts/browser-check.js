'use strict';
// Run with Playwright installed: node scripts/browser-check.js
// Optional BASELINE_DIR supplies an untouched checkout for migration fixtures.
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const assert=require('node:assert/strict');
const {chromium,webkit,devices}=require('playwright');
const repo=path.resolve(__dirname,'..');
function server(directory){return new Promise(resolve=>{
  const app=http.createServer((req,res)=>{
    const requested=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const file=path.resolve(directory,'.'+(requested==='/'?'/index.html':requested));
    if(!file.startsWith(directory+path.sep)){res.writeHead(403).end();return;}
    fs.readFile(file,(error,data)=>{
      if(error){res.writeHead(404).end();return;}
      const types={'.html':'text/html','.js':'text/javascript','.png':'image/png','.webmanifest':'application/manifest+json'};
      res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(data);
    });
  });
  app.listen(0,'127.0.0.1',()=>resolve({app,url:'http://127.0.0.1:'+app.address().port}));
});}
async function readState(page){return page.evaluate(()=>JSON.parse(localStorage.getItem('punjabi-app-state-v1')));}
async function run(){
  const active=await server(repo);let baseline;
  const reports=[];
  try{
    let legacy,pristine;
    if(process.env.BASELINE_DIR){
      baseline=await server(path.resolve(process.env.BASELINE_DIR));
      const browser=await chromium.launch();const page=await browser.newPage();
      await page.goto(baseline.url);await page.waitForSelector('#blocksSubnav button',{state:'attached'});
      legacy=await readState(page);pristine=JSON.parse(JSON.stringify(legacy));
      const counts=Object.fromEntries(Object.entries(legacy.vocab).map(([id,rows])=>[id,rows.length]));
      fs.mkdirSync(path.join(repo,'reports'),{recursive:true});
      fs.writeFileSync(path.join(repo,'reports','baseline.json'),JSON.stringify({counts,words:Object.values(legacy.vocab).flat().length,verbs:legacy.verbs.length,templates:legacy.templates.length,enabledTemplates:legacy.templates.filter(t=>t.enabled).length},null,2)+'\n');
      if(process.env.BASELINE_ONLY){await browser.close();return;}
      await browser.close();
      legacy.saved.push({id:'saved-regression',roman:'test',gurmukhi:'ਟੈਸਟ',english:'Existing saved sentence'});
      legacy.savedWords=[{id:'saved-word-regression',roman:'pāṇī',gurmukhi:'ਪਾਣੀ',english:'water'}];
      legacy.vocab.WHAT.find(w=>w.id==='what-pani').e='my edited water';
      legacy.vocab.WHAT.find(w=>w.id==='what-kitab').enabled=false;
      legacy.vocab.WHAT.push({id:'custom-regression',p:'seb',g:'ਸੇਬ',e:'my apple',gender:'m',number:'sg',tags:['edible'],enabled:true});
    }
    for(const [name,type,options] of [['desktop-chromium',chromium,{}],['iphone-webkit',webkit,devices['iPhone 13']]]){
      console.log('Checking '+name);
      const browser=await type.launch();const context=await browser.newContext(options);const page=await context.newPage();
      const errors=[];page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));
      if(legacy)await page.addInitScript(({state})=>{
        if(!localStorage.getItem('punjabi-app-state-v1')){
          localStorage.setItem('punjabi-app-state-v1',JSON.stringify(state));
          localStorage.setItem('punjabi-learning-v1',JSON.stringify({wordProgress:{'what-pani':{correct:12,wrong:3,streak:4}},game:{bestScore:42}}));
        }
      },{state:legacy});
      const started=Date.now();await page.goto(active.url,{waitUntil:'domcontentloaded'});await page.waitForSelector('#blocksSubnav button',{state:'attached'});
      let state=await readState(page);
      assert.ok(state.linguistic);assert.equal(state.vocab,undefined);assert.equal(state.verbs,undefined);
      if(pristine&&name==='desktop-chromium'){
        const summary=await page.evaluate(({pristine})=>{
          const overlays=new Map(PUNJABI_GRAMMAR_READY_VOCABULARY.map(row=>[row.id,row]));
          const expansion=PUNJABI_VOCABULARY_EXPANSION.map(row=>overlays.has(row.id)?Object.assign({},row,overlays.get(row.id),{quality:Object.assign({},row.quality,{grammarEligible:true})}):row);
          PunjabiLinguisticSystem.install(pristine,{categories:PunjabiLearningContext.categories,expansion});
          const entries=Object.values(pristine.linguistic.entries).filter(e=>!e.deleted);
          const countBy=field=>entries.reduce((counts,e)=>{const value=e[field]||'unrecorded';counts[value]=(counts[value]||0)+1;return counts;},{});
          return {totalBefore:535,totalAfter:entries.length,newCanonicalImports:entries.filter(e=>e.importedDataset).length,legacyCanonical:entries.filter(e=>!e.importedDataset).length,aliasCount:Object.keys(pristine.linguistic.aliases).length,importedRecords:expansion.length,reviewedImportedNouns:expansion.filter(e=>e.verifiedGrammar).length,partsOfSpeech:countBy('partOfSpeech'),gender:countBy('gender'),categories:Object.fromEntries(Object.values(pristine.linguistic.categories).map(c=>[c.id,(c.vocabularyIds||[]).length])),compactCharacters:JSON.stringify(PunjabiLinguisticSystem.snapshot(pristine,{compact:true})).length};
        },{pristine});
        fs.writeFileSync(path.join(repo,'reports','vocabulary-integration.json'),JSON.stringify(summary,null,2)+'\n');
      }
      const entries=await page.evaluate(()=>{const state=JSON.parse(localStorage.getItem('punjabi-app-state-v1'));PunjabiLinguisticSystem.install(state,{categories:PunjabiLearningContext.categories,expansion:PUNJABI_VOCABULARY_EXPANSION});return Object.values(state.linguistic.entries).filter(e=>!e.deleted);});
      assert.ok(entries.length>500);
      if(legacy){
        assert.ok(state.saved.some(s=>s.id==='saved-regression'));
        assert.ok(state.savedWords.some(s=>s.id==='saved-word-regression'));
        assert.ok(entries.some(e=>e.e==='my edited water'));
        assert.ok(entries.some(e=>e.e==='my apple'));
        assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('punjabi-learning-v1')).wordProgress['what-pani'].correct),12);
        assert.ok(await page.evaluate(()=>localStorage.getItem('punjabi-app-state-before-linguistic-v1')));
      }
      await page.locator('#generateBtn').click();assert.ok(await page.locator('#outputCard .gurmukhi-line').textContent());
      await page.locator('#saveMainBtn').click();
      const templateIds=await page.locator('#batchTemplateSelect option').evaluateAll(rows=>rows.map(r=>r.value).filter(id=>id!=='__random__'));
      console.log(name+': migration and main generator passed; checking '+templateIds.length+' templates');
      const failedTemplates=[];
      for(const id of templateIds){
        if(Number(id.slice(1))%10===0)console.log(name+': template '+id);
        await page.locator('#batchTemplateSelect').selectOption(id);
        await page.locator('#batchGenerateBtn').click();
        if(!await page.locator('#batchResults .gurmukhi-line').count())failedTemplates.push(id);
      }
      assert.deepEqual(failedTemplates,[]);console.log(name+': all templates generated');
      await page.locator('[data-screen="vocabulary"]').click();
      const renderStarted=Date.now();await page.locator('#vocabularySearch').fill('water');
      assert.ok(await page.locator('.vocabulary-word').count());
      const searchMs=Date.now()-renderStarted;
      await page.locator('#addVocabularyWord').click();
      await page.locator('[name="roman"]').fill('nava test');
      await page.locator('[name="gurmukhi"]').fill('ਨਵਾਂ ਟੈਸਟ');
      await page.locator('[name="english"]').fill('integration sentinel');
      await page.locator('#vocabularyEditForm [type="submit"]').click();
      await page.locator('#vocabularySearch').fill('integration sentinel');
      assert.equal(await page.locator('.vocabulary-word').count(),1);

      const persisted=await readState(page);
      const custom=Object.values(persisted.linguistic.entries).find(e=>e.e==='integration sentinel');assert.ok(custom);
      await page.locator('[data-screen="flashcards"]').click();
      await page.locator('#flashContent').selectOption('words');
      await page.locator('#startFlash').click();await page.locator('#revealFlash').click();
      assert.ok(await page.locator('.flash-answer').textContent());
      await page.locator('[data-rating="good"]').click();
      await page.locator('[data-screen="vocab-game"]').click();
      assert.ok(await page.locator('#screen-vocab-game').textContent());
      await page.locator('#gameChallenge').selectOption('text');await page.locator('#gameGridSize').selectOption('4');
      await page.locator('#gamePromptScript').selectOption('english');await page.locator('#gameScript').selectOption('gurmukhi');
      await page.locator('#gameTimed').uncheck();await page.locator('#gameMaxStrikes').fill('0');
      await page.locator('#gameRounds').evaluate(el=>{el.value='1';el.dispatchEvent(new Event('input',{bubbles:true}));});
      await page.locator('#startWordGame').click();await page.waitForSelector('.game-tile');
      const correctId=await page.evaluate(()=>{
        const state=JSON.parse(localStorage.getItem('punjabi-app-state-v1'));PunjabiLinguisticSystem.install(state,{expansion:PUNJABI_VOCABULARY_EXPANSION});
        const meaning=document.getElementById('gamePrompt').textContent.trim();return PunjabiLinguisticSystem.vocabulary(state).find(w=>w.english===meaning).id;
      });
      await page.locator('[data-game-id="'+correctId+'"]').click();
      assert.ok(await page.evaluate(()=>Object.values(JSON.parse(localStorage.getItem('punjabi-learning-v1')).progression.vocabulary).some(p=>p.correct>0)));
      await page.reload({waitUntil:'domcontentloaded'});await page.waitForSelector('#blocksSubnav button',{state:'attached'});
      assert.ok(Object.values((await readState(page)).linguistic.entries).some(e=>e.id===custom.id));
      console.log(name+': editing, flashcards and reload passed; checking offline');
      await page.evaluate(async()=>{await Promise.race([navigator.serviceWorker.ready,new Promise((_,reject)=>setTimeout(()=>reject(Error('Service worker did not finish installation')),15000))]);});
      await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
      const cached=await page.evaluate(async()=>{const keys=await caches.keys();const cache=await caches.open(keys.find(k=>k.startsWith('punjabi-sentence-builder-')));return (await cache.keys()).map(r=>r.url);});
      assert.ok(cached.some(url=>url.includes('vocabulary-expansion')));
      const offlineMethod=name==='iphone-webkit'?'origin-server-stopped':'browser-offline';
      if(name==='iphone-webkit'){active.app.closeAllConnections();await new Promise(resolve=>active.app.close(resolve));}
      else await context.setOffline(true);
      await page.reload({waitUntil:'domcontentloaded'});await page.waitForSelector('#blocksSubnav button',{state:'attached'});
      await page.locator('#generateBtn').click();assert.ok(await page.locator('#outputCard .gurmukhi-line').textContent());
      await page.locator('[data-screen="vocabulary"]').click();await page.locator('#vocabularySearch').fill('integration sentinel');
      assert.equal(await page.locator('.vocabulary-word').count(),1);
      assert.deepEqual(errors,[]);
      reports.push({browser:name,entries:entries.length,templates:templateIds.length,failedTemplates,searchMs,totalMs:Date.now()-started,offline:true,offlineMethod,migration:!!legacy,pageErrors:errors});
      await browser.close();
    }
    fs.mkdirSync(path.join(repo,'reports'),{recursive:true});
    fs.writeFileSync(path.join(repo,'reports','browser-check.json'),JSON.stringify(reports,null,2)+'\n');
    console.log(JSON.stringify(reports,null,2));
  }finally{active.app.close();if(baseline)baseline.app.close();}
}
run().catch(error=>{console.error(error);process.exit(1);});
