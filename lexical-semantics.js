/* Dictionary definitions and sentence meanings share stable lexical/sense IDs.
 * This module never edits the source entry or mistakes synonym separators for
 * evidence that a meaning is appropriate in a particular construction. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.PunjabiLexicalSemantics=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const string=value=>typeof value==='string'?value.trim():'';
  const list=value=>Array.isArray(value)?value:[];
  const clean=value=>string(value).replace(/\s+/g,' ');
  const key=value=>clean(value).toLowerCase().replace(/^to /,'').replace(/^(a|an|the) /,'').replace(/[.!]$/,'');
  const roleAliases={WHO:'subject',WHAT:'object',WHERE:'location',WHEN:'time',HOW:'manner',WHY:'reason',ABOUT:'topic',VERBS:'verb',VERB:'verb',STATE:'description',ADJECTIVE:'description'};
  const englishArgumentPhrases={listen:'listen to',wait:'wait for'};
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
    if(gloss)return conciseGloss(gloss,entry);
    // An existing authored verb base is an explicit lexical choice. Verify it
    // against complete source alternatives; do not choose an alternative by
    // its position in a comma/slash-separated dictionary definition.
    const predicateMeaning=authoredPredicateMeaning(entry,sense);
    if(predicateMeaning)return predicateMeaning;
    const bindingMeaning=conciseGloss(entry.e||entry.english,entry);
    if(bindingMeaning&&key(bindingMeaning)===key(sense.english))return bindingMeaning;
    return conciseGloss(sense.english,entry);
  }
  function selectSense(entry,context){
    context=context||{};
    const senses=normalizeSenses(entry),role=roleAliases[context.role]||context.role;
    const requested=context.senseId||context.selectedSenseId||entry&&entry.selectedSenseId||entry&&entry.senseId;
    const semanticTags=list(context.semanticTags).slice();
    const verb=context.verb||{};
    if(verb.takesTags)semanticTags.push(...list(verb.takesTags));else if(verb.takesTag)semanticTags.push(verb.takesTag);
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
      const evidence=[];let score=0;
      if(requested){score+=100;evidence.push('explicit-stable-sense-id');}
      if(role&&roles.includes(role))evidence.push('construction-role-compatibility');
      if(templates.length)evidence.push('authored-template-compatibility');
      if(verbIds.length)evidence.push('authored-predicate-compatibility');
      const matches=sense.semanticTags.filter(tag=>semanticTags.includes(tag));
      if(matches.length){score+=matches.length*10;evidence.push('semantic-context:'+matches.join(','));}
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
    for(const field of ['gender','number','countability','englishCountability','person','englishPerson','inflections','gScript'])if(result.sense[field]!=null)projected[field]=result.sense[field];
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
    if(options.article==='definite')return 'the '+value;
    if(options.article==='indefinite'||countability==='count'||countability==='countable'){
      if(entry.number==='pl'||entry.englishNumber==='pl')return value;
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
  return {version:1,normalizeSenses,selectSense,contextualEntry,lexicalSelection,lexicalId,conciseGloss,authoredPredicateMeaning,englishSubject,englishObjective,englishNounPhrase,inflectEnglish};
});
