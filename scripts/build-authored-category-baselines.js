#!/usr/bin/env node
'use strict';
// Migration provenance only: IDs, hashed identity and existing category IDs.
// The committed application's own fixture supplies the historical default;
// this artifact contains no dictionary text or replacement lexical records.
const fs=require('node:fs');
const path=require('node:path');
const {applicationFixture}=require('./application-fixture');
const reference=process.argv[2]||'49ded7b';
function fingerprint(e){
  const text=JSON.stringify([e.g,e.p,e.e,e.partOfSpeech].map(v=>String(v||'').normalize('NFC').trim().replace(/\s+/g,' ')));
  let a=2166136261,b=2246822519,c=3266489917,d=668265263;
  for(let i=0;i<text.length;i++){const n=text.charCodeAt(i);a=Math.imul(a^n,16777619);b=Math.imul(b^n,2246822519);c=Math.imul(c^n,3266489917);d=Math.imul(d^n,668265263);}
  return [a,b,c,d].map(h=>(h>>>0).toString(16).padStart(8,'0')).join('')+':'+text.length;
}
const fixture=applicationFixture({ref:reference,generation:false});
const baseline=Object.fromEntries(Object.values(fixture.state.linguistic.entries).filter(e=>!e.deleted&&!e.importedDataset).map(e=>[e.primaryId,{fingerprint:fingerprint(e),categories:(e.categories||[]).slice().sort()}]));
const result={metadata:{version:1,reference,entryCount:Object.keys(baseline).length,scope:'Unmodified historical authored category defaults only; no lexical records.'},entries:baseline};
fs.writeFileSync(path.join(__dirname,'../data/authored-category-baselines.js'),'// Historical category migration provenance; no lexical data.\n(function(root,factory){if(typeof module==="object"&&module.exports)module.exports=factory();else root.PUNJABI_AUTHORED_CATEGORY_BASELINES=factory();})(typeof globalThis!=="undefined"?globalThis:this,function(){return '+JSON.stringify(result)+';});\n');
console.log(JSON.stringify(result.metadata));
