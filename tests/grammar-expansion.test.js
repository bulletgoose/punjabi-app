'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const engine=require('../grammar-engine');
const dictionary=require('../data/vocabulary-expansion').entries;
const profiles=require('../data/verb-morphology-profiles');
const {applicationFixture}=require('../scripts/application-fixture');
const lexical=require('../linguistic-system');
const semantics=require('../lexical-semantics');
const source=g=>dictionary.find(e=>e.g===g&&e.partOfSpeech==='verb');
const main={id:'who-main',vocabularyId:'lex:who-main',p:'main',g:'ਮੈਂ',e:'I',partOfSpeech:'pronoun',person:'1sg',gender:'m',number:'sg',semanticTags:['human','animate']};
function profiled(g){const entry=source(g);return {...entry,...engine.enrichVerb(entry)};}
function render(g,aspect,gender,script){return engine.conjugate({verb:profiled(g),subject:{...main,gender:gender||'m'},aspect,script:script||'gurmukhi'});}
let fixture;
function app(){return fixture||(fixture=applicationFixture());}
function find(role,g,senseGloss){const rows=app().state.vocab[role]||[];return rows.find(x=>(x.g===g||x.gScript&&x.gScript.infinitive===g)&&(!senseGloss||semantics.selectSense(x,{role}).contextualMeaning===senseGloss));}
function generate(id,roleRows){const f=app();const state={vocab:{...f.state.vocab,...roleRows},verbs:f.state.verbs};return engine.generate(engine.templates.find(t=>t.id===id),state,rows=>rows[0]);}

test('source morphology profiles cover the corpus without approving all argument structures',()=>{
 assert.equal(profiles.metadata.profileCount,254);assert.equal(profiles.metadata.semanticEligibleCount,89);
 assert.equal(profiles.metadata.futureCount,254);assert.equal(profiles.metadata.perfectiveCount,251);
 assert.ok(profiles.profiles.every(p=>p.grammarReview.nativeReviewed===false));
 const unsupported=profiles.profiles.find(p=>!p.verifiedGrammar);assert.ok(unsupported);
 const patch=engine.enrichVerb(source(unsupported.g));assert.equal(patch.verifiedGrammar,false);assert.ok(patch.morphologicalValidation.future);
});

test('productive consonantal rules preserve habitual, future and perfective agreement',()=>{
 assert.equal(render('ਸਿੱਖਣਾ','habitual','f').text,'ਸਿੱਖਦੀ ਹਾਂ');
 assert.equal(render('ਖ਼ਰੀਦਣਾ','future','f').text,'ਖ਼ਰੀਦਾਂਗੀ');
 assert.equal(render('ਹੱਸਣਾ','perfective','f').text,'ਹੱਸੀ');
 assert.equal(engine.conjugate({verb:profiled('ਪੜ੍ਹਨਾ'),aspect:'imperative',script:'gurmukhi'}).text,'ਪੜ੍ਹੋ');
 const read=profiled('ਪੜ੍ਹਨਾ');assert.equal(engine.conjugate({verb:read,subject:{...main,person:'3pl',number:'pl'},aspect:'future',script:'gurmukhi'}).text,'ਪੜ੍ਹਨਗੇ');
 for(const p of profiles.profiles.filter(p=>p.verifiedGrammar))for(const script of ['roman','gurmukhi'])for(const person of ['1sg','2sg','3sg','1pl','2pl','3pl'])for(const gender of ['m','f']){
  const v=profiled(p.g),subject={...main,person,gender,number:person.endsWith('pl')?'pl':'sg'};
  assert.equal(engine.conjugate({verb:v,subject,aspect:'future',script}).ok,true,p.g+'/'+person+'/'+gender+'/'+script);
 }
});

test('irregular stems and edited source identities do not receive a regular perfective',()=>{
 const doPatch=engine.enrichVerb(source('ਕਰਨਾ'));assert.equal(doPatch.perfective,undefined);
 const changed={...source('ਸਿੱਖਣਾ'),p:'my edited lemma'};assert.equal(engine.enrichVerb(changed),null);
 const translated={...source('ਸਿੱਖਣਾ'),e:'my translation'};assert.equal(engine.enrichVerb(translated),null);
 assert.equal(engine.enrichVerb({id:'custom',partOfSpeech:'verb',p:'x',g:'x',e:'x'}),null);
});

test('enrichment deep clones nested source paradigms and retains stable selected sense IDs',()=>{
 const entry=source('ਹੱਸਣਾ'),a=engine.enrichVerb(entry),b=engine.enrichVerb(entry);
 a.future.f['1sg']='changed';a.gScript.forms['1sg']='changed';a.eligibleSenses[0].base='changed';
 const c=engine.enrichVerb(entry);assert.equal(c.future.f['1sg'],b.future.f['1sg']);assert.equal(c.gScript.forms['1sg'],b.gScript.forms['1sg']);assert.deepEqual(c.eligibleSenses,b.eligibleSenses);
 assert.equal(c.type,'simple');assert.equal(c.isModalComplement,true);
 assert.ok(entry.meanings.some(s=>s.id===c.selectedSenseId));
});

test('noun descriptions use the source noun gender in present, negative and past clauses',()=>{
 const book=find('WHAT','ਕਿਤਾਬ','book'),newAdjective=find('ADJECTIVE','ਨਵਾਂ','new');assert.ok(book);assert.ok(newAdjective);
 const roles={WHAT:[book],ADJECTIVE:[newAdjective]};
 const present=generate('P60',roles),past=generate('P67',roles),negative=generate('P68',roles);
 assert.equal(present.gurmukhi,'ਕਿਤਾਬ ਨਵੀਂ ਹੈ।');assert.equal(present.english,'The book is new.');
 assert.equal(past.gurmukhi,'ਕਿਤਾਬ ਨਵੀਂ ਸੀ।');assert.equal(past.english,'The book was new.');
 assert.equal(negative.gurmukhi,'ਕਿਤਾਬ ਨਵੀਂ ਨਹੀਂ ਹੈ।');assert.equal(negative.english,'The book is not new.');
 const nounPart=present.sentenceBreakdown.find(p=>p.role==='object');assert.equal(nounPart.selectedSenseId,book.selectedSenseId);assert.equal(nounPart.lexicalSelections[0].contextualMeaning,'book');
});

test('material nouns participate in identification and do not acquire edible action tags',()=>{
 const wood=find('WHAT','ਕਾਠ','wood');assert.ok(wood);
 const sentence=generate('P59',{WHAT:[wood]});assert.equal(sentence.gurmukhi,'ਇਹ ਕਾਠ ਹੈ।');assert.equal(sentence.english,'This is wood.');
 assert.ok(!wood.semanticTags.includes('edible'));
 const eat=app().state.verbs.find(v=>v.id==='v-khana');assert.equal(engine.compatible(eat,wood),false);
 assert.equal(sentence.sentenceBreakdown.find(p=>p.role==='object').lexicalSelections[0].senseId,wood.selectedSenseId);
});

test('location and question constructions reuse checked locative forms',()=>{
 const book=find('WHAT','ਕਿਤਾਬ','book'),home=app().state.vocab.WHERE.find(x=>x.id==='where-ghar');
 const where=generate('P61',{WHAT:[book],WHERE:[home]}),question=generate('P62',{WHAT:[book]});
 assert.equal(where.gurmukhi,'ਕਿਤਾਬ ਘਰ ਵਿੱਚ ਹੈ।');assert.equal(where.english,'The book is at home.');
 assert.equal(question.gurmukhi,'ਕਿਤਾਬ ਕਿੱਥੇ ਹੈ?');assert.equal(question.english,'Where is the book?');
 assert.equal(engine.nounPhrase({id:'unreviewed',p:'muṇḍā',g:'ਮੁੰਡਾ',gender:'m',number:'sg'},{case:'location'}).ok,false);
});

test('present time and manner are consumed by an enabled construction',()=>{
 const f=app(),time=f.state.vocab.WHEN.find(t=>t.e==='now'),manner=f.state.vocab.HOW.find(t=>t.e==='slowly');assert.ok(time);assert.ok(manner);
 const sentence=generate('P66',{WHO:[f.state.vocab.WHO.find(s=>s.id==='who-main')],WHEN:[time],HOW:[manner]});assert.ok(sentence);
 assert.ok(sentence.english.endsWith('slowly now.'));assert.ok(sentence.sentenceBreakdown.some(p=>p.category==='WHEN'));assert.ok(sentence.sentenceBreakdown.some(p=>p.category==='HOW'));
 assert.ok(!sentence.english.includes(','));
});

test('source manner synonyms use the approved contextual sense in translation and breakdown',()=>{
 const f=app(),subject=f.state.vocab.WHO.find(s=>s.id==='who-main'),time=f.state.vocab.WHEN.find(t=>t.e==='now');
 const manner=f.state.vocab.HOW.find(t=>t.e.includes(',')&&semantics.selectSense(t,{role:'HOW'}).contextualMeaning==='quickly');
 assert.ok(manner,'A source-backed multi-gloss manner entry is present.');
 const sentence=generate('P66',{WHO:[subject],WHEN:[time],HOW:[manner]});assert.ok(sentence);
 assert.ok(sentence.english.endsWith('quickly now.'));assert.ok(!sentence.english.includes(','));
 const part=sentence.sentenceBreakdown.find(p=>p.category==='HOW');
 assert.equal(part.english,'quickly');assert.equal(part.selectedSenseId,manner.selectedSenseId);
 assert.equal(part.lexicalSelections[0].senseId,manner.selectedSenseId);
 assert.equal(part.lexicalSelections[0].contextualMeaning,'quickly');
 const cash=f.state.vocab.HOW.find(t=>semantics.selectSense(t,{role:'HOW'}).contextualMeaning==='in cash');assert.ok(cash);
 assert.equal(generate('P66',{WHO:[subject],WHEN:[time],HOW:[cash]}),null,'An unsupported manner remains restricted.');
});

test('communication manners require compatible actions and retain shared source senses',()=>{
 const f=app(),subject=f.state.vocab.WHO.find(s=>s.id==='who-main'),time=f.state.vocab.WHEN.find(t=>t.e==='now');
 const template=engine.templates.find(t=>t.id==='P66');
 const phone=f.state.vocab.HOW.find(t=>t.id==='how-phone'),speak=f.state.verbs.find(v=>v.id==='v-bolna'),read=f.state.verbs.find(v=>v.id==='v-parhna');assert.ok(phone);assert.ok(speak);assert.ok(read);
 const state={vocab:{...f.state.vocab,WHO:[subject],WHEN:[time],HOW:[phone]},verbs:[read]};
 assert.equal(engine.generate(template,state,rows=>rows[0]),null,'Reading is not authorized for the by-phone manner.');
 state.verbs=[read,speak];
 const phoneSentence=engine.generate(template,state,rows=>rows[0]);assert.equal(phoneSentence.english,'I am speaking by phone now.');
 for(const gloss of ['orally','face to face']){
  const manner=f.state.vocab.HOW.find(t=>semantics.selectSense(t,{role:'HOW'}).contextualMeaning===gloss);assert.ok(manner,gloss);
  state.vocab.HOW=[manner];state.verbs=[speak];
  const sentence=engine.generate(template,state,rows=>rows[0]);assert.ok(sentence,gloss);assert.ok(sentence.english.endsWith(gloss+' now.'));
  const part=sentence.sentenceBreakdown.find(p=>p.category==='HOW');assert.equal(part.english,gloss);assert.equal(part.lexicalSelections[0].contextualMeaning,gloss);assert.equal(part.selectedSenseId,manner.selectedSenseId);
 }
 const together=f.state.vocab.HOW.find(t=>t.id==='how-ikathe');state.vocab.HOW=[together];assert.equal(engine.generate(template,state,rows=>rows[0]),null,'Together requires a plural subject.');
});

test('all new templates are reachable and keep lexical selections separate from functional grammar tokens',()=>{
 const f=app();for(const template of engine.templates.filter(t=>Number(t.id.slice(1))>=59)){
  let sentence;for(let i=0;i<12&&!sentence;i++)sentence=engine.generate(template,f.state,rows=>rows[Math.floor(i/12*rows.length)]);
  assert.ok(sentence,template.id);assert.ok(!/undefined|[,;/]/.test(sentence.english),sentence.english);
  for(const part of sentence.sentenceBreakdown){
   if(part.vocabularyIds.length){assert.ok(part.selectedSenseId,template.id+':'+part.role);assert.equal(part.lexicalSelections.length,1);assert.ok(lexical.get(f.state,part.vocabularyId));}
   else assert.ok(part.grammarConceptIds.length,'Functional word is explained as grammar.');
  }
 }
});


test('possession uses countable indefinite articles and preferences use ingredient or particular meanings',()=>{
 const f=app(),who=f.state.vocab.WHO.find(s=>s.id==='who-main');
 const tea=find('WHAT','ਚਾਹ','tea'),gold=find('WHAT','ਸੋਨਾ','gold'),book=find('WHAT','ਕਿਤਾਬ','book');
 assert.ok(tea);assert.ok(gold);assert.ok(book);
 assert.equal(generate('P69',{WHO:[who],WHAT:[tea]}).english,'I have tea.');
 assert.equal(generate('P69',{WHO:[who],WHAT:[gold]}).english,'I have gold.');
 assert.equal(generate('P69',{WHO:[who],WHAT:[book]}).english,'I have a book.');
 assert.equal(generate('P70',{WHO:[who],WHAT:[tea]}).english,'I like tea.');
 const potato=find('WHAT','ਆਲੂ','potato');assert.ok(potato);
 const preference=generate('P70',{WHO:[who],WHAT:[potato]});
 assert.equal(preference.english,'I like potato.');
 assert.equal(preference.sentenceBreakdown.find(p=>p.role==='object').english,'potato');
 assert.equal(potato.number,'sg');
 assert.ok(preference.sentenceBreakdown.find(p=>p.role==='object').grammarNote.includes('Punjabi noun number is unchanged'));
 assert.equal(generate('P70',{WHO:[who],WHAT:[book]}).english,'I like the book.');
});

test('location questions honor the existing question-word enabled setting',()=>{
 const f=app(),book=find('WHAT','ਕਿਤਾਬ','book'),template=engine.templates.find(t=>t.id==='P62');
 const question=f.state.vocab.QUESTION.find(q=>q.id==='q-kithe');assert.ok(question);
 assert.deepEqual(engine.dependenciesFor(template),['q-kithe']);
 const state={vocab:{...f.state.vocab,WHAT:[book],QUESTION:[{...question,enabled:false}]},verbs:f.state.verbs};
 assert.equal(engine.generate(template,state,rows=>rows[0]),null);
 const sentence=generate('P62',{WHAT:[book],QUESTION:[question]});
 const part=sentence.sentenceBreakdown.find(p=>p.role==='question');
 assert.equal(part.vocabularyId,question.vocabularyId);assert.ok(part.selectedSenseId);
});


test('structured polar questions distinguish grammatical function from dictionary sense',()=>{
 const f=app(),template=engine.templates.find(t=>t.id==='P50');
 const sentence=engine.generate(template,f.state,rows=>rows[0]);assert.ok(sentence);
 const marker=sentence.sentenceBreakdown.find(p=>p.category==='QUESTION');
 assert.equal(marker.english,'polar question marker');assert.ok(!/[,;/]/.test(marker.english));
 assert.equal(marker.lexicalSelections[0].meaningKind,'construction-translation');
 assert.equal(marker.lexicalSelections[0].contextualMeaning,'polar question marker');
 assert.equal(marker.lexicalSelections[0].senseId,marker.selectedSenseId);
 assert.ok(marker.grammarNote.includes('yes/no'));
});

test('occupation identification excludes source-supported infant subjects',()=>{
 const f=app();
 const infant=f.state.vocab.WHO.find(s=>{
  const sense=(s.senses||[]).find(x=>x.id===s.selectedSenseId);
  return (s.ageClass||s.semanticProperties&&s.semanticProperties.ageClass||sense&&sense.semanticProperties&&sense.semanticProperties.ageClass)==='infant';
 });
 assert.ok(infant,'The corpus contains a source-supported infant noun.');
 assert.equal(generate('P63',{WHO:[infant]}),null);
 const subject=f.state.vocab.WHO.find(s=>s.id==='who-main');
 assert.ok(generate('P63',{WHO:[subject]}),'An unrestricted pronoun remains usable for occupation identification.');
});
