/* Device-local cleanup for the first kept-only catalog. No discarded words. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PunjabiStorageCleanup=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const marker='punjabi-kept-catalog-storage-v1',currentCache='punjabi-sentence-builder-v16';
  function cleanStorage(storage,catalog,stateTools){
    const first=storage.getItem(marker)!==catalog.revision;
    const keys=[];for(let i=0;i<storage.length;i++)keys.push(storage.key(i));
    for(const key of keys)if(key&&key.startsWith('punjabi')&&key!=='punjabi-app-state-v1'&&key!=='punjabi-learning-v1'&&/(?:backup|before|library|vocab|state)/i.test(key))storage.removeItem(key);
    if(first){let value={};try{value=JSON.parse(storage.getItem('punjabi-learning-v1'))||{};}catch(error){}
      storage.setItem('punjabi-learning-v1',JSON.stringify(stateTools.cleanLearning(value,catalog)));
    }
    return first;
  }
  async function clearCaches(environment){
    if(environment.caches){const keys=await environment.caches.keys();await Promise.all(keys.filter(k=>/punjabi/i.test(k)&&k!==currentCache).map(k=>environment.caches.delete(k)));}
    if(environment.indexedDB)await new Promise((resolve,reject)=>{
      const request=environment.indexedDB.deleteDatabase('punjabi-speech-cache-v1');
      let timeout;request.onsuccess=()=>{clearTimeout(timeout);resolve();};request.onerror=()=>{clearTimeout(timeout);reject(request.error||new Error('Old pronunciation storage could not be removed.'));};
      request.onblocked=()=>{timeout=setTimeout(()=>reject(new Error('Close other Punjabi app tabs and reopen the app to finish removing old audio.')),10000);};
    });
  }
  async function run(environment,storage,catalog){
    if(environment.speechSynthesis)environment.speechSynthesis.cancel();
    await clearCaches(environment);storage.setItem(marker,catalog.revision);
  }
  return Object.freeze({cleanStorage,clearCaches,run,currentCache,marker});
});
