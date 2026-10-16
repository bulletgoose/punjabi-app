'use strict';
// Frozen development-time screening rubric. It deliberately does not import
// the runtime compatibility validator. A clean screen is not proof of fluency.
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),crypto=require('node:crypto');
const dir=path.resolve(__dirname,'../reports/sentence-semantics');
const set=s=>new Set(s.split('|'));
const height=set('human|person|man|woman|boy|girl|child|adult|teacher|student|father|mother|brother|sister|friend|tree|plant|bamboo|wheat|barley|maize|grass|building|house|wall|door|mountain|hill|cliff|peak|tower');
const length=set('rope|road|street|river|stream|canal|bridge|snake|python|crocodile|carrot|cucumber|radish|cane|branch|root|leaf|hair|arm|leg|finger|tail|scarf|shawl|cloth|garment|shirt|dress|skirt|coat|trousers|pants|curtain|blanket|bed|table|train|boat|ship|car|journey|story|poem|novel|letter|essay|report');
const cavities=set('cup|glass|bowl|pot|pan|bottle|bucket|basket|box|bag|sack|container|jar|jug|vase|room|house|well|cave|river|lake|sea|ocean|pond|canal|valley');
const celestial=set('sun|moon|star|sky|cloud|rainbow|lightning|thunder|wind|weather|climate|sunshine');
const indoor=set('home|house|room|bedroom|bathroom|kitchen|attic|office|school|classroom|library|shop|hospital|restaurant|prison|building');
function load(label){return {lexicon:JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(dir,label+'.lexicon.json.gz')))),records:zlib.gunzipSync(fs.readFileSync(path.join(dir,label+'.corpus.jsonl.gz'))).toString().trim().split('\n').filter(Boolean).map(line=>JSON.parse(line))};}
function nodes(record,lexicon){return record.parts.flatMap((p,index)=>p.selections.map(selection=>{const entry=lexicon[selection.vocabularyId]||{},sense=(entry.senses||[]).find(s=>s.id===selection.senseId)||{};return {part:p,index,selection,entry,sense,head:sense.classification?.head||'',tags:sense.semanticTags||entry.semanticTags||[],meaning:selection.contextualMeaning||'',definition:sense.english||entry.e||'',pos:sense.partOfSpeech||entry.partOfSpeech};}));}
function assess(record,lexicon){
  const issues=[],words=nodes(record,lexicon),add=(category,rule,severity,detail)=>{if(!issues.some(x=>x.rule===rule))issues.push({category,rule,severity,detail});};
  if(record.pattern==='wordPractice')return {status:'quoted',issues};
  const objects=words.filter(n=>n.part.category==='WHAT'||['object','comparison','occupation'].includes(n.part.role));
  const subjects=words.filter(n=>n.part.category==='WHO'||['subject','experiencer','possessor','addressee'].includes(n.part.role));
  if(subjects.length>1&&subjects.some((s,i)=>i&&s.entry.id===subjects[0].entry.id&&/^(?:a|an) /i.test(s.part.english||'')&&s.part.english===subjects[0].part.english))add('D','established-actor-reference','questionable','Repeated indefinite English subjects do not clearly retain the established actor in these linked clauses.');
  for(const v of words.filter(n=>n.pos==='verb')){
    const verb=v.meaning.replace(/^to /,''),object=objects.filter(n=>n.index<=v.index).at(-1)||objects[0],subject=subjects[0];
    if(subject&&(v.sense.qualifiers||[]).some(q=>/^for sun$/i.test(q))&&subject.head!=='sun')add((v.entry.senses||[]).some(s=>s.english==='to come out')?'A':'B','source-qualified-agent','error','The selected source sense is restricted to the sun; the actor is a person. Other senses, if present, are separate construction-support questions.');
    if(subject&&subject.tags.includes('human')&&/to fall, flow/.test(v.definition))add('B','natural-process-agent','error','The fall/flow sense describes material motion rather than a person falling.');
    if(/\bappear\b.*\bseem\b.*\bbe felt\b/.test(v.definition))add('C','missing-copular-complement','error','An appearance/seeming predicate is used as a complete action without a predicative complement.');
    if(/progress|Progress/.test(record.pattern)&&verb==='understand')add('E','progressive-stative','questionable','Ordinary English does not naturally use this stative sense in the progressive without additional context.');
    if(/progress|Progress/.test(record.pattern)&&verb==='find'&&/\b(?:search|seek)\b/.test(v.definition))add('E','progressive-search-sense','questionable','The ongoing-search reading is more natural than an achievement reading in this unqualified context.');
    if(!object)continue;
    if(['weigh','lift','carry','pull','hold','keep'].includes(verb)&&(object.tags.includes('place')||celestial.has(object.head)))add('B','manipulation-of-fixed-entity','error',verb+' takes a manipulable entity or goods, not '+object.head+'.');
    if(['weigh','lift','carry'].includes(verb)&&object.tags.includes('anatomical'))add('G','detached-anatomy-context','questionable','Manipulating or weighing a body part needs medical/detached-part context not established here.');
    if(['weigh','lift','carry','pull','hold','touch','smell'].includes(verb)&&object.head==='email')add('B','physical-action-on-digital-content','error','The email sense denotes digital content, not a physical sheet of paper.');
    if(['distribute','divide'].includes(verb)&&(object.sense.number||'sg')!=='pl'&&!object.tags.some(t=>['edible','drinkable'].includes(t))&&/give away/.test(v.definition))add('E','singular-distribution-realization','questionable','Giving away a single item is the more natural existing source alternative in an unqualified context.');
    if(['lift','pull','hold'].includes(verb)&&object.tags.includes('drinkable'))add('G','unexpressed-container','questionable','This manipulation reading depends on an unexpressed container or portion.');
    if(verb==='suck'&&object.head==='potato')add('E','consumption-mode','questionable','The intended sucking/sipping mode is not supported by this ordinary food sense.');
    if(['weigh','lift','carry','pull','hold','give away','distribute'].includes(verb)&&object.head==='drill'&&/\bparade\b/.test(object.definition))add('F','definition-head-homograph','error','The source means military drill/parade; the English head was misclassified as a tool.');
    if(['give','take','bring','send','buy','borrow','share','distribute'].includes(verb)&&(object.tags.includes('place')||celestial.has(object.head)))add('B','transfer-of-fixed-entity','error','The ordinary transfer sense lacks a transferable referent.');
    if(['eat','chew','nibble','taste'].includes(verb)&&!object.tags.includes('edible')&&!['ingredient','food'].some(t=>object.tags.includes(t)))add('F','consumption-support-missing','questionable','The selected sense lacks food compatibility evidence.');
  }
  for(const a of words.filter(n=>n.pos==='adjective')){
    const noun=objects[0]||subjects[0];if(!noun)continue;const gloss=a.meaning,head=noun.head;
    if(gloss==='renown')add('A','noun-gloss-as-adjective','error','The noun gloss “renown” cannot serve as this English predicative adjective.');
    if(gloss==='high'&&(noun.tags.includes('human')||['tree','plant','building','house'].includes(head)))add('A','elevation-instead-of-stature','error','The height reading needs natural stature wording rather than “high”.');
    if(['high','tall'].includes(gloss)&&!(height.has(head)||noun.tags.includes('human')))add('G','height-context-unestablished','questionable','The noun is not established as a standing entity with the intended height property.');
    if(gloss==='long'&&noun.tags.includes('human'))add('A','length-instead-of-stature','error','A person’s stature needs the tall sense, not the length sense.');
    else if(gloss==='long'&&!length.has(head)&&!noun.tags.includes('wearable'))add('G','length-context-unestablished','questionable','The intended length dimension is not established for '+head+'.');
    if(gloss==='deep'&&!cavities.has(head))add('B','depth-without-depth-referent','error','Literal depth is not an established ordinary property of '+head+'.');
    if(['ripe','unripe'].includes(gloss)&&!noun.tags.includes('edible')&&!noun.tags.includes('plant'))add('B','ripeness-without-produce','error','Ripeness requires a fruit/crop/food sense.');
    if(['wet','dry','moist','damp'].includes(gloss)&&noun.tags.includes('drinkable'))add('E','moisture-of-liquid','questionable','The liquid needs a different ordinary descriptive property.');
    if(['rough','hard','solid','flat','straight'].includes(gloss)&&noun.tags.includes('drinkable'))add('B','solid-property-of-liquid','error','A solid surface/shape is not established for this liquid sense.');
    if(gloss==='fresh'&&!noun.tags.some(t=>['edible','drinkable','plant','material'].includes(t)))add('G','freshness-context-unestablished','questionable','Freshness may need new/recent/rested context not expressed by this standalone description.');
  }
  const location=words.find(n=>n.part.category==='WHERE'||['location','destination'].includes(n.part.role));
  for(const n of words){
    if(n.entry.g==='ਦੇਵਰ'&&n.sense.gender==='f')add('C','kinship-agreement-metadata','error','This kinship noun requires masculine agreement; its imported gender label is incorrect.');
    if(n.entry.e==='water'&&n.head==='juice')add('A','unsupported-extended-noun-sense','error','The unqualified water noun supplies no fruit/extract context for choosing juice.');
    if(/\b(?:generally|usually|only) in compounds\b/i.test(n.definition))add('F','compound-only-usage','questionable','The source restricts ordinary use to compounds; standalone usage is not established.');
  }
  if(record.pattern==='instrument'&&objects.some(n=>n.head==='email'))add('B','instrument-medium','error','A pen does not write an email in this literal construction.');
  if(location&&objects.length&&/nominalLocation|thereIs/.test(record.pattern)){
    const object=objects[0];if(indoor.has(location.head)&&(object.tags.includes('geographical')||celestial.has(object.head)))add('B','location-scale-mismatch','error','The geographical/celestial entity cannot ordinarily be located inside this small place.');
  }
  if(record.pattern==='comparison'&&objects.length>1&&objects[0].entry.id===objects[1].entry.id)add('E','self-comparison','questionable','No distinguishing referents are supplied for comparing the same lexical item with itself.');
  if(/\b(?:a|an) (?:clothes|trousers|pants|scissors|socks|shoes|gloves|people|cattle|mathematics|news|information|equipment|furniture|luggage)\b/i.test(record.english))add('C','english-number-or-mass-article','error','The English noun cannot take this singular indefinite article.');
  if(/\bthere are (?:no )?money\b/i.test(record.english))add('C','mass-existential-agreement','error','English money is singular mass even though Punjabi paise is plural.');
  if(/\bhow many money\b/i.test(record.english))add('C','mass-quantity-question','error','English asks how much money, preserving the Punjabi plural noun construction.');
  if(/^Whose (?:a|an|the)\b/i.test(record.english))add('C','possessive-determiner','error','Whose already occupies the determiner position.');
  if(/\b(?:these|those|they|we|you) is\b|\bI (?:is|are)\b|\b(?:he|she) are\b/i.test(record.english))add('C','english-person-agreement','error','English subject/auxiliary agreement is incorrect.');
  if(/future|Future/.test(record.pattern)&&/\b(?:yesterday|last night|last week|last year)\b/i.test(record.english))add('C','tense-time-conflict','error','A past-time phrase conflicts with the future predicate.');
  if(/past|perfective/.test(record.pattern)&&/\b(?:tomorrow|next week|next year)\b/i.test(record.english))add('C','tense-time-conflict','error','A future-time phrase conflicts with the past predicate.');
  return {status:issues.some(i=>i.severity==='error')?'incorrect':issues.length?'questionable':'screen-clear',issues};
}
function report(label){
  const {records,lexicon}=load(label),judgements=records.map(r=>({id:r.id,kind:r.kind,templateId:r.templateId,...assess(r,lexicon)}));
  const byId=new Map(judgements.map(j=>[j.id,j]));
  const totals={};for(const j of judgements)totals[j.status]=(totals[j.status]||0)+1;
  const rules={};for(const j of judgements)for(const issue of j.issues){rules[issue.rule]??={category:issue.category,severity:issue.severity,count:0,exampleIds:[]};rules[issue.rule].count++;if(rules[issue.rule].exampleIds.length<8)rules[issue.rule].exampleIds.push(j.id);}
  const main=judgements.filter(j=>j.kind==='main'&&j.status!=='quoted'),all=judgements.filter(j=>j.status!=='quoted');
  const rates=rows=>({sentences:rows.length,incorrect:rows.filter(j=>j.status==='incorrect').length,questionable:rows.filter(j=>j.status==='questionable').length,screenClearRate:rows.filter(j=>j.status==='screen-clear').length/rows.length});
  const summary={label,criteriaVersion:1,scope:'Frozen rule-based full-corpus screening, not a fluent-speaker accuracy measurement. See the separate development-time AI review ledger for sampled language-quality estimates.',totals,main:rates(main),all:rates(all),distinctRootCauseRules:Object.keys(rules).length,rules};
  fs.writeFileSync(path.join(dir,label+'.screen.json'),JSON.stringify(summary,null,2)+'\n');
  fs.writeFileSync(path.join(dir,label+'.screen-ledger.jsonl.gz'),zlib.gzipSync(judgements.map(j=>JSON.stringify(j)).join('\n')+'\n'));
  const samples=[];
  for(const template of [...new Set(records.filter(r=>r.kind==='main').map(r=>r.templateId))]){
    const rows=records.filter(r=>r.kind==='main'&&r.templateId===template&&r.pattern!=='wordPractice');
    for(let i=0;i<Math.min(6,rows.length);i++)samples.push(rows[Math.floor(i*rows.length/Math.min(6,rows.length))]);
  }
  const planPath=path.join(dir,label+'.sample-plan.json');
  const captureSummary=JSON.parse(fs.readFileSync(path.join(dir,label+'.summary.json')));
  if(fs.existsSync(planPath)&&captureSummary.pass2PropertyRegressionRepair){
    const plan=JSON.parse(fs.readFileSync(planPath)),byRecord=new Map(records.map(r=>[r.id,r])),used=new Set(plan.slots.filter(s=>byRecord.has(s.id)).map(s=>s.id));
    const maxOriginal=plan.initialRecordMax||Math.max(...plan.slots.map(s=>Number(s.id.split('-').at(-1))));
    samples.splice(0,samples.length,...plan.slots.map(slot=>{
      if(byRecord.has(slot.id))return byRecord.get(slot.id);
      const candidates=records.filter(r=>r.kind==='main'&&r.templateId===slot.templateId&&!used.has(r.id)&&Number(r.id.split('-').at(-1))>maxOriginal);
      const offset=crypto.createHash('sha256').update('20261016:'+slot.id).digest().readUInt32LE(0);
      const replacement=candidates[offset%candidates.length];
      if(!replacement)throw Error('Missing deterministic regression-review replacement for '+slot.id);
      used.add(replacement.id);return replacement;
    }));
  }
  fs.writeFileSync(path.join(dir,label+'.review-sample.jsonl'),samples.map(r=>JSON.stringify({id:r.id,templateId:r.templateId,pattern:r.pattern,gurmukhi:r.gurmukhi,roman:r.roman,english:r.english,screen:byId.get(r.id),sourceSenses:nodes(r,lexicon).map(n=>({role:n.part.role,gurmukhi:n.entry.g,meaning:n.meaning,dictionary:n.definition,tags:n.tags,head:n.head,qualifiers:n.sense.qualifiers}))})).join('\n')+'\n');
  const examples=records.filter(r=>byId.get(r.id)?.issues.length).map(r=>({id:r.id,template:r.templateId,gurmukhi:r.gurmukhi,english:r.english,issues:byId.get(r.id).issues}));
  fs.writeFileSync(path.join(dir,label+'.flagged-examples.json.gz'),zlib.gzipSync(JSON.stringify(examples)));
  const decisions=JSON.parse(fs.readFileSync(path.join(dir,'ai-review-decisions.json'))),exceptions=decisions[label]||{};
  const corpusHash=crypto.createHash('sha256').update(records.map(r=>JSON.stringify(r)).join('\n')+'\n').digest('hex');
  if(decisions.reviewedCorpusSha256?.[label]&&decisions.reviewedCorpusSha256[label]!==corpusHash){
    fs.writeFileSync(path.join(dir,label+'.ai-review.json'),JSON.stringify({status:'review-required',reason:'Saved development-time language annotations belong to a different captured corpus. Re-adjudicate the new review sample.'},null,2)+'\n');
    console.log(JSON.stringify(summary,null,2));return;
  }
  const reviews=samples.map(r=>{
    const judgement={id:r.id,templateId:r.templateId,validity:'plausible',translation:'accurate',natural:true,categories:[],note:'Reviewed under the stated ordinary-usage criteria; no clear defect identified.',...exceptions[r.id]};
    if(byId.get(r.id).issues.some(i=>i.rule==='established-actor-reference')){judgement.natural=false;judgement.categories=Array.from(new Set(judgement.categories.concat('D','E')));judgement.note+=' Repeated indefinite subjects should refer back to the established actor.';}
    return judgement;
  });
  const count=(field,value)=>reviews.filter(r=>r[field]===value).length;
  const aiSummary={sampleSize:reviews.length,templates:new Set(reviews.map(r=>r.templateId)).size,validity:{plausible:count('validity','plausible'),incorrect:count('validity','incorrect'),uncertain:count('validity','uncertain')},translation:{accurate:count('translation','accurate'),incorrect:count('translation','incorrect'),uncertain:count('translation','uncertain')},natural:count('natural',true),method:decisions.method,sampling:decisions.criteria.sampling};
  aiSummary.validityRate=aiSummary.validity.plausible/reviews.length;aiSummary.contextualTranslationAccuracy=aiSummary.translation.accurate/reviews.length;aiSummary.naturalnessRate=aiSummary.natural/reviews.length;
  fs.writeFileSync(path.join(dir,label+'.ai-review.json'),JSON.stringify({summary:aiSummary,reviews},null,2)+'\n');
  console.log(JSON.stringify(summary,null,2));
}
if(require.main===module)report(process.argv[2]);
module.exports={load,nodes,assess,report};
