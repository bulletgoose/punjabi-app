'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

// Exercise the UI's actual rendering helpers, without another implementation
// of contextual meaning selection or a browser-specific DOM shim.
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const helpers=html.slice(html.indexOf('  function lexicalDetailSenses('),html.indexOf('  function renderSentence('));
function renderFixture(entries){
  const escape=value=>String(value==null?'':value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const context=vm.createContext({escapeHtml:escape,escAttr:escape,state:{linguistic:{categories:{communication:{label:'Communication & Language'}}}},window:{PunjabiLinguisticSystem:{get:(_,id)=>entries[id]||null},PunjabiLearningContext:{grammarConcepts:{perfective:{name:'Perfective aspect'}}}}});
  vm.runInContext(helpers,context);
  return context;
}
const order={id:'lex:order',p:'hukam',g:'ਹੁਕਮ',e:'command, order, instruction',partOfSpeech:'noun',gender:'m',number:'sg',categories:['communication'],quality:{nativeReviewed:false},source:{name:'Recorded dictionary source',url:'https://en.wiktionary.org/wiki/ਹੁਕਮ'},senses:[{id:'sense:order',english:'an authoritative order',usage:'An authoritative direction.',examples:[{gurmukhi:'ਹੁਕਮ',roman:'hukam',english:'order'}]},{id:'sense:command',english:'command or instruction'}]};
function orderSentence(){return {sentenceBreakdown:[{roman:'hukam',gurmukhi:'ਹੁਕਮ',english:'an order',category:'WHAT',role:'object',vocabularyIds:['lex:order'],selectedSenseId:'sense:order',lexicalSelections:[{vocabularyId:'lex:order',senseId:'sense:order',contextualMeaning:'order'}],grammarNote:'Unmarked direct object.',grammarConceptIds:['perfective']}]};}

test('closed breakdown uses contextual meaning and keeps alternatives and explanation expanded',()=>{
  const markup=renderFixture({'lex:order':order}).sentenceBreakdownMarkup(orderSentence(),{roman:true,gurmukhi:true,english:true},true);
  const summary=markup.match(/<summary\b[^>]*>([\s\S]*?)<\/summary>/)[1];
  assert.match(summary,/hukam/);assert.match(summary,/ਹੁਕਮ/);assert.match(summary,/an order/);assert.match(summary,/WHAT/);
  assert.doesNotMatch(summary,/command|instruction|Unmarked|Dictionary form/);
  assert.match(markup,/<details class="sentence-breakdown-part"/);
  assert.match(markup,/data-selected-sense-id="sense:order"/);
  assert.match(markup,/Other dictionary meanings/);assert.match(markup,/command or instruction/);
  assert.match(markup,/Meaning in this sentence:<\/strong> order/);
  assert.match(markup,/Unmarked direct object/);assert.match(markup,/Perfective aspect/);
  assert.match(markup,/Independent fluent-speaker review pending/);
});

test('Vocabulary and breakdown reuse the same lexical meanings and usage',()=>{
  const ui=renderFixture({'lex:order':order});
  const vocabulary=ui.meaningAndUsageMarkup(order,{}, {dictionaryForm:false});
  const breakdown=ui.sentenceBreakdownMarkup(orderSentence(),{},false);
  for(const text of ['an authoritative order','command or instruction','An authoritative direction.','Recorded examples:','Recorded dictionary source']){
    assert.ok(vocabulary.includes(text),text);assert.ok(breakdown.includes(text),text);
  }
  assert.match(html,/meaningAndUsageMarkup\(source\|\|item/);
});

test('inflected phrase pronunciation and canonical dictionary pronunciation remain distinct',()=>{
  const verb={id:'lex:give',p:'deṇā',g:'ਦੇਣਾ',e:'give',partOfSpeech:'verb',meanings:[{id:'sense:give',english:'give'}]};
  const markup=renderFixture({'lex:give':verb}).sentenceBreakdownMarkup({sentenceBreakdown:[{roman:'dittā',gurmukhi:'ਦਿੱਤਾ',english:'gave',category:'VERB',vocabularyId:'lex:give',selectedSenseId:'sense:give'}]}, {},false);
  assert.match(markup,/sentence-breakdown-part" data-word data-roman="dittā" data-gurmukhi="ਦਿੱਤਾ"/);
  assert.match(markup,/data-vocabulary-id="lex:give"[^>]*data-roman="deṇā" data-gurmukhi="ਦੇਣਾ"/);
  assert.match(markup,/data-speak-word="play">🔊 Dictionary form/);
  assert.match(markup,/data-speak-word="play">🔊 Play part/);
  assert.doesNotMatch(markup,/Other dictionary meanings/);
});

test('absent metadata stays absent and saved phrases do not require a current lexical entry',()=>{
  const markup=renderFixture({}).sentenceBreakdownMarkup({sentenceBreakdown:[{roman:'ghar vich',gurmukhi:'ਘਰ ਵਿੱਚ',english:'at home',category:'WHERE',dictionaryForms:[{roman:'ghar',gurmukhi:'ਘਰ',english:'house'}]}]}, {},false);
  assert.match(markup,/Saved dictionary form: ਘਰ — ghar — house/);
  assert.doesNotMatch(markup,/masculine|feminine|Fluent-speaker review|Case:|agreement/);
});

test('learner content is escaped and display preferences cover expandable details',()=>{
  const changed=Object.assign({},order,{p:'<img src=x>',g:'ਹੁਕਮ',source:{url:'javascript:alert(1)'},senses:[{id:'sense:order',english:'<script>bad</script>',usage:'" unsafe <note>'}]});
  const markup=renderFixture({'lex:order':changed}).sentenceBreakdownMarkup(orderSentence(),{roman:false,gurmukhi:true,english:false},true);
  assert.doesNotMatch(markup,/<script>|<img|href="javascript:/);
  assert.match(markup,/&lt;script&gt;bad&lt;\/script&gt;/);
  assert.match(markup,/lexical-explanation learning-script-english" hidden/);
  assert.match(markup,/class="learning-script-roman" data-script-available="true" hidden/);
});

test('selected sense supplies its own gender and number instead of entry-wide defaults',()=>{
  const word=Object.assign({},order,{senses:[{id:'sense:feminine',english:'selected meaning',gender:'f',number:'pl'}]});
  const markup=renderFixture({}).meaningAndUsageMarkup(word,{senseId:'sense:feminine'}, {dictionaryForm:false});
  assert.match(markup,/<p class="note">noun · feminine · plural<\/p>/);
  assert.doesNotMatch(markup,/masculine|singular/);
  const unknown=Object.assign({},word,{senses:[{id:'sense:unknown',english:'selected meaning',gender:null,number:null}]});
  const unresolved=renderFixture({}).meaningAndUsageMarkup(unknown,{senseId:'sense:unknown'}, {dictionaryForm:false});
  assert.doesNotMatch(unresolved,/masculine|feminine|singular|plural/);
});

test('metadata completion and fluent review remain separate in expanded status details',()=>{
  const assessment={dataCompleteness:{status:'complete-core',grammar:'complete-for-supported-constructions',semantics:'partial'},schemaValidation:{status:'valid'},sourceVerification:{status:'snapshot-aligned'},morphologicalValidation:{status:'direct-base-only-or-unresolved',scope:'Only the direct base is supported.'},constructionCompatibility:{status:'supported'},linguisticConfidence:{level:'source-supported-bounded'},fluentSpeakerReview:{status:'pending'},sentenceGenerationEligibility:{eligible:true,roles:['WHO','WHAT']},unresolvedReasons:['The plural requires independent review.']};
  const word=Object.assign({},order,{assessment,quality:{nativeReviewed:true}});
  const markup=renderFixture({}).meaningAndUsageMarkup(word,{}, {dictionaryForm:false});
  assert.match(markup,/Fluent-speaker review: pending/);
  assert.doesNotMatch(markup,/Recorded fluent-speaker review/);
  assert.match(markup,/<details class="lexical-review-details"><summary>Metadata and review status<\/summary>/);
  assert.match(markup,/Complete for supported constructions/);assert.match(markup,/Matches recorded dictionary source/);
  assert.match(markup,/Base form only; other forms unresolved/);assert.match(markup,/Pending independent review/);
  assert.match(markup,/WHO · WHAT/);assert.match(markup,/The plural requires independent review/);
  assert.match(markup,/Only the direct base is supported/);
});

test('restricted and absent assessment data never become a positive review claim',()=>{
  const ui=renderFixture({});
  assert.equal(ui.lexicalAssessmentMarkup(order),'');
  const markup=ui.lexicalAssessmentMarkup({assessment:{sentenceGenerationEligibility:{eligible:false},unresolvedReasons:['<unsafe> missing evidence']}});
  assert.match(markup,/<dt>Sentence use<\/dt><dd>Restricted<\/dd>/);
  assert.match(markup,/&lt;unsafe&gt; missing evidence/);
  assert.doesNotMatch(markup,/Record validation|Dictionary evidence|Pending independent review|Recorded as reviewed/);
});

test('category-filtered Vocabulary links the displayed lexical sense to shared details',()=>{
  const source=Object.assign({},order,{senses:[{id:'sense:anatomy',english:'the collarbone; the clavicle',categories:['anatomy'],gender:'f',number:'sg'},{id:'sense:clothing',english:'a rigid necklace',categories:['clothing'],gender:'m',number:'sg'}]});
  const item={displaySenseId:'sense:clothing'};
  const markup=renderFixture({}).meaningAndUsageMarkup(source,{senseId:item.displaySenseId},{dictionaryForm:false});
  assert.match(markup,/data-selected-sense-id="sense:clothing"/);
  assert.match(markup,/Selected dictionary sense:<\/strong> a rigid necklace/);
  assert.match(markup,/Topics: clothing/);
  assert.match(markup,/<p class="note">noun · masculine · singular<\/p>/);
  assert.doesNotMatch(markup,/Topics: anatomy|noun · feminine/);
  assert.match(markup,/the collarbone; the clavicle/);
  assert.match(html,/meaningAndUsageMarkup\(source\|\|item,\{senseId:item\.displaySenseId\}/);
});
