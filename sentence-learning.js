// Sentence constructions for retained lexical classes and explicit connectors.
(function(r,f){if(typeof module==='object'&&module.exports)module.exports=f();else r.PunjabiSentenceLearning=f();})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const connectorRows=[
 ['and','c-ate','Coordination: and'],['but','c-par','Contrast: but'],['purpose','c-tanjo','Purpose: so that'],['if','c-je','Condition: if … then'],['when','c-jado','Time: when'],['then','c-phir','Sequence: then'],['however','c-lekin','Contrast: however'],['or','c-ja','Alternative: or'],['because','c-kiuki','Reason: because'],['therefore','c-iskarke','Result: therefore'],['although','c-bhave','Concession: although'],['also','c-vi','Addition: also'],['first','c-pehla','Sequence: first'],['afterward','c-usbaad','Sequence: after that'],['finally','c-akhir','Sequence: finally']
];
const questionRows=[['who','q-kaun','Who is this?'],['whom','q-kisnu','To whom?'],['whose','q-kisda','Whose object?'],['else','q-kihor','What else?'],['duration','q-kinnichir','How long?'],['distance','q-kiniduur','How far?'],['count','q-kinne','How many?']];
const rows=connectorRows.map(([kind,id,name],i)=>({id:'P'+(72+i),name,pattern:'connector:'+kind,connectorId:id,requiredRoles:['connector','subject','verb'],requiredVocabularyIds:[id],grammarConceptIds:['connected-clauses','word-order','habitual-present'],family:'Connectors'}));
rows.push({id:'P87',name:'Identify a number',pattern:'numberIdentity',requiredRoles:['quantity'],grammarConceptIds:['numbers','auxiliaries'],family:'Numbers'});
rows.push({id:'P88',name:'Practice saying a word',pattern:'wordPractice',requiredRoles:['word'],grammarConceptIds:['imperatives','quoted-forms'],family:'Word practice',probability:1});
questionRows.forEach(([kind,id,name],i)=>rows.push({id:'P'+(89+i),name,pattern:'question:'+kind,questionId:id,requiredRoles:['question'],requiredVocabularyIds:[id],grammarConceptIds:['questions','word-order'],family:'Questions'}));
rows.push({id:'P96',name:'Possess a counted set of books',pattern:'countedPossession',requiredRoles:['subject','quantity','object'],grammarConceptIds:['numbers','number-agreement','possession'],family:'Numbers'});
rows.push({id:'P97',name:'Result: for this reason',pattern:'connector:reasonResult',reasonId:'why-islai',requiredRoles:['reason','subject','verb'],requiredVocabularyIds:['why-islai','state-tired','v-kamkarna'],grammarConceptIds:['connected-clauses','word-order','habitual-present'],family:'Connectors'});
const templates=rows.map(t=>Object.assign({enabled:true,engine:'sentence-learning-v1',difficulty:3,probability:5,slots:[],optionalRoles:[],prerequisiteGrammarConceptIds:t.grammarConceptIds,scenarioIds:['daily-routine'],reviewStatus:'reference-supported;independent-review-not-recorded'},t));
templates.find(t=>t.id==='P74').grammarConceptIds.push('subjunctive','modals');
templates.find(t=>t.id==='P82').requiredVocabularyIds.push('c-par');
for(const t of templates){
 const kind=t.pattern.split(':')[1];
 if(['but','however','because','therefore','although'].includes(kind))t.requiredVocabularyIds.push('state-tired','v-kamkarna');
 if(['if','when'].includes(kind))t.requiredVocabularyIds.push('state-tired','v-sona');
 if(kind==='purpose')t.requiredVocabularyIds.push('v-kamkarna');
 if(kind==='finally')t.requiredVocabularyIds.push('v-sona');
 if(kind==='whom')t.requiredVocabularyIds.push('who-tusi','v-dena');
 if(kind==='duration')t.requiredVocabularyIds.push('who-tusi','v-intazar');
 if(kind==='distance')t.requiredVocabularyIds.push('who-tusi','v-jana');
 if(t.id==='P96')t.requiredVocabularyIds=['who-main','what-kitab'];
}
const byId=Object.fromEntries(templates.map(t=>[t.id,t]));
function handles(t){return !!byId[t&&t.id];}
function generate(template,state,choose,tools){
 const def=byId[template.id];if(!def||!template.enabled)return null;
 const {grammar,semantics,lexical}=tools,parts=[];
 const enabled=rows=>(rows||[]).filter(r=>r.enabled!==false),find=(role,id)=>enabled(state.vocab[role]).find(r=>r.id===id);
 if(def.requiredVocabularyIds?.length){
  const ids=new Set(Object.keys(state.vocab).filter(role=>!['WORD','LEXICON'].includes(role)&&!role.startsWith('GAME_')).flatMap(role=>enabled(state.vocab[role])).concat(enabled(state.verbs)).map(row=>row.id));
  if(def.requiredVocabularyIds.some(id=>!ids.has(id)))return null;
 }
 const eview=(r,role)=>semantics.contextualEntry(r,{role,senseId:r.selectedSenseId})||r;
 function p(row,role,roman,gurmukhi,english,note,category){
  const id=row&&(row.vocabularyId||lexical.resolveId(state,row.id)),senseId=row&&(row.selectedSenseId||(row.senses||[])[0]?.id);
  parts.push({roman,gurmukhi,english,role,category:category||role.toUpperCase(),vocabularyId:id||null,vocabularyIds:id?[id]:[],selectedSenseId:senseId||null,lexicalSelections:id?[{vocabularyId:id,senseId,contextualMeaning:english,evidence:[role==='word'?'quoted-canonical-form':'authored-construction-context']}]:[],grammarNote:note||'',grammarConceptIds:def.grammarConceptIds});
 }
 function fixed(role,r,g,e){p(null,role,r,g,e,'Construction marker.');}
 function result(english,question){
  if(parts.some(p=>!p.roman||!p.gurmukhi)||!parts.length)return null;
  const roman=parts.map(p=>p.roman).join(' ')+(question?'?':'.'),gurmukhi=parts.map(p=>p.gurmukhi).join(' ')+(question?'?':'।');
  return {roman,punjabi:roman,gurmukhi,english:english.charAt(0).toUpperCase()+english.slice(1)+(question?'?':'.'),templateId:template.id,templateName:template.name,difficulty:template.difficulty,signature:template.id+'|'+parts.map(p=>p.vocabularyId+'@'+p.roman).join('|'),sentenceBreakdown:parts,breakdown:parts.map(p=>({label:p.role,value:p.roman,gurmukhi:p.gurmukhi,type:p.category,meaning:p.english,vocabularyId:p.vocabularyId})),buildingBlocks:parts,vocabularyIds:[...new Set(parts.flatMap(p=>p.vocabularyIds))],senseIds:[...new Set(parts.map(p=>p.selectedSenseId).filter(Boolean))],grammarConceptIds:def.grammarConceptIds,scenarioIds:def.scenarioIds,scriptWarning:''};
 }
 if(def.pattern==='wordPractice'){
  const row=choose(enabled(state.vocab.WORD).filter(w=>w.p&&w.g&&/[\u0a00-\u0a7f]/.test(w.g)&&!/[⟦⟧]/.test(w.g)));if(!row)return null;
  p(row,'word','“'+row.p+'”','“'+row.g+'”','“'+row.p+'”','Quoted dictionary form: no inflection or conversational argument structure is inferred.','WORD');fixed('imperative','kaho','ਕਹੋ','say');return result('say “'+row.p+'”');
 }
 if(def.pattern==='numberIdentity'){
  const row=choose(enabled(state.vocab.NUMBER).filter(n=>n.p&&n.g));if(!row)return null;
  fixed('demonstrative','eh','ਇਹ','this');p(row,'quantity',row.p,row.g,row.e,'Identifies the numeral itself; no counted-noun agreement is inferred.','NUMBER');fixed('auxiliary','hai','ਹੈ','is');return result('this is '+row.e);
 }
 if(def.pattern==='countedPossession'){
  const numbers=enabled(state.vocab.NUMBER).filter(n=>['one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen','twenty'].includes(n.e)),n=choose(numbers);
  const book=find('WHAT','what-kitab'),person=find('WHO','who-main');if(!n||!book||!person||book.p!=='kitāb'||book.g!=='ਕਿਤਾਬ'||!person.withPossession||!person.gScript?.withPossession)return null;
  const plural=n.e!=='one';
  p(person,'possessor',person.withPossession,person.gScript.withPossession,'I','Checked oblique possessive phrase.','WHO');p(n,'quantity',n.p,n.g,n.e,'Cardinal numeral in a counted noun phrase.','NUMBER');
  p(book,'object',plural?'kitābā̃':book.p,plural?'ਕਿਤਾਬਾਂ':book.g,plural?'books':'book','Explicit regular feminine consonant-stem plural; reference grammar §5.4.','WHAT');fixed('auxiliary',plural?'han':'hai',plural?'ਹਨ':'ਹੈ',plural?'are':'is');return result('I have '+n.e+' '+(plural?'books':'book'));
 }
 const subjects=enabled(state.vocab.WHO).filter(s=>{
  if(!['1sg','2sg','3sg','1pl','2pl','3pl'].includes(s.person)||!['m','f'].includes(s.gender)||s.ageClass==='infant')return false;
  const view=eview(s,'WHO'),tags=view.semanticTags||[];
  return !tags.includes('anatomical')&&(view.partOfSpeech==='pronoun'||view.semanticProperties?.human===true||tags.includes('human'));
 });
 const subject=choose(subjects);if(!subject)return null;
 const sv=eview(subject,'WHO');if(sv.partOfSpeech==='pronoun')for(const key of ['gender','number','person','englishPerson'])if(subject[key]!=null)sv[key]=subject[key];const engSubject=semantics.englishSubject(sv),person=sv.person||'3sg',engPerson=sv.englishPerson||person;
 function subjectPart(){p(subject,'subject',sv.p,sv.g,engSubject,'Direct subject with person/number agreement.','WHO');}
 function verb(base){return enabled(state.verbs).find(v=>(v.base===base||v.id==='v-'+base)&&v.root&&v.gScript);}
 function routineBase(){const candidates=enabled(state.verbs).filter(v=>v.root&&v.gScript&&!grammar.verbRulesFor(v).transitive&&['human','animate','any'].includes(grammar.verbRulesFor(v).subjectClass)&&v.type!=='modal'&&!['want','do','make','learn','understand'].includes(v.base));return (choose(candidates)||{}).base||'work';}
 function action(base,object,negative=false,aspect='habitual'){
  const raw=verb(base),v=raw&&eview(raw,'VERB');if(!v)return null;
  const r=grammar.conjugate({verb:v,subject:sv,object,negative,aspect,script:'roman'}),g=grammar.conjugate({verb:v,subject:sv,object,negative,aspect,script:'gurmukhi'});if(!r.ok||!g.ok)return null;
  if(object)p(object,'object',object.p,object.g,object.e,'Selected compatible direct object.','WHAT');
  const b=(v.lexicalSelection?.contextualMeaning||v.e||v.base).replace(/^to /,'');if(/[,;/]/.test(b))return null;const meaning=negative?(engPerson==='3sg'?'does not ':'do not ')+b:semantics.inflectEnglish(b,'habitual',engPerson);
  p(raw,'verb',r.text,g.text,meaning,'Habitual agreement follows the selected subject.','VERB');return engSubject+' '+meaning+(object?' '+semantics.englishNounPhrase(object,{definite:true}):'');
 }
 function stateClause(kind,negative=false){
  const raw=find('STATE','state-'+kind);if(!raw||!raw.forms||!raw.gScript?.forms)return null;
  const key=sv.number==='pl'?(sv.gender==='f'?'fpl':'pl'):sv.gender==='f'?'f':'m';const r=key==='fpl'&&kind==='tired'?'thakkīā̃':raw.forms[key]||raw.forms.pl||raw.p,g=key==='fpl'&&kind==='tired'?'ਥੱਕੀਆਂ':raw.gScript.forms[key]||raw.gScript.forms.pl||raw.g;
  const aux=person==='1sg'?['hā̃','ਹਾਂ','am']:person==='2sg'?['haĩ','ਹੈਂ','are']:['2pl','1pl'].includes(person)?person==='2pl'?['ho','ਹੋ','are']:['hā̃','ਹਾਂ','are']:sv.number==='pl'?['han','ਹਨ','are']:['hai','ਹੈ','is'];
  aux[2]=engPerson==='1sg'?'am':engPerson==='3sg'?'is':'are';
  subjectPart();p(raw,'state',r,g,raw.e,'Adjective agrees with the selected subject.','STATE');if(negative)fixed('negative','nahī̃','ਨਹੀਂ','not');fixed('auxiliary',aux[0],aux[1],aux[2]);return engSubject+' '+aux[2]+(negative?' not':'')+' '+raw.e;
 }
 if(def.pattern.startsWith('connector:')){
  const kind=def.pattern.split(':')[1],c=find(def.reasonId?'WHY':'CONNECTOR',def.connectorId||def.reasonId);if(!c)return null;
  const connector=meaning=>p(c,def.reasonId?'reason':'connector',c.p,c.g,meaning,'Discourse marker placement belongs to this clause pattern.',def.reasonId?'WHY':'CONNECTOR');
  let a,b;
  if(kind==='purpose'){
   // Purpose clause uses the explicitly supported modal subjunctive.
   subjectPart();a=action('work');if(!a)return null;connector('so that');subjectPart();
   const v=enabled(state.verbs).find(v=>v.id==='v-arams' || v.base==='rest')||enabled(state.verbs).find(v=>v.base==='sleep');if(!v)return null;
   const infinitiveR=(v.prefix?v.prefix+' ':'')+v.root,infinitiveG=(v.gScript.prefix?v.gScript.prefix+' ':'')+v.gScript.root;
   const subjunctive={'1sg':['sakā̃','ਸਕਾਂ'],'2sg':['sakẽ','ਸਕੇਂ'],'3sg':['sake','ਸਕੇ'],'1pl':['sakīe','ਸਕੀਏ'],'2pl':['sako','ਸਕੋ'],'3pl':['sakaṇ','ਸਕਣ']}[person];if(!subjunctive)return null;
   p(v,'verb',infinitiveR+' '+subjunctive[0],infinitiveG+' '+subjunctive[1],'can '+v.base,'Purpose clause uses the explicit person/number subjunctive of sak; it does not inflect for gender.','VERB');return result(a+' so that '+engSubject+' can '+v.base);
  }
  if(kind==='because'||kind==='therefore'||kind==='reasonResult'){
   if(kind==='because'){a=stateClause('tired');if(!a)return null;connector('because');subjectPart();b=action('work');}
   else {subjectPart();a=action('work');connector(kind==='reasonResult'?'for this reason':'therefore');b=stateClause('tired');}
   return a&&b?result(a+(kind==='because'?' because ':kind==='reasonResult'?'; for this reason, ':'; therefore, ')+b):null;
  }
  if(kind==='although'){connector('although');a=stateClause('tired');const but=find('CONNECTOR','c-par');if(!but)return null;p(but,'connector',but.p,but.g,'but','Punjabi concessive pairing; natural English omits redundant but.','CONNECTOR');subjectPart();b=action('work');return a&&b?result('although '+a+', '+b):null;}
  if(kind==='but'||kind==='however'){a=stateClause('tired');connector(kind);subjectPart();b=action('work');return a&&b?result(a+(kind==='but'?' but ':'; however, ')+b):null;}
  if(kind==='if'||kind==='when'){
   connector(kind);a=stateClause('tired');
   fixed('consequent','tā̃','ਤਾਂ','then');subjectPart();b=action('sleep');return a&&b?result(kind+' '+a+', then '+b):null;
  }
  if(['first','afterward','finally'].includes(kind)){connector(kind==='afterward'?'after that':kind);subjectPart();a=action(kind==='finally'?'sleep':routineBase());return a?result((kind==='afterward'?'after that':kind)+', '+a):null;}
  if(kind==='also'){const base=routineBase();subjectPart();connector('also');a=action(base);if(!a)return null;return result(a.replace(engSubject+' ',engSubject+' also '));}
  subjectPart();a=action(routineBase());if(!a)return null;connector(kind);subjectPart();b=action(routineBase());return b?result(a+' '+(kind==='then'?'and then':kind)+' '+b):null;
 }
 if(def.pattern.startsWith('question:')){
  const kind=def.pattern.split(':')[1],q=find('QUESTION',def.questionId);if(!q)return null;
  if(kind==='who'){fixed('demonstrative','eh','ਇਹ','this');p(q,'question',q.p,q.g,'who','Personal identity question.','QUESTION');fixed('auxiliary','hai','ਹੈ','is');return result('who is this',true);}
  if(kind==='else'){p(q,'question',q.p,q.g,'what else','Additional-thing question.','QUESTION');fixed('predicate','chāhīdā hai','ਚਾਹੀਦਾ ਹੈ','is needed');return result('what else is needed',true);}
  if(kind==='whose'){
   const raw=choose(enabled(state.vocab.WHAT).filter(o=>['m','f'].includes(o.gender)&&o.number!=='pl'&&!(o.semanticTags||o.tags||[]).some(t=>['human','animal','animate'].includes(t))&&(o.semanticTags||o.tags||[]).some(t=>['buyable','wearable','readable','container','tool','vehicle'].includes(t))&&eview(o,'WHAT')!==o)),o=raw&&eview(raw,'WHAT');if(!o)return null;
   fixed('demonstrative','eh','ਇਹ','this');p(q,'question',o.gender==='f'?'kis dī':'kis dā',o.gender==='f'?'ਕਿਸ ਦੀ':'ਕਿਸ ਦਾ','whose','Possessive question agrees with possessed noun.','QUESTION');p(raw,'object',o.p,o.g,o.e,'Direct singular possessed noun.','WHAT');fixed('auxiliary','hai','ਹੈ','is');return result('whose '+o.e+' is this',true);
  }
  if(kind==='count'){p(q,'question',q.p,q.g,'how many','Independent quantity interrogative.','QUESTION');fixed('predicate','chāhīde han','ਚਾਹੀਦੇ ਹਨ','are needed');return result('how many are needed',true);}
  // Polite second-person questions retain a checked subject and auxiliary.
  const you=find('WHO','who-tusi');if(!you)return null;p(you,'subject',you.p,you.g,'you','Polite second-person subject.','WHO');
  function politeVerb(base,object){const v=verb(base);if(!v)return null;const r=grammar.conjugate({verb:v,subject:you,object,aspect:'habitual',script:'roman'}),g=grammar.conjugate({verb:v,subject:you,object,aspect:'habitual',script:'gurmukhi'});if(!r.ok||!g.ok)return null;p(v,'verb',r.text,g.text,base,'Polite subject controls gender and number agreement.','VERB');return true;}
  if(kind==='distance'){p(q,'question',q.p,q.g,'how far','Distance question.','QUESTION');if(!politeVerb('go'))return null;return result('how far do you go',true);}
  if(kind==='duration'){p(q,'question','kinnā cir','ਕਿੰਨਾ ਚਿਰ','how long','Duration question uses masculine cir.','QUESTION');if(!politeVerb('wait'))return null;return result('how long do you wait',true);}
  if(kind==='origin'){p(q,'question',q.p,q.g,'where from','Origin question.','QUESTION');fixed('predicate','āunde ho','ਆਉਂਦੇ ਹੋ','come');return result('where do you come from',true);}
  if(kind==='whom'){
   const object=choose(enabled(state.vocab.WHAT).filter(o=>grammar.compatible(enabled(state.verbs).find(v=>v.id==='v-dena'),o))),o=object&&eview(object,'WHAT');if(!o)return null;
   p(q,'question',q.p,q.g,'to whom','Dative/recipient interrogative.','QUESTION');p(object,'object',o.p,o.g,o.e,'Direct object of give.','WHAT');if(!politeVerb('give',o))return null;return result('to whom do you give '+semantics.englishNounPhrase(o,{definite:true}),true);
  }
 }
 return null;
}
return Object.freeze({templates,handles,generate});
});
