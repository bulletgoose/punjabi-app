'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const audit=require('../vocabulary-audit');
const source=require('../data/source-evidence');
const {entries,metadata}=require('../data/vocabulary-expansion');
const grammar=require('../grammar-engine');
const semantics=require('../lexical-semantics');
const enriched=entries.map(e=>audit.enrich(Object.assign({},e,grammar.enrichVerb(e))));
const noun=g=>enriched.find(e=>e.g===g&&e.partOfSpeech==='noun');
let integrationFixture;
const app=()=>integrationFixture||(integrationFixture=require('../scripts/application-fixture').applicationFixture({generation:false}));

test('entire imported corpus and every original sense align with checksum-bound source evidence',()=>{
  assert.equal(source.metadata.sourceSha256,metadata.sourceSha256);
  assert.equal(source.metadata.matchedEntries,entries.length);
  assert.equal(source.metadata.matchedSenses,entries.reduce((n,e)=>n+e.meanings.length,0));
  const ids=new Set();
  for(let i=0;i<entries.length;i++){
    const base=entries[i],live=enriched[i];
    assert.equal(live.id,base.id);assert.equal(live.g,base.g);assert.equal(live.p,base.p);assert.equal(live.e,base.e);
    assert.equal(live.assessment.assessed,true);assert.equal(live.assessment.schemaValidation.status,'valid');
    assert.equal(live.assessment.sourceVerification.status,'snapshot-aligned');
    assert.equal(live.assessment.fluentSpeakerReview.status,'pending');
    assert.equal(live.quality.nativeReviewed,false);
    for(const sense of live.senses){
      assert(!ids.has(sense.id),'Sense IDs are globally unique.');ids.add(sense.id);
      assert(base.meanings.some(s=>s.id===sense.id));
      assert.equal(sense.sourceSenseId,source.entries[base.id].senses[sense.id].sourceSenseId);
      assert.equal(sense.verification.nativeReviewed,false);
      if(sense.countability)assert(sense.tags.includes(sense.countability));
    }
    if(!live.assessment.sentenceGenerationEligibility.eligible)assert(live.assessment.unresolvedReasons.length);
  }
});

test('ordinary wood sense is materials while independently gendered physique sense remains appearance',()=>{
  const wood=noun('ਕਾਠ'),material=wood.senses.find(s=>s.contextualGloss==='wood'),physique=wood.senses.find(s=>s.contextualGloss==='physique');
  assert(material.categories.includes('materials'));assert(!material.categories.includes('body'));assert(!material.categories.includes('anatomy'));
  assert(physique.categories.includes('appearance'));assert(physique.categories.includes('body'));
  assert.equal(material.gender,'f');assert.equal(physique.gender,'m');assert.equal(wood.gender,null);
  assert.equal(semantics.selectSense(wood,{role:'WHAT',senseId:material.id}).contextualMeaning,'wood');
  assert.equal(semantics.selectSense(wood,{role:'WHAT'}).ok,false,'Unselected polysemy remains explicit.');
});

test('structured semantic heads and unambiguous topic evidence replace unsupported keyword categories',()=>{
  const teacher=noun('ਅਧਿਆਪਕ');assert(teacher.categories.includes('people'));assert(teacher.categories.includes('work'));
  const wood=noun('ਕਾਠ');
  const correction=audit.categoryCorrectionReport(entries,enriched);
  assert(correction.entriesChanged>1000);assert(correction.movedOutOfGeneral>100);
  const after=correction.changes.find(c=>c.id===wood.id);assert(after.added.includes('materials'));
  const fake=audit.enrich({id:'user-stone',p:'stone',g:'ਪੱਥਰ',e:'a stone used to rub the body',partOfSpeech:'noun',meanings:['a stone used to rub the body'],categories:['body']});
  assert(fake.senses[0].categories.includes('materials'));assert(!fake.senses[0].categories.includes('body'));
  assert(audit.validateCategories([fake]).some(i=>i.type==='unsupported-category-assignment'&&i.category==='body'));
  const adjective=enriched.find(e=>e.partOfSpeech==='adjective'&&e.g==='ਨੀਲਾ');assert(!adjective.categories.includes('numbers'));
  assert(adjective.categories.includes('colors'));assert(!adjective.categories.includes('body'),'Generic object colors do not imply human anatomy/appearance.');
});

test('eligible noun roles have source sense gender and contextual meaning, source obliques stay scoped',()=>{
  assert(enriched.filter(e=>e.roleEligibility.WHAT.eligible).length>2000);
  for(const entry of enriched){
    for(const [role,status] of Object.entries(entry.roleEligibility).filter(([,s])=>s.eligible)){
      assert(status.senseIds.length);assert(status.constructionIds.length);
      for(const id of status.senseIds){
        const sense=entry.senses.find(s=>s.id===id);assert(sense);assert(sense.contextualGloss);assert(!/[,;/]/.test(sense.contextualGloss));
        if(entry.partOfSpeech==='noun')assert(['m','f'].includes(sense.gender));
        if(['ABOUT','WHERE','WHY'].includes(role)&&entry.partOfSpeech==='noun'){
          const construction=status.constructionsBySense[id];assert(construction);
          assert(sense.sourceForms.some(f=>f.tags.includes('oblique')&&f.tags.includes('singular')&&f.g===construction.form.g&&f.p===construction.form.p));
          assert.equal(sense.gScript.inflections.oblique,construction.form.g);
        }
      }
    }
  }
  const house=noun('ਘਰ'),homeSense=house.senses.find(s=>s.contextualGloss==='house');
  assert.deepEqual(house.roleEligibility.WHERE.constructionsBySense[homeSense.id].postposition,{p:'vich',g:'ਵਿੱਚ',e:'in'});
  const road=noun('ਸੜਕ');assert(Object.values(road.roleEligibility.WHERE.constructionsBySense).every(c=>c.postposition.g==='ਤੇ'&&c.englishPrefix==='on'));
});

test('adjective paradigms and adverbial roles use source cells and explicit complete phrases',()=>{
  const report=audit.summarize(enriched);assert(report.auxiliaryRoles.ADJECTIVE>75);assert(report.roles.WHEN>=40);assert(report.roles.HOW>=10);assert(report.roles.WHY>=10);
  const large=enriched.find(e=>e.partOfSpeech==='adjective'&&e.g==='ਵੱਡਾ');
  const sense=large.senses.find(s=>s.contextualGloss==='big');assert(large.roleEligibility.ADJECTIVE.senseIds.includes(sense.id));
  assert.equal(sense.forms.f,'vaḍḍī');assert.equal(sense.gScript.forms.f,'ਵੱਡੀ');assert.equal(sense.gScript.forms.fpl,'ਵੱਡੀਆਂ');
  const tuesday=enriched.find(e=>e.partOfSpeech==='noun'&&e.roleEligibility.WHEN.eligible&&e.meanings.some(s=>s.english==='Tuesday'));
  const construction=Object.values(tuesday.roleEligibility.WHEN.constructionsBySense)[0];assert.equal(construction.postposition.g,'ਨੂੰ');
  assert.equal(enriched.find(e=>e.g==='ਅੱਜ'&&e.partOfSpeech==='adverb').roleEligibility.WHEN.eligible,true);
  assert.equal(enriched.find(e=>e.g==='ਛੇਤੀ'&&e.partOfSpeech==='adverb').roleEligibility.HOW.eligible,true);
  assert.equal(noun('ਅਕਤੂਬਰ').roleEligibility.HOW.eligible,false,'A temporal noun is not automatically a manner phrase.');
});

test('verb morphology permission never grants unauthorized alternative argument senses',()=>{
  let checked=0;
  for(const entry of enriched.filter(e=>e.partOfSpeech==='verb'&&e.roleEligibility.VERB.eligible)){
    assert(entry.eligibleSenses.length);checked++;
    for(const id of entry.roleEligibility.VERB.senseIds){const authorized=entry.eligibleSenses.find(s=>s.senseId===id);assert(authorized);assert.equal(entry.senses.find(s=>s.id===id).contextualGloss,'to '+authorized.base);}
  }
  assert(checked>=75);
  const ask=enriched.find(e=>e.g==='ਮੰਗਣਾ'&&e.partOfSpeech==='verb');
  assert(!ask.roleEligibility.VERB.senseIds.includes('wt-sense-eb3fa62c5f78bed4b65c'));
  const reside=enriched.find(e=>e.g==='ਵੱਸਣਾ'&&e.partOfSpeech==='verb');
  assert(!reside.roleEligibility.VERB.senseIds.includes('wt-sense-55be34501b4003bdfc4d'));
});

test('source data, user category choices and user lexical edits are never silently replaced',()=>{
  const original=JSON.stringify(source);
  const copy=audit.enrich(entries.find(e=>e.g==='ਕਿਤਾਬ'&&e.partOfSpeech==='noun'));
  copy.senses[0].sourceForms[0].p='user-edited';assert.equal(JSON.stringify(source),original);
  const wood=entries.find(e=>e.g==='ਕਾਠ'&&e.partOfSpeech==='noun');
  const categories=audit.enrich({...wood,categories:['home'],userModifiedCategories:true});assert.deepEqual(categories.categories,['home']);
  const edited=audit.enrich({...wood,p:'my edited pronunciation'});assert.equal(edited.p,'my edited pronunciation');assert.equal(edited.assessment.sourceVerification.status,'unresolved');assert.equal(edited.roleEligibility.WHAT.eligible,false);
  const falseReview=audit.enrich({...wood,senses:wood.meanings.map(s=>({...s,verification:{nativeReviewed:true}}))});
  assert.equal(falseReview.assessment.fluentSpeakerReview.status,'pending','A boolean does not constitute qualified speaker provenance.');
  const editedMeaning=audit.enrich({...wood,e:'custom wood',userModifiedLexicalFields:['e']});
  assert.equal(editedMeaning.assessment.sentenceGenerationEligibility.eligible,false);assert.equal(editedMeaning.e,'custom wood');
});

test('an exact dictionary alias follows a legacy canonical ID without replacing its sense ID or phrase',()=>{
  const book=entries.find(e=>e.g==='ਕਿਤਾਬ'&&e.partOfSpeech==='noun');
  const canonical={...book,id:'lex:what-book',primaryId:'what-book',e:'a book',meanings:['a book'],source:{type:'legacy',status:'unreviewed'},sources:[{type:'legacy'},book.source]};
  const result=audit.enrich(canonical);
  assert.equal(result.id,'lex:what-book');assert.equal(result.e,'a book');assert.deepEqual(result.meanings,['a book']);
  assert.equal(result.dictionaryEntryId,book.id);assert.equal(result.assessment.sourceVerification.status,'snapshot-aligned');
  assert.equal(result.senses[0].id,'sense:lex:what-book:legacy-1');
  assert.equal(result.senses[0].dictionarySenseId,book.meanings[0].id);assert(result.senses[0].sourceForms.length);
  assert.equal(result.roleEligibility.ABOUT.eligible,true);
  const edited=audit.enrich({...canonical,e:'my edited book',meanings:['my edited book']});assert.equal(edited.assessment.sourceVerification.status,'unresolved');
});

test('category validation reports conflicting senses, duplicate labels and orphaned hierarchy without mutating data',()=>{
  const wood=structuredClone(noun('ਕਾਠ'));wood.senses[0].categories.push('body');
  const issues=audit.validateCategories([wood],{categories:{body:{id:'body',label:'Body'},duplicate:{id:'duplicate',label:'Body'},orphan:{id:'orphan',label:'Orphan',parentId:'missing'}}});
  assert(issues.some(i=>i.type==='semantic-category-conflict'));assert(issues.some(i=>i.type==='duplicate-category-label'));assert(issues.some(i=>i.type==='orphaned-category'));
  assert.equal(audit.validateCategories(enriched).filter(i=>['semantic-category-conflict','unknown-category','duplicate-category-label','orphaned-category','uncategorized-entry'].includes(i.type)).length,0);
});

test('known unchanged authored category defaults migrate without overwriting saved category or lexical changes',()=>{
  const baseline=require('../data/authored-category-baselines');
  assert.equal(baseline.metadata.reference,'49ded7b');assert.equal(baseline.metadata.entryCount,529);
  const original={id:'lex:what-kitab',primaryId:'what-kitab',p:'kitāb',g:'ਕਿਤਾਬ',e:'a book',partOfSpeech:'noun',meanings:['a book'],categories:['activities','education']};
  assert.equal(audit.fingerprint(original),baseline.entries['what-kitab'].fingerprint);
  const migrated=audit.enrich(original);
  assert(migrated.categories.includes('education'));assert(!migrated.categories.includes('activities'));
  assert.equal(migrated.categoryMigration.reference,'49ded7b');
  assert.equal(migrated.roleEligibility.WHAT.eligible,false,'Category correction does not itself authorize grammar.');
  const explicit=audit.enrich({...original,userModifiedCategories:true});assert.deepEqual(explicit.categories,original.categories);
  const savedCategories=audit.enrich({...original,categories:['home']});assert.deepEqual(savedCategories.categories,['home'],'A changed historical category is preserved even without a new edit flag.');
  const savedDefinition=audit.enrich({...original,e:'my favourite book'});assert.deepEqual(savedDefinition.categories,original.categories,'A changed identity invalidates the original default fingerprint.');
  const pronoun=audit.enrich({id:'lex:user-pronoun',g:'ਮੈਂ',p:'maĩ',e:'I',partOfSpeech:'pronoun',person:'1sg',authoredRoles:['WHO'],categories:['people']});
  assert(!audit.validateCategories([pronoun]).some(i=>i.type==='unsupported-category-assignment'&&i.category==='people'));
  const connector=audit.enrich({id:'lex:c-par',primaryId:'c-par',p:'par',g:'ਪਰ',e:'but',partOfSpeech:'conjunction',categories:['storytelling','functional']});
  const context=audit.validateCategories([connector]).find(i=>i.category==='storytelling');assert.equal(context.type,'learning-context-assignment');assert.equal(context.severity,'info');
});

test('empty lexical records stay unresolved and authored predicate bases retain reviewed contextual choices',()=>{
  const empty=audit.enrich({id:'empty',senses:[],meanings:[],categories:[]});
  assert.equal(empty.assessment.schemaValidation.status,'invalid');assert.equal(empty.assessment.dataCompleteness.semantics,'partial');
  assert.equal(empty.assessment.fluentSpeakerReview.status,'pending');assert.equal(empty.quality.nativeReviewed,false);
  const verb={id:'lex:v-karna',primaryId:'v-karna',p:'karṇā',g:'ਕਰਨਾ',e:'to do/make',partOfSpeech:'verb',base:'do',root:'kar',forms:{m:'kardā',f:'kardī',pl:'karde'},gScript:{root:'ਕਰ',forms:{m:'ਕਰਦਾ',f:'ਕਰਦੀ',pl:'ਕਰਦੇ'}},authoredRoles:['VERB'],categories:['actions']};
  const supported=audit.enrich(verb);
  assert.equal(supported.senses[0].contextualGloss,'to do');assert.equal(supported.senses[0].sentenceEligible,true);
  assert.equal(supported.roleEligibility.VERB.eligible,true);assert.equal(supported.roleEligibility.VERB.senseIds.length,1);
  assert.equal(supported.senses[0].contextualMeaningEvidence.method,'authored-predicate-base-matches-complete-definition-alternative');
  assert.equal(supported.assessment.fluentSpeakerReview.status,'pending');
  const mismatch=audit.enrich({...verb,base:'take'});
  assert.equal(mismatch.senses[0].contextualGloss,null);assert.equal(mismatch.roleEligibility.VERB.eligible,false,'A base outside the complete dictionary alternatives is not guessed.');
});

test('source-alias flags cannot erase bounded original authored verb and plural pronoun assessments',()=>{
  const fixture=app();
  const canonical=Object.values(fixture.state.linguistic.entries);
  for(const id of ['v-khana','v-likhna','v-sona']){
    const existing=canonical.find(e=>e.primaryId===id);assert(existing);
    const input={...existing,verifiedGrammar:false};
    const result=audit.enrich(input);
    assert.equal(result.assessment.sentenceGenerationEligibility.eligible,true,id);
    assert.equal(result.roleEligibility.VERB.eligible,true,id);
    assert.equal(result.assessment.dataCompleteness.grammar,'complete-for-supported-constructions');
    assert.equal(result.assessment.constructionCompatibility.authoredEvidence.reference,'49ded7b');
    assert.equal(result.assessment.sourceVerification.status,'snapshot-aligned');
    assert.equal(result.assessment.fluentSpeakerReview.status,'pending');
    assert.deepEqual(result.future,input.future,'Stored future overrides are preserved.');
    assert.deepEqual(result.perfective,input.perfective,'Stored perfective overrides are preserved.');
    const partial={...input,forms:{...input.forms}};delete partial.forms['3pl'];
    assert.equal(audit.enrich(partial).roleEligibility.VERB.eligible,false,'Incomplete authored cells do not grant morphology.');
    const edited=audit.enrich({...input,userModifiedLexicalFields:['root']});assert.equal(edited.roleEligibility.VERB.eligible,false,'Changed learner morphology requires revalidation.');
  }
  const we=audit.enrich({...canonical.find(e=>e.primaryId==='who-asi'),verifiedGrammar:false});
  assert.equal(we.roleEligibility.WHO.eligible,true);assert.equal(we.senses[0].person,'1pl');assert.equal(we.senses[0].number,'pl');
  assert.equal(we.assessment.fluentSpeakerReview.status,'pending');
  const raw=entries.find(e=>e.partOfSpeech==='verb'&&!grammar.enrichVerb(e));
  assert(raw);
  const authored=canonical.find(e=>e.primaryId==='v-khana');
  const imported=audit.enrich({...raw,root:authored.root,forms:authored.forms,gScript:authored.gScript,base:raw.e.replace(/^to /,''),authoredRoles:['VERB'],verifiedGrammar:false});
  assert.equal(imported.roleEligibility.VERB.eligible,false,'An imported dictionary entry cannot claim historical authored permission.');
});

test('bounded source noun affordances make all reviewed cut dig count mend wipe sow and water senses usable',()=>{
  const targets={cuttable:['wood','paper','rope'],diggable:['soil','field'],countable:['book','coin','apple'],repairable:['shirt','garment','rope'],cleanable:['floor','table','mirror'],plantable:['seed']};
  const objects={};
  for(const [tag,heads] of Object.entries(targets))objects[tag]=heads.map(head=>{
    const entry=enriched.find(e=>e.roleEligibility.WHAT.eligible&&e.senses.some(s=>s.classification.head===head&&s.semanticTags.includes(tag)&&e.roleEligibility.WHAT.senseIds.includes(s.id)));
    assert(entry,tag+':'+head);
    const sense=entry.senses.find(s=>s.classification.head===head&&s.semanticTags.includes(tag)&&eRole(entry,s.id));
    assert(sense.objectCompatibilityEvidence.some(e=>e.head===head&&e.nativeReviewed===false));
    return semantics.contextualEntry(entry,{role:'WHAT',senseId:sense.id});
  });
  function eRole(entry,id){return entry.roleEligibility.WHAT.senseIds.includes(id);}
  const milkEntry=enriched.find(e=>e.g==='ਦੁੱਧ'&&e.partOfSpeech==='noun');
  const milk=semantics.contextualEntry(milkEntry,{role:'WHAT',senseId:milkEntry.roleEligibility.WHAT.senseIds[0]});assert(milk);
  const subject={id:'who-main',p:'maĩ',g:'ਮੈਂ',e:'I',person:'1sg',gender:'m',number:'sg',partOfSpeech:'pronoun',semanticTags:['human','animate']};
  const newlyUsable=[];
  for(const entry of enriched.filter(e=>e.partOfSpeech==='verb'&&e.roleEligibility.VERB.eligible))for(const senseId of entry.roleEligibility.VERB.senseIds){
    const profile=entry.eligibleSenses.find(p=>p.senseId===senseId),tag=profile.requiredObjectTags.find(t=>targets[t]);if(!tag)continue;
    newlyUsable.push(entry.g);
    const verb={...semantics.contextualEntry(entry,{role:'VERB',senseId}),...entry.roleEligibility.VERB.bindingBySense[senseId]};
    for(const object of objects[tag]){
      assert.equal(grammar.compatible(verb,object),true,entry.g+'/'+object.e);
      for(const script of ['roman','gurmukhi'])assert.equal(grammar.conjugate({verb,subject,object,aspect:'future',script}).ok,true,entry.g+'/'+object.e+'/'+script);
      const sentence=grammar.generate(grammar.templates.find(t=>t.id==='P47'),{vocab:{WHO:[subject],WHAT:[object]},verbs:[verb]},rows=>rows[0]);assert(sentence,entry.g+'/'+object.e);
      assert(!/[,;/]|undefined/.test(sentence.english));assert(sentence.sentenceBreakdown.some(p=>p.role==='object'&&p.selectedSenseId===object.selectedSenseId));
    }
    assert.equal(grammar.compatible(verb,milk),false,'Liquid milk cannot satisfy '+tag);
    assert.equal(grammar.generate(grammar.templates.find(t=>t.id==='P47'),{vocab:{WHO:[subject],WHAT:[milk]},verbs:[verb]},rows=>rows[0]),null,'Invalid object prevents sentence generation.');
  }
  assert.equal(new Set(newlyUsable).size,12);assert.equal(newlyUsable.length,13,'Repair and clean are separate senses of one verb.');
  const wood=noun('ਕਾਠ'),body=wood.senses.find(s=>s.contextualGloss==='physique');assert(!body.semanticTags.includes('cuttable'));
  const iron=enriched.find(e=>e.partOfSpeech==='noun'&&e.senses.some(s=>s.classification.head==='iron'));assert(iron);assert(iron.senses.every(s=>!s.semanticTags.includes('cuttable')));
  const tableOfContents=enriched.find(e=>e.g==='ਤਤਕਰਾ');assert(tableOfContents.senses.every(s=>!s.semanticTags.includes('cleanable')));
  const planet=enriched.flatMap(e=>e.senses).find(s=>s.english==='Earth');assert(planet);assert(!planet.semanticTags.includes('diggable'));
  const tree=enriched.find(e=>e.g==='ਦਰਖ਼ਤ');assert(tree.senses.every(s=>!s.semanticTags.includes('plantable')),'Shared sow/water requirement must not allow sowing a tree.');
  const book=objects.countable[0];assert(book.semanticTags.includes('countable-object'));assert(book.countability==null,'Enumeration affordance does not manufacture Punjabi countability.');
});

test('source modifier restrictions survive corpus enrichment and sentence construction',()=>{
  const fixture=app(),state=fixture.state,template=grammar.templates.find(t=>t.id==='P60');
  const bySense=(role,id)=>(state.vocab[role]||[]).find(row=>row.selectedSenseId===id);
  const nounRow=(g,meaning)=>state.vocab.WHAT.find(row=>row.g===g&&semantics.selectSense(row,{role:'WHAT'}).contextualMeaning===meaning);
  const describe=(object,adjective)=>grammar.generate(template,{vocab:{WHAT:[object],ADJECTIVE:[adjective]},verbs:[]},rows=>rows[0]);
  const korā=enriched.find(e=>e.g==='ਕੋਰਾ'&&e.partOfSpeech==='adjective');
  const pot=korā.senses.find(s=>s.id==='wt-sense-960a253b14bfd5e1579a');
  assert.equal(pot.sentenceEligible,false);assert(pot.restrictionReason.includes('earthen pot'));assert(!korā.roleEligibility.ADJECTIVE.senseIds.includes(pot.id));
  assert.equal(bySense('ADJECTIVE',pot.id),undefined);
  assert.deepEqual(korā.meanings,entries.find(e=>e.id===korā.id).meanings,'Dictionary senses, IDs and definitions stay intact.');
  const fresh=bySense('ADJECTIVE','wt-sense-4ba7713b31e4654c4379');assert(fresh);
  for(const [g,meaning] of [['ਕੁਰਸੀ','chair'],['ਦਰਵਾਜ਼ਾ','door']]){
    const object=nounRow(g,meaning);assert(object);
    assert.equal(describe(object,{...korā,selectedSenseId:pot.id}),null,'The restricted earthen-pot sense is unavailable for '+meaning);
    const sentence=describe(object,fresh);assert(sentence);assert.equal(sentence.sentenceBreakdown.find(p=>p.role==='description').selectedSenseId,fresh.selectedSenseId);
  }
  const rainHeavy=bySense('ADJECTIVE','wt-sense-504426242185d4ddecef'),unrestrictedHeavy=bySense('ADJECTIVE','wt-sense-412d2ef8ee5dc9b0fe0a');assert(rainHeavy);assert(unrestrictedHeavy);
  const iron=nounRow('ਲੋਹਾ','iron');assert(iron);
  assert.equal(describe(iron,rainHeavy),null,'Rain-only adjective cannot describe iron.');assert(describe(iron,unrestrictedHeavy));
  const rain=state.vocab.WHAT.find(row=>row.semanticTags.includes('rain'));assert(rain);assert(describe(rain,rainHeavy),'The supported rain sense remains usable.');
  const cattleColor=bySense('ADJECTIVE','wt-sense-0d35991d7a93370deae4'),horseColor=bySense('ADJECTIVE','wt-sense-eb638a59726f3cfc18e9');assert(cattleColor);assert(horseColor);
  const cow=state.vocab.WHAT.find(row=>row.semanticTags.includes('cattle')),horse=state.vocab.WHAT.find(row=>row.semanticTags.includes('horse'));assert(cow);assert(horse);
  assert(describe(cow,cattleColor));assert(describe(horse,horseColor));assert.equal(describe(iron,cattleColor),null);assert.equal(describe(cow,horseColor),null);
  for(const entry of enriched.filter(e=>e.partOfSpeech==='adjective'))for(const sense of entry.senses){
    if(!sense.modifierRestriction)continue;
    assert.equal(sense.modifierRestriction.definition,sense.english);assert.equal(sense.modifierRestriction.nativeReviewed,false);
    if(sense.modifierRestriction.status==='unresolved-target'){
      assert.equal(sense.sentenceEligible,false);assert(sense.restrictionReason);assert(!entry.roleEligibility.ADJECTIVE.senseIds.includes(sense.id));
    }else if(entry.roleEligibility.ADJECTIVE.senseIds.includes(sense.id))assert(sense.modifierTargets.length,'Explicit context retains a supported target mapping.');
  }
});
