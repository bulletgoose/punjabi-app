#!/usr/bin/env node
'use strict';
// Recover only evidence aligned to already-imported senses. No quotations,
// recordings, new words, replacement spellings, or inferred morphology.
const fs=require('node:fs');
const crypto=require('node:crypto');
const path=require('node:path');
const {entries,metadata}=require('../data/vocabulary-expansion');
const POS={noun:'noun',verb:'verb',adj:'adjective',adv:'adverb',pron:'pronoun',num:'numeral',conj:'conjunction',postp:'postposition',prep:'preposition',particle:'particle',det:'determiner',intj:'interjection',phrase:'phrase'};
const clean=v=>String(v||'').normalize('NFC').replace(/\s+/g,' ').trim();
function extract(raw){
  const sha=crypto.createHash('sha256').update(raw).digest('hex');
  if(sha!==metadata.sourceSha256)throw new Error('Source snapshot checksum differs from the imported corpus.');
  const byWord=new Map(entries.map(e=>[e.g+'\0'+e.partOfSpeech,e]));
  const output={};
  for(const line of raw.toString('utf8').split('\n')){
    if(!line.trim())continue;
    const row=JSON.parse(line),entry=byWord.get(clean(row.word)+'\0'+POS[row.pos]);
    if(!entry||row.lang_code!=='pa')continue;
    const accepted=(row.senses||[]).map(s=>({source:s,meaning:entry.meanings.find(m=>m.sourceSenseId&&m.sourceSenseId===s.id)})).filter(s=>s.meaning);
    if(!accepted.length)continue;
    const forms=(row.forms||[]).filter(f=>f.source==='declension'&&f.form!=='-'&&/^[\p{Script=Gurmukhi}\p{Mark}\s’'\-]+$/u.test(f.form||'')&&f.roman&&/^[\p{Script=Latin}\p{Mark}\s’'\-().]+$/u.test(f.roman)).map(f=>({g:clean(f.form),p:clean(f.roman),tags:f.tags||[]}));
    const current=output[entry.id]||(output[entry.id]={g:entry.g,p:entry.p,partOfSpeech:entry.partOfSpeech,senses:{},formSets:[]});
    let formSet=current.formSets.findIndex(x=>JSON.stringify(x)===JSON.stringify(forms));
    if(formSet<0){formSet=current.formSets.length;current.formSets.push(forms);}
    for(const {source,meaning} of accepted){
      // Disambiguation probabilities are explicitly retained. A category
      // spread across senses is never treated as unambiguous source evidence.
      current.senses[meaning.id]={sourceSenseId:source.id,english:meaning.english,
        tags:meaning.tags||[],qualifiers:meaning.qualifiers||[],
        links:(source.links||[]).map(l=>clean(l[0])).filter(Boolean),
        topics:(source.categories||[]).filter(c=>c.orig&&c.langcode==='pa').map(c=>({name:c.name,disambiguation:c._dis||null})),formSet};
    }
  }
  return {metadata:{version:1,sourceSha256:sha,sourceUrl:metadata.sourceUrl,license:'CC-BY-SA-4.0',licenseUrl:metadata.licenseUrl,matchedEntries:Object.keys(output).length,matchedSenses:Object.values(output).reduce((n,e)=>n+Object.keys(e.senses).length,0),modifications:'Retained definition links, sense-disambiguated topic evidence and noun declension cells aligned by original source sense ID. No source conjugations imported.'},entries:output};
}
if(require.main===module){
  const result=extract(fs.readFileSync(process.argv[2]||'/tmp/punjabi-kaikki.jsonl'));
  fs.writeFileSync(path.join(__dirname,'../data/source-evidence.js'),'// Adapted Wiktionary evidence: CC BY-SA 4.0. See docs/VOCABULARY_SOURCES.md.\n(function(root,factory){if(typeof module==="object"&&module.exports)module.exports=factory();else root.PUNJABI_SOURCE_EVIDENCE=factory();})(typeof globalThis!=="undefined"?globalThis:this,function(){return '+JSON.stringify(result)+';});\n');
  console.log(JSON.stringify(result.metadata));
}
module.exports={extract};
