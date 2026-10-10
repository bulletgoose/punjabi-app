'use strict';
// Reproduce the report with the application's real data setup and generator.
// No external model, translation API or independently authored sentence is used.
const fs=require('node:fs');
const path=require('node:path');
const {applicationFixture}=require('./application-fixture');

function buildExamples(options={}){
  const fixture=applicationFixture({seed:271828182,...options});
  const {state,context,lexical,grammar,learning,window}=fixture;
  if(!window.PunjabiLexicalSemantics||!window.PunjabiVocabularyAudit)throw Error('Load the integrated lexical semantics and corpus audit modules before generating the report.');
  const semantics=window.PunjabiLexicalSemantics;
  const templates=state.templates.filter(template=>template.enabled!==false);
  const rows=Object.keys(state.vocab).filter(category=>!category.startsWith('GAME_')&&category!=='LEXICON').flatMap(category=>Array.from(state.vocab[category])).concat(Array.from(state.verbs));
  const enabled=new Map(rows.map(row=>[row,row.enabled]));
  function restore(){for(const [row,value]of enabled)row.enabled=value;}
  function describe(sentence){
    const words=[];
    for(const part of sentence.sentenceBreakdown||[]){
      for(const selection of part.lexicalSelections||[]){
        const word=lexical.get(state,selection.vocabularyId);
        if(word&&!words.some(value=>value.selection.vocabularyId===selection.vocabularyId&&value.selection.senseId===selection.senseId))words.push({selection,word,senses:semantics.normalizeSenses(word)});
      }
    }
    const categories=new Set(words.flatMap(value=>{const selected=value.senses.find(sense=>sense.id===value.selection.senseId);return selected&&selected.categories.length?selected.categories:value.word.categories||[];}).filter(category=>!['general','essential','activities','actions'].includes(category)));
    const sourceWords=words.filter(value=>value.senses.some(sense=>sense.sourceSenseId));
    const multiple=words.filter(value=>value.senses.length>1||value.senses.some(sense=>/[,;/]/.test(sense.english)));
    return {sentence,words,categories:Array.from(categories),sourceWords,multiple,sourceMultiple:sourceWords.filter(value=>multiple.includes(value)),signature:sentence.signature};
  }
  const candidates=[],signatures=new Set();
  function record(template,target){
    let sentence;try{sentence=context.assemble(template);}catch(error){return false;}
    if(!sentence||!sentence.gurmukhi||!sentence.english||!sentence.sentenceBreakdown||!sentence.sentenceBreakdown.some(part=>part.lexicalSelections&&part.lexicalSelections.length))return false;
    if(target&&!sentence.sentenceBreakdown.some(part=>(part.lexicalSelections||[]).some(selection=>selection.vocabularyId===target.vocabularyId&&(!target.senseId||selection.senseId===target.senseId))))return false;
    if(signatures.has(sentence.signature))return false;
    signatures.add(sentence.signature);candidates.push(Object.assign(describe(sentence),{priority:target?(target.required?300:100):0,requestedLemma:target&&target.g}));return true;
  }
  // First request representative real dictionary lemmas. If a lemma is not
  // construction-compatible, it is skipped rather than forced into a pattern.
  // These are lexical requests, not authored output sentences. The app still
  // chooses validated surfaces, grammatical constructions and translations.
  const targetsRequested=[
    ['ਕਾਠ','wood','P60','hard'],['ਹੁਕਮ','order','P53'],['ਕਿਤਾਬ','book','P47',null,'read'],
    ['ਅੰਬ','mango','P01',null,'eat'],['ਖੀਰ','kheer (rice pudding)','P51',null,'eat'],
    ['ਆਲੂ','potato','P70'],['ਦੁੱਧ','milk','P08',null,'drink'],['ਚਾਹ','tea','P69'],
    ['ਪਾਣੀ','water','P60','cold'],['ਕੁਰਸੀ','chair','P68','new'],['ਪਹਾੜ','mountain','P62'],
    ['ਨਦੀ','river','P59'],['ਘੋੜਾ','horse','P60','beautiful'],['ਸੋਨਾ','gold','P69'],
    ['ਭਾਸ਼ਾ','language','P59'],['ਰੁੱਖ','tree','P60','big'],['ਦਰਵਾਜ਼ਾ','door','P67','new'],
    ['ਡਾਕਟਰ','doctor','P63'],['ਦੋਸਤ','friend','P61'],['ਫੁੱਲ','flower','P67','red'],
    ['ਪੁਸਤਕ','book','P04',null,'read'],['ਜਹਾਜ਼','ship','P59'],['ਲੋਹਾ','iron','P60','heavy'],
    ['ਮਿੱਟੀ','soil','P68','dry'],['ਪੱਥਰ','stone','P60','hard']
  ];
  // Shared English labels do not establish shared Punjabi usage. These
  // unrestricted source senses exclude 'new' used of an earthen pot and
  // 'heavy' used of pouring rain when describing furniture or metal.
  const unrestrictedAdjectiveSenses={new:'wt-sense-4ba7713b31e4654c4379',heavy:'wt-sense-412d2ef8ee5dc9b0fe0a'};
  function meaning(row,role){const selected=semantics.selectSense(row,{role,senseId:row.selectedSenseId});return selected.ok?selected.contextualMeaning.replace(/^(?:to|a|an|the) /,''):null;}
  function constrain(role,predicate){const pool=role==='VERB'?state.verbs:state.vocab[role]||[];for(const row of pool)row.enabled=enabled.get(row)!==false&&predicate(row);}
  const nominalTemplates=templates.filter(template=>/nominal|noun|identity|identif|object.*description|object.*state|adjective|description/i.test([template.pattern,template.name].join(' '))&&grammar.isStructuredTemplate(template));
  const actionTemplates=templates.filter(template=>['P01','P06','P23','P25','P31','P47','P51','P55'].includes(template.id));
  for(const [gurmukhi,gloss,preferredId,adjectiveGloss,verbBase]of targetsRequested){
    restore();
    const matching=Array.from(state.vocab.WHAT||[]).filter(word=>word.g===gurmukhi&&meaning(word,'WHAT')===gloss&&word.enabled!==false);
    const targets=matching.filter(word=>/wt-pa-/.test(word.vocabularyId||word.id));
    if(!targets.length)targets.push(...matching);
    if(!targets.length)continue;
    const target=targets[0];
    constrain('WHAT',word=>word.id===target.id);
    constrain('WHO',word=>word.id==='who-main'||preferredId==='P53'&&word.id==='who-oh');
    if(adjectiveGloss)constrain('ADJECTIVE',word=>meaning(word,'ADJECTIVE')===adjectiveGloss&&(!unrestrictedAdjectiveSenses[adjectiveGloss]||word.selectedSenseId===unrestrictedAdjectiveSenses[adjectiveGloss]));
    if(verbBase)constrain('VERB',word=>meaning(word,'VERB')===verbBase);
    if(preferredId==='P61')constrain('WHERE',word=>word.id==='where-ghar');
    const expected={vocabularyId:target.vocabularyId||lexical.resolveId(state,target.id),senseId:target.selectedSenseId,g:gurmukhi,required:!!unrestrictedAdjectiveSenses[adjectiveGloss]};
    const preferred=templates.find(template=>template.id===preferredId);
    let found=false;
    for(const template of [preferred].filter(Boolean).concat(nominalTemplates,actionTemplates)){if(record(template,expected)){found=true;break;}}
    if(!found)continue;
  }
  restore();
  constrain('WHO',word=>['who-main','who-tu','who-oh','who-asi','who-tusi','who-ohna'].includes(word.id));
  constrain('WHAT',word=>word.id.startsWith('what-')||targetsRequested.some(target=>target[0]===word.g));
  constrain('WHERE',word=>word.id.startsWith('where-')||['ਘਰ ਵਿੱਚ','ਕਮਰੇ ਵਿੱਚ','ਰਸਤੇ ਤੇ','ਪਹਾੜ ਤੇ'].includes(word.g));
  // Sample additional structures for diversity; comprehensive construction
  // combinations are exercised by the grammar/integration test suites.
  const additionalIds=new Set(['P05','P12','P31','P33','P37','P44','P48','P57','P58','P64','P65','P66','P71']);
  for(const template of templates.filter(value=>additionalIds.has(value.id)))record(template);
  restore();
  const chosen=[],used=new Set(),covered=new Set();
  while(chosen.length<24&&chosen.length<candidates.length){
    const scored=candidates.filter(value=>!used.has(value)).map(value=>({value,score:value.priority+value.categories.filter(category=>!covered.has(category)).length*12+(value.multiple.length?6:0)+(value.sourceWords.length?4:0)+(value.sourceMultiple.length?10:0)+(grammar.isStructuredTemplate(templates.find(template=>template.id===value.sentence.templateId))?2:0)-chosen.filter(previous=>previous.sentence.templateId===value.sentence.templateId).length*8}));
    scored.sort((a,b)=>b.score-a.score);const next=scored[0].value;
    chosen.push(next);used.add(next);next.categories.forEach(category=>covered.add(category));
  }
  if(chosen.length<20)throw Error('Only '+chosen.length+' actual generated examples were available; at least 20 are required.');
  if(!chosen.some(value=>value.sourceMultiple.length))throw Error('The actual generated examples did not include an imported multi-meaning source sense.');
  const labels=new Map(Object.values(learning.categories||{}).map(category=>[category.id,category.label||category.name||category.id]));
  const escape=value=>String(value||'').replace(/\|/g,'\\|').replace(/\n/g,' ');
  const lines=['# Contextual translation examples','',
    'These '+chosen.length+' examples were produced by the application’s actual sentence generator and integrated vocabulary. Run `node scripts/translation-examples.js` to reproduce this report. A fixed random seed makes selection repeatable for the current data and code.','',
    'The dictionary text below is preserved verbatim. Concise sentence meanings reference the same stable sense IDs as the breakdown. Construction eligibility and source-supported metadata do not constitute independent fluent-speaker verification; these examples still require fluent-speaker review.',''];
  lines.push('Imported dictionary text is adapted from English Wiktionary contributors through Kaikki/Wiktextract under CC BY-SA 4.0. See [vocabulary sources](VOCABULARY_SOURCES.md) and [the vocabulary license](../VOCABULARY_LICENSE.txt); individual dictionary entries are linked below.','');
  for(const [index,example]of chosen.entries()){
    const sentence=example.sentence;
    lines.push('## '+(index+1)+'. '+sentence.templateName,'',
      '**Punjabi:** '+sentence.gurmukhi+'  ',
      '**Roman Punjabi:** '+sentence.roman+'  ',
      '**Natural English:** '+sentence.english+'  ',
      '**Template:** `'+sentence.templateId+'`  ',
      '**Categories:** '+(example.categories.map(category=>labels.get(category)||category).join('; ')||'General learning context'),'',
      '| Punjabi phrase | Roman Punjabi | Meaning in this sentence | Role |',
      '| --- | --- | --- | --- |');
    for(const part of sentence.sentenceBreakdown)lines.push('| '+[part.gurmukhi,part.roman,part.english,part.role||part.category].map(escape).join(' | ')+' |');
    lines.push('','| Base entry and selected sense | Contextual lexical meaning | Full dictionary meanings and alternatives | Selection evidence |','| --- | --- | --- | --- |');
    for(const value of example.words){
      const {word,selection,senses}=value;
      const definitions=senses.map(sense=>(sense.id===selection.senseId?'Selected source sense: ':'Other source sense: ')+sense.english).join('; ');
      const evidence=(selection.evidence||[]).map(reason=>{const descriptions={
        'explicit-stable-sense-id':'The construction supplies this stable sense ID.',
        'construction-role-compatibility':'The sense supports this grammatical role.',
        'concise-dictionary-gloss':'The source provides a concise single meaning.',
        'explicit-contextual-gloss':'The audited sense has a concise contextual gloss; full source wording remains available.',
        'authored-verb-gloss':'The authored predicate matches this source meaning.',
        'source-argument-structure':'Source transitivity matches the construction.',
        'authored-english-by-object':'An existing authored light-verb expression supplies the contextual English translation.',
        'authored-polar-question-marker':'The supported construction uses this item as a polar question marker.',
        'user-edited-translation;review-needed':'A learner-authored translation override is preserved and requires review.'
      };return descriptions[reason]||(reason.startsWith('semantic-context:')?'Semantic compatibility: '+reason.slice('semantic-context:'.length):reason);}).join(' ');
      const source=word.source&&word.source.url?' [Source]('+word.source.url+')':'';
      lines.push('| '+[word.g+' — '+word.p+' (`'+selection.senseId+'`)'+source,selection.contextualMeaning,definitions,evidence||'Selected by the supported construction’s explicit lexical metadata.'].map(escape).join(' | ')+' |');
    }
    const notes=sentence.sentenceBreakdown.map(part=>part.grammarNote).filter(Boolean);
    if(notes.length)lines.push('','**Form explanation:** '+Array.from(new Set(notes)).join(' '),'');
  }
  return {markdown:lines.join('\n'),examples:chosen.map(value=>value.sentence),coverage:{examples:chosen.length,candidates:candidates.length,categories:Array.from(covered),examplesWithMultipleDictionaryMeanings:chosen.filter(value=>value.multiple.length).length,examplesWithImportedMultipleDictionaryMeanings:chosen.filter(value=>value.sourceMultiple.length).length,examplesWithDictionarySources:chosen.filter(value=>value.sourceWords.length).length}};
}
if(require.main===module){
  const report=buildExamples();
  fs.writeFileSync(path.join(__dirname,'..','docs','CONTEXTUAL_TRANSLATION_EXAMPLES.md'),report.markdown+'\n');
  console.log(JSON.stringify(report.coverage,null,2));
}
module.exports={buildExamples};
