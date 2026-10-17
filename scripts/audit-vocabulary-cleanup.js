'use strict';
const fs=require('node:fs'),path=require('node:path'),z=require('node:zlib'),crypto=require('node:crypto');
const cleanup=require('../vocabulary-cleanup'),grammar=require('../grammar-engine');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'reports/vocabulary-cleanup');
const sha=v=>crypto.createHash('sha256').update(typeof v==='string'?v:cleanup.stable(v)).digest('hex');
const save=(name,value)=>{fs.mkdirSync(dir,{recursive:true});const text=JSON.stringify(value,null,name.endsWith('.gz')?0:2)+'\n';fs.writeFileSync(path.join(dir,name),name.endsWith('.gz')?z.gzipSync(text,{level:9}):text);};
const read=name=>JSON.parse(name.endsWith('.gz')?z.gunzipSync(fs.readFileSync(path.join(dir,name))):fs.readFileSync(path.join(dir,name)));
function groups(rows,key){const map=new Map();for(const r of rows){const k=key(r);map.set(k,[...(map.get(k)||[]),r]);}return [...map.values()].filter(g=>g.length>1);}
function refs(l,templates){
  const result={},required=new Set();
  for(const t of templates||[])for(const id of new Set([...(t.requiredVocabularyIds||[]),...grammar.dependenciesFor(t)])){(result[id]||=[]).push({file:'template:'+t.id,kind:'required-binding'});required.add(id);const canonical=l.entries[id]?id:l.aliases[id];if(canonical)required.add(canonical);}
  const files=['index.html','grammar-engine.js','sentence-learning.js','learning-context.js','lexical-semantics.js','game-vocabulary.js','data/verb-morphology-profiles.js','data/grammar-ready-vocabulary.js'];
  for(const file of files){const source=fs.readFileSync(path.join(root,file),'utf8');for(const m of source.matchAll(/['"]([^'"\n]{2,110})['"]/g)){const id=m[1];if(l.entries[id]||l.aliases[id]){(result[id]||=[]).push({file,kind:'literal-reference-or-definition'});required.add(id);required.add(l.entries[id]?id:l.aliases[id]);}}}
  return {references:result,protectedIds:required};
}
function exactGroups(entries){return groups(entries,e=>[cleanup.norm(e.g),cleanup.norm(e.p).toLowerCase(),e.partOfSpeech,cleanup.meaning(e.e)].join('|')).flatMap(g=>{
  const clusters=[];for(const e of g){const old=clusters.find(v=>v.every(x=>cleanup.morphologyCompatible(x,e)));if(old)old.push(e);else clusters.push([e]);}return clusters.filter(v=>v.length>1);
});}
function inventory(label,l,templates,sourceRef){
  const all=Object.values(l.entries).filter(e=>!e.deleted),active=all.filter(e=>!e.cleanupArchived),reference=refs(l,templates),plan=cleanup.plan(l.entries,reference.protectedIds);
  const bindings=Object.entries(l.bindings).flatMap(([category,rows])=>rows.map(b=>({...b,category})));
  const byId=new Map();for(const b of bindings){if(!byId.has(b.vocabularyId))byId.set(b.vocabularyId,[]);byId.get(b.vocabularyId).push(b);}
  const aliases=new Map();for(const [alias,id]of Object.entries(l.aliases)){if(!aliases.has(id))aliases.set(id,[]);aliases.get(id).push(alias);}
  const records=all.map(e=>({id:e.id,primaryId:e.primaryId,active:!e.cleanupArchived,disposition:e.cleanupArchived||null,
    gurmukhi:e.g,roman:e.p,romanVariants:e.romanVariants||[],english:e.e,meanings:e.meanings,pos:e.partOfSpeech,gender:e.gender,number:e.number,
    morphology:cleanup.morphology(e),morphologySha256:sha(cleanup.morphology(e)),metadataSha256:sha({morphology:cleanup.morphology(e),tags:e.semanticTags,roles:e.roleEligibility,senses:e.senses}),
    categories:e.categories,semanticTags:e.semanticTags,frequency:e.frequency,frequencyEvidence:e.frequency==null?'No measured frequency supplied.':'Existing source/user metadata, unchanged.',source:e.source,
    senses:(e.senses||[]).map(s=>({id:s.id,sourceSenseId:s.sourceSenseId,english:s.english,contextualGloss:s.contextualGloss,tags:s.tags,qualifiers:s.qualifiers,
      gender:s.gender,number:s.number,sourceForms:s.sourceForms,semanticTags:s.semanticTags,semanticProperties:Object.fromEntries(Object.entries(s.semanticProperties||{}).filter(([,v])=>v!==false)),
      sentenceEligible:s.sentenceEligible,compatibleRoles:s.compatibleRoles,restrictionReason:s.restrictionReason,metadataSha256:sha(s)})),
    sentenceEligibility:e.roleEligibility,utility:plan.decisions[e.id]||cleanup.utility(e),bindings:byId.get(e.id)||[],aliases:aliases.get(e.id)||[],
    references:[...(reference.references[e.id]||[]),...(aliases.get(e.id)||[]).flatMap(id=>reference.references[id]||[])],
    duplicateDisposition:{exactTarget:plan.merges[e.id]||null,synonymTarget:plan.alternatives[e.id]||null,fringeReason:plan.excluded[e.id]||null,retentionReason:plan.heldSynonyms[e.id]||cleanup.policy.preserveAlternatives[e.g]||null},alternatives:e.vocabularyAlternatives||[]}));
  const exact=exactGroups(active),sameSpelling=groups(active,e=>cleanup.lexicalKey(e));
  const sharedEnglish=groups(active,e=>e.partOfSpeech+'|'+cleanup.meaning(e.e));
  const nearRoman=groups(active,e=>[cleanup.norm(e.g),e.partOfSpeech].join('|')).filter(g=>new Set(g.map(e=>cleanup.norm(e.p))).size>1);
  const roleCounts=Object.fromEntries(Object.entries(l.bindings).map(([role,rows])=>[role,{rows:rows.length,enabled:rows.filter(b=>b.enabled!==false&&!l.entries[b.vocabularyId]?.deleted&&!l.entries[b.vocabularyId]?.cleanupArchived).length,uniqueLexemes:new Set(rows.map(b=>b.vocabularyId)).size}]));
  const duplicateBindings=[];
  for(const [category,rows]of Object.entries(l.bindings))for(const group of groups(rows,b=>cleanup.bindingKey(l.entries[b.vocabularyId],b,category))){
    const eligible=group.filter((b,i)=>i&&group.slice(0,i).some(a=>cleanup.compatibleBindings(l.entries[b.vocabularyId],a,b)&&!(reference.protectedIds.has(a.id)&&reference.protectedIds.has(b.id))));
    if(eligible.length)duplicateBindings.push({category,ids:group.map(b=>b.id),redundant:eligible.length});
  }
  const raw=require('../data/vocabulary-expansion').entries,rawDuplicateIds=groups(raw,e=>e.id),source=require('../data/source-evidence');
  const summary={label,sourceRef,inventoryRecords:records.length,uniqueActiveRecords:active.length,archivedCompatibilityRecords:all.length-active.length,totalBuildingBlockRows:Object.entries(roleCounts).filter(([r])=>!r.startsWith('GAME_')&&r!=='LEXICON').reduce((n,[r,c])=>n+c.rows,0),roles:roleCounts,
    exactRedundantRecords:exact.reduce((n,g)=>n+g.length-1,0),exactDuplicateGroups:exact.map(g=>g.map(e=>e.id)),
    redundantBindingRows:duplicateBindings.reduce((n,g)=>n+g.redundant,0),duplicateBindings,
    sameSpellingGroups:sameSpelling.length,nearRomanGroups:nearRoman.length,sharedEnglishGroups:sharedEnglish.length,
    measuredFrequencyRecords:active.filter(e=>e.frequency!=null).length,utilityTiers:Object.fromEntries([1,2,3,4].map(t=>[t,records.filter(r=>r.utility.tier===t).length])),
    rawSources:{dictionaryRows:raw.length,duplicateDictionaryIds:rawDuplicateIds.length,grammarReadyOverrides:require('../data/grammar-ready-vocabulary').length,sourceEvidenceEntries:Object.keys(source.entries||{}).length,priorCatalogExcluded:require('../data/sentence-catalog-policy').excluded.length},
    cleanup:l.vocabularyCleanup||null,recordIdsSha256:sha(records.map(r=>r.id).sort()),manualBrowserState:'Unavailable: repository-default inventory only. Actual user browser deletions were not inspected.',
    normalization:'NFC, whitespace and English article/case normalization for comparison only. Gurmukhi diacritics and original spellings remain unchanged. Roman near-variants are candidates, not automatic identity proof.'};
  save(label+'.inventory.json.gz',records);save(label+'.summary.json',summary);
  save(label+'.relationships.json.gz',{sameSpelling:sameSpelling.map(g=>g.map(e=>e.id)),nearRoman:nearRoman.map(g=>g.map(e=>e.id)),sharedEnglish:sharedEnglish.map(g=>g.map(e=>e.id)),references:reference.references,rawDuplicateIds});
  return summary;
}
function compare(finalState){
  const b=read('baseline.summary.json'),f=read('final.summary.json'),before=read('baseline.inventory.json.gz'),after=read('final.inventory.json.gz'),byId=new Map(after.map(r=>[r.id,r]));
  const material=[],changed=[],bindingChanged=[];
  for(const old of before){const current=byId.get(old.id);if(!current){material.push({id:old.id,issue:'Missing compatibility record.'});continue;}
    if(old.gurmukhi!==current.gurmukhi||old.roman!==current.roman||old.english!==current.english)material.push({id:old.id,issue:'Original spelling/translation changed.'});
    if(old.metadataSha256!==current.metadataSha256||current.disposition||current.alternatives.length)changed.push(old.id);
    if(sha(old.bindings)!==sha(current.bindings))bindingChanged.push(old.id);
    for(const s of old.senses){const next=current.senses.find(v=>v.id===s.id);if(!next||next.metadataSha256!==s.metadataSha256)material.push({id:old.id,senseId:s.id,issue:'Original dictionary/semantic/morphology metadata changed.'});}
    for(const [k,v]of Object.entries(old.morphology))if(v!=null&&cleanup.stable(v)!==cleanup.stable(current.morphology[k]))material.push({id:old.id,issue:'Original grammatical form changed: '+k});
  }
  const exact=Object.entries(f.cleanup.exactMerges).map(([id,target])=>({id,target,gurmukhi:byId.get(id).gurmukhi,english:byId.get(id).english,roman:byId.get(id).roman}));
  const synonyms=Object.entries(f.cleanup.synonymAlternatives).map(([id,target])=>({id,target,from:byId.get(id).gurmukhi,to:byId.get(target).gurmukhi,english:byId.get(id).english}));
  const fringe=Object.entries(f.cleanup.fringe).map(([id,reason])=>({id,gurmukhi:byId.get(id).gurmukhi,english:byId.get(id).english,reason}));
  const missingReferences=[];for(const r of before)for(const id of r.aliases.concat(r.id))if(!finalState.entries[id]&&!finalState.aliases[id])missingReferences.push(id);
  const result={baseline:b,final:f,metadataRecordsUpdated:new Set(changed.concat(bindingChanged)).size,lexicalMetadataRecordsUpdated:new Set(changed).size,bindingMetadataRecordsUpdated:new Set(bindingChanged).size,exactConsolidations:exact.length,synonymConsolidations:synonyms.length,fringeRemoved:fringe.length,exactExamples:exact,synonymExamples:synonyms,fringeExamples:fringe,
    validation:{originalRecordsAudited:before.length,finalRecordsAudited:after.length,materialMetadataRegressions:material,unresolvedOriginalIds:missingReferences,unwantedExactRecords:f.exactRedundantRecords,unwantedBindingDuplicates:f.redundantBindingRows},
    assessment:'All records were programmatically inventoried and assigned a conservative utility outcome. AI reviewed candidate definition groups and semantic distinctions; this is not a measured-frequency or native-speaker certification.'};
  save('comparison.json',result);return result;
}
if(require.main===module){
  const mode=process.argv[2];
  if(mode==='baseline'){
    const ref=process.argv[3]||'de5527aded10b16d057aec904395d6113ad00f91',f=require('./application-fixture').applicationFixture({ref,generation:false});
    console.log(JSON.stringify(inventory('baseline',f.state.linguistic,f.state.templates,ref),null,2));
  }else if(mode==='final'){
    const f=require('./application-fixture').applicationFixture({generation:false});
    fs.writeFileSync('/tmp/pr10-final-state.json.gz',z.gzipSync(JSON.stringify(f.state.linguistic)));
    const summary=inventory('final',f.state.linguistic,f.state.templates,'working-tree'),result=compare(f.state.linguistic);
    console.log(JSON.stringify({summary,validation:result.validation,metadataRecordsUpdated:result.metadataRecordsUpdated,exactConsolidations:result.exactConsolidations,synonymConsolidations:result.synonymConsolidations,fringeRemoved:result.fringeRemoved},null,2));
  }else throw Error('Use baseline (captured unmodified state) or final.');
}
module.exports={inventory,compare,read,save,refs,exactGroups,sha};
