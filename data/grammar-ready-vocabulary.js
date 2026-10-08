// Construction metadata only; the imported lexicon remains the word source.
// Adapted dictionary metadata: CC BY-SA 4.0. See VOCABULARY_LICENSE.txt.
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.PUNJABI_GRAMMAR_READY_VOCABULARY=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const reference='https://pt.learnpunjabi.org/assets/a%20reference%20grammar_final.pdf';
  // [Existing lexical ID, explicit dictionary gender, compatible sense class,
  //  whether the source also has a matching direct-singular declension cell.]
  const reviewed=[
    ['wt-pa-51737efdf7d045198fe8','m','edible',true], // ਅੰਬ — mango
    ['wt-pa-651013d40b5ffe5b4efe','m','edible',false], // ਆਲੂ — potato
    ['wt-pa-15182b3b09cdedee0eb2','m','edible',true], // ਆੜੂ — peach
    ['wt-pa-629bb73d2995930499ae','m','edible',false], // ਕਰੇਲਾ — bitter melon
    ['wt-pa-4b55c77671c0f6cc0bf0','m','edible',true], // ਕੇਲਾ — banana
    ['wt-pa-89ea1b8bc1fb20d5068f','m','edible',false], // ਖਾਣਾ — food (noun)
    ['wt-pa-21bed1265e26efb3e8e1','f','edible',false], // ਖੀਰ — rice pudding
    ['wt-pa-d3433137793ba8b522d0','m','edible',true], // ਖੀਰਾ — cucumber
    ['wt-pa-6e1a6aa968b73ff1a595','f','edible',true], // ਗਾਜਰ — carrot
    ['wt-pa-1d9a59e4c780a29094fc','m','edible',false], // ਗੋਸ਼ਤ — meat
    ['wt-pa-b6a80b0026ab597f9d5c','m','edible',true], // ਟਮਾਟਰ — tomato
    ['wt-pa-5d090f8e3473e2786e45','f','edible',false], // ਚੀਨੀ — sugar
    ['wt-pa-2b1feb813573bc0c219e','m','edible',false], // ਪਨੀਰ — cheese
    ['wt-pa-03f17333cab548998ca3','m','edible',false], // ਪੁਲਾਉ — pilaf
    ['wt-pa-a974cd199d4698d91929','f','edible',false], // ਪੂਰੀ — fried bread
    ['wt-pa-66b0fef03184ec60eb9c','f','edible',false], // ਬਿਰਿਆਨੀ — biryani
    ['wt-pa-983ecbc26772b067df36','m','edible',false], // ਭਟੂਰਾ — fried bread
    ['wt-pa-8248564dce59e2f6b39c','f','edible',true], // ਭੁਰਜੀ — scrambled-egg dish
    ['wt-pa-f8efde918f64e11893f9','m','edible',false], // ਭੱਤ — cooked rice
    ['wt-pa-fa3dffdf74db1998b607','m','edible',false], // ਮਸਰ — lentil
    ['wt-pa-e442caa5624bdfd4b35d','f','edible',false], // ਮਿਰਚ — chili pepper
    ['wt-pa-33efcc8b96b29679d842','f','edible',false], // ਮੁੰਗੀ — mung bean
    ['wt-pa-771e1704a6cba1239027','m','edible',false], // ਲਸਣ — garlic
    ['wt-pa-18fddb869651415095f1','m','edible',true], // ਸ਼ਹਿਦ — honey
    ['wt-pa-2223bae0be101820fc6e','m','edible',true], // ਸੇਬ — apple
    ['wt-pa-6d15d50f089b0b7c803c','m','edible',false], // ਸੰਤਰਾ — orange
    ['wt-pa-79a59111dc33fb0bc073','m','drinkable',true], // ਦੁੱਧ — milk
    ['wt-pa-1d55ee8d127cc953897a','m','drinkable',false], // ਅੰਬਰਸ — mango juice
    ['wt-pa-c970efe61404121b7eed','f','readable',true], // ਕਿਤਾਬ — book
    ['wt-pa-29953143c98b3fd546bf','f',null,true] // ਕਲਮ — pen
  ];
  return reviewed.map(([id,gender,senseClass,sourceSingular])=>({
    id,gender,number:'sg',semanticTags:[senseClass,'giveable','takeable'].filter(Boolean),verifiedGrammar:true,
    grammarReview:{
      status:'source-crosschecked;native-review-pending',nativeReviewed:false,reviewedAt:'2026-10-08',
      method:'Manual comparison with one accepted dictionary noun sense and its explicit gender. Semantic compatibility tags are inferred from that sense, not copied from source grammar tables.',
      scope:'Direct singular noun phrases as objects in supported constructions only. No plural, oblique, postpositional, adjective or verb forms are authorized.',
      numberEvidence:sourceSingular?'source-declension-direct-singular':'ordinary-dictionary-base-noun-used-as-grammatical-singular',
      genderEvidence:'explicit-dictionary-sense-tag',countability:'unspecified',sourceEntry:'inherited-from-lexical-record',
      references:[{url:reference,sections:'5.4 noun inflection; 8.3 direct object; 8.5 agreement'}]
    }
  }));
});
