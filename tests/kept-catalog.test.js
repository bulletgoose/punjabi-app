'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const catalog=require('../data/vocabulary-catalog'),stateTools=require('../catalog-state'),cleanup=require('../storage-cleanup');
const {applicationFixture}=require('../scripts/application-fixture');
const copy=value=>JSON.parse(JSON.stringify(value));
function storage(initial={}){const map=new Map(Object.entries(initial));return {map,get length(){return map.size;},key:i=>[...map.keys()][i],getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};}

test('the positive catalog has unique IDs, complete forms and resolvable live bindings and senses',()=>{
 const {entries,bindings,aliases}=catalog.registry;
 assert.equal(Object.keys(entries).length,1562);assert.equal(catalog.templates.length,104);
 const bindingIds=new Set();
 for(const [id,e]of Object.entries(entries)){
  assert.equal(id,e.id);assert.ok(e.g&&e.p&&e.e&&e.senses.length,id);
  assert.equal(e.catalogEpoch,catalog.revision);assert.equal(e.cleanupArchived,undefined);assert.equal(e.vocabularyAlternatives,undefined);
  assert.equal(new Set(e.senses.map(s=>s.id)).size,e.senses.length);
 }
 for(const [role,rows]of Object.entries(bindings))for(const b of rows){
  assert.ok(!bindingIds.has(role+':'+b.id),b.id);bindingIds.add(role+':'+b.id);
  assert.equal(aliases[b.id],b.vocabularyId,b.id);
  const e=entries[b.vocabularyId];assert.ok(e,role+' '+b.id);
  if(b.selectedSenseId)assert.ok(e.senses.some(s=>s.id===b.selectedSenseId),b.id);
  if(role==='VERBS')assert.ok(e.root&&e.gScript&&e.forms,b.id);
 }
 for(const id of Object.values(aliases))assert.ok(entries[id],id);
 assert.deepEqual(catalog.registry.tombstones,{});
});

test('an old library is rebuilt without unknown records, aliases, backups or uncertain saved text',()=>{
 const id=Object.keys(catalog.registry.entries)[0],entry=catalog.registry.entries[id];
 const old={linguistic:{entries:{[id]:{enabled:false},'synthetic-obsolete':{id:'synthetic-obsolete',e:'obsolete fixture'}},aliases:{'synthetic-obsolete':'synthetic-obsolete'},progression:{vocabulary:{[id]:{correct:3},'synthetic-obsolete':{correct:8}}}},templates:[{id:catalog.templates[0].id,enabled:false}],saved:[
  {id:'uncertain',english:'unverifiable old text'},
  {id:'invalid',english:'obsolete fixture',sentenceBreakdown:[{vocabularyId:'synthetic-obsolete'}]},
  {id:'valid',english:entry.e,sentenceBreakdown:[{vocabularyId:id}]}],savedWords:[{id:'known',gurmukhi:entry.g,roman:entry.p,english:entry.e},{id:'unknown',gurmukhi:'unknown',roman:'unknown',english:'obsolete fixture'}],oldBackup:'obsolete fixture'};
 const restored=stateTools.restore(old,catalog);
 assert.equal(Object.keys(restored.linguistic.entries).length,1562);assert.equal(restored.linguistic.entries[id].enabled,false);
 assert.equal(restored.templates[0].enabled,false);assert.deepEqual(restored.saved.map(v=>v.id),['valid']);assert.equal(restored.savedWords.length,1);
 assert.equal(restored.linguistic.progression.vocabulary[id].correct,3);assert.ok(!JSON.stringify(restored).includes('obsolete fixture'));assert.ok(!JSON.stringify(restored).includes('synthetic-obsolete'));
 const learning=stateTools.cleanLearning({display:{roman:false},wordProgress:{[id]:{correct:4},'synthetic-obsolete':{correct:8}},stats:{ratings:['obsolete fixture']}},catalog);
 assert.equal(learning.display.roman,false);assert.deepEqual(Object.keys(learning.wordProgress),[id]);assert.deepEqual(learning.stats.ratings,[]);
});

test('compact reload preserves current edits, future user words and explicit retained-word deletions',()=>{
 const f=applicationFixture({generation:false}),row=f.state.vocab.WHAT.find(v=>v.id==='what-kitab');assert.ok(row);
 row.enabled=false;
 f.state.vocab.WHAT.push({id:'new-user-fixture',g:'ਕਿਤਾਬ',p:'kitāb',e:'my book',gender:'f',enabled:true});
 const before=f.lexical.snapshot(f.state,{compact:true});assert.ok(JSON.stringify(before).length<300000);
 const restored=stateTools.restore(before,catalog);f.lexical.install(restored,{catalog,grammar:f.grammar,categories:f.learning.categories});
 assert.equal(restored.vocab.WHAT.find(v=>v.id==='what-kitab').enabled,false);assert.ok(restored.vocab.WHAT.some(v=>v.id==='new-user-fixture'));
 restored.vocab.WHAT=restored.vocab.WHAT.filter(v=>v.id!=='what-kitab');
 const again=stateTools.restore(f.lexical.snapshot(restored,{compact:true}),catalog);f.lexical.install(again,{catalog,grammar:f.grammar,categories:f.learning.categories});
 assert.ok(!again.vocab.WHAT.some(v=>v.id==='what-kitab'));assert.ok(again.vocab.WHAT.some(v=>v.id==='new-user-fixture'));
});

test('approved annotation omissions clean learning and sentence views while retaining dictionary senses',()=>{
 const f=applicationFixture({generation:false}),words=f.lexical.vocabulary(f.state);
 const annotated=Object.values(catalog.registry.entries).filter(e=>e.omittedDictionaryAnnotations?.length);
 assert.equal(annotated.length,49);
 for(const e of annotated){
  const view=words.find(w=>w.vocabularyId===e.id||w.id===e.primaryId||w.id===e.id);assert.ok(view,e.id);
  for(const annotation of e.omittedDictionaryAnnotations){assert.ok(!view.english.includes(annotation),e.id);assert.ok(JSON.stringify(e.senses).includes(annotation),e.id);}
 }
});

test('upgrade removes app backup chunks and obsolete audio/shell caches without touching unrelated storage',async()=>{
 const local=storage({'punjabi-app-state-v1':'current','punjabi-learning-v1':'{}','punjabi-library-before-v1:0':'old fixture','punjabi-vocabulary-backup':'old fixture','punjabi-app-theme':'dark','unrelated':'keep'});
 assert.equal(cleanup.cleanStorage(local,catalog,stateTools),true);assert.equal(local.getItem('punjabi-library-before-v1:0'),null);assert.equal(local.getItem('punjabi-vocabulary-backup'),null);assert.equal(local.getItem('unrelated'),'keep');assert.equal(local.getItem('punjabi-app-theme'),'dark');
 const deleted=[],databases=[];let cancelled=false;
 const environment={speechSynthesis:{cancel(){cancelled=true;}},caches:{async keys(){return ['punjabi-sentence-builder-v15',cleanup.currentCache,'other-app'];},async delete(k){deleted.push(k);}},indexedDB:{deleteDatabase(name){databases.push(name);const request={};queueMicrotask(()=>request.onsuccess());return request;}}};
 await cleanup.run(environment,local,catalog);
 assert.ok(cancelled);assert.deepEqual(deleted,['punjabi-sentence-builder-v15']);assert.deepEqual(databases,['punjabi-speech-cache-v1']);assert.equal(local.getItem(cleanup.marker),catalog.revision);
 const failure=storage();await assert.rejects(cleanup.run({indexedDB:{deleteDatabase(){const request={error:new Error('fixture failure')};queueMicrotask(()=>request.onerror());return request;}}},failure,catalog),/fixture failure/);assert.equal(failure.getItem(cleanup.marker),null);
});

test('offline shell contains existing positive-catalog files and activation replaces old open pages',async()=>{
 const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
 const handlers={},removed=[],navigated=[],added=[];
 const context={URL,Request,Response,self:{registration:{scope:'https://example.test/app/'},location:{origin:'https://example.test'},addEventListener:(type,handler)=>handlers[type]=handler,skipWaiting:async()=>{},clients:{claim:async()=>{},matchAll:async()=>[{url:'https://example.test/app/',navigate:async u=>navigated.push(u)}]}},caches:{open:async()=>({addAll:async rows=>added.push(...rows)}),keys:async()=>['punjabi-sentence-builder-v15','other-app'],delete:async key=>removed.push(key)}};
 vm.runInNewContext(source,context);let pending;handlers.install({waitUntil(p){pending=p;}});await pending;
 for(const request of added){const file=new URL(request.url).pathname.replace('/app/','')||'index.html';assert.ok(fs.existsSync(path.join(root,file)),file);}
 assert.ok(added.some(r=>r.url.includes('vocabulary-catalog.js')));assert.ok(added.some(r=>r.url.includes('sentence-semantic-parameters.js')));
 handlers.activate({waitUntil(p){pending=p;}});await pending;assert.deepEqual(removed,['punjabi-sentence-builder-v15']);assert.equal(navigated.length,1);
});
