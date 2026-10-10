const test=require('node:test');
const assert=require('node:assert/strict');
const semantics=require('../lexical-semantics');
const imported=require('../data/vocabulary-expansion').entries;
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');

function applicationFixture(){
  const lexical=require('../linguistic-system'),grammar=require('../grammar-engine'),learning=require('../learning-context');
  const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
  const window={PunjabiLexicalSemantics:semantics,PunjabiLinguisticSystem:lexical,PunjabiGrammarEngine:grammar,PunjabiLearningContext:learning};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','game-vocabulary.js'),'utf8'),{window});
  const context=vm.createContext({window,console,localStorage:{getItem:()=>null,setItem(){}}});
  const range=(start,end)=>html.slice(html.indexOf(start),html.indexOf(end));
  vm.runInContext(range('  function defaultData(){','  /* ---------------- State load/save')+range('  const STORAGE_KEY =','  /* ---------------- Generation engine')+range('  const gurmukhiSeeds =','  let scriptG=')+range('  function installScriptData(){','  function scriptProjection(')+'\ninstallScriptData(); this.fixtureState=state;',context);
  lexical.install(context.fixtureState,{categories:learning.categories});
  vm.runInContext(range('  let scriptG=','  function installScriptData(){')+range('  /* ---------------- Generation engine','  /* ---------------- Rendering: Generate screen')+range('  function habitualForSubject(','  function validateGrammarMetadata(')+range('  function scriptProjection(',"  const LEARNING_KEY=")+'\nthis.assemble=assembleFromTemplate;',context);
  return {context,lexical,state:context.fixtureState};
}

test('source sense IDs and complete definitions survive normalization without changing the entry',()=>{
  const entry=imported.find(word=>word.g==='ਹੁਕਮ'),before=JSON.stringify(entry);
  const senses=semantics.normalizeSenses(entry);
  assert.equal(senses.length,2);
  assert.equal(senses[0].id,entry.meanings[0].id);
  assert.equal(senses[0].sourceSenseId,entry.meanings[0].sourceSenseId);
  assert.equal(senses[0].english,'order, instruction');
  assert.equal(senses[0].verification.nativeReviewed,false);
  assert.equal(JSON.stringify(entry),before);
});

test('an explicit learner translation override takes precedence without claiming dictionary verification',()=>{
  const entry={id:'wood',e:'timber',senses:[{id:'wood-sense',english:'wood, timber',contextualGloss:'wood'}],translationOverride:{senseId:'wood-sense',english:'timber',source:'user'}};
  const result=semantics.selectSense(entry,{role:'object',senseId:'wood-sense'});
  assert.equal(result.contextualMeaning,'timber');assert.ok(result.evidence.includes('user-edited-translation;review-needed'));
  assert.equal(semantics.normalizeSenses(entry)[0].english,'wood, timber');
});

test('editing a saved role translation preserves its selected secondary sense across persistence',()=>{
  const lexical=require('../linguistic-system');
  const entry={id:'lex:kath',primaryId:'kath',p:'kāṭh',g:'ਕਾਠ',e:'wood, timber',partOfSpeech:'noun',gender:'m',number:'sg',verifiedGrammar:true,semanticTags:['physical'],categories:['materials'],meanings:[{id:'wood',english:'wood, timber'},{id:'body',english:'physique, body, build, frame'}],senses:[{id:'wood',english:'wood, timber',contextualGloss:'wood'},{id:'body',english:'physique, body, build, frame',contextualGloss:'physique'}]};
  const state=lexical.install({linguistic:{schemaVersion:lexical.SCHEMA_VERSION,entries:{'lex:kath':entry},bindings:{WHAT:[{id:'kath-body',vocabularyId:'lex:kath',selectedSenseId:'body',e:'physique',enabled:true}]},aliases:{'kath-body':'lex:kath'}}});
  state.vocab.WHAT[0].e='build';
  assert.equal(lexical.get(state,'lex:kath').translationOverride.senseId,'body');
  const selected=semantics.contextualEntry(state.vocab.WHAT[0],{role:'WHAT'});
  assert.equal(selected.selectedSenseId,'body');assert.equal(selected.e,'build');
  const restored=lexical.install(JSON.parse(JSON.stringify(lexical.snapshot(state))));
  assert.equal(semantics.contextualEntry(restored.vocab.WHAT[0],{role:'WHAT'}).e,'build');
  assert.equal(lexical.get(restored,'lex:kath').senses[1].english,'physique, body, build, frame');
});

test('editing an existing location phrase keeps its custom English and canonical noun after reload',()=>{
  const lexical=require('../linguistic-system');
  const state=lexical.install({vocab:{WHERE:[{id:'where-ghar',p:'ghar vich',g:'ਘਰ ਵਿੱਚ',e:'at home',senses:[{id:'home',english:'home'}],enabled:true}]},verbs:[]});
  state.vocab.WHERE[0].e='at my own house';
  assert.equal(lexical.get(state,'where-ghar').e,'home');
  const restored=lexical.install(JSON.parse(JSON.stringify(lexical.snapshot(state))));
  const projected=semantics.contextualEntry(restored.vocab.WHERE[0],{role:'WHERE'});
  assert.equal(projected.e,'at my own house');assert.equal(projected.lexicalSelection.contextualMeaning,'home');
  assert.equal(projected.lexicalSelection.phraseTranslation.source,'user');
});

test('legacy string senses receive stable IDs independent of edited translation text',()=>{
  const first=semantics.normalizeSenses({id:'lex:custom',e:'a book',meanings:['a book']});
  const edited=semantics.normalizeSenses({id:'custom',vocabularyId:'lex:custom',e:'the book',meanings:['the book']});
  assert.equal(first[0].id,edited[0].id);
  assert.equal(first[0].id,'sense:lex:custom:legacy-1');
});

test('unresolved comma/slash lists and ambiguous multiple senses never become sentence glosses',()=>{
  for(const value of ['command, order, instruction, direction','do/make','hand; turn'])assert.equal(semantics.selectSense({id:'x',e:value},{role:'object'}).ok,false);
  const entry={id:'x',senses:[{id:'x-a',english:'bank'},{id:'x-b',english:'riverbank'}]};
  assert.equal(semantics.selectSense(entry,{role:'location'}).ok,false);
  const partiallyResolved={id:'hukam',senses:[{id:'order',english:'order, instruction',compatibleRoles:['object']},{id:'spades',english:'spades',compatibleRoles:['object']}]};
  assert.equal(semantics.selectSense(partiallyResolved,{role:'WHAT'}).ok,false,'a readable alternative cannot hide an unresolved compatible sense');
});

test('contextual selection does not append verb restrictions to caller-owned lexical metadata',()=>{
  const tags=['readable'];
  semantics.selectSense({id:'book',e:'book'},{role:'WHAT',semanticTags:tags,verb:{takesTags:['portable']}});
  assert.deepEqual(tags,['readable']);
});

test('one sense with an authored contextual meaning is selected by construction evidence, not array order',()=>{
  const entry={id:'hukam',partOfSpeech:'noun',gender:'m',number:'sg',senses:[
    {id:'cards',english:'spades, symbol ♠.',contextualGloss:'spades',semanticTags:['playing-card'],compatibleRoles:['object']},
    {id:'order',english:'order, instruction',contextualGloss:'order',semanticTags:['directive'],compatibleRoles:['object'],usage:'An authoritative direction.'}
  ]};
  const selection=semantics.selectSense(entry,{role:'WHAT',semanticTags:['directive']});
  assert.equal(selection.senseId,'order');assert.equal(selection.contextualMeaning,'order');
  const projection=semantics.contextualEntry(entry,{role:'object',senseId:'order'});
  assert.equal(projection.e,'order');assert.equal(projection.selectedSenseId,'order');
  assert.equal(projection.lexicalSelection.vocabularyId,'lex:hukam');
  assert.equal(entry.senses[1].english,'order, instruction');
});

test('a selected sense owns gender, countability and semantics rather than inheriting another sense',()=>{
  const entry={id:'kath',partOfSpeech:'noun',gender:'f',number:'sg',countability:'uncountable',semanticTags:['material','appearance'],senses:[
    {id:'wood',english:'wood, timber',contextualGloss:'wood',gender:'f',number:'sg',countability:'uncountable',semanticTags:['material'],semanticProperties:{human:false,animate:false}},
    {id:'physique',english:'physique, body, build, frame',contextualGloss:'physique',gender:'m',number:'sg',countability:'countable',semanticTags:['appearance'],semanticProperties:{human:false,animate:false}}
  ]};
  const projection=semantics.contextualEntry(entry,{role:'WHAT',senseId:'physique'});
  assert.equal(projection.gender,'m');assert.equal(projection.countability,'countable');assert.deepEqual(projection.semanticTags,['appearance']);
  assert.equal(entry.gender,'f');assert.deepEqual(entry.semanticTags,['material','appearance']);
});

test('a requested sense cannot bypass grammatical role or argument restrictions',()=>{
  const entry={id:'laugh',partOfSpeech:'verb',senses:[{id:'laugh-intransitive',english:'to laugh',tags:['intransitive'],compatibleRoles:['verb']},{id:'mock-transitive',english:'to mock',tags:['transitive'],compatibleRoles:['verb']}]};
  assert.equal(semantics.selectSense(entry,{senseId:'laugh-intransitive',role:'verb',transitive:true}).ok,false);
  assert.equal(semantics.selectSense(entry,{senseId:'mock-transitive',role:'subject'}).ok,false);
  assert.equal(semantics.selectSense(entry,{role:'verb',transitive:true}).senseId,'mock-transitive');
  const bounded={id:'x',senses:[{id:'x-sense',english:'order',compatibleTemplates:['give-recipient'],semanticRestrictions:{verbIds:['give']}}]};
  assert.equal(semantics.selectSense(bounded,{senseId:'x-sense',role:'object',template:'comparison',verb:{id:'give'}}).ok,false);
  assert.equal(semantics.selectSense(bounded,{senseId:'x-sense',role:'object',template:'give-recipient',verb:{id:'eat'}}).ok,false);
  assert.equal(semantics.selectSense(bounded,{senseId:'x-sense',role:'object',template:'give-recipient',verb:{id:'give'}}).ok,true);
});

test('singleton concise source glosses and authored verb choices work without synonym-position inference',()=>{
  assert.equal(semantics.selectSense({id:'book',e:'book'},{role:'object'}).contextualMeaning,'book');
  const verb={id:'do',partOfSpeech:'verb',english:'to do/make',base:'do'};
  assert.equal(semantics.contextualEntry(verb,{role:'verb'}).base,'do');
  const reversed={...verb,english:'make/do'};
  assert.equal(semantics.contextualEntry(reversed,{role:'verb'}).base,'do');
  assert.equal(semantics.contextualEntry({...verb,base:'guess'},{role:'verb'}),null);
  assert.equal(semantics.contextualEntry({id:'listen',partOfSpeech:'verb',english:'to listen',base:'listen to'},{role:'verb'}).base,'listen to');
  assert.equal(semantics.contextualEntry({id:'talk',partOfSpeech:'verb',english:'to talk',base:'talk with you'},{role:'verb'}).base,'talk');
  assert.equal(semantics.authoredPredicateMeaning({partOfSpeech:'verb',base:'make'},{english:'to do/make'}),'to make');
  assert.equal(semantics.authoredPredicateMeaning({partOfSpeech:'verb',base:'invent'},{english:'to do/make'}),null);
});

test('postpositional pronouns preserve ambiguity and English case',()=>{
  const subject={id:'who-oh',partOfSpeech:'pronoun',e:'he/she',gender:'f'};
  assert.equal(semantics.englishSubject(subject),'he or she');
  assert.equal(semantics.englishObjective(subject),'him or her');
  assert.equal(semantics.englishSubject(subject,{genderEstablished:true}),'she');
  assert.equal(semantics.contextualEntry(subject,{role:'subject'}).e,'he or she');
  assert.equal(semantics.selectSense({...subject,e:'he or she'},{role:'subject'}).contextualMeaning,'he or she');
  assert.equal(semantics.englishSubject({e:'teacher',partOfSpeech:'noun',countability:'count',number:'sg'}),'a teacher');
});

test('common noun subjects with unresolved English countability receive a determiner without changing names or authored phrases',()=>{
  for(const [e,expected]of [['husband','the husband'],['headman','the headman'],['my husband','my husband'],['a husband','a husband'],['Harjit','Harjit']]){
    assert.equal(semantics.englishSubject({e,partOfSpeech:'noun',gender:'m',number:'sg'}),expected);
  }
  assert.equal(semantics.englishSubject({e:'he/she',partOfSpeech:'pronoun',gender:'m'}),'he or she');
});

test('authored locative phrase translations retain postpositions while selecting the canonical noun sense',()=>{
  const entry={id:'where-ghar',vocabularyId:'lex:where-ghar',partOfSpeech:'noun',p:'ghar vich',g:'ਘਰ ਵਿੱਚ',e:'at home',meanings:['home']};
  const projected=semantics.contextualEntry(entry,{role:'WHERE'});
  assert.equal(projected.e,'at home');assert.equal(projected.dictionaryMeaning,'home');
  assert.equal(projected.lexicalSelection.contextualMeaning,'home');
  const edited=semantics.contextualEntry({...entry,e:'at my own house',phraseTranslationOverride:{english:'at my own house',source:'user'}},{role:'WHERE'});
  assert.equal(edited.e,'at my own house');assert.equal(edited.lexicalSelection.contextualMeaning,'home');
  assert.equal(edited.phraseTranslationEvidence,'user-edited-phrase-translation;review-needed');
  assert.equal(edited.lexicalSelection.phraseTranslation.english,'at my own house');
});

test('validated postpositional constructions retain full phrase English and noun sense identity independently',()=>{
  const entry={id:'house',partOfSpeech:'noun',e:'house, home',selectedSenseId:'house-sense',senses:[{id:'house-sense',english:'house, home',contextualGloss:'house',compatibleRoles:['location']}],construction:{type:'postpositional-phrase',englishPrefix:'in',englishArticle:'indefinite'}};
  const projected=semantics.contextualEntry(entry,{role:'WHERE'});
  assert.equal(projected.e,'in a house');assert.equal(projected.lexicalSelection.contextualMeaning,'house');
  assert.equal(projected.lexicalSelection.phraseTranslation.source,'validated-construction');
  assert.equal(projected.dictionaryMeaning,'house, home');assert.equal(projected.countability,undefined);
  const edited=semantics.contextualEntry({...entry,phraseTranslationOverride:{english:'at my own house',source:'user'}},{role:'WHERE'});
  assert.equal(edited.e,'at my own house');assert.equal(edited.lexicalSelection.phraseTranslation.source,'user');
});

test('English noun articles follow explicit countability, leaving mass and unknown nouns bare',()=>{
  assert.equal(semantics.englishNounPhrase({e:'apple',countability:'count',number:'sg'}),'an apple');
  assert.equal(semantics.englishNounPhrase({e:'book',countability:'count',number:'sg'}),'a book');
  assert.equal(semantics.englishNounPhrase({e:'milk',countability:'mass'}),'milk');
  assert.equal(semantics.englishNounPhrase({e:'rice'}),'rice');
  assert.equal(semantics.englishNounPhrase({e:'a book',countability:'count'}),'a book');
  assert.equal(semantics.englishNounPhrase({e:'university',countability:'count'}),'a university');
  const englishHint=semantics.contextualEntry({id:'mountain',partOfSpeech:'noun',senses:[{id:'mountain-sense',english:'mountain',englishCountability:'countable'}]},{senseId:'mountain-sense'});
  assert.equal(semantics.englishNounPhrase(englishHint),'a mountain');assert.equal(englishHint.countability,undefined);
});

test('English inflection handles common irregulars and phrasal verbs consistently',()=>{
  for(const [base,kind,person,expected] of [['have','habitual','3sg','has'],['study','habitual','3sg','studies'],['go','progressive',null,'going'],['write','progressive',null,'writing'],['sit','progressive',null,'sitting'],['speak','perfective',null,'spoke'],['listen to','perfective',null,'listened to'],['lie down','progressive',null,'lying down'],['lie down','perfective',null,'lay down'],['lie','perfective',null,'lied'],['get up','perfective',null,'got up']])assert.equal(semantics.inflectEnglish(base,kind,person),expected);
});

test('time ambiguity uses an explicit construction time reference with one stable source identity',()=>{
  const entry={id:'when-kal',e:'tomorrow/yesterday'};
  const past=semantics.selectSense(entry,{role:'WHEN',tense:'past'}),future=semantics.selectSense(entry,{role:'WHEN',timeReference:'future'});
  assert.equal(past.contextualMeaning,'yesterday');assert.equal(future.contextualMeaning,'tomorrow');assert.equal(past.senseId,future.senseId);
  assert.equal(semantics.selectSense(entry,{role:'WHEN'}).ok,false);
});

test('existing conversational patterns generate both scripts and carry the same canonical selected senses',()=>{
  const {context,lexical,state}=applicationFixture();
  const original=lexical.snapshot(state);
  for(const template of state.templates.filter(value=>value.enabled&&/^P/.test(value.id))){
    for(let attempt=0;attempt<3;attempt++){
      const sentence=context.assemble(template);
      assert.ok(sentence,template.id+' remains reachable');
      assert.ok(sentence.gurmukhi,template.id+' has Gurmukhi');
      assert.doesNotMatch(sentence.english,/undefined|\bto listen (?!to)|\bhe\/she\b/);
      for(const part of sentence.sentenceBreakdown){
        if(part.vocabularyIds.length)assert.ok(part.lexicalSelections.length,template.id+' has contextual lexical references');
        for(const selection of part.lexicalSelections){
          const word=lexical.get(state,selection.vocabularyId);
          assert.ok(semantics.normalizeSenses(word).some(sense=>sense.id===selection.senseId));
          assert.doesNotMatch(selection.contextualMeaning,/[,/;]/);
        }
      }
    }
  }
  assert.deepEqual(lexical.snapshot(state),original,'sentence projection does not rewrite learner dictionary data');
});

test('a synonym-bearing dictionary noun uses one shared sense in natural English and the existing breakdown',()=>{
  const {context,state}=applicationFixture();
  state.vocab.WHAT.forEach(entry=>{entry.enabled=false;});
  state.verbs.forEach(entry=>{entry.enabled=entry.id==='v-parhna';});
  state.vocab.WHO.forEach(entry=>{entry.enabled=entry.id==='who-main';});
  state.vocab.WHAT.push({id:'test-contextual-book',p:'kitāb',g:'ਕਿਤਾਬ',e:'book, volume',gender:'f',number:'sg',countability:'count',tags:['readable'],enabled:true,senses:[{id:'test-book-sense',english:'book, volume',contextualGloss:'book',compatibleRoles:['object'],semanticTags:['readable'],sourceSenseId:'test-source-book'}]});
  const sentence=context.assemble(state.templates.find(template=>template.id==='P01'));
  assert.equal(sentence.english,'I read a book.');
  const part=sentence.sentenceBreakdown.find(value=>value.category==='WHAT');
  assert.equal(part.english,'a book');assert.equal(part.selectedSenseId,'test-book-sense');
  assert.equal(part.lexicalSelections[0].contextualMeaning,'book');
  assert.equal(part.dictionaryForms[0].english,'book, volume');
  assert.equal(state.vocab.WHAT.find(word=>word.id==='test-contextual-book').e,'book, volume');
});

test('legacy predicate breakdowns omit repeated subjects and polar markers retain their contextual construction meaning',()=>{
  const {context,state}=applicationFixture();
  state.vocab.WHAT.forEach(entry=>{entry.enabled=entry.id==='what-kitab';});
  state.verbs.forEach(entry=>{entry.enabled=entry.id==='v-parhna';});
  state.vocab.WHO.forEach(entry=>{entry.enabled=entry.id==='who-main';});
  const cases=[['P04','I do not read a book.','do not read'],['P05','Do I read a book?','read'],['P08','I am not reading a book.','am not reading'],['P13','How do I read a book?','read']];
  for(const [id,english,predicate]of cases){
    const sentence=context.assemble(state.templates.find(template=>template.id===id));
    assert.equal(sentence.english,english);assert.equal(sentence.sentenceBreakdown.find(part=>part.category==='VERB').english,predicate);
    if(id==='P05'){
      const marker=sentence.sentenceBreakdown.find(part=>part.category==='QUESTION');
      assert.equal(marker.lexicalSelections[0].contextualMeaning,'polar question marker');
      assert.equal(marker.lexicalSelections[0].meaningKind,'construction-translation');
      assert.equal(marker.dictionaryForms[0].english,'what');assert.match(marker.grammarNote,/yes\/no question/);
    }
  }
});

test('the legacy because-clause template excludes raw causal nouns and discourse adverbs',()=>{
  const {context,state}=applicationFixture();
  state.vocab.WHO.forEach(entry=>{entry.enabled=entry.id==='who-main';});
  state.vocab.WHAT.forEach(entry=>{entry.enabled=entry.id==='what-kitab';});
  state.verbs.forEach(entry=>{entry.enabled=entry.id==='v-parhna';});
  state.vocab.WHY.forEach(entry=>{entry.enabled=entry.id==='why-useful';});
  state.vocab.WHY.push({id:'test-causal-noun',p:'samassiā karke',g:'ਸਮੱਸਿਆ ਕਰਕੇ',e:'problem',partOfSpeech:'noun',enabled:true,construction:{type:'postpositional-phrase',englishPrefix:'because of'},senses:[{id:'test-problem-sense',english:'problem',compatibleRoles:['reason']}]});
  state.vocab.WHY.push({id:'test-causal-adverb',p:'is laī',g:'ਇਸ ਲਈ',e:'therefore',partOfSpeech:'adverb',enabled:true,senses:[{id:'test-therefore-sense',english:'therefore',compatibleRoles:['reason']}]});
  vm.runInContext('Math.random=()=>0.99;',context);
  const template=state.templates.find(template=>template.id==='P36');
  const sentence=context.assemble(template);
  assert.equal(sentence.english,'I read a book because it is useful.');
  assert.equal(sentence.sentenceBreakdown.find(part=>part.category==='WHY').english,'because it is useful');
  state.vocab.WHY.find(entry=>entry.id==='why-useful').enabled=false;
  assert.equal(context.assemble(template),null,'unsupported reason strings do not fill a complete because-clause slot');
});

test('legacy annotations resolve the chosen sense within its grammatical role when roles share one lexical ID',()=>{
  const {context,state}=applicationFixture();
  const canonicalId='lex:test-polysemous-roles';
  state.linguistic.entries[canonicalId]={id:canonicalId,primaryId:'test-polysemous-roles',p:'mālī',g:'ਮਾਲੀ',e:'gardener; prize',partOfSpeech:'noun',gender:'m',number:'sg',person:'3sg',englishPerson:'3sg',countability:'countable',enabled:true,senses:[
    {id:'test-person',english:'gardener',compatibleRoles:['subject'],semanticTags:['human'],countability:'countable'},
    {id:'test-object',english:'prize',compatibleRoles:['object'],semanticTags:['takeable'],countability:'countable'}
  ]};
  state.vocab.WHO.push({id:'test-person-binding',vocabularyId:canonicalId,selectedSenseId:'test-person',enabled:true});
  state.vocab.WHAT.push({id:'test-object-binding',vocabularyId:canonicalId,selectedSenseId:'test-object',enabled:true});
  state.vocab.WHO.forEach(entry=>{entry.enabled=entry.id==='test-person-binding';});
  state.vocab.WHAT.forEach(entry=>{entry.enabled=entry.id==='test-object-binding';});
  state.verbs.forEach(entry=>{entry.enabled=entry.id==='v-laina';});
  const sentence=context.assemble(state.templates.find(template=>template.id==='P01'));
  assert.equal(sentence.english,'A gardener takes a prize.');
  assert.equal(sentence.sentenceBreakdown.find(part=>part.category==='WHO').lexicalSelections[0].senseId,'test-person');
  assert.equal(sentence.sentenceBreakdown.find(part=>part.category==='WHAT').lexicalSelections[0].senseId,'test-object');
});

test('two legacy clauses can retain different chosen senses of one surface form and lexical ID',()=>{
  const {context,state}=applicationFixture();
  const id='lex:test-repeated-form';
  state.linguistic.entries[id]={id,primaryId:'test-repeated-form',p:'vastū',g:'ਵਸਤੂ',e:'message; letter',partOfSpeech:'noun',gender:'f',number:'sg',countability:'countable',enabled:true,senses:[
    {id:'test-message',english:'message',compatibleRoles:['object'],semanticTags:['takeable']},
    {id:'test-letter',english:'letter',compatibleRoles:['object'],semanticTags:['takeable']}
  ]};
  state.vocab.WHAT.push({id:'test-first-sense',vocabularyId:id,selectedSenseId:'test-message',enabled:true});
  state.vocab.WHAT.push({id:'test-second-sense',vocabularyId:id,selectedSenseId:'test-letter',enabled:true});
  state.vocab.WHAT.forEach(entry=>{entry.enabled=entry.vocabularyId===id;});
  state.vocab.WHO.forEach(entry=>{entry.enabled=entry.id==='who-main';});
  state.verbs.forEach(entry=>{entry.enabled=entry.id==='v-laina';});
  vm.runInContext('Math.random=(()=>{const values=[0,0,0.75];let index=0;return ()=>values[index++%values.length];})();',context);
  const sentence=context.assemble(state.templates.find(template=>template.id==='P37'));
  assert.equal(sentence.english,'I take a message and take a letter.');
  assert.deepEqual(Array.from(sentence.sentenceBreakdown.filter(part=>part.category==='WHAT'),part=>part.lexicalSelections[0].senseId),['test-message','test-letter']);
});

test('authored light-verb expression translations are also reflected in contextual breakdown annotations',()=>{
  const {context,state}=applicationFixture();
  state.vocab.WHAT.forEach(entry=>{entry.enabled=entry.id==='what-madad';});
  state.verbs.forEach(entry=>{entry.enabled=entry.id==='v-karna';});
  state.vocab.WHO.forEach(entry=>{entry.enabled=entry.id==='who-main';});
  const sentence=context.assemble(state.templates.find(template=>template.id==='P01'));
  assert.equal(sentence.english,'I give help.');
  const part=sentence.sentenceBreakdown.find(value=>value.category==='VERB');
  assert.equal(part.english,'give');assert.equal(part.lexicalSelections[0].contextualMeaning,'give');
  assert.equal(part.lexicalSelections[0].meaningKind,'construction-translation');
  assert.match(part.grammarNote,/light verb/);assert.equal(part.dictionaryForms[0].english,'to do/make');
});

test('the complete corpus audit preserves an authored verb choice required by the existing what-doing template',()=>{
  const {applicationFixture:integratedFixture}=require('../scripts/application-fixture');
  const {context,state,lexical}=integratedFixture({seed:9182});
  state.vocab.WHO.forEach(entry=>{entry.enabled=entry.id==='who-main';});
  state.verbs.forEach(entry=>{entry.enabled=entry.id==='v-karna';});
  const sentence=context.assemble(state.templates.find(template=>template.id==='P09'));
  assert.ok(sentence,'P09 remains reachable after the complete vocabulary audit');
  assert.equal(sentence.english,'What am I doing?');assert.equal(sentence.gurmukhi,'ਮੈਂ ਕੀ ਕਰ ਰਿਹਾ ਹਾਂ?');
  const action=sentence.sentenceBreakdown.find(part=>part.category==='VERB');
  assert.equal(action.english,'am doing');assert.equal(action.lexicalSelections[0].contextualMeaning,'to do');
  const sense=semantics.normalizeSenses(lexical.get(state,'v-karna')).find(value=>value.id===action.lexicalSelections[0].senseId);
  assert.equal(sense.english,'to do/make');assert.equal(sense.verification.nativeReviewed,false);
});
