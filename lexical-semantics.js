/* Dictionary definitions and sentence meanings share stable lexical/sense IDs.
 * This module never edits the source entry or mistakes synonym separators for
 * evidence that a meaning is appropriate in a particular construction. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./data/sentence-semantic-parameters'));
  else root.PunjabiLexicalSemantics=factory(root.PUNJABI_SENTENCE_SEMANTIC_PARAMETERS);
})(typeof globalThis!=='undefined'?globalThis:this,function(parameters){
  'use strict';
  const string=value=>typeof value==='string'?value.trim():'';
  const list=value=>Array.isArray(value)?value:[];
  const clean=value=>string(value).replace(/\s+/g,' ');
  const key=value=>clean(value).toLowerCase().replace(/^to /,'').replace(/^(a|an|the) /,'').replace(/[.!]$/,'');
  const roleAliases={WHO:'subject',WHAT:'object',WHERE:'location',WHEN:'time',HOW:'manner',WHY:'reason',ABOUT:'topic',VERBS:'verb',VERB:'verb',STATE:'description',ADJECTIVE:'description'};
  const englishArgumentPhrases={listen:'listen to',wait:'wait for'};
  parameters=parameters||{heads:{},predicates:{},modifiers:{},senseReviews:{}};
  const headGroups=Object.fromEntries(Object.entries(parameters.heads).map(([name,words])=>[name,new Set(words.split('|'))]));
  const inGroup=(name,head)=>!!headGroups[name]&&headGroups[name].has(head);
  function selectedSource(entry){return list(entry&&entry.senses).find(s=>s.id===(entry.selectedSenseId||entry.senseId))||{};}
  function propertiesOf(entry,sense){
    entry=entry||{};sense=sense||selectedSource(entry);
    // An audited empty tag list is unresolved evidence, not permission to
    // borrow tags from another sense of the canonical entry.
    const tags=sense.classification?list(sense.semanticTags):list(sense.semanticTags).length?sense.semanticTags:list(entry.semanticTags||entry.tags),has=tag=>tags.includes(tag);
    const props=Object.assign({},sense.classification?{}:entry.semantic,sense.classification?{}:entry.semantics,sense.classification?{}:entry.semanticProperties,sense.semanticProperties),head=sense.classification&&sense.classification.head||key(sense.contextualGloss||entry.e||entry.english).replace(/^(?:at|in|on|to|from) (?:a |an |the )?/,'').replace(/^(?:my|your|our|their|his|her) /,'').replace(/ \([^)]*\)$/,'');
    const digital=['email','e-mail','software','website','internet','information','news','language'].includes(head);
    const celestial=inGroup('celestial',head),place=has('place')||has('geographical'),human=entry.partOfSpeech==='pronoun'||props.human===true||(!sense.classification||!!sense.classification.head)&&(has('human')||inGroup('human',head));
    const animal=has('animal'),food=has('edible'),drinkable=has('drinkable'),liquid=drinkable||inGroup('liquid',head),gas=inGroup('gas',head);
    const material=has('material'),manufactured=has('concrete')||has('tool')||has('wearable')||has('readable');
    const physical=!digital&&(manufactured||material||food||drinkable||has('plant')||animal||human||place||has('physical-object')||has('anatomical'))&&!celestial;
    const portable=!place&&!digital&&!celestial&&!gas&&(manufactured||material||food||drinkable||inGroup('portable',head)||inGroup('smallAnimal',head)||['baby','infant','child'].includes(head));
    const solid=physical&&!liquid&&!gas&&!place&&!has('anatomical')&&!human&&!animal;
    const communicative=has('communication')||has('readable')||digital||['help','aid','assistance','advice','permission'].includes(head);
    const produce=list(sense.categories).includes('produce')&&food;
    const abstract=has('abstract')||has('emotion')||has('character')||has('temporal')||has('quantity')||digital;
    const grains=['sand','soil','flour','sugar','rice','salt','dust','cement'].includes(head);
    const values={head,human,animal,plant:has('plant'),food,solidFood:food&&!liquid&&!['flour','sugar','salt'].includes(head),suckable:drinkable||food&&inGroup('juicyFood',head),drinkable,liquid,gas,digital,celestial,place,geographical:has('geographical'),material,abstract,communicative,produce,
      portable,liftable:portable&&!liquid&&!grains,graspable:portable&&!liquid&&!grains||human||animal||has('anatomical'),
      weighable:physical&&!place&&!gas&&!digital&&!celestial,accessible:physical&&!has('geographical'),scentBearing:physical&&!place&&!digital,
      transferable:portable||digital||!place&&!celestial&&['giveable','takeable','bringable','sendable','loanable'].some(has),purchasable:portable||digital||['land','house','home','building','apartment','car','bus','ship','boat'].includes(head),
      heightBearing:human||inGroup('tall',head),lengthBearing:inGroup('length',head)||has('wearable'),depthBearing:inGroup('depth',head),
      textureBearing:solid&&!digital||has('anatomical'),shapeBearing:solid||inGroup('surface',head),moistureBearing:solid||inGroup('surface',head)||has('plant'),
      freshnessBearing:food||drinkable||has('plant')||head==='soil',colourBearing:physical&&!human&&!has('anatomical')&&!celestial,
      temperatureBearing:physical,transparent:inGroup('transparent',head),breakable:manufactured&&!food&&!drinkable||has('plant'),
      indoor:inGroup('indoor',head),container:has('container'),space:has('space'),economic:has('economic'),quantity:has('quantity'),serviceProvider:has('occupation'),cuttable:has('cuttable')||inGroup('slicedFood',head)};
    // A dictionary head such as drill is polysemous in English as well. The
    // complete definition takes precedence over the tool-head shortcut.
    if(head==='drill'&&/\b(?:parade|exercise|military)\b/i.test(sense.english||''))for(const name of ['portable','liftable','graspable','weighable','accessible','scentBearing','transferable','purchasable','textureBearing','shapeBearing','colourBearing','temperatureBearing','breakable'])values[name]=false;
    return Object.assign({},props,values);
  }
  function semanticMetadata(sense,entry){
    const properties=propertiesOf(entry,sense),head=properties.head;
    const extraTags=Object.entries(properties).filter(([,value])=>value===true).map(([name])=>name);
    let englishCountability=sense.englishCountability,englishNumber=sense.englishNumber;
    if(inGroup('pluralEnglish',head)){englishNumber='pl';englishCountability='countable';}
    else if(inGroup('massEnglish',head)||properties.drinkable){englishNumber='sg';englishCountability='uncountable';}
    else if((properties.human||properties.animal||properties.produce||inGroup('discreteFood',head)||sense.semanticProperties&&sense.semanticProperties.countability==='countable')&&head&&head!=='household'){englishNumber='sg';englishCountability='countable';}
    const modifierTargets=parameters.modifiers[key(sense.contextualGloss||sense.english)];
    const review=parameters.senseReviews[sense.sourceSenseId]||parameters.senseReviews[sense.id];
    return {properties,extraTags,englishCountability,englishNumber,modifierTargets:!sense.modifierRestriction&&modifierTargets?modifierTargets:null,review};
  }
  function aspectOf(context){return context.aspect||context.template&&context.template.aspect||(/(?:progress|Progress)/.test(context.template&&context.template.pattern||'')?'progressive':null);}
  function predicateCompatibility(entry,context,sense,meaning){
    context=context||{};sense=sense||selectedSource(entry);const base=key(meaning||sense.contextualGloss||entry.base||entry.e||entry.english),frame=parameters.predicates[base],rules=[];
    const fail=(rule,reason)=>({ok:false,rule,reason,rules});
    const subject=context.subject&&propertiesOf(context.subject),object=context.object&&propertiesOf(context.object);
    for(const qualifier of list(sense.qualifiers)){
      if(/^for sun$/i.test(qualifier)&&subject&&subject.head!=='sun')return fail('source-qualified-agent','This source sense requires the sun as subject.');
    }
    const alternatives=string(sense.english).split(/[,;]/).map(key);
    if(subject&&alternatives.includes('fall')&&alternatives.includes('flow')&&subject.human)return fail('natural-process-agent','The fall/flow sense describes a natural process, not a person falling.');
    if(/\bappear\b.*\bseem\b.*\bbe felt\b/.test(sense.english||''))return fail('copular-complement-required','This source sense requires a predicative complement not supplied by action templates.');
    if(frame&&frame.stative&&/progressive/i.test(aspectOf(context)||''))return fail('stative-aspect','The ordinary stative sense is not supported in this progressive construction.');
    if(frame&&frame.objectAny){
      if(!object&&context.complete)return fail('predicate-object-required','This predicate requires an object.');
      if(object&&!frame.objectAny.some(p=>object[p]===true||contextTags(context.object).includes(p)))return fail('predicate-'+frame.family,'The object lacks the required '+frame.objectAny.join('/')+' property.');
      if(object)rules.push('predicate-'+frame.family);
    }
    if(object&&base==='see'&&['news','television'].includes(object.head)&&list(entry.senses).some(s=>/\bwatch\b/.test(s.english||'')))return fail('media-predicate-sense','The available watch sense is the supported ordinary reading for this media object.');
    if(context.instrument&&object&&object.digital&&!propertiesOf(context.instrument).digital)return fail('instrument-medium','A physical writing instrument does not produce this digital object.');
    return {ok:true,rules};
  }
  function modifierCompatibility(sense,entry,noun,meaning){
    const props=propertiesOf(noun),gloss=key(meaning||sense.contextualGloss||sense.english),targets=parameters.modifiers[gloss];
    const explicit=list(sense.modifierRestriction&&sense.modifierRestriction.targets);
    if(explicit.length&&!explicit.some(t=>contextTags(noun).includes(t)||props[t]===true))return false;
    if(targets&&!targets.some(t=>props[t]===true||contextTags(noun).includes(t)))return false;
    if(gloss==='long'&&props.human)return false;
    if(gloss==='deep'&&/\bfast\b/.test(sense.english||''))return false;
    return true;
  }
  function lexicalId(entry){const id=string(entry&&entry.vocabularyId)||string(entry&&entry.id)||string(entry&&entry.primaryId);return id&&(!id.startsWith('lex:')?'lex:'+id:id);}
  function normalizeSenses(entry){
    if(!entry)return [];
    const source=Array.isArray(entry.senses)&&entry.senses.length?entry.senses:Array.isArray(entry.meanings)&&entry.meanings.length?entry.meanings:[entry.e||entry.english].filter(Boolean);
    return source.map((value,index)=>{
      const sense=typeof value==='string'?{english:value}:Object.assign({},value);
      sense.id=string(sense.id||sense.senseId)||'sense:'+lexicalId(entry)+':legacy-'+(index+1);
      sense.english=clean(sense.english||sense.definition||sense.gloss);
      sense.partOfSpeech=sense.partOfSpeech||entry.partOfSpeech||entry.pos||null;
      sense.source=sense.source||entry.source||null;
      sense.tags=list(sense.tags);sense.qualifiers=list(sense.qualifiers);
      sense.semanticTags=list(sense.semanticTags);sense.categories=list(sense.categories);
      sense.examples=list(sense.examples);
      sense.verification=sense.verification||{sourceSupported:!!sense.sourceSenseId,nativeReviewed:false,status:sense.sourceSenseId?'dictionary-source;fluent-review-pending':'legacy-preserved;fluent-review-pending'};
      return sense;
    });
  }
  function conciseGloss(value,entry){
    const gloss=clean(value);
    if((gloss==='he/she'||gloss==='he or she')&&entry&&entry.partOfSpeech==='pronoun')return 'he or she';
    // Commas, slashes and semicolons can separate senses or synonyms. Long
    // definitions, form-of records and disjunctions need an authored mapping.
    if(!gloss||/[,;/\n]|\bor\b|\balternative\b|\bform of\b|\bstem of\b|\bplural of\b|\bspelling of\b/i.test(gloss)||gloss.split(' ').length>7)return null;
    return gloss.replace(/[.!]$/,'');
  }
  function rolesOf(sense){return list(sense.compatibleRoles||sense.roles||sense.sentenceRoles||sense.buildingBlockRoles).map(role=>roleAliases[role]||role);}
  const physicalTags=['physical-object','concrete','edible','drinkable','material','plant','animal','human','wearable','readable','tool','place'];
  function contextTags(entry){
    const tags=list(entry&&(entry.semanticTags||entry.tags)).slice();
    if(tags.some(tag=>physicalTags.includes(tag))&&!tags.includes('physical-object'))tags.push('physical-object');
    return tags;
  }
  // Restrictions describe argument classes, never Punjabi spellings. They
  // apply even to an explicitly bound sense: a binding is not context proof.
  function argumentCompatibility(sense,entry,context,meaning){
    const role=roleAliases[context.role]||context.role,restrictions=sense.semanticRestrictions||{};
    const described=context.described||(role==='description'&&(context.object||context.subject));
    const targets=list(sense.modifierTargets||entry.modifierTargets);
    if(described&&targets.length&&!targets.some(tag=>tag==='entity'||contextTags(described).includes(tag)||propertiesOf(described)[tag]===true))return false;
    if(described&&!modifierCompatibility(sense,entry,described,meaning))return false;
    for(const argument of ['subject','object','recipient','described']){
      const required=list(restrictions[argument+'Tags']),excluded=list(restrictions['excluded'+argument.charAt(0).toUpperCase()+argument.slice(1)+'Tags']);
      const value=argument==='described'?described:context[argument];
      if(value&&((required.length&&!required.some(tag=>contextTags(value).includes(tag)))||excluded.some(tag=>contextTags(value).includes(tag))))return false;
    }
    const head=key(meaning||sense.contextualGloss||sense.english).split(/[,;]/)[0];
    // Evaluation of a task is not a botanical property; the same distinction
    // applies to every adjective carrying these English senses.
    if(described&&['difficult','hazardous','easy','arduous'].includes(head)&&!contextTags(described).some(tag=>['abstract','activity','task','human'].includes(tag)))return false;
    if(role==='verb'&&context.object&&['allocate','allot'].includes(head)&&!contextTags(context.object).some(tag=>['economic','quantity','abstract'].includes(tag)))return false;
    if(role==='verb'&&!predicateCompatibility(entry,context,sense,meaning).ok)return false;
    const primary=key(entry.e||entry.english).split(/[,;]/)[0];
    if(['object','subject','topic'].includes(role)&&primary==='water'&&sense.classification&&sense.classification.head==='juice'&&!list(context.semanticTags).includes('extract-source'))return false;
    return true;
  }
  function dictionaryDisplayGloss(value,sense,entry){
    const gloss=clean(value),match=gloss.match(/^(.*?) \(([^()]*)\)$/);
    if(!match)return gloss;
    const tags=list(sense.semanticTags).length?contextTags(sense):contextTags(entry);
    const labels={plant:['plant','edible'],fruit:['plant','edible'],vegetable:['plant','edible'],animal:['animal'],person:['human']};
    const label=match[2].toLowerCase(),pos=sense.partOfSpeech||entry.partOfSpeech||entry.pos;
    // Remove only recognized dictionary category labels corroborated by the
    // selected sense. Meaning-bearing parentheses and edited phrases survive.
    if((labels[label]&&labels[label].some(tag=>tags.includes(tag)))||label===pos||(label==='informal'&&pos==='pronoun'))return match[1];
    if(/^(?:plant and seed|flower and plant|plant or seed|fruit or tree)$/.test(label)&&tags.some(t=>['plant','ingredient','edible'].includes(t)))return match[1];
    if(/^(?:(?:kind|type|sort) of )?(?:rice dish|ice cream|indian shirt)$/.test(label)&&tags.some(t=>['edible','food','wearable'].includes(t)))return match[1];
    return gloss;
  }
  function authoredPredicateMeaning(entry,sense){
    if(!entry||!sense||!((sense.partOfSpeech||entry.partOfSpeech)==='verb'||entry.infinitive)||!entry.base)return null;
    const alternatives=string(sense.english).split(/[,;/]/).map(value=>key(value));
    if(alternatives.includes(key(entry.base))||alternatives.some(value=>englishArgumentPhrases[value]===entry.base))return 'to '+entry.base;
    return null;
  }
  function contextualGloss(sense,entry,context){
    const role=roleAliases[context.role]||context.role;
    const byRole=sense.contextualMeanings||sense.englishByRole||{};
    const override=entry.translationOverride;
    const overrideApplies=override&&typeof override==='object'&&override.source==='user'&&(override.senseId===sense.id||override.senseId===sense.sourceSenseId);
    let gloss=overrideApplies?string(override.english):string(byRole[role]||byRole[context.role]||sense.contextualGloss||sense.sentenceGloss);
    if(!gloss&&(entry.id==='when-kal'||entry.primaryId==='when-kal'))gloss=context.tense==='past'||context.timeReference==='past'?'yesterday':context.tense==='future'||context.timeReference==='future'?'tomorrow':'';
    if(!gloss&&context.senseId&&entry.contextualGloss)gloss=string(entry.contextualGloss);
    function render(gloss){
      // Dividing/giving away food is naturally expressed as sharing it. This
      // realizes the existing distribution sense, retaining its source ID and
      // arguments; it does not add a dictionary definition or a recipient.
      const alternatives=string(sense.english).split(/[,;]/).map(key);
      if(!overrideApplies&&role==='verb'&&contextTags(context.object).some(tag=>['edible','drinkable'].includes(tag))&&alternatives.includes('give away')&&alternatives.includes('distribute')&&['distribute','divide'].includes(key(gloss)))gloss='to share';
      else if(!overrideApplies&&role==='verb'&&context.object&&alternatives.includes('give away')&&alternatives.includes('distribute')&&['distribute','divide'].includes(key(gloss))&&(context.object.englishNumber||context.object.number)!=='pl')gloss='to give away';
      if(!overrideApplies&&role==='verb'&&/progressive/i.test(aspectOf(context)||'')&&alternatives.includes('find')&&(alternatives.includes('search')||alternatives.includes('seek')))gloss='to search for';
      if(!overrideApplies&&role==='verb'&&context.subject&&propertiesOf(context.subject).human&&alternatives.includes('drown')&&alternatives.includes('dive'))gloss='to drown';
      if(!overrideApplies&&role==='description'&&context.described&&key(gloss)==='high'){
        const p=propertiesOf(context.described);if(p.heightBearing&&!p.geographical)gloss='tall';
      }
      if(!overrideApplies&&(role==='subject'||role==='object')&&alternatives.includes('daughter')&&alternatives.includes('child'))gloss='child';
      return conciseGloss(overrideApplies?gloss:dictionaryDisplayGloss(gloss,sense,entry),entry);
    }
    if(gloss)return render(gloss);
    // An existing authored verb base is an explicit lexical choice. Verify it
    // against complete source alternatives; do not choose an alternative by
    // its position in a comma/slash-separated dictionary definition.
    const predicateMeaning=authoredPredicateMeaning(entry,sense);
    if(predicateMeaning)return render(predicateMeaning);
    const bindingMeaning=conciseGloss(entry.e||entry.english,entry);
    if(bindingMeaning&&key(bindingMeaning)===key(sense.english))return render(bindingMeaning);
    return render(sense.english);
  }
  function selectSense(entry,context){
    context=context||{};
    const senses=normalizeSenses(entry),role=roleAliases[context.role]||context.role;
    const requested=context.senseId||context.selectedSenseId||entry&&entry.selectedSenseId||entry&&entry.senseId;
    const semanticTags=list(context.semanticTags).slice();
    const verb=context.verb||{};
    if(role==='object'){
      if(verb.takesTags)semanticTags.push(...list(verb.takesTags));else if(verb.takesTag)semanticTags.push(verb.takesTag);
    }
    const related=role==='description'?context.described||context.object||context.subject:role==='verb'?context.object:null;
    semanticTags.push(...contextTags(related));
    const candidates=[];
    for(const sense of senses){
      if(requested&&sense.id!==requested&&sense.sourceSenseId!==requested)continue;
      if(sense.sentenceEligible===false||sense.eligible===false)continue;
      const roles=rolesOf(sense);
      if(role&&roles.length&&!roles.includes(role))continue;
      const restrictions=sense.semanticRestrictions||{};
      const templateId=typeof context.template==='string'?context.template:context.template&&context.template.id;
      const templates=list(sense.compatibleTemplateIds||sense.templateIds||sense.compatibleTemplates);
      if(templates.length&&(!templateId||!templates.includes(templateId)))continue;
      const verbIds=list(restrictions.verbIds),verbId=verb.id||verb.primaryId;
      if(verbIds.length&&(!verbId||!verbIds.includes(verbId)))continue;
      const required=list(restrictions.requiredContextTags);
      if(required.length&&!required.every(tag=>semanticTags.includes(tag)))continue;
      if(context.transitive===true&&sense.tags.includes('intransitive')&&!sense.tags.includes('transitive'))continue;
      if(context.transitive===false&&sense.tags.includes('transitive')&&!sense.tags.includes('intransitive'))continue;
      const meaning=contextualGloss(sense,entry,context);
      if(!argumentCompatibility(sense,entry,context,meaning))continue;
      const evidence=[];let score=0;
      if(requested){score+=100;evidence.push('explicit-stable-sense-id');}
      if(role&&roles.includes(role))evidence.push('construction-role-compatibility');
      if(templates.length)evidence.push('authored-template-compatibility');
      if(verbIds.length)evidence.push('authored-predicate-compatibility');
      const matches=sense.semanticTags.filter(tag=>semanticTags.includes(tag));
      if(matches.length){score+=matches.length*10;evidence.push('semantic-context:'+matches.join(','));}
      if(related){
        const targets=list(sense.modifierTargets||entry.modifierTargets).filter(tag=>contextTags(related).includes(tag));
        if(targets.length){score+=targets.length*10;evidence.push('modifier-target:'+targets.join(','));}
        evidence.push('sentence-argument-compatibility');
        if(key(meaning)==='share'&&!string(sense.english).split(/[,;]/).map(key).includes('share'))evidence.push('food-context-realization-of-distribution-sense');
      }
      if(context.transitive!==undefined&&sense.tags.includes(context.transitive?'transitive':'intransitive')){score+=5;evidence.push('source-argument-structure');}
      if(context.englishBase&&key(sense.english)===key(context.englishBase)){score+=20;evidence.push('authored-verb-gloss');}
      if(entry.translationOverride&&entry.translationOverride.source==='user'&&(entry.translationOverride.senseId===sense.id||entry.translationOverride.senseId===sense.sourceSenseId))evidence.push('user-edited-translation;review-needed');
      else if(sense.contextualGloss||sense.sentenceGloss)evidence.push('explicit-contextual-gloss');else evidence.push('concise-dictionary-gloss');
      candidates.push({sense,meaning,score,evidence});
    }
    candidates.sort((a,b)=>b.score-a.score);
    if(!candidates.length)return {ok:false,senseId:null,contextualMeaning:null,reason:requested?'Requested sense is missing, incompatible or lacks a concise contextual gloss.':'No compatible sense has a source-supported concise sentence meaning.',evidence:[]};
    const best=candidates[0];
    // A readable first definition does not authorize us to discard other
    // meanings. Multiple senses need a unique contextual match or explicit ID.
    if(!requested&&candidates[1]&&candidates[1].score===best.score)return {ok:false,senseId:null,contextualMeaning:null,reason:'Multiple dictionary senses remain ambiguous in this construction.',evidence:[]};
    if(!best.meaning)return {ok:false,senseId:best.sense.id,contextualMeaning:null,reason:'The compatible sense lacks a source-supported concise sentence meaning.',evidence:best.evidence};
    return {ok:true,sense:best.sense,senseId:best.sense.id,contextualMeaning:best.meaning,reason:requested?'Explicit construction sense selected.':'Unique compatible contextual meaning.',evidence:best.evidence};
  }
  function lexicalSelection(entry,context){const result=selectSense(entry,context);return result.ok?{vocabularyId:lexicalId(entry),senseId:result.senseId,contextualMeaning:result.contextualMeaning,evidence:result.evidence}:null;}
  function contextualEntry(entry,context){
    const result=selectSense(entry,context);
    if(!result.ok)return null;
    const projected=Object.assign({},entry,{dictionaryMeaning:result.sense.english,e:result.contextualMeaning,english:result.contextualMeaning,selectedSenseId:result.senseId,lexicalSelection:{vocabularyId:lexicalId(entry),senseId:result.senseId,contextualMeaning:result.contextualMeaning,evidence:result.evidence}});
    const bindingMeaning=conciseGloss(entry.e||entry.english,entry);
    if(bindingMeaning&&/^(?:at|in|on|to|from|with|about) /i.test(bindingMeaning)&&key(bindingMeaning.replace(/^(?:at|in|on|to|from|with|about) /i,''))===key(result.contextualMeaning)){
      projected.e=bindingMeaning;projected.english=bindingMeaning;projected.phraseMeaning=bindingMeaning;
    }
    const phraseOverride=entry.phraseTranslationOverride;
    const phraseMeaning=phraseOverride&&phraseOverride.source==='user'&&clean(phraseOverride.english);
    if(phraseMeaning){projected.e=phraseMeaning;projected.english=phraseMeaning;projected.phraseMeaning=phraseMeaning;projected.phraseTranslationEvidence='user-edited-phrase-translation;review-needed';projected.lexicalSelection.phraseTranslation={english:phraseMeaning,source:'user',reviewStatus:'unverified'};}
    if((entry.partOfSpeech||entry.pos)==='verb'||entry.infinitive)projected.base=result.contextualMeaning.replace(/^to /,'');
    const tags=result.sense.tags;
    for(const field of ['gender','number','countability','englishCountability','englishNumber','person','englishPerson','inflections','gScript','modifierTargets','modifierKind'])if(result.sense[field]!=null)projected[field]=result.sense[field];
    if(!projected.countability){if(tags.includes('uncountable'))projected.countability='mass';else if(tags.includes('countable'))projected.countability='count';}
    if(!result.sense.gender){if(tags.includes('feminine')&&!tags.includes('masculine'))projected.gender='f';else if(tags.includes('masculine')&&!tags.includes('feminine'))projected.gender='m';}
    const enrichedSemantics=result.sense.classification||result.sense.semanticProperties||result.sense.semanticTags.length;
    projected.semanticTags=enrichedSemantics?result.sense.semanticTags.slice():list(entry.semanticTags||entry.tags).slice();
    if(result.sense.semanticProperties){
      projected.semanticProperties=Object.assign({},entry.semanticProperties,result.sense.semanticProperties);
      if(entry.semantic&&typeof entry.semantic==='object'&&!Array.isArray(entry.semantic))projected.semantic=Object.assign({},entry.semantic,result.sense.semanticProperties);
      if(entry.semantics&&typeof entry.semantics==='object'&&!Array.isArray(entry.semantics))projected.semantics=Object.assign({},entry.semantics,result.sense.semanticProperties);
    }
    projected.tags=projected.semanticTags;
    const construction=entry.construction;
    if(construction&&construction.type==='postpositional-phrase'&&/^(?:at|in|on|to|from|with|about)$/.test(construction.englishPrefix||'')&&!phraseMeaning){
      const article=construction.englishArticle==='definite'?'definite':construction.englishArticle==='indefinite'?'indefinite':null;
      const phrase=construction.englishPrefix+' '+englishNounPhrase(Object.assign({},projected,{e:result.contextualMeaning,english:result.contextualMeaning}),article?{article}:{});
      projected.e=phrase;projected.english=phrase;projected.phraseMeaning=phrase;
      projected.lexicalSelection.phraseTranslation={english:phrase,source:'validated-construction',constructionType:construction.type};
    }
    return projected;
  }
  function englishSubject(entry,options){
    options=options||{};let value=clean(entry&&entry.e||entry&&entry.english).replace(/ \(informal\)$/,'');
    if(value==='he/she'||value==='he or she')value=options.genderEstablished&&entry.gender==='f'?'she':options.genderEstablished&&entry.gender==='m'?'he':'he or she';
    if(entry&&entry.partOfSpeech==='noun'){
      const countability=entry.englishCountability||entry.countability||entry.grammar&&entry.grammar.countability;
      return englishNounPhrase(Object.assign({},entry,{e:value}),['count','countable','mass','uncountable'].includes(countability)?{}:{article:'definite'});
    }
    return value;
  }
  function englishObjective(entry,options){const value=englishSubject(entry,options);return {I:'me',he:'him',she:'her',we:'us',they:'them','he or she':'him or her'}[value]||value;}
  function englishNounPhrase(entry,options){
    options=options||{};const value=clean(entry&&entry.e||entry&&entry.english);
    if(!value)return '';
    if(/^(?:a|an|the|my|your|our|their|his|her|this|that|these|those|some|any|each|every|no)\b/i.test(value)||/^[A-Z]/.test(value)||entry&&['pronoun','adverb','expression'].includes(entry.partOfSpeech))return value;
    // English determiner behavior is independent of the Punjabi noun's
    // grammatical countability; an audited translation hint may supply it.
    const countability=entry&&(entry.englishCountability||entry.countability||entry.grammar&&entry.grammar.countability);
    const article=entry&&(entry.englishArticle||entry.definiteness)||options.article||(options.definite===true?'definite':options.definite===false?'indefinite':null);
    if(article==='definite')return 'the '+value;
    if(article==='bare'||article==='generic'||article==='none')return value;
    if(['mass','uncountable'].includes(countability))return value;
    if(article==='indefinite'||countability==='count'||countability==='countable'){
      if((entry.englishNumber||entry.number)==='pl')return value;
      return (/^(?:honest|hour|heir|[aeiou])/i.test(value)&&!/^uni(?:vers|form|t)|^use|^euro/i.test(value)?'an ':'a ')+value;
    }
    // Unknown countability stays bare rather than inventing mass/count facts.
    return value;
  }
  function inflectEnglish(base,kind,person){
    const parts=clean(base).split(' '),verb=parts.shift();let form=verb;
    if(kind==='habitual'&&person==='3sg')form={be:'is',have:'has',do:'does',go:'goes'}[verb]||(/[^aeiou]y$/i.test(verb)?verb.slice(0,-1)+'ies':/(s|sh|ch|x|z|o)$/i.test(verb)?verb+'es':verb+'s');
    if(kind==='progressive')form={be:'being',get:'getting',sit:'sitting',run:'running',swim:'swimming',stop:'stopping',put:'putting',cut:'cutting',lie:'lying',die:'dying',tie:'tying',begin:'beginning',win:'winning',dig:'digging',prefer:'preferring',plan:'planning'}[verb]||(/ie$/.test(verb)?verb.slice(0,-2)+'ying':/e$/.test(verb)&&!/(ee|ye|oe)$/.test(verb)?verb.slice(0,-1)+'ing':verb+'ing');
    if(kind==='perfective')form=verb==='lie'&&parts[0]==='down'?'lay':{be:'was',have:'had',do:'did',go:'went',come:'came',eat:'ate',drink:'drank',give:'gave',take:'took',read:'read',write:'wrote',send:'sent',buy:'bought',bring:'brought',find:'found',think:'thought',speak:'spoke',sleep:'slept',rise:'rose',sit:'sat',run:'ran',see:'saw',hear:'heard',teach:'taught',understand:'understood',make:'made',pay:'paid',meet:'met',feel:'felt',leave:'left',keep:'kept',sell:'sold',tell:'told',say:'said',hold:'held',fall:'fell',stand:'stood',wear:'wore',break:'broke',lose:'lost',choose:'chose',drive:'drove',swim:'swam',put:'put',cut:'cut',set:'set',let:'let',cost:'cost',hit:'hit',get:'got',wake:'woke',sing:'sang',fly:'flew',grow:'grew',become:'became',know:'knew',begin:'began',forget:'forgot',forgive:'forgave',win:'won',dig:'dug',catch:'caught',throw:'threw',draw:'drew',build:'built',fight:'fought',feed:'fed',lead:'led',lend:'lent',spend:'spent',shut:'shut'}[verb]||(/[^aeiou]y$/.test(verb)?verb.slice(0,-1)+'ied':/e$/.test(verb)?verb+'d':({stop:'stopped',plan:'planned',prefer:'preferred',travel:'travelled'}[verb]||verb+'ed'));
    return [form].concat(parts).join(' ');
  }
  function validateGeneratedSentence(sentence,resolve,template){
    if(!sentence)return {ok:false,reason:'No sentence.'};
    if(template&&template.pattern==='wordPractice')return {ok:true,rules:['quoted-dictionary-form']};
    const nodes=[],rules=new Set(),fail=(rule,reason)=>({ok:false,rule,reason,rules:[...rules]});
    for(const [index,part] of (sentence.sentenceBreakdown||[]).entries())for(const selection of part.lexicalSelections||[]){
      const entry=resolve(selection.vocabularyId);if(!entry)continue;
      const sense=normalizeSenses(entry).find(s=>s.id===selection.senseId);if(!sense)return fail('stable-sense-reference','The selected sense is absent.');
      const authoredFunction=['CONNECTOR','QUESTION','NUMBER'].includes(part.category)&&list(selection.evidence).includes('authored-construction-context');
      if(sense.sentenceEligible===false&&!authoredFunction)return fail('unsupported-sense-construction',sense.restrictionReason||'This source sense is not approved for sentence construction.');
      const node=Object.assign({},entry,{selectedSenseId:sense.id,e:selection.contextualMeaning,semanticTags:sense.semanticTags.length?sense.semanticTags:entry.semanticTags,semanticProperties:Object.assign({},entry.semanticProperties,sense.semanticProperties)});
      nodes.push({entry:node,source:entry,sense,index,part,selection});
    }
    const subjects=nodes.filter(n=>n.part.category==='WHO'||['subject','experiencer','possessor','addressee'].includes(n.part.role));
    for(const node of nodes.filter(n=>n.part.category==='WHO'))if(!propertiesOf(node.entry).human)return fail('human-role-evidence','This person slot needs human evidence for the selected sense, not another sense of the word.');
    const objects=nodes.filter(n=>n.part.category==='WHAT'||n.part.role==='object');
    const subject=subjects[0]&&subjects[0].entry,recipient=nodes.find(n=>n.part.role==='recipient'||n.part.category==='RECIPIENT');
    const instrument=nodes.find(n=>n.part.role==='instrument'||n.part.category==='INSTRUMENT');
    for(const n of nodes){
      const pos=n.sense.partOfSpeech||n.entry.partOfSpeech;
      if(pos==='verb'){
        const object=objects.filter(o=>o.index<n.index).at(-1)||objects[0];
        const result=predicateCompatibility(n.entry,{subject,object:object&&object.entry,recipient:recipient&&recipient.entry,instrument:instrument&&instrument.entry,template,complete:true},n.sense,n.selection.contextualMeaning);
        if(!result.ok)return result;result.rules.forEach(r=>rules.add(r));
      }
      if(pos==='adjective'){
        const described=(objects[0]||subjects[0]);
        if(described&&!modifierCompatibility(n.sense,n.entry,described.entry,n.selection.contextualMeaning))return fail('modifier-dimension','The noun lacks this modifier’s supported property.');
        if(described)rules.add('modifier-dimension');
      }
    }
    const location=nodes.find(n=>n.part.role==='location'||n.part.category==='WHERE');
    if(location&&objects[0]&&/nominalLocation|thereIs/.test(template&&template.pattern||'')){
      const item=propertiesOf(objects[0].entry),place=propertiesOf(location.entry);
      if(place.indoor&&(item.geographical||item.celestial||item.place&&!['room','bedroom','bathroom','kitchen'].includes(item.head)))return fail('location-scale','The entity does not fit this ordinary indoor location.');
      rules.add('location-scale');
    }
    if(template&&template.pattern==='comparison'&&objects.length>1&&lexicalId(objects[0].entry)===lexicalId(objects[1].entry))return fail('distinct-comparison','The comparison needs distinct referents.');
    if(recipient&&subject&&subject.partOfSpeech==='pronoun'&&lexicalId(recipient.entry)===lexicalId(subject))return fail('reflexive-recipient-required','This self-transfer needs a reflexive construction not supported by this template.');
    return {ok:true,rules:[...rules]};
  }
  return {version:2,normalizeSenses,selectSense,contextualEntry,lexicalSelection,lexicalId,conciseGloss,authoredPredicateMeaning,englishSubject,englishObjective,englishNounPhrase,inflectEnglish,propertiesOf,semanticMetadata,predicateCompatibility,modifierCompatibility,validateGeneratedSentence};
});
