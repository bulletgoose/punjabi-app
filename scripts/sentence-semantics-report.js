'use strict';
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const {load,nodes}=require('./assess-sentence-semantics');
const parameters=require('../data/sentence-semantic-parameters');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'reports/sentence-semantics');
const read=name=>JSON.parse(fs.readFileSync(path.join(dir,name)));
const percent=n=>(n*100).toFixed(2)+'%';
const baseline=load('baseline'),final=load('final'),b=read('baseline.summary.json'),f=read('final.summary.json');
const bs=read('baseline.screen.json'),fscreen=read('final.screen.json'),ba=read('baseline.ai-review.json').summary,fa=read('final.ai-review.json').summary;
const semanticFields=['gender','number','englishCountability','englishNumber','modifierTargets','modifierKind','sentenceEligible','restrictionReason'];
function substantive(s){
  return {...Object.fromEntries(semanticFields.map(k=>[k,s[k]??null])),positiveProperties:Object.keys(s.semanticProperties||{}).filter(k=>s.semanticProperties[k]===true).sort()};
}
const metadataChanges=[];
for(const [id,entry]of Object.entries(final.lexicon)){
  const before=baseline.lexicon[id];if(!before)continue;
  const changed=[];
  for(const sense of entry.senses||[]){const old=(before.senses||[]).find(s=>s.id===sense.id);if(old&&JSON.stringify(substantive(old))!==JSON.stringify(substantive(sense)))changed.push({senseId:sense.id,before:substantive(old),after:substantive(sense)});}
  if(changed.length)metadataChanges.push({vocabularyId:id,gurmukhi:entry.g,partOfSpeech:entry.partOfSpeech,senses:changed});
}
const dictionaryChanges=[];
for(const [id,entry]of Object.entries(final.lexicon))for(const sense of entry.senses||[]){const old=baseline.lexicon[id]?.senses?.find(s=>s.id===sense.id);if(old&&old.english!==sense.english)dictionaryChanges.push({id,senseId:sense.id,before:old.english,after:sense.english});}
if(dictionaryChanges.length)throw Error('Source dictionary definitions changed unexpectedly.');
const coverage=label=>{
  const corpus=label==='baseline'?baseline:final;
  return [...new Set(corpus.records.map(r=>r.templateId))].map(id=>{
    const rows=corpus.records.filter(r=>r.templateId===id),byRole={};for(const r of rows)for(const p of r.parts)for(const s of p.selections){byRole[p.role]??=new Set();byRole[p.role].add(s.vocabularyId);}
    return {id,sentences:rows.length,uniqueGurmukhiSentences:new Set(rows.map(r=>r.gurmukhi)).size,uniqueEnglishSentences:new Set(rows.map(r=>r.english)).size,uniqueVocabulary:new Set(rows.flatMap(r=>r.parts.flatMap(p=>p.selections.map(s=>s.vocabularyId)))).size,roles:Object.fromEntries(Object.entries(byRole).map(([k,v])=>[k,v.size]))};
  });
};
const mechanisms=[
  ['baseline-000014','B','Fixed institutions/places fail the physical holding frame; choose a manipulable object.'],
  ['baseline-000207','A/F','Reject the sun-only rise binding for a human. The valid come-out sense remains a separate, currently unprofiled construction.'],
  ['baseline-003701','B','Digital content is distinct from a physical sheet; holding is rejected while digital keeping/storage remains allowed.'],
  ['baseline-006034','C','English money is singular mass: “There is money in Auckland.” Punjabi ਪੈਸੇ ਹਨ stays plural.'],
  ['baseline-007937','C','Use “How much money do you need?” while retaining Punjabi plural quantity agreement.'],
  ['baseline-010941','B','The writing instrument and medium must agree; choose a physical message/letter for a pen.'],
  ['baseline-011368','A/F','The nominal English gloss renown is not approved as a predicative adjective; retain the other valid senses and dictionary record.'],
  ['baseline-016927','C','Whose supplies the determiner: “Whose razor is this?”'],
  ['baseline-000467','C/E','Use masculine agreement for devar; a single table uses the existing give-away alternative.'],
  ['baseline-002901','C/G','Peanut receives a singular count determiner. The uncommon wife sense remains explicitly uncertain rather than receiving an invented gender correction.']
];
const examples=mechanisms.map(([id,category,fix])=>{
  const r=baseline.records.find(r=>r.id===id),exact=final.records.find(x=>x.templateId===r.templateId&&x.gurmukhi===r.gurmukhi);
  return {id,templateId:r.templateId,gurmukhi:r.gurmukhi,roman:r.roman,originalEnglish:r.english,category,fix,observedSamePunjabiFinalEnglish:exact?.english||null,sourceSelections:nodes(r,baseline.lexicon).map(n=>({vocabularyId:n.entry.id,senseId:n.sense.id,dictionary:n.definition,meaning:n.meaning,role:n.part.role}))};
});
const retention={dictionaryEntriesBefore:Object.keys(baseline.lexicon).length,dictionaryEntriesAfter:Object.keys(final.lexicon).length,dictionaryDefinitionsChanged:dictionaryChanges.length,wordPracticeBefore:b.distinctQuotedEntries,wordPracticeAfter:f.distinctQuotedEntries,
  note:'Coverage loss is reported by role/sense in the coverage ledgers; blocked contexts do not delete vocabulary. Focused regressions retain goods measurement, help/prize transfer, digital storage, ordinary figurative priceless descriptions, length/depth for matching objects, and the four PR #8 cases.'};
const sourceFiles=['index.html','lexical-semantics.js','grammar-engine.js','vocabulary-audit.js','sentence-learning.js','linguistic-system.js','data/sentence-semantic-parameters.js','data/verb-morphology-profiles.js','data/grammar-ready-vocabulary.js','data/vocabulary-expansion.js','data/source-evidence.js','data/sentence-catalog-policy.js'];
const hash=files=>{const digest=crypto.createHash('sha256');for(const [name,contents]of files)digest.update(name+'\0').update(contents);return digest.digest('hex');};
const finalHash=hash(sourceFiles.map(name=>[name,fs.readFileSync(path.join(root,name))]));
function committed(name){try{return execFileSync('git',['show',b.sourceRef+':'+name],{cwd:root,maxBuffer:32*1024*1024});}catch(error){if(error.status===0&&Buffer.isBuffer(error.stdout))return error.stdout;throw error;}}
const baselineHash=hash(sourceFiles.filter(name=>name!=='data/sentence-semantic-parameters.js').map(name=>[name,committed(name)]));
const result={baseline:{coverage:b,screen:bs,aiReview:ba,runtimeSha256:baselineHash},final:{coverage:f,screen:fscreen,aiReview:fa,runtimeSha256:finalHash},metadataRecordsUpdated:metadataChanges.length,metadataSensesUpdated:metadataChanges.reduce((n,e)=>n+e.senses.length,0),rules:{nounPropertyGroups:Object.keys(parameters.heads).length,predicateFrames:Object.keys(parameters.predicates).length,adjectiveRequirements:Object.keys(parameters.modifiers).length,sourceSenseReviews:Object.keys(parameters.senseReviews).length,screenRootCauseGroups:bs.distinctRootCauseRules},retention,examples,templateVocabularyCoverage:{baseline:coverage('baseline'),final:coverage('final')}};
fs.writeFileSync(path.join(dir,'comparison.json'),JSON.stringify(result,null,2)+'\n');
fs.writeFileSync(path.join(dir,'metadata-changes.json.gz'),zlib.gzipSync(JSON.stringify(metadataChanges)));
fs.writeFileSync(path.join(dir,'runtime-rule-catalog.json'),JSON.stringify(parameters,null,2)+'\n');
const lines=['# Bounded sentence-semantics evaluation','',
  'Baseline: `'+b.sourceRef+'` (merged PR #8). Seed: `'+b.seed+'`. One baseline capture and one final capture; targeted quota completion is part of each capture. All output comes from the existing application engine. No runtime AI or translation API is used.','',
  '| Measure | Baseline | Final |','| --- | ---: | ---: |',
  '| Enabled templates evaluated | '+b.enabledTemplates+' | '+f.enabledTemplates+' |',
  '| Distinct main bilingual outputs | '+b.mainSentences+' | '+f.mainSentences+' |',
  '| Distinct main Punjabi surfaces (within template) | '+new Set(baseline.records.filter(r=>r.kind==='main').map(r=>r.templateId+'|'+r.gurmukhi)).size+' | '+new Set(final.records.filter(r=>r.kind==='main').map(r=>r.templateId+'|'+r.gurmukhi)).size+' |',
  '| Targeted coverage sentences | '+b.supplementarySentences+' | '+f.supplementarySentences+' |',
  '| Total bilingual records analysed | '+b.totalSentences+' | '+f.totalSentences+' |',
  '| Distinct words used propositionally | '+b.distinctSemanticEntries+' | '+f.distinctSemanticEntries+' |',
  '| Distinct words also reachable as quoted practice | '+b.distinctQuotedEntries+' | '+f.distinctQuotedEntries+' |',
  '| Exercised role/sense bindings | '+b.exercisedBindings+'/'+b.bindings+' | '+f.exercisedBindings+'/'+f.bindings+' |',
  '| Full-corpus screen: incorrect / questionable | '+bs.all.incorrect+' / '+bs.all.questionable+' | '+fscreen.all.incorrect+' / '+fscreen.all.questionable+' |',
  '| Full-corpus screen clear (excluding quotes) | '+percent(bs.all.screenClearRate)+' | '+percent(fscreen.all.screenClearRate)+' |',
  '| Main-corpus screen clear (excluding quotes) | '+percent(bs.main.screenClearRate)+' | '+percent(fscreen.main.screenClearRate)+' |',
  '| AI-review sample size (96 content templates) | '+ba.sampleSize+' | '+fa.sampleSize+' |',
  '| AI sample: plausible / incorrect / uncertain | '+[ba.validity.plausible,ba.validity.incorrect,ba.validity.uncertain].join(' / ')+' | '+[fa.validity.plausible,fa.validity.incorrect,fa.validity.uncertain].join(' / ')+' |',
  '| AI sample: semantic/grammatical validity | '+percent(ba.validityRate)+' | '+percent(fa.validityRate)+' |',
  '| AI sample: translation accurate / incorrect / uncertain | '+[ba.translation.accurate,ba.translation.incorrect,ba.translation.uncertain].join(' / ')+' | '+[fa.translation.accurate,fa.translation.incorrect,fa.translation.uncertain].join(' / ')+' |',
  '| AI sample: contextual translation accuracy | '+percent(ba.contextualTranslationAccuracy)+' | '+percent(fa.contextualTranslationAccuracy)+' |',
  '| AI sample: natural wording | '+percent(ba.naturalnessRate)+' | '+percent(fa.naturalnessRate)+' |','',
  'The full-corpus screen uses the same frozen explicit rubric for both passes and is not a fluent-speaker correctness score. The separate development-time AI review covers the saved template-stratified samples, not an independent native review of every generated sentence. Sample percentages are descriptive, not calibrated population estimates; uncertainty is not a confirmed error. Quoted-word practice is excluded from quality-rate denominators. Sample decisions use identical criteria; final review slots withdrawn by a regression repair receive deterministic replacement records rather than selecting examples by outcome.','',
  'Pass 2 permitted only directly introduced serious regression repairs: authored connector constructions blocked by display eligibility (P79/P81), and empty sense tags incorrectly inheriting other senses’ entry-wide properties. Only the affected connector cases and records referencing affected properties were regenerated; unaffected captured records were retained. The property repair ledger preserves withdrawn examples and role bindings. No further pre-existing quality issues discovered in Pass 2 were patched.','',
  '## Findings and implementation','',
  'The baseline identified '+bs.distinctRootCauseRules+' screening root-cause groups across the requested A–G classes: wrong contextual senses, incompatible arguments, grammatical/quantity errors, discourse reference, unnatural realizations, insufficient metadata and uncertain special-context readings.','',
  metadataChanges.length+' vocabulary records ('+result.metadataSensesUpdated+' senses) received substantive sentence metadata changes. The reusable catalog contains '+result.rules.nounPropertyGroups+' noun-property groups, '+result.rules.predicateFrames+' predicate frames and '+result.rules.adjectiveRequirements+' adjective requirements, plus source-sense review overlays. Capabilities marked false mean unsupported in the ordinary learner construction, not proof of linguistic impossibility.','',
  'The existing generators now share a bounded final acceptance check (eight attempts), with earlier pair checks where possible. Sense-specific properties distinguish digital content, fixed geography, portable goods, liquids, solids, physical dimensions and abstract/communicative uses. Source-qualified agents and complement-dependent predicates are checked. Progressive search wording and singular give-away wording retain the existing source sense and Punjabi roles. English mass/count/number hints, possessive determiners and established-actor reference are separated from Punjabi agreement. Original dictionary definitions and meaningful qualifiers are retained.','',
  '## Ten source-linked discoveries','',
  '| Corpus ID / template | Actual original Punjabi | Actual original English | Class and correction/prevention |','| --- | --- | --- | --- |'];
for(const e of examples)lines.push('| '+e.id+' / '+e.templateId+' | '+e.gurmukhi+' | '+e.originalEnglish+' | '+e.category+': '+e.fix+' |');
lines.push('','## Quotas and coverage','',
  'Every enabled template was attempted. The 200 target counts distinct bilingual surfaces, not repeated IDs; different supported senses can share a Punjabi surface, so separate Punjabi-surface counts are also supplied. This does not establish 200 unique Punjabi strings for every template. Shortfalls below are explicit after bounded random sampling and forced-pool completion through every enabled target binding. Fixed questions, numeral identification, counted possession and fixed-clause templates can have fewer than 200 different supported surfaces. No claim is made that every semantic permutation was exhaustively enumerated.','',
  '| Template | Baseline distinct | Final distinct |','| --- | ---: | ---: |');
for(const t of b.templates.filter(t=>t.generated<200||f.templates.find(x=>x.id===t.id)?.generated<200))lines.push('| '+t.id+' ('+t.pattern+') | '+t.generated+' | '+f.templates.find(x=>x.id===t.id)?.generated+' |');
lines.push('','All '+retention.dictionaryEntriesBefore+' dictionary entries remain; '+dictionaryChanges.length+' original definitions changed. Coverage files retain every enabled binding and its demonstrated/unreached status, and the lexicon captures the reasons for unsupported roles. Per-template vocabulary/role counts and all source sense IDs are in `comparison.json` and the compressed corpora.','',
  '## Remaining limitations','',
  '- Source dictionaries and English definition heads remain imperfect. Ambiguous heads such as military drill versus a drill tool, uncommon kinship senses, and some imported gender labels need further source/native adjudication. They are not marked fluent-reviewed.',
  '- Predicative news still has an English agreement gap; some topic phrases lack articles, source/causal clauses can be unnatural, and a full-size vehicle can still appear in a small room. These Pass 2 findings are documented rather than starting another implementation cycle.',
  '- Some valid Punjabi readings lack an approved argument-profile binding (for example the human come-out reading alongside a sun-only rise sense). Unsupported bindings are skipped; the vocabulary and dictionary senses remain available.',
  '- Conservative ordinary-context rules can under-generate figurative, metonymic, ownership or specialised uses. They also cannot ensure that two individually plausible connected events are a likely real-world story.',
  '- Long meaning-bearing kinship explanations and uncommon loanword definitions can remain less idiomatic. No Google Translate-level or 100% correctness claim is made.','',
  '## Reproduction and focused validation','',
  'To reproduce the saved assessments without generation: `node scripts/assess-sentence-semantics.js baseline`, `node scripts/assess-sentence-semantics.js final`, then `node scripts/sentence-semantics-report.js`. Fresh capture commands are `node scripts/evaluate-sentence-semantics.js baseline '+b.sourceRef+'` and `node scripts/evaluate-sentence-semantics.js final`. Saved AI annotations are tied to corpus hashes: a fresh, different capture requires new development-time language adjudication and will not silently reuse the old scores. Regression repairs and their seeds/withdrawn cases are recorded in the final summary and repair ledger. No API performs the review.','',
  'Focused checks: comprehensive semantic rules (7 initial cases plus the two directly introduced connector/property-scope regression cases), existing contextual-generation regressions (10 including subcases), lexical semantics (26; two affected cases rerun after the transfer-affordance correction), grammar engine (13), and sentence projection (2): 60 cases passed across the bounded runs. No application-wide build/lint/test cycle was run.','',
  'Dictionary data originates from the repository’s English Wiktionary/Kaikki snapshots (CC BY-SA); original source attribution and URLs remain in `data/source-evidence.js` and the original datasets. Dictionary definitions are unchanged.');
fs.writeFileSync(path.join(dir,'REPORT.md'),lines.join('\n'));
console.log(JSON.stringify({metadataRecordsUpdated:result.metadataRecordsUpdated,metadataSensesUpdated:result.metadataSensesUpdated,rules:result.rules,retention,baselineAI:ba,finalAI:fa,baselineScreen:bs.all,finalScreen:fscreen.all},null,2));
