#!/usr/bin/env node
'use strict';
// Reproducible morphology evidence extractor, never a general dictionary approval.
const fs=require('node:fs'),crypto=require('node:crypto');
const input=process.argv[2];if(!input)throw Error('Usage: node scripts/build-verb-profiles.js SOURCE.jsonl');
const raw=fs.readFileSync(input);const sha=crypto.createHash('sha256').update(raw).digest('hex');
const dictionary=require('../data/vocabulary-expansion').entries;
const source=new Map(raw.toString('utf8').trim().split('\n').map(JSON.parse).filter(e=>e.pos==='verb'&&/[\u0a00-\u0a7f]/u.test(e.word)).map(e=>[e.word,e]));
const persons=['1sg','2sg','3sg','1pl','2pl','3pl'];
const aux={roman:['hā̃','haĩ','hai','hā̃','ho','han'],gurmukhi:['ਹਾਂ','ਹੈਂ','ਹੈ','ਹਾਂ','ਹੋ','ਹਨ']};
const regularFuture={roman:{m:['ā̃gā','ẽgā','egā','ā̃ge','oge','aṇge'],f:['ā̃gī','ẽgī','egī','ā̃gīā̃','ogīā̃','aṇgīā̃']},gurmukhi:{m:['ਾਂਗਾ','ੇਂਗਾ','ੇਗਾ','ਾਂਗੇ','ੋਗੇ','ਣਗੇ'],f:['ਾਂਗੀ','ੇਂਗੀ','ੇਗੀ','ਾਂਗੀਆਂ','ੋਗੀਆਂ','ਣਗੀਆਂ']}};
const intransitive=new Set(['laugh','smile','run','walk','sit','sit down','stand','sleep','speak','talk','think','live','dance','swim','cry','weep','cough','sneeze','work','rest','travel','arrive','come','go','rise','get up','wake up','wait','sing','play','jump','crawl','climb','return','agree','disagree','pray','look','breathe','yawn','listen']);
const objectTags={eat:['edible'],drink:['drinkable'],read:['readable'],write:['writable'],watch:['watchable'],see:['watchable'],hear:['listenable'],listen:['listenable'],cook:['cookable'],learn:['learnable'],understand:['understandable'],buy:['buyable'],sell:['buyable'],give:['giveable'],take:['takeable'],bring:['bringable'],send:['sendable'],find:['findable'],open:['openable'],close:['closable'],wash:['washable'],clean:['cleanable'],wear:['wearable'],hold:['physical-object'],keep:['physical-object'],carry:['physical-object'],lift:['physical-object'],drop:['physical-object'],throw:['physical-object'],cut:['cuttable'],break:['breakable'],build:['buildable'],repair:['repairable'],count:['countable'],draw:['drawable'],paint:['paintable'],plant:['plantable'],water:['plantable'],dig:['diggable'],fold:['foldable'],taste:['edible'],smell:['physical-object'],touch:['physical-object'],choose:['buyable'],collect:['physical-object'],save:['saveable'],remember:['memorable'],forget:['memorable'],say:['speakable'],tell:['speakable'],ask:['answerable'],answer:['answerable']};
const blockedPerfective=new Set(['ਕਰ','ਖਾ','ਪੀ','ਜਾ','ਦੇ','ਲੈ','ਪੈ','ਸੌਂ','ਸੌ','ਸੀ','ਪੀਹ','ਬਹਿ','ਰਹਿ','ਢਹਿ','ਜੋ','ਵਿੰਨ੍ਹ','ਗੁੰਨ੍ਹ','ਰਿੰਨ੍ਹ','ਬੰਨ੍ਹ']);
// Explicit lemma/sense authorization for useful verbs whose dictionary tables
// have no transitivity tag. Each base must occur as a complete gloss alternative.
const authored={
 'ਖ਼ਰੀਦਣਾ':['buy',true], 'ਲਿਖਣਾ':['write',true], 'ਸਿੱਖਣਾ':['learn',true], 'ਪੜ੍ਹਣਾ':['read',true],
 'ਖੇਡਣਾ':['play',false], 'ਚੱਲਣਾ':['walk',false], 'ਨੱਚਣਾ':['dance',false], 'ਛਿੱਕਣਾ':['sneeze',false],
 'ਦੌੜਣਾ':['run',false], 'ਬੋਲਣਾ':['speak',false], 'ਆਖਣਾ':['speak',false], 'ਜਾਗਣਾ':['wake up',false],
 'ਕਰਾਹਣਾ':['groan',false], 'ਕੰਬਣਾ':['tremble',false], 'ਥੁੱਕਣਾ':['spit',false],
 'ਪਰਤਣਾ':['return',false], 'ਬਹੁੜਨਾ':['return',false], 'ਮੁੜਣਾ':['return',false], 'ਮੰਨਣਾ':['agree',false],
 'ਖਿੱਚਣਾ':['pull',true], 'ਛਾਪਣਾ':['print',true], 'ਚੱਟਣਾ':['taste',true], 'ਪੂੰਝਣਾ':['wipe',true],
 'ਲਖਣਾ':['understand',true], 'ਸੁੰਘਣਾ':['smell',true]
};
['stroll','depart','stop','halt','pause','linger','hide','win','succeed','wander','roam','hesitate','shudder','fall','dive','vomit','retch','groan','tremble','spit'].forEach(x=>intransitive.add(x));
Object.assign(objectTags,{pull:['physical-object'],print:['writable'],wipe:['cleanable'],fry:['cookable'],chew:['edible'],nibble:['edible'],suck:['edible'],sow:['plantable'],lift:['physical-object'],weigh:['physical-object'],request:['giveable'],borrow:['loanable'],distribute:['giveable'],allocate:['giveable']});
const profiles=[],restrictions=[];
const cleanCells=e=>(e.forms||[]).filter(f=>f.source==='conjugation'&&f.form&&f.roman&&!f.tags?.some(t=>t.startsWith('error')||['dialectal','uncommon','usually','archaic','obsolete'].includes(t)));
const has=(cells,g,tags)=>cells.some(f=>f.form===g&&tags.every(t=>f.tags?.includes(t)));
for(const e of dictionary.filter(e=>e.partOfSpeech==='verb')){
 const r=source.get(e.g),cells=r?cleanCells(r):[];
 const s=cells.find(f=>f.tags?.includes('stem')&&!f.form.includes(' '));
 if(!s||e.g.includes(' ')||!/[ਣਨ]ਾ$/u.test(e.g)){restrictions.push({id:e.id,reason:'Missing simple source-supported stem or multiword/form entry.'});continue;}
 const consonantal=/[ਕ-ਹੜਸ਼ਖਗਜ਼ਫਲ਼]$/u.test(s.form)&&!/[ਾਿੀੁੂੇੈੋੌੰਂ]$/u.test(s.form);
 // Source romanization sometimes retains final schwa. Strip it only for the
 // independently identified consonant-final Gurmukhi stem.
 const rootR=consonantal?s.roman.replace(/[aă]$/u,''):s.roman;
 const habitualG={m:s.form+'ਦਾ',f:s.form+'ਦੀ',pl:s.form+'ਦੇ',fpl:s.form+'ਦੀਆਂ'};
 const habitualR={m:rootR+'dā',f:rootR+'dī',pl:rootR+'de',fpl:rootR+'dīā̃'};
 const pastG={m:s.form+'ਿਆ',f:s.form+'ੀ',pl:s.form+'ੇ',fpl:s.form+'ੀਆਂ'};
 const pastR={m:rootR+'iā',f:rootR+'ī',pl:rootR+'e',fpl:rootR+'īā̃'};
 const habitualOK=consonantal&&Object.entries(habitualG).every(([,g])=>has(cells,g,['imperfective','participle']));
 if(!habitualOK){restrictions.push({id:e.id,reason:'Vowel/stem alternation or incomplete source comparison: needs authored paradigm.'});continue;}
 const future={roman:{m:{},f:{}},gurmukhi:{m:{},f:{}}};
 const futureOK=['m','f'].every(gender=>has(cells,s.form+regularFuture.gurmukhi[gender][0],['first-person','future','singular',gender==='m'?'masculine':'feminine'])&&has(cells,s.form+regularFuture.gurmukhi[gender][2],['third-person','future','singular',gender==='m'?'masculine':'feminine']));
 if(futureOK)for(const script of ['roman','gurmukhi'])for(const gender of ['m','f'])persons.forEach((p,i)=>future[script][gender][p]=(script==='roman'?rootR:s.form)+regularFuture[script][gender][i]);
 const pastOK=!blockedPerfective.has(s.form)&&Object.entries(pastG).every(([,g])=>has(cells,g,['perfective','participle']));
 const eligibleSenses=(e.meanings||[]).map(m=>{
   const gloss=String(m.english||'').toLowerCase();
   // Only simple parallel lexical alternatives. Parenthesized/qualified senses
   // remain restricted unless an exact authored lemma below covers them.
   const alternatives=gloss.split(/[,;]/u).map(x=>x.trim().replace(/^to\s+/u,'').replace(/[.]$/u,''));
   const tags=m.tags||[]; const manual=authored[e.g];
   if(manual&&alternatives.includes(manual[0]))return {senseId:m.id,base:manual[0],transitive:manual[1],requiredObjectTags:manual[1]?(objectTags[manual[0]]||[]):[],argumentEvidence:'authored-lemma-and-dictionary-sense'};
   if(tags.some(t=>['figuratively','auxiliary','modal'].includes(t)))return null;
   if(/[()]/u.test(gloss))return null;
   // Intersect with an explicit semantic lexicon; do not select the first gloss.
   const bare=tags.includes('intransitive')&&alternatives.find(x=>intransitive.has(x));
   if(bare)return {senseId:m.id,base:bare,transitive:false,requiredObjectTags:[],argumentEvidence:'source-intransitive-tag'};
   const action=tags.includes('transitive')&&alternatives.find(x=>objectTags[x]);
   if(action)return {senseId:m.id,base:action,transitive:true,requiredObjectTags:objectTags[action],argumentEvidence:'source-transitive-tag'};
   return null;
 }).filter(Boolean);
 const selected=eligibleSenses.find(s=>!s.transitive)||eligibleSenses[0];
 if(futureOK)for(const gender of ['m','f']){future.gurmukhi[gender]['3pl']=e.g.replace(/ਾ$/u,'')+(gender==='m'?'ਗੇ':'ਗੀਆਂ');if(/ਨਾ$/u.test(e.g))future.roman[gender]['3pl']=rootR+(gender==='m'?'ange':'angīā̃');}
 const forms={},gForms={};persons.forEach((p,i)=>{const k=p.endsWith('pl')?'pl':'m';forms[p]=habitualR[k]+' '+aux.roman[i];gForms[p]=habitualG[k]+' '+aux.gurmukhi[i];});
 profiles.push({id:e.id,p:e.p,g:e.g,sourceEnglish:e.e,root:rootR,infinitive:e.p,imperative:rootR+'o',habitual:habitualR,forms,gScript:{root:s.form,infinitive:e.g,imperative:s.form+'ੋ',habitual:habitualG,forms:gForms},...(futureOK?{future:future.roman}:{}),...(pastOK?{perfective:pastR}:{}),...(selected?{base:selected.base,selectedSenseId:selected.senseId,transitive:selected.transitive,takesTags:selected.requiredObjectTags,subjectClass:'human',verifiedGrammar:true}:{}),eligibleSenses,grammarReview:{status:'source-cells-and-reference-rule;native-review-pending',nativeReviewed:false,scope:'Consonant-final simple stem only. Habitual/perfective agreement cells compared with source. Future 1sg/3sg cells crosschecked; remaining person endings use Gill & Gleason §5.20. Respectful/plural imperative uses the consonantal root + -o rule from §5.23; extraction-error-tagged imperative cells are not treated as verified source cells. Semantic authorization is separate and restricted to listed senses.',sourceSnapshotSha256:sha,sourceUrl:e.source.url,references:[{url:'https://pt.learnpunjabi.org/assets/a%20reference%20grammar_final.pdf',sections:'5.16–5.20; 5.23; 8.4–8.5'}]},...(futureOK?{gFuture:future.gurmukhi}:{}),...(pastOK?{gPerfective:pastG}:{})});
}
const metadata={sourceSha256:sha,profileCount:profiles.length,semanticEligibleCount:profiles.filter(p=>p.verifiedGrammar).length,futureCount:profiles.filter(p=>p.future).length,perfectiveCount:profiles.filter(p=>p.perfective).length,restrictions};
fs.writeFileSync('data/verb-morphology-profiles.js','// Adapted dictionary morphology metadata: CC BY-SA 4.0; see VOCABULARY_LICENSE.txt.\n(function(root,factory){if(typeof module==="object"&&module.exports)module.exports=factory();else root.PUNJABI_VERB_MORPHOLOGY_PROFILES=factory();})(typeof globalThis!=="undefined"?globalThis:this,function(){return '+JSON.stringify({profiles,metadata})+';});\n');
console.log(metadata.profileCount,metadata.semanticEligibleCount,metadata.futureCount,metadata.perfectiveCount);
