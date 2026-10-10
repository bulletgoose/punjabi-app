'use strict';
// Reproducible measurements from app initialization, not report assertions.
// node scripts/audit-report.js [--baseline-ref <commit>]
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {applicationFixture}=require('./application-fixture');
const {provenance}=require('./report-provenance');
const reportDir=path.resolve(__dirname,'..','reports');
const roles=['WHO','WHEN','WHERE','WHAT','HOW','WHY','ABOUT','VERB'];
function distribution(values){const result={};for(const value of values){const key=value==null?'unrecorded':String(value);result[key]=(result[key]||0)+1;}return result;}
function representativeSupport(fixture){
  const vocab=Object.fromEntries(Object.keys(fixture.state.vocab).map(category=>{
    if(category==='LEXICON')return [category,[]];
    const rows=Array.from(fixture.state.vocab[category]),covered=new Set(),selected=[];
    for(const row of rows){
      const keys=[...(row.tags||row.semanticTags||[]).map(tag=>'tag:'+tag),'person:'+row.person,'gender:'+row.gender,'number:'+row.number,'time:'+row.time];
      if(selected.length<40||keys.some(key=>!covered.has(key))){selected.push(row);keys.forEach(key=>covered.add(key));}
    }
    return [category,selected];
  }));
  return Object.assign({},fixture.state,{vocab,verbs:Array.from(fixture.state.verbs)});
}
function eligibleRoles(fixture){
  return Object.fromEntries(roles.map(role=>{
    const rows=role==='VERB'?Array.from(fixture.state.verbs):Array.from(fixture.state.vocab[role]||[]);
    const enabled=rows.filter(row=>row.enabled!==false);
    const ids=rows=>new Set(rows.map(row=>row.vocabularyId||fixture.lexical.resolveId(fixture.state,row.id)).filter(Boolean));
    return [role,{boundLexicalEntries:ids(rows).size,enabledLexicalEntries:ids(enabled).size,bindings:rows.length,enabledBindings:enabled.length,constructedPhraseBindings:enabled.filter(row=>row.construction).length}];
  }));
}
function paradigmCoverage(fixture){
  const {state,lexical,grammar}=fixture;
  const subjectIds=['who-main','who-tu','who-tusi','who-oh','who-asi','who-ohlok'];
  const subjects=subjectIds.map(id=>state.vocab.WHO.find(subject=>subject.id===id)).filter(Boolean);
  const verbs=Array.from(new Map(state.verbs.map(verb=>[verb.vocabularyId||lexical.resolveId(state,verb.id),verb])).values());
  const result={boundLexicalEntries:verbs.length,agreementCells:'Both scripts; six person/respect distinctions; masculine/feminine subjects. Perfective transitives also exercise all four object gender/number agreement controllers as morphology units.',byAspect:{}};
  for(const aspect of ['habitual','progressive','pastProgressive','future','perfective']){
    const checks=[];
    for(const verb of verbs){
      const rules=grammar.verbRulesFor(verb),sampleObject=rules.transitive?state.vocab.WHAT.find(object=>grammar.compatible(verb,object)):null;
      let total=0,passed=0;const reasons=new Set();
      for(const subject of subjects)for(const gender of ['m','f'])for(const script of ['roman','gurmukhi']){
        const controllers=aspect==='perfective'&&rules.transitive?['m','f','pl','fpl']:[null];
        for(const controller of controllers){
          total++;
          const object=controller?Object.assign({},sampleObject,{gender:controller==='f'||controller==='fpl'?'f':'m',number:controller==='pl'||controller==='fpl'?'pl':'sg'}):sampleObject;
          if(rules.transitive&&!sampleObject){reasons.add('No compatible object available.');continue;}
          const form=grammar.conjugate({verb,subject:Object.assign({},subject,{gender}),object,aspect,script});
          if(form.ok&&!/undefined|⟦|⟧/.test(form.text||'')&&(script!=='gurmukhi'||/[\u0a00-\u0a7f]/.test(form.text||'')))passed++;
          else reasons.add(form.reason||'Invalid text');
        }
      }
      checks.push({vocabularyId:verb.vocabularyId||lexical.resolveId(state,verb.id),primaryId:verb.id,totalCells:total,passedCells:passed,complete:passed===total&&total>0,limitations:[...reasons]});
    }
    result.byAspect[aspect]={completeLexicalEntries:checks.filter(check=>check.complete).length,checks};
  }
  return result;
}
function templateReachability(fixture){
  if(!fixture.context.assembleWithState)return null;
  const {state,lexical,grammar}=fixture;
  const unchanged=JSON.stringify(lexical.snapshot(state,{compact:true}));
  const roleNames={WHO:['subject','experiencer','possessor','addressee','recipient','occupation'],WHEN:['time'],WHERE:['location','destination','origin'],WHAT:['object','choice','comparison','secondObject'],HOW:['manner'],WHY:['reasonClause','reason'],ABOUT:['topic'],VERB:['verb','action','modal','imperative','secondVerb'],ADJECTIVE:['description'],STATE:['description','state'],QUESTION:['question','questionMarker'],CONNECTOR:['connector']};
  const templates=state.templates.filter(template=>template.enabled);
  const preferred={WHO:['P64','P02','P63'],WHEN:['P66','P03','P43','P33'],WHERE:['P61','P31','P48'],WHAT:['P59','P69','P31'],HOW:['P66'],WHY:['P71','P36'],ABOUT:['P34','P35'],VERB:['P64','P65','P01','P02'],ADJECTIVE:['P60','P67','P68'],STATE:['P28','P43'],QUESTION:[],CONNECTOR:[]};
  // A successful output is an existence proof. Keep a representative support
  // pool (including every semantic tag and authored dependency), rather than
  // projecting thousands of unrelated alternatives for every forced lemma.
  const supportVocab=representativeSupport(fixture).vocab;
  const proven=new Map(),byRole={};
  const legacyStatePatterns=['state','stateNegative','stateQuestion','pastState'];
  const started=performance.now();
  for(const role of Object.keys(roleNames)){
    const candidates=templates.filter(template=>(grammar.metadataFor(template).requiredRoles||[]).some(name=>roleNames[role].includes(name)))
      .filter(template=>role==='STATE'?legacyStatePatterns.includes(template.pattern):role==='ADJECTIVE'?!legacyStatePatterns.includes(template.pattern):true).sort((a,b)=>{
      const rank=id=>{const index=preferred[role].indexOf(id);return index<0?1000:index;};return rank(a.id)-rank(b.id);
    });
    const rows=Array.from(role==='VERB'?state.verbs:state.vocab[role]||[]).filter(row=>row.enabled!==false);
    const groups=new Map();
    for(const row of rows){const id=row.vocabularyId||lexical.resolveId(state,row.id);if(!groups.has(id))groups.set(id,[]);groups.get(id).push(row);}
    const reached=[],unreached=[];
    for(const [id,bindings] of groups){
      let found,hadCandidates=false;
      for(const row of bindings){
        const vocab=Object.assign({},supportVocab),projection=Object.assign({},state,{vocab,verbs:Array.from(state.verbs)});
        if(role==='VERB')projection.verbs=[row];else projection.vocab[role]=[row];
        const rowCandidates=['QUESTION','CONNECTOR'].includes(role)?templates.filter(template=>grammar.dependenciesFor(template).includes(row.id)):candidates;
        hadCandidates=hadCandidates||rowCandidates.length>0;
        for(const template of rowCandidates){
          if(role==='VERB'){
            const required=new Set(grammar.dependenciesFor(template));
            projection.verbs=row.type==='modal'?Array.from(state.verbs).filter(verb=>verb.type!=='modal'||verb.id===row.id):Array.from(state.verbs).filter(verb=>verb.id===row.id||required.has(verb.id));
          }
          for(let attempt=0;attempt<2&&!found;attempt++){
            // Some validated manner bindings require a plural group, while
            // others require one actor. Exercise both without relying on a
            // random subject to happen to satisfy that restriction.
            if(role==='HOW'){
              const number=attempt===0?'sg':'pl',subjects=(supportVocab.WHO||[]).filter(subject=>subject.enabled!==false&&subject.number===number);
              projection.vocab.WHO=subjects.length?subjects:supportVocab.WHO;
            }
            const sentence=fixture.context.assembleWithState(template,projection);
            const emitted=sentence&&(sentence.sentenceBreakdown||[]).find(part=>{
              const correctRole=part.category===role||roleNames[role].includes(part.role)||(role==='QUESTION'&&part.category==='Q')||(role==='STATE'&&legacyStatePatterns.includes(template.pattern)&&part.category==='HOW');
              const correctId=(part.vocabularyIds||[]).includes(id)||part.vocabularyId===id;
              const correctSense=!row.selectedSenseId||(part.lexicalSelections||[]).some(selection=>selection.vocabularyId===id&&selection.senseId===row.selectedSenseId);
              return correctRole&&correctId&&correctSense;
            });
            if(sentence&&/[\u0a00-\u0a7f]/.test(sentence.gurmukhi||'')&&emitted)found={templateId:template.id,bindingId:row.id,senseId:row.selectedSenseId||null};
          }
          if(found)break;
        }
        if(found)break;
      }
      if(found){reached.push({vocabularyId:id,...found});if(!proven.has(id))proven.set(id,{vocabularyId:id,role,...found});}
      else unreached.push({vocabularyId:id,primaryId:bindings[0].id,bindingsTried:bindings.length,reason:hadCandidates?'No matching role/sense occurrence in constrained generation attempts; further construction review required.':'No enabled supported template consumes this role.'});
    }
    byRole[role]={enabledLexicalEntries:groups.size,demonstratedLexicalEntries:reached.length,candidateTemplates:candidates.map(template=>template.id),unreached,reached};
    console.log('Reachability '+role+': '+reached.length+'/'+groups.size+' lexical entries demonstrated');
  }
  assert.equal(JSON.stringify(lexical.snapshot(state,{compact:true})),unchanged,'Template reachability never rewrites dictionary data.');
  const mainIds=new Set(roles.flatMap(role=>byRole[role].reached.map(row=>row.vocabularyId)));
  return {demonstratedEntries:proven.size,demonstratedMainRoleEntries:mainIds.size,auxiliaryRoles:['ADJECTIVE','STATE','QUESTION','CONNECTOR'],byRole,demonstrated:[...proven.values()],durationMs:Math.round((performance.now()-started)*100)/100,method:'Group enabled bindings by canonical lexical entry and role, trying alternative sense bindings until one succeeds. Require the canonical ID, matching breakdown role/category and selected sense in a bilingual output. Includes the eight Building Block roles plus adjective/state descriptions and explicit question/connector dependencies. Supporting alternatives retain every semantic tag, person/gender/number/time class and the first forty rows. Two deterministic attempts per compatible enabled template and binding; manner attempts explicitly exercise singular and plural actors. Failed demonstrations remain explicit; constrained software demonstrations may undercount eligibility and are not fluent-speaker verification.'};
}
function measure(fixture,label='application'){
  const {state,lexical,grammar}=fixture;
  const entries=Object.values(state.linguistic.entries).filter(entry=>!entry.deleted);
  const compact=lexical.snapshot(state,{compact:true});
  const enabledTemplates=state.templates.filter(template=>template.enabled);
  const templates=enabledTemplates.map(template=>({id:template.id,pattern:template.pattern,roles:grammar.metadataFor(template).requiredRoles||[],structured:grammar.isStructuredTemplate(template)}));
  const roleCoverage=eligibleRoles(fixture);
  const paradigms=paradigmCoverage(fixture);
  const roleIds=new Set(roles.flatMap(role=>Array.from(role==='VERB'?state.verbs:state.vocab[role]||[]).filter(row=>row.enabled!==false).map(row=>row.vocabularyId||lexical.resolveId(state,row.id))));
  const started=performance.now();
  const game=lexical.vocabulary(state);
  const discoveryMs=performance.now()-started;
  const generated=[],templateResults=[],usedIds=new Set();
  const samplingState=representativeSupport(fixture);
  console.log('Sampling '+label+': '+enabledTemplates.length+' enabled templates, ten attempts each');
  if(fixture.context.assemble)for(const template of enabledTemplates){
    let successes=0;
    for(let i=0;i<10;i++){
      const sentence=fixture.context.assembleWithState?fixture.context.assembleWithState(template,samplingState):fixture.context.assemble(template);
      if(!sentence||!sentence.gurmukhi||!sentence.english)continue;
      successes++;
      if(fixture.window.PunjabiLexicalSemantics)assert.doesNotMatch(sentence.english,/undefined|\bhe\/she\b|\//,'Translation is well formed for '+template.id);
      for(const part of sentence.sentenceBreakdown||[]){
        if(fixture.window.PunjabiLexicalSemantics&&(part.vocabularyIds||[]).length)assert.ok((part.lexicalSelections||[]).length,'Canonical parts carry contextual sense selections for '+template.id);
        for(const selection of part.lexicalSelections||[]){
          assert.doesNotMatch(selection.contextualMeaning||'',/[,/;]/,'One contextual meaning for '+template.id);
          if(fixture.window.PunjabiLexicalSemantics){
            const word=lexical.get(state,selection.vocabularyId),senses=fixture.window.PunjabiLexicalSemantics.normalizeSenses(word);
            assert.ok(senses.some(sense=>sense.id===selection.senseId),'Selected sense exists in canonical entry for '+template.id);
            const sense=senses.find(sense=>sense.id===selection.senseId);
            if(/[,/;]/.test(sense.english||''))assert.equal(sentence.english.includes(sense.english),false,'Dictionary synonyms never replace contextual sentence meaning for '+template.id);
          }
        }
      }
      (sentence.vocabularyIds||[]).forEach(id=>usedIds.add(id));
      if(successes===1)generated.push(sentence);
    }
    templateResults.push({id:template.id,attempts:10,successes});
    assert.ok(successes>0,'Enabled template '+template.id+' generates at least one bilingual sentence');
    if(templateResults.length%10===0||templateResults.length===enabledTemplates.length)console.log('Sampled '+label+': '+templateResults.length+'/'+enabledTemplates.length+' templates');
  }
  const summaries=entries.map(entry=>entry.assessment||entry.audit||entry.metadataAssessment||null);
  const audit=fixture.window.PunjabiVocabularyAudit;
  const vocabularyValidationSummary=audit?audit.summarize(entries):null;
  const categoryValidation=audit?audit.validateCategories(entries,{categories:state.linguistic.categories}):[];
  const assessmentStatusByField={};
  for(const assessment of summaries.filter(Boolean))for(const [field,value] of Object.entries(assessment)){
    const status=typeof value==='string'?value:value&&value.status;
    if(status){const counts=assessmentStatusByField[field]||(assessmentStatusByField[field]={});counts[status]=(counts[status]||0)+1;}
  }
  assert.equal(JSON.stringify(lexical.snapshot(state,{compact:true})),JSON.stringify(compact),'Generation never rewrites dictionary data.');
  return {
    canonicalEntries:entries.length,importedCanonicalEntries:entries.filter(entry=>entry.importedDataset).length,legacyCanonicalEntries:entries.filter(entry=>!entry.importedDataset).length,
    rawImportedRecords:fixture.context.bundled.length,partsOfSpeech:distribution(entries.map(entry=>entry.partOfSpeech)),gender:distribution(entries.map(entry=>entry.gender)),
    senses:entries.reduce((n,entry)=>n+(entry.senses||entry.meanings||[]).length,0),
    sourceStatus:distribution(entries.map(entry=>entry.source&&entry.source.status)),
    actualFluentSpeakerReviews:entries.filter(entry=>entry.quality&&entry.quality.nativeReviewed===true||entry.grammarReview&&entry.grammarReview.nativeReviewed===true||entry.review&&entry.review.fluentSpeaker&&entry.review.fluentSpeaker.status==='reviewed').length,
    assessmentsRecorded:summaries.filter(Boolean).length,assessmentFields:summaries.find(Boolean)||null,assessmentStatusByField,vocabularyValidationSummary,
    unresolvedReasonCounts:distribution(summaries.filter(Boolean).flatMap(assessment=>assessment.unresolvedReasons||[])),
    categoryValidation:{counts:distribution(categoryValidation.map(issue=>issue.type)),issues:categoryValidation},
    categories:Object.fromEntries(Object.values(state.linguistic.categories).map(category=>[category.id,{label:category.label,parentId:category.parentId||null,entries:entries.filter(entry=>(entry.categories||[]).includes(category.id)).length}])),
    roles:roleCoverage,entriesWithAtLeastOneEnabledRole:roleIds.size,wordGameEntries:game.length,
    templates:{total:state.templates.length,enabled:enabledTemplates.length,metadata:templates,generatedChecks:templateResults,samplingMethod:'Ten deterministic attempts per enabled template using the actual app assembly with representative supporting alternatives. Pools retain every semantic tag, person/gender/number/time class and the first forty rows. Full-corpus per-entry reachability is validated separately; browser performance uses the full app data.'},
    generatedSampleUsedLexicalEntries:usedIds.size,
    verbs:{bound:paradigms.boundLexicalEntries,habitual:paradigms.byAspect.habitual.completeLexicalEntries,future:paradigms.byAspect.future.completeLexicalEntries,perfective:paradigms.byAspect.perfective.completeLexicalEntries},paradigmCoverage:paradigms,
    compactCharacters:JSON.stringify(compact).length,compactBytesUtf8:Buffer.byteLength(JSON.stringify(compact)),performance:{fullLibraryDiscoveryMs:Math.round(discoveryMs*100)/100},
    generated
  };
}
function compare(before,after){
  const byPrimary=new Map(Object.values(before.state.linguistic.entries).filter(entry=>!entry.deleted).map(entry=>[entry.primaryId,entry]));
  const changes=[];
  let movedOutOfGeneral=0;
  for(const entry of Object.values(after.state.linguistic.entries).filter(entry=>!entry.deleted)){
    const previous=byPrimary.get(entry.primaryId);if(!previous)continue;
    const from=[...(previous.categories||[])].sort(),to=[...(entry.categories||[])].sort();
    if(JSON.stringify(from)!==JSON.stringify(to))changes.push({id:entry.id,gurmukhi:entry.g,roman:entry.p,english:entry.e,before:from,after:to});
    if(from.includes('general')&&!to.includes('general'))movedOutOfGeneral++;
  }
  return {entriesChanged:changes.length,movedOutOfGeneral,newCategories:Object.keys(after.state.linguistic.categories).filter(id=>!before.state.linguistic.categories[id]),changes};
}
function run(){
  const inputProvenance=provenance();
  const refArg=process.argv.indexOf('--baseline-ref'),ref=refArg>=0?process.argv[refArg+1]:'49ded7b';
  const baseline=applicationFixture({ref});
  const start=performance.now(),current=applicationFixture(),initializationMs=performance.now()-start;
  console.log('Initialized baseline '+ref+' and current app');
  const after=measure(current,'current'),before=measure(baseline,'baseline'),categoryCorrections=compare(baseline,current);
  after.templateReachability=templateReachability(current);before.templateReachability=templateReachability(baseline);
  after.performance.initializationMs=Math.round(initializationMs*100)/100;
  assert.equal(provenance().inputSha256,inputProvenance.inputSha256,'Source inputs changed during audit; rerun against frozen sources.');
  const report={provenance:inputProvenance,completedAt:new Date().toISOString(),success:true,baselineCommit:ref,method:'Pristine app initialization using source code at the baseline commit and working tree; counts exclude deleted entries. Roles distinguish unique lexical IDs from generated phrase bindings. Forced-entry reachability and representative random samples are software observations, not exhaustive linguistic validation. Semantic completeness is completeness of supported sense classification, rather than exhaustive validation of every semantic property.',before,after,categoryCorrections};
  fs.mkdirSync(reportDir,{recursive:true});
  fs.writeFileSync(path.join(reportDir,'complete-integration-audit.json'),JSON.stringify(report,null,2)+'\n');
  fs.writeFileSync(path.join(reportDir,'generated-validation-samples.json'),JSON.stringify(after.generated,null,2)+'\n');
  const reviewQueue=Object.values(current.state.linguistic.entries).filter(entry=>!entry.deleted).map(entry=>({
    vocabularyId:entry.id,primaryId:entry.primaryId,gurmukhi:entry.g,roman:entry.p,english:entry.e,partOfSpeech:entry.partOfSpeech,
    assessment:entry.assessment||null,roleEligibility:entry.roleEligibility||null,
    senses:(entry.senses||[]).map(sense=>({id:sense.id,sourceSenseId:sense.sourceSenseId||null,english:sense.english,contextualGloss:sense.contextualGloss||null,categories:sense.categories||[],verification:sense.verification||null}))
  }));
  fs.writeFileSync(path.join(reportDir,'vocabulary-review-queue.json'),JSON.stringify(reviewQueue,null,2)+'\n');
  console.log(JSON.stringify({baseline:before.canonicalEntries,current:after.canonicalEntries,assessed:after.assessmentsRecorded,roles:after.roles,templates:after.templates.total,enabledTemplates:after.templates.enabled,failedTemplates:after.templates.generatedChecks.filter(template=>template.successes===0),categoryChanges:categoryCorrections.entriesChanged,movedOutOfGeneral:categoryCorrections.movedOutOfGeneral},null,2));
}
if(require.main===module){try{run();}catch(error){fs.mkdirSync(reportDir,{recursive:true});fs.writeFileSync(path.join(reportDir,'complete-integration-audit.json'),JSON.stringify({provenance:provenance(),success:false,error:error.message},null,2)+'\n');console.error(error);process.exitCode=1;}}
module.exports={applicationFixture,measure,compare,eligibleRoles,paradigmCoverage,templateReachability};
