// Learning topics, linguistic concepts and communication objectives are separate
// registries. They contain identifiers, never copies of lexical records.
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.PunjabiLearningContext=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const topics=[
    ['essential','Essential Communication'],['people','People & Identity'],['family','Family & Relationships'],
    ['emotions','Emotions & Personality'],['activities','Everyday Activities'],['actions','Actions & Verbs'],
    ['food','Food & Drink'],['produce','Fruits & Vegetables','food'],['kitchen','Cooking & Kitchen','food'],
    ['restaurants','Restaurants & Cafés','food'],['home','Home & Living'],['clothing','Clothing & Accessories'],
    ['shopping','Shopping & Money'],['numbers','Numbers & Measurements'],['time','Time & Dates'],
    ['places','Places & Locations'],['directions','Directions & Navigation','places'],['travel','Transport & Travel'],
    ['airports','Airports & Flights','travel'],['accommodation','Accommodation','travel'],['tourism','Tourism & Sightseeing','travel'],
    ['work','Work & Occupations'],['business','Business & Commerce','work'],['professional','Professional Communication','work'],
    ['education','Education & Learning'],['technology','Technology & Digital Life'],['social-media','Social Media & Communication','technology'],
    ['health','Health & Wellbeing'],['body','Body & Appearance','health'],['anatomy','Human Anatomy','body'],['appearance','Physical Appearance','body'],['medical','Medical & Healthcare','health'],
    ['safety','Safety & Emergencies'],['nature','Nature & Environment'],['weather','Weather & Climate','nature'],
    ['disasters','Natural Events & Disasters','nature'],['sport','Sport & Fitness'],['culture','Entertainment & Culture'],
    ['celebrations','Celebrations & Traditions','culture'],['romance','Dating & Romance','family'],
    ['materials','Materials & Substances','nature'],['tools','Tools & Equipment','home'],['construction','Construction & Infrastructure','places'],
    ['plants','Plants & Trees','nature'],['animals','Animals & Wildlife','nature'],['geography','Geography & Landscapes','places'],
    ['objects','Objects & Everyday Items','home'],['communication','Communication & Language'],['movement','Movement & Actions','actions'],
    ['personality','Personality & Character','emotions'],['causality','Cause & Effect','abstract'],['quantities','Quantities & Measurements','numbers'],['descriptions','Properties & Descriptions'],['colors','Colors','descriptions'],
    ['opinions','Opinions & Reasoning'],['storytelling','Conversation & Storytelling'],['goals','Goals & Aspirations'],
    ['problems','Problem Solving'],['society','Society & Community'],['abstract','Abstract Concepts'],
    ['functional','Grammar & Functional Words'],['general','General Vocabulary']
  ];
  const categories=Object.fromEntries(topics.map(([id,name,parentId])=>[id,{id,name,label:name,parentId:parentId||null,description:name,provisional:true}]));
  const concepts=[
    ['word-order','Punjabi word order','Subjects and complements precede the predicate.',1,[]],
    ['pronouns','Personal pronouns','Person, number and respect affect agreement.',1,['word-order']],
    ['gender-agreement','Gender agreement','Agreement follows grammatical gender, not English translations.',2,['pronouns']],
    ['number-agreement','Number agreement','Singular, plural and respectful subjects have distinct forms.',2,['pronouns']],
    ['auxiliaries','Auxiliary verbs','Present and past auxiliaries complete finite predicates.',2,['pronouns']],
    ['habitual-present','Habitual present','The habitual participle agrees with the subject.',2,['gender-agreement','number-agreement','auxiliaries']],
    ['progressive','Progressive aspect','The root combines with an agreeing progressive participle.',2,['habitual-present']],
    ['negation','Negation','ਨਹੀਂ precedes the finite predicate in supported patterns.',2,['habitual-present']],
    ['questions','Questions','Question words occur in their Punjabi grammatical position.',2,['word-order']],
    ['postpositions','Postpositions','Case markers follow a compatible noun or pronoun phrase.',2,['word-order']],
    ['oblique','Oblique forms','Some nouns and pronouns change before a postposition.',3,['postpositions']],
    ['dative','Dative experiencers','Needs and preferences can use a dative experiencer.',3,['postpositions']],
    ['modals','Ability and requests','Modal constructions combine a lexical action with an agreeing predicate.',3,['habitual-present']],
    ['imperatives','Polite imperatives','Authored command forms express requests and instructions.',2,['pronouns']],
    ['past','Past constructions','Past auxiliaries combine with an appropriate aspect.',3,['auxiliaries']],
    ['perfective','Perfective aspect','Reviewed irregular forms describe completed events.',3,['past','gender-agreement']],
    ['ergativity','Perfective alignment','Agreement may target an unmarked object; Eastern Punjabi pronouns require special treatment.',4,['perfective','oblique']],
    ['future','Future forms','Reviewed finite future forms agree with person, gender and number.',3,['habitual-present']],
    ['possession','Possession','Possessive constructions use appropriate pronoun and noun forms.',2,['postpositions']],
    ['connected-clauses','Connected clauses','Conjunctions connect independently valid clauses.',4,['word-order']],
    ['conditions','Conditions','A conditional clause sets the context for a main clause.',4,['connected-clauses']]
  ];
  const grammarConcepts=Object.fromEntries(concepts.map(([id,name,description,difficulty,prerequisites])=>[id,{id,name,description,difficulty,prerequisites,relatedTemplates:[],relatedVocabulary:[],examples:[]}]));
  const scenarios=[
    ['introduction','Introduce yourself',['who-main'],['pronouns','word-order'],['P28']],
    ['restaurant-order','Ask politely for food or drink',['what-pani','what-khana','v-dena'],['imperatives','questions','modals'],['P19','P20','P23']],
    ['directions','Ask where someone is going',['q-kithe','v-jana'],['questions','postpositions'],['P10','P16','P46']],
    ['daily-routine','Describe daily activities',['when-harroz','v-karna'],['habitual-present'],['P01','P03']],
    ['health-needs','Describe a state or need',['what-davai'],['dative','gender-agreement'],['P21','P28']],
    ['future-plans','Talk about intended actions',['v-chahuna'],['modals','future'],['P14','P33']],
    ['past-experience','Talk about past activities',['v-jana'],['past','perfective'],['P43','P44','P46']],
    ['family-discussions','Talk about family and give things to someone',['who-bhain','v-dena'],['dative','postpositions'],['P53','P54','P56']],
    ['opinions-reasoning','Compare things and express reasons',['what-cah','what-pani'],['comparisons','reasons'],['P36','P57']],
    ['work-conversation','Explain work and discuss topics',['what-kam','v-gallkarna'],['habitual-present','connected-clauses'],['P34','P36','P37']]
  ].map(([id,objective,requiredVocabulary,requiredGrammar,usefulTemplates])=>({id,objective,requiredVocabulary,requiredGrammar,usefulTemplates,difficulty:3,prerequisiteSkills:[],exampleConversations:[],completionCriteria:null,status:'foundation'}));
  function connect(state,engine,lexical){
    const registry=state.linguistic;
    registry.grammarConcepts=Object.assign(JSON.parse(JSON.stringify(grammarConcepts)),registry.grammarConcepts||{});
    Object.values(registry.grammarConcepts).forEach(c=>{c.relatedTemplates=[];});
    Object.values(engine.concepts||{}).forEach(c=>{if(c&&c.id&&!registry.grammarConcepts[c.id])registry.grammarConcepts[c.id]=Object.assign({relatedTemplates:[],relatedVocabulary:[],examples:[],description:c.name,difficulty:4,prerequisites:c.prerequisiteConceptIds||[]},c);});
    state.templates.forEach(t=>{
      const metadata=engine.metadataFor(t);
      ['id','name','enabled','probability','difficulty','slots','pattern','family','description'].forEach(k=>delete metadata[k]);
      if(!/^P\d+$/.test(t.id))Object.keys(metadata).forEach(k=>{if(t[k]===undefined)t[k]=metadata[k];});
      else Object.assign(t,metadata);
      (t.grammarConceptIds||[]).forEach(id=>{
        if(registry.grammarConcepts[id])registry.grammarConcepts[id].relatedTemplates.push(t.id);
      });
    });
    const existingScenarios=new Map((registry.scenarios||[]).map(s=>[s.id,s]));
    scenarios.forEach(s=>{if(!existingScenarios.has(s.id))existingScenarios.set(s.id,Object.assign({},s,{requiredVocabulary:s.requiredVocabulary.map(id=>lexical.resolveId(state,id)).filter(Boolean)}));});
    registry.scenarios=Array.from(existingScenarios.values());
    return registry;
  }
  function progress(){return {schemaVersion:1,vocabulary:{},grammar:{},communication:{},events:[]};}
  function record(progressState,dimension,id,event){
    if(!['vocabulary','grammar','communication'].includes(dimension)||!id)throw new Error('A stable learning object is required.');
    const previous=progressState[dimension][id]||{exposures:0,correct:0,incorrect:0,mastery:'new',lastReviewed:null,nextReview:null};
    previous.exposures++;
    if(event.correct===true)previous.correct++;
    if(event.correct===false)previous.incorrect++;
    previous.lastReviewed=event.at||Date.now();
    progressState[dimension][id]=previous;
    // Evidence is retained without inventing an adaptive unlock policy.
    progressState.events.push({dimension,id,type:event.type||'exposure',at:previous.lastReviewed,correct:event.correct});
    if(progressState.events.length>1000)progressState.events=progressState.events.slice(-1000);
    return previous;
  }
  function wordProgress(item,records){
    const ids=Array.from(new Set([item.id,...(item.legacyIds||[])]));
    const histories=ids.map(id=>records[id]).filter(p=>p&&typeof p==='object');
    if(!histories.length)return {};
    const recent=histories.slice().sort((a,b)=>(b.lastSeen||0)-(a.lastSeen||0))[0];
    const result=Object.assign({},recent,{correct:histories.reduce((sum,p)=>sum+(Number(p.correct)||0),0),wrong:histories.reduce((sum,p)=>sum+(Number(p.wrong)||0),0)});
    const cards=histories.filter(p=>p.fsrsCard).sort((a,b)=>(Number(new Date(b.fsrsCard.last_review||b.lastSeen||0)))-(Number(new Date(a.fsrsCard.last_review||a.lastSeen||0))));
    if(cards.length)result.fsrsCard=cards[0].fsrsCard;
    return result;
  }
  return Object.freeze({categories,grammarConcepts,scenarios,connect,progress,record,wordProgress});
});
