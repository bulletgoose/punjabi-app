/* Positive catalog hydration. Older libraries are rebuilt, not archived. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PunjabiCatalogState=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const clone=value=>JSON.parse(JSON.stringify(value));
  const object=value=>value&&typeof value==='object'&&!Array.isArray(value);
  const array=value=>Array.isArray(value)?value:[];
  const normalized=value=>String(value||'').normalize('NFC').trim().replace(/\s+/g,' ');
  const fields=(value,names)=>Object.fromEntries(names.filter(k=>value&&value[k]!==undefined).map(k=>[k,clone(value[k])]));
  function identities(catalog){return new Set([...Object.keys(catalog.registry.entries),...Object.keys(catalog.registry.aliases)]);}
  function progress(records,allowed){
    const result={};for(const [id,value]of Object.entries(records||{}))if(allowed.has(id)&&object(value))result[id]=fields(value,['correct','wrong','incorrect','streak','lastSeen','exposures','mastery','lastReviewed','nextReview','fsrsCard']);return result;
  }
  function cleanProgression(value,allowed){
    return {schemaVersion:1,vocabulary:progress(value&&value.vocabulary,allowed),grammar:object(value&&value.grammar)?clone(value.grammar):{},communication:object(value&&value.communication)?clone(value.communication):{},events:array(value&&value.events).filter(e=>e&&e.dimension!=='vocabulary'||e&&allowed.has(e.id)).map(e=>fields(e,['dimension','id','type','at','correct']))};
  }
  function safeSentence(value,allowed){
    if(!object(value)||!Array.isArray(value.sentenceBreakdown)||!value.sentenceBreakdown.length)return false;
    let found=false,valid=true;
    function visit(node){
      if(!object(node)&&!Array.isArray(node))return;
      for(const [key,item]of Object.entries(node)){
        if(key==='vocabularyId'){found=true;if(!allowed.has(item))valid=false;}
        else if(key==='vocabularyIds'&&Array.isArray(item)){for(const id of item){found=true;if(!allowed.has(id))valid=false;}}
        else if(object(item)||Array.isArray(item))visit(item);
      }
    }
    visit(value);return found&&valid;
  }
  function savedWords(values,catalog){
    const rows=catalog.registry.bindings.WORD.map(b=>({entry:catalog.registry.entries[b.vocabularyId],binding:b}));
    return array(values).flatMap(word=>{
      const matches=rows.filter(({entry,binding})=>normalized(entry.g)===normalized(word.gurmukhi)&&normalized(entry.p)===normalized(word.roman)&&[entry.e,binding.e,...entry.senses.map(s=>s.english),...entry.senses.map(s=>s.contextualGloss)].some(e=>normalized(e)===normalized(word.english)));
      if(matches.length!==1)return [];
      const {entry,binding}=matches[0];return [{id:word.id,roman:entry.p,gurmukhi:entry.g,english:binding.e||entry.e,vocabularyId:entry.id,savedAt:word.savedAt}];
    });
  }
  function restore(previous,catalog){
    previous=object(previous)?previous:{};
    const old=previous.linguistic||{},current=old.catalogRevision===catalog.revision;
    const linguistic=clone(catalog.registry),allowed=identities(catalog);
    if(current){
      for(const [id,e]of Object.entries(old.entries||{}))if(object(e)&&(linguistic.entries[id]||e.catalogEpoch===catalog.revision)&&e.catalogEpoch===catalog.revision){linguistic.entries[id]=clone(e);allowed.add(id);allowed.add(e.primaryId);}
    }else{
      for(const [id,e]of Object.entries(linguistic.entries)){const saved=old.entries&&old.entries[id];if(saved){if(saved.enabled===false)e.enabled=false;if(saved.deleted===true)e.deleted=true;}}
    }
    const baselineBindings=new Map(Object.entries(linguistic.bindings).flatMap(([role,rows])=>rows.map(b=>[role+':'+b.id,b])));
    for(const [role,rows]of Object.entries(old.bindings||{}))for(const b of array(rows)){
      const key=role+':'+b.id,base=baselineBindings.get(key);
      if(base){if(current)Object.assign(base,clone(b));else if(b.enabled===false)base.enabled=false;}
      else if(current&&linguistic.entries[b.vocabularyId]?.catalogEpoch===catalog.revision){(linguistic.bindings[role]||=[]).push(clone(b));}
    }
    for(const [key,t]of Object.entries(old.tombstones||{}))if(object(t)&&['removed-entry','removed-binding'].includes(t.reason)&&allowed.has(t.vocabularyId)&&(!t.id||allowed.has(t.id))){
      linguistic.tombstones[key]=fields(t,['id','vocabularyId','category','reason']);
      if(t.reason==='removed-entry')linguistic.entries[t.vocabularyId].deleted=true;
      if(t.reason==='removed-binding'&&linguistic.bindings[t.category])linguistic.bindings[t.category]=linguistic.bindings[t.category].filter(b=>b.id!==t.id);
    }
    linguistic.aliases={};for(const [id,e]of Object.entries(linguistic.entries))linguistic.aliases[e.primaryId]=id;
    for(const rows of Object.values(linguistic.bindings))for(const b of rows)linguistic.aliases[b.id]=b.vocabularyId;
    linguistic.progression=cleanProgression(old.progression,allowed);
    const templates=current&&Array.isArray(previous.templates)?clone(previous.templates):clone(catalog.templates);
    if(!current)for(const t of templates){const saved=array(previous.templates).find(v=>v.id===t.id);if(saved)Object.assign(t,fields(saved,['enabled','probability','difficulty']));}
    return {schemaVersion:7,linguistic,templates,saved:current?clone(array(previous.saved)):array(previous.saved).filter(v=>safeSentence(v,allowed)).map(v=>fields(v,['id','punjabi','gurmukhi','roman','english','templateId','templateName','difficulty','breakdown','sentenceBreakdown','buildingBlocks','savedAt'])),savedWords:current?clone(array(previous.savedWords)):savedWords(previous.savedWords,catalog)};
  }
  function cleanLearning(value,catalog){
    const allowed=identities(catalog),result=fields(value||{},['display','audio','flash','game','vocabulary']);
    result.wordProgress=progress(value&&value.wordProgress,allowed);result.progression=cleanProgression(value&&value.progression,allowed);
    result.stats={version:1,ratings:[],totalReviews:0,counts:{again:0,hard:0,good:0,easy:0}};return result;
  }
  return Object.freeze({restore,cleanLearning,identities,safeSentence});
});
