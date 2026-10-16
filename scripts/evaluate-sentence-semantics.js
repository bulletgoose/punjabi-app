'use strict';
// Development-only, deterministic two-pass corpus capture. The application
// still chooses and renders every sentence; this script only varies its pools.
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),crypto=require('node:crypto');
const {applicationFixture}=require('./application-fixture');
const root=path.resolve(__dirname,'..'),out=path.join(root,'reports/sentence-semantics');
const SEED=20261016,TARGET=200;
const roles=['WHO','WHAT','WHERE','WHEN','HOW','WHY','ABOUT','ADJECTIVE','STATE','QUESTION','CONNECTOR','NUMBER','WORD','VERB'];
const names={WHO:['subject','experiencer','possessor','addressee','recipient','companion'],WHAT:['object','choice','secondChoice','comparison','secondObject','occupation'],WHERE:['location','destination','origin'],WHEN:['time'],HOW:['manner','politeness'],WHY:['reason','reasonClause'],ABOUT:['topic'],ADJECTIVE:['description'],STATE:['description','state'],QUESTION:['question','questionMarker','quantityQuestion'],CONNECTOR:['connector','conditionClause'],NUMBER:['quantity'],WORD:['word'],VERB:['verb','action','modal','imperative','secondVerb']};
const fields=['id','vocabularyId','primaryId','enabled','p','g','e','english','partOfSpeech','pos','selectedSenseId','senseId','senses','meanings','source','translationOverride','phraseTranslationOverride','contextualGloss','construction','semanticTags','tags','gender','number','countability','englishCountability','englishNumber','englishArticle','definiteness','person','englishPerson','semanticProperties','semantic','semantics','ageClass','grammar','roleEligibility','verifiedGrammar','inflections','nounForms','gScript','root','infinitive','base','forms','type','prefix','habitual','future','perfective','takesTags','takesTag','subjectClass','isModalComplement','imperative','objectPostposition','englishByObject','dest','dative','withPossession','time','timeContexts','modifierTargets','modifierKind','indeclinable'];
const legacyStates=['state','stateNegative','stateQuestion','pastState'];
const preferred={WHO:['P64','P02','P63'],WHAT:['P59','P69','P01','P31'],WHERE:['P61','P31','P48'],WHEN:['P66','P03','P43','P33'],HOW:['P66','P13'],WHY:['P71','P36'],ABOUT:['P34','P35'],VERB:['P01','P02','P64','P65','P14'],ADJECTIVE:['P60','P67','P68'],STATE:['P28','P43'],NUMBER:['P87','P96'],WORD:['P88'],QUESTION:[],CONNECTOR:[]};
const digest=data=>crypto.createHash('sha256').update(data).digest('hex');
function write(name,data){fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,name),name.endsWith('.gz')?zlib.gzipSync(data,{level:9}):data);}
function completeQuotas(f,label,records,results){
  const {state,grammar,context}=f,plain=w=>Object.fromEntries(fields.filter(k=>w[k]!==undefined).map(k=>[k,w[k]]));
  const pools=Object.fromEntries(roles.map(role=>[role,Array.from(role==='VERB'?state.verbs:state.vocab[role]||[]).filter(w=>w.enabled!==false).map(plain)]));
  const seen=new Set(records.map(r=>[r.templateId,r.gurmukhi,r.english].join('|')));
  let nextId=Math.max(0,...records.map(r=>Number(r.id.split('-').at(-1))))+1;
  let seed=SEED^0x6a09e667;context.Math.random=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};
  for(const result of results.filter(r=>r.generated<TARGET&&!['whichWant','amountQuestion','numberIdentity','countedPossession','question:who','question:else','question:duration','question:distance','question:count'].includes(r.pattern))){
    const t=state.templates.find(t=>t.id===result.id),role=t.pattern==='occupationIdentity'?'WHAT':result.repairRole||(/^(?:connector:)/.test(t.pattern)?'WHO':'WHAT'),deps=new Set(grammar.dependenciesFor(t));
    const candidates=t.pattern==='occupationIdentity'?pools[role].filter(w=>(w.semanticTags||w.tags||[]).includes('occupation')):pools[role];let attempts=0;
    for(const row of candidates){
      if(result.generated>=TARGET)break;
      const vocab=Object.fromEntries(roles.filter(r=>r!=='VERB').map(r=>{
        const window=Array.from({length:Math.min(16,pools[r].length)},(_,i)=>pools[r][(attempts*13+i)%pools[r].length]);
        return [r,pools[r].slice(0,r==='WHAT'?40:16).concat(window,pools[r].filter(w=>deps.has(w.id)))];
      }));
      vocab[role]=[row];
      if(role==='WHO'&&(grammar.metadataFor(t).requiredRoles||[]).filter(r=>names.WHO.includes(r)).length>1){
        const support=pools.WHO.find(w=>w.vocabularyId!==row.vocabularyId&&w.partOfSpeech==='pronoun');if(support)vocab.WHO.push(support);
      }
      if(t.pattern==='choiceQuestion'){
        const tags=row.semanticTags||row.tags||[],tag=['drinkable','edible','watchable','buyable'].find(tag=>tags.includes(tag));
        const peer=tag&&pools.WHAT.find(w=>w.id!==row.id&&(w.semanticTags||w.tags||[]).includes(tag));if(!peer)continue;vocab.WHAT.push(peer);
      }
      const verbs=pools.VERB.filter((w,i)=>i<24||deps.has(w.id)||['v-sona','v-kamkarna','v-gallkarna','v-chahuna','v-dena','v-jana','v-auna'].includes(w.id));
      for(let i=0;i<3&&result.generated<TARGET;i++){
        const beforeSeed=seed;attempts++;const s=context.assembleWithState(t,{vocab,verbs});if(!s||!s.gurmukhi||!s.english)continue;
        const identity=[t.id,s.gurmukhi,s.english].join('|');if(seen.has(identity))continue;seen.add(identity);
        records.push({id:label+'-'+String(nextId++).padStart(6,'0'),kind:'main',quotaCompletion:true,templateId:t.id,pattern:t.pattern,seed:beforeSeed,iteration:attempts,target:{role,bindingId:row.id,senseId:row.selectedSenseId},gurmukhi:s.gurmukhi,roman:s.roman||s.punjabi,english:s.english,grammarConceptIds:s.grammarConceptIds||grammar.metadataFor(t).grammarConceptIds,semanticValidation:s.semanticValidation,parts:(s.sentenceBreakdown||[]).map(p=>({roman:p.roman,gurmukhi:p.gurmukhi,english:p.english,role:p.role||p.category,category:p.category,grammarNote:p.grammarNote,vocabularyIds:p.vocabularyIds||[p.vocabularyId].filter(Boolean),selectedSenseId:p.selectedSenseId,selections:p.lexicalSelections||[]}))});
        result.generated++;
      }
    }
    result.quotaCompletionAttempts=attempts;result.shortfall=TARGET-result.generated;result.reason=result.shortfall?'All enabled target bindings were offered in bounded forced-pool quota completion; the engine did not yield 200 distinct accepted surfaces.':null;
    console.log(label+' quota '+t.id+': '+result.generated+'/'+TARGET);
  }
}
function refreshSummary(summary,records,coverage){
  const semantic=new Set(),quoted=new Set(),keys=new Set();
  for(const r of records)for(const p of r.parts)for(const s of p.selections){
    (r.pattern==='wordPractice'?quoted:semantic).add(s.vocabularyId);
    for(const role of roles)if(p.category===role||names[role].includes(p.role)||role==='STATE'&&legacyStates.includes(r.pattern)&&p.category==='HOW'){
      keys.add([role,s.vocabularyId,s.senseId||''].join('|'));keys.add([role,s.vocabularyId,''].join('|'));
    }
  }
  for(const c of coverage.bindings){c.exercised=keys.has([c.role,c.vocabularyId,c.senseId||''].join('|'));c.reason=c.exercised?null:c.reason||'No retained accepted matching role/sense output in bounded coverage attempts.';}
  const text=records.map(r=>JSON.stringify(r)).join('\n')+'\n';
  Object.assign(summary,{corpusSha256:digest(text),mainSentences:records.filter(r=>r.kind==='main').length,supplementarySentences:records.filter(r=>r.kind!=='main').length,totalSentences:records.length,distinctSemanticEntries:semantic.size,distinctQuotedEntries:quoted.size,distinctEntries:new Set([...semantic,...quoted]).size,exercisedBindings:coverage.bindings.filter(c=>c.exercised).length,unreachedBindings:coverage.bindings.filter(c=>!c.exercised).length});
  summary.quotaCompletion='Shortfalls with variable content also receive up to three forced-pool attempts for every enabled target binding, retaining fixed dependencies and sleeping/work support verbs. Exact surface duplicates are discarded.';
  write(summary.label+'.corpus.jsonl.gz',text);write(summary.label+'.coverage.json.gz',JSON.stringify(coverage));write(summary.label+'.summary.json',JSON.stringify(summary,null,2)+'\n');
}
function repairPropertyScope(label,summary,records,coverage){
  const f=applicationFixture({seed:SEED}),semantics=f.window.PunjabiLexicalSemantics,entries=f.state.linguistic.entries;
  const old=JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(out,label+'.lexicon.json.gz'))));
  const changed=new Set();
  for(const [id,entry]of Object.entries(entries))for(const s of entry.senses||[]){const before=old[id]?.senses?.find(x=>x.id===s.id);if(before&&JSON.stringify(before.semanticProperties)!==JSON.stringify(s.semanticProperties))changed.add(id+'|'+s.id);}
  const removed=[];
  const retained=records.filter(r=>{
    if(!r.parts.some(p=>p.selections.some(s=>changed.has(s.vocabularyId+'|'+s.senseId))))return true;
    const t=f.state.templates.find(t=>t.id===r.templateId),result=semantics.validateGeneratedSentence({sentenceBreakdown:r.parts.map(p=>({...p,lexicalSelections:p.selections}))},id=>entries[id],t);
    if(result.ok)return true;removed.push({...r,regressionReason:result});return false;
  });
  records.splice(0,records.length,...retained);
  const active=new Set();
  for(const role of roles)for(const w of role==='VERB'?f.state.verbs:f.state.vocab[role]||[])if(w.enabled!==false)active.add([role,w.vocabularyId,w.selectedSenseId||''].join('|'));
  const withdrawn=coverage.bindings.filter(c=>!active.has([c.role,c.vocabularyId,c.senseId||''].join('|'))).map(c=>({...c,reason:'Introduced cross-sense property inheritance repaired; this sense lacks evidence for this role. Dictionary and word-practice entry retained.'}));
  coverage.bindings=coverage.bindings.filter(c=>active.has([c.role,c.vocabularyId,c.senseId||''].join('|')));
  coverage.withdrawnRegressionBindings=withdrawn;
  for(const t of summary.templates){t.generated=records.filter(r=>r.kind==='main'&&r.templateId===t.id).length;t.shortfall=TARGET-t.generated;if(removed.some(r=>r.kind==='main'&&r.templateId===t.id&&r.parts.some(p=>p.category==='WHO'&&p.selections.some(s=>changed.has(s.vocabularyId+'|'+s.senseId)))))t.repairRole='WHO';}
  completeQuotas(f,label,records,summary.templates.filter(t=>removed.some(r=>r.kind==='main'&&r.templateId===t.id)));
  for(const r of records){const t=f.state.templates.find(t=>t.id===r.templateId);r.semanticValidation=semantics.validateGeneratedSentence({sentenceBreakdown:r.parts.map(p=>({...p,lexicalSelections:p.selections}))},id=>entries[id],t);}
  write(label+'.lexicon.json.gz',JSON.stringify(Object.fromEntries(Object.entries(entries).filter(([,e])=>!e.deleted).map(([id,e])=>[id,{id,primaryId:e.primaryId,p:e.p,g:e.g,e:e.e,partOfSpeech:e.partOfSpeech,enabled:e.enabled,meanings:e.meanings,senses:e.senses,semanticTags:e.semanticTags,semanticProperties:e.semanticProperties,roleEligibility:e.roleEligibility,assessment:e.assessment&&{unresolvedReasons:e.assessment.unresolvedReasons},verification:e.verification}]))));
  const ledgerPath=path.join(out,'pass2-property-regression-repairs.json.gz'),prior=fs.existsSync(ledgerPath)?JSON.parse(zlib.gunzipSync(fs.readFileSync(ledgerPath))):{changedSenses:0,removed:[],withdrawnBindings:[]};
  write('pass2-property-regression-repairs.json.gz',JSON.stringify({changedSenses:prior.changedSenses+changed.size,removed:prior.removed.concat(removed),withdrawnBindings:prior.withdrawnBindings.concat(withdrawn)}));
  summary.bindings=coverage.bindings.length;
  const previous=summary.pass2PropertyRegressionRepair||{};
  summary.pass2PropertyRegressionRepair={changedSenses:(previous.changedSenses||0)+changed.size,invalidRecordsReplacedOrWithdrawn:(previous.invalidRecordsReplacedOrWithdrawn||0)+removed.length,mainReplacements:(previous.mainReplacements||0)+removed.filter(r=>r.kind==='main').length,withdrawnRoleBindings:(previous.withdrawnRoleBindings||0)+withdrawn.length,reason:'Audited senses must not inherit entry-wide tags from other senses or gain human bindings from unresolved imported tags. Only records referencing affected senses were revalidated and invalid cases replaced/withdrawn; unaffected records retained.'};
}
function run(label,options={}){
  const f=applicationFixture({seed:SEED,...options}),{state,grammar,lexical,context}=f;
  let seed=SEED;const random=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};context.Math.random=random;
  const plain=row=>Object.fromEntries(fields.filter(k=>row[k]!==undefined).map(k=>[k,row[k]]));
  const pool=Object.fromEntries(roles.map(role=>[role,Array.from(role==='VERB'?state.verbs:state.vocab[role]||[]).filter(w=>w.enabled!==false).map(plain)]));
  const key=(role,w)=>[role,w.vocabularyId||lexical.resolveId(state,w.id),w.selectedSenseId||''].join('|');
  for(const rows of Object.values(pool))for(let i=rows.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[rows[i],rows[j]]=[rows[j],rows[i]];}
  const templates=state.templates.filter(t=>t.enabled),counts=new Map(),seen=new Set(),semanticIds=new Set(),quotedIds=new Set(),records=[],templateResults=[],attemptErrors=new Map();
  const entries=Object.fromEntries(Object.entries(state.linguistic.entries).filter(([,e])=>!e.deleted).map(([id,e])=>[id,{id,primaryId:e.primaryId,p:e.p,g:e.g,e:e.e,partOfSpeech:e.partOfSpeech,enabled:e.enabled,meanings:e.meanings,senses:e.senses,semanticTags:e.semanticTags,semanticProperties:e.semanticProperties,roleEligibility:e.roleEligibility,assessment:e.assessment&&{unresolvedReasons:e.assessment.unresolvedReasons},verification:e.verification}]));
  write(label+'.lexicon.json.gz',JSON.stringify(entries));
  const anchors={};
  for(const role of roles){
    const chosen=[],covered=new Set(),original=Array.from(role==='VERB'?state.verbs:state.vocab[role]||[]).filter(w=>w.enabled!==false);
    for(const w of original){const tags=role==='WHAT'?(w.semanticTags||w.tags||[]):[w.person,w.gender,w.number];
      if(chosen.length<3||tags.some(tag=>tag&&!covered.has(tag))){chosen.push(plain(w));tags.forEach(tag=>covered.add(tag));}
    }
    anchors[role]=chosen.slice(0,role==='WHAT'?40:12);
  }
  function projection(t,iteration,target){
    const deps=new Set(grammar.dependenciesFor(t)),vocab={};
    for(const role of roles){
      const rows=pool[role],window=[];
      if(rows.length){const start=(iteration*13)%rows.length;for(let i=0;i<Math.min(16,rows.length);i++)window.push(rows[(start+i)%rows.length]);}
      const wanted=target&&target.role===role;
      const chosen=wanted?[target.row]:window.concat(anchors[role]);
      // Preserve fixed dependencies without mutating a learner's enabled flags.
      if(!wanted||['QUESTION','CONNECTOR','VERB'].includes(role))chosen.push(...rows.filter(w=>deps.has(w.id)));
      if(wanted&&role==='VERB'&&target.row.type==='modal')chosen.push(...window.filter(v=>v.type!=='modal'));
      const unique=Array.from(new Map(chosen.map(w=>[w.id,w])).values());
      if(role==='VERB')vocab.verbs=unique;else vocab[role]=unique;
    }
    const verbs=vocab.verbs;delete vocab.verbs;return {vocab,verbs};
  }
  function capture(t,iteration,kind,target){
    const projectionState=projection(t,iteration,target),beforeSeed=seed;
    let sentence;try{sentence=context.assembleWithState(t,projectionState);}catch(error){const message=error.message;attemptErrors.set(message,(attemptErrors.get(message)||0)+1);return null;}
    if(!sentence||!sentence.english||!sentence.gurmukhi)return null;
    const parts=sentence.sentenceBreakdown||[];
    if(target&&!parts.some(p=>(p.category===target.role||names[target.role].includes(p.role)||target.role==='STATE'&&legacyStates.includes(t.pattern)&&p.category==='HOW')&&(p.lexicalSelections||[]).some(s=>s.vocabularyId===target.row.vocabularyId&&(!target.row.selectedSenseId||s.senseId===target.row.selectedSenseId))))return null;
    const identity=[t.id,sentence.gurmukhi,sentence.english].join('|');
    if(kind==='main'&&seen.has(identity))return false;
    seen.add(identity);
    const id=label+'-'+String(records.length+1).padStart(6,'0');
    const row={id,kind,templateId:t.id,pattern:t.pattern,seed:beforeSeed,iteration,target:target&&{role:target.role,bindingId:target.row.id,senseId:target.row.selectedSenseId},gurmukhi:sentence.gurmukhi,roman:sentence.roman||sentence.punjabi,english:sentence.english,grammarConceptIds:sentence.grammarConceptIds||grammar.metadataFor(t).grammarConceptIds,semanticValidation:sentence.semanticValidation,parts:parts.map(p=>({roman:p.roman,gurmukhi:p.gurmukhi,english:p.english,role:p.role||p.category,category:p.category,grammarNote:p.grammarNote,vocabularyIds:p.vocabularyIds||[p.vocabularyId].filter(Boolean),selectedSenseId:p.selectedSenseId,selections:p.lexicalSelections||[]}))};
    records.push(row);
    for(const p of parts)for(const selection of p.lexicalSelections||[]){
      const quoted=t.pattern==='wordPractice';(quoted?quotedIds:semanticIds).add(selection.vocabularyId);
      for(const role of roles)if(p.category===role||names[role].includes(p.role)||role==='STATE'&&legacyStates.includes(t.pattern)&&p.category==='HOW'){
        const k=[role,selection.vocabularyId,selection.senseId||''].join('|');counts.set(k,(counts.get(k)||0)+1);
      }
    }
    return row;
  }
  for(const t of templates){
    const start=records.length;let attempts=0,stale=0;
    const fixed=/^(?:question:(?:who|else|duration|distance|count)|whichWant)$/.test(t.pattern);
    const goal=fixed?1:t.pattern==='numberIdentity'?pool.NUMBER.length:TARGET;
    while(records.length-start<Math.min(TARGET,goal)&&attempts<1200&&stale<(records.length>start?160:220)){
      const result=capture(t,attempts++,'main');if(result)stale=0;else stale++;
    }
    const generated=records.length-start;
    templateResults.push({id:t.id,pattern:t.pattern,requested:TARGET,generated,attempts,shortfall:TARGET-generated,reason:generated<TARGET?(fixed?'The template has one fixed surface sentence.':t.pattern==='numberIdentity'?'Finite existing numeral inventory.':'Bounded diverse-pool attempts exhausted; unique outputs/compatibility are limited.'):null});
    console.log(label+' '+t.id+' '+generated+'/'+TARGET+'; '+semanticIds.size+' semantic entries; '+records.length+' sentences');
  }
  const mainCount=records.length,coverage=[];
  let targeted=0;
  for(const role of roles){
    const groups=new Map(pool[role].map(w=>[key(role,w),w]));
    let reached=0,unreached=0;
    for(const [k,row] of groups){
      let proof=counts.has(k),attempts=0;
      const depsRole=['QUESTION','CONNECTOR'].includes(role);
      const candidates=templates.filter(t=>depsRole?grammar.dependenciesFor(t).includes(row.id):(grammar.metadataFor(t).requiredRoles||[]).some(name=>names[role].includes(name)))
        .filter(t=>role==='STATE'?legacyStates.includes(t.pattern):role==='ADJECTIVE'?!legacyStates.includes(t.pattern):true)
        .sort((a,b)=>{const rank=t=>{const n=preferred[role].indexOf(t.id);return n<0?999:n;};return rank(a)-rank(b);});
      if(!proof)for(const t of candidates.slice(0,5)){
        for(let i=0;i<3&&!proof;i++){attempts++;proof=!!capture(t,targeted++,'supplementary',{role,row});}
        if(proof)break;
      }
      proof?reached++:unreached++;
      coverage.push({role,vocabularyId:row.vocabularyId,bindingId:row.id,senseId:row.selectedSenseId||null,exercised:proof,attempts,reason:proof?null:!candidates.length?'No enabled template consumes this binding.':'No accepted matching role/sense output in bounded targeted attempts; incomplete forms, semantics, or construction support require review.'});
    }
    console.log(label+' coverage '+role+': '+reached+'/'+groups.size+' bindings; '+unreached+' explicitly unreached');
  }
  const allBound=new Set(Object.values(pool).flat().map(w=>w.vocabularyId).filter(Boolean));
  const exclusions=Object.values(entries).filter(e=>!allBound.has(e.id)).map(e=>({vocabularyId:e.id,gurmukhi:e.g,partOfSpeech:e.partOfSpeech,reason:e.enabled===false?'Disabled lexical entry.':e.assessment?.unresolvedReasons?.join(' ')||'No enabled sentence-role binding; dictionary retained.',roleEligibility:Object.fromEntries(Object.entries(e.roleEligibility||{}).map(([r,v])=>[r,{eligible:v.eligible,reason:v.reason}]))}));
  const text=records.map(r=>JSON.stringify(r)).join('\n')+'\n';write(label+'.corpus.jsonl.gz',text);
  write(label+'.coverage.json.gz',JSON.stringify({bindings:coverage,unboundEntries:exclusions}));
  const summary={label,seed:SEED,sourceRef:options.ref||'working-tree',corpusSha256:digest(text),enabledTemplates:templates.length,templates:templateResults,mainSentences:mainCount,supplementarySentences:records.length-mainCount,totalSentences:records.length,distinctSemanticEntries:semanticIds.size,distinctQuotedEntries:quotedIds.size,distinctEntries:new Set([...semanticIds,...quotedIds]).size,enabledBoundEntries:allBound.size,bindings:coverage.length,exercisedBindings:coverage.filter(c=>c.exercised).length,unreachedBindings:coverage.filter(c=>!c.exercised).length,unboundEntries:exclusions.length,generationExceptions:Object.fromEntries(attemptErrors),method:'Seeded rotating pools from every enabled binding, semantic-tag anchors and fixed dependencies. Up to 1200 attempts/template; 200 unique bilingual outputs where reachable. At most five templates × three attempts for supplementary uncovered role/sense bindings. Fixed-surface and finite-inventory shortfalls are explicit. Quote-only vocabulary is counted separately from propositional usage.'};
  completeQuotas(f,label,records,summary.templates);refreshSummary(summary,records,{bindings:coverage,unboundEntries:exclusions});return summary;
}
if(require.main===module){const [label,ref,mode]=process.argv.slice(2);if(!['baseline','final'].includes(label))throw Error('Usage: node scripts/evaluate-sentence-semantics.js baseline|final [baseline-ref] [--complete-existing|--refresh-existing|--repair=P79,P81]');
  if(mode==='--repair-property-scope'||mode==='--complete-existing'||mode==='--refresh-existing'||mode&&mode.startsWith('--repair=')){
    const read=name=>JSON.parse(name.endsWith('.gz')?zlib.gunzipSync(fs.readFileSync(path.join(out,name))):fs.readFileSync(path.join(out,name)));
    const summary=read(label+'.summary.json'),coverage=read(label+'.coverage.json.gz'),records=zlib.gunzipSync(fs.readFileSync(path.join(out,label+'.corpus.jsonl.gz'))).toString().trim().split('\n').map(line=>JSON.parse(line));
    if(mode==='--repair-property-scope')repairPropertyScope(label,summary,records,coverage);
    else if(mode!=='--refresh-existing'){
      const fixture=applicationFixture({seed:SEED,...(ref&&ref!=='working-tree'?{ref}:{})}),ids=mode.startsWith('--repair=')?mode.slice('--repair='.length).split(','):null;
      completeQuotas(fixture,label,records,ids?summary.templates.filter(t=>ids.includes(t.id)):summary.templates);
      if(ids){const repair={templates:ids,reason:summary.pass2PropertyRegressionRepair?'Complete only affected person-role replacement quotas with distinct recipient support.':'The final acceptance check incorrectly blocked authored function-word constructions when their dictionary display gloss was ineligible. Only the affected templates were regenerated after a focused regression passed.'};if(summary.pass2RegressionRepair)summary.pass2QuotaCompletion=repair;else summary.pass2RegressionRepair=repair;}
    }
    refreshSummary(summary,records,coverage);
  }else console.log(JSON.stringify(run(label,ref?{ref}:{}),null,2));
}
module.exports={run,SEED,TARGET,roles,names};
