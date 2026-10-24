/* Deterministic vocabulary curation only. Sentence rules and UI are consumers. */
(function(root,factory){
  const api=factory(typeof module==='object'&&module.exports?require('./data/vocabulary-cleanup-policy'):root.PUNJABI_VOCABULARY_CLEANUP_POLICY,
    typeof module==='object'&&module.exports?require('./lexical-semantics'):root.PunjabiLexicalSemantics);
  if(typeof module==='object'&&module.exports)module.exports=api;else root.PunjabiVocabularyCleanup=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(policy,semantics){
  'use strict';
  const norm=v=>String(v||'').normalize('NFC').trim().replace(/\s+/gu,' ');
  const meaning=v=>norm(v).toLowerCase().replace(/^(?:a|an|the)\s+/,'').replace(/[.!]$/,'');
  const stable=v=>JSON.stringify(v,(_,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.fromEntries(Object.keys(x).sort().map(k=>[k,x[k]])):x);
  const families=new Map();for(const family of policy.glossFamilies)for(const word of family)families.set(meaning(word),meaning(family[0]));
  const concept=v=>families.get(meaning(v))||meaning(v);
  const senses=e=>e.senses||[];
  const senseMeaning=s=>s.contextualGloss||s.english||'';
  const selected=(e,b)=>senses(e).find(s=>s.id===b.selectedSenseId);
  const protectedEntry=e=>!!(e.userModifiedCategories||(e.userModifiedLexicalFields||[]).length||e.translationOverride?.source==='user');
  const morphology=e=>({gender:e.gender,number:e.number,person:e.person,root:e.root,type:e.type,objectPostposition:e.objectPostposition,forms:e.forms,gScript:e.gScript,inflections:e.inflections});
  function lexicalKey(e){return [norm(e.g),e.partOfSpeech].join('|');}
  function definitionKeys(e){return new Set([e.e,...senses(e).flatMap(s=>[s.english,senseMeaning(s)])].map(concept).filter(Boolean));}
  function morphologyCompatible(a,b){
    for(const k of ['gender','number','person','root','type','objectPostposition'])if(a[k]!=null&&b[k]!=null&&a[k]!==b[k])return false;
    // The lemma script itself is compared separately. Distinct paradigms are
    // not silently unioned just because two dictionary heads look alike.
    for(const k of ['forms','inflections'])if(a[k]&&b[k]&&stable(a[k])!==stable(b[k]))return false;
    const af={...(a.gScript||{})},bf={...(b.gScript||{})};delete af.infinitive;delete bf.infinitive;
    for(const k of Object.keys(af))if(bf[k]!=null&&stable(af[k])!==stable(bf[k]))return false;
    return true;
  }
  function score(e){return (!e.importedDataset?10000:0)+(e.verifiedGrammar?100:0)+senses(e).filter(s=>s.verification?.sourceSupported).length*5+Object.values(morphology(e)).filter(v=>v!=null).length;}
  function utility(e){
    const definitions=senses(e).map(s=>meaning(s.english));
    const fringe=policy.fringe.find(rule=>e.partOfSpeech==='noun'&&definitions.length&&definitions.every(d=>rule.definitions.map(meaning).includes(d)));
    if(fringe)return {tier:4,reason:fringe.reason,evidence:'Reviewed complete dictionary definitions; utility judgement, not usage frequency.'};
    if(!e.importedDataset)return {tier:1,reason:'Existing authored everyday/core vocabulary; retained.',evidence:'Authored learner inventory; no measured frequency data.'};
    if(policy.preserveAlternatives[e.g])return {tier:3,reason:policy.preserveAlternatives[e.g],evidence:'Reviewed contextual, cultural or grammatical distinction.'};
    const everyday=new Set(['family','people','food','produce','kitchen','home','clothing','travel','transport','education','work','shopping','money','time','emotions','health','directions','essential']);
    if((e.categories||[]).some(c=>everyday.has(c))&&senses(e).some(s=>s.classification?.status==='source-supported'))return {tier:2,reason:'Useful intermediate vocabulary in an everyday learner domain; retained.',evidence:'Structured domain and source definition; not a frequency estimate.'};
    return {tier:3,reason:'Less common/special-context or insufficient usage evidence; conservatively retained.',evidence:'Uncertainty is not grounds for deletion.'};
  }
  function plan(entries,protectedIds){
    protectedIds=protectedIds||new Set();
    const rows=Object.values(entries).filter(e=>!e.deleted),merges={},alternatives={},excluded={},decisions={},heldSynonyms={},groups=new Map();
    for(const e of rows){decisions[e.id]=utility(e);if(decisions[e.id].tier===4&&!protectedEntry(e)&&!protectedIds.has(e.id))excluded[e.id]=decisions[e.id].reason;const k=lexicalKey(e);groups.set(k,[...(groups.get(k)||[]),e]);}
    for(const group of groups.values()){
      const ordered=group.filter(e=>!excluded[e.id]&&!protectedEntry(e)).sort((a,b)=>score(b)-score(a)||a.id.localeCompare(b.id));
      const clusters=ordered.map(e=>({members:[e],keys:definitionKeys(e)}));
      // At most n-1 merges. Require every known paradigm in a component to
      // agree; an unknown-gender seed cannot bridge masculine/feminine forms.
      for(let i=0;i<clusters.length;i++)for(let j=i+1;j<clusters.length;j++){
        const a=clusters[i],b=clusters[j];if(![...a.keys].some(k=>b.keys.has(k))||!a.members.every(x=>b.members.every(y=>morphologyCompatible(x,y))))continue;
        a.members.push(...b.members);b.keys.forEach(k=>a.keys.add(k));clusters.splice(j,1);i=-1;break;
      }
      for(const c of clusters)for(const e of c.members.slice(1))merges[e.id]=c.members[0].id;
    }
    for(const [key,preferred]of Object.entries(policy.conceptPreferences)){
      const group=rows.filter(e=>!excluded[e.id]&&!merges[e.id]&&!protectedEntry(e)&&e.partOfSpeech+'|'+concept(e.e)===key);
      const target=group.filter(e=>norm(e.g)===norm(preferred)).sort((a,b)=>score(b)-score(a)||a.id.localeCompare(b.id))[0];if(!target)continue;
      for(const e of group){
        if(e.id===target.id||protectedIds.has(e.id)||policy.preserveAlternatives[e.g])continue;
        const targetKeys=definitionKeys(target);
        if(senses(e).some(s=>!targetKeys.has(concept(s.english))&&!targetKeys.has(concept(senseMeaning(s))))){heldSynonyms[e.id]='Additional dictionary senses are not covered by the preferred word; retain the useful distinction rather than deduplicate by the primary English gloss.';continue;}
        // Human gender forms and grammatical number are separate learning
        // concepts. Other lexical synonyms retain their own full paradigms in
        // compatibility records; no replacement paradigm is copied to them.
        if(e.number&&target.number&&e.number!==target.number)continue;
        const human=senses(e).some(s=>s.semanticProperties?.human)||senses(target).some(s=>s.semanticProperties?.human);
        if(human&&e.gender&&target.gender&&e.gender!==target.gender)continue;
        const sourceRoles=Object.entries(e.roleEligibility||{}).filter(([,r])=>r.eligible).map(([r])=>r);
        if(sourceRoles.some(r=>!target.roleEligibility?.[r]?.eligible))continue;
        alternatives[e.id]=target.id;
      }
    }
    // A spelling duplicate can point to a preferred synonym through its
    // representative. Keep mappings shallow and deterministic.
    for(const id of Object.keys(merges))while(merges[merges[id]])merges[id]=merges[merges[id]];
    return {version:policy.version,merges,alternatives,excluded,decisions,heldSynonyms};
  }
  function identityKeys(e,b,category){
    const s=b&&selected(e,b),words=s?[senseMeaning(s)]:[e.e,...senses(e).map(senseMeaning)];
    return [...new Set(words.map(concept).filter(Boolean).map(k=>[category||'*',lexicalKey(e),k].join('|')))];
  }
  function bindingKey(e,b,category){
    if(['LEXICON','WORD'].includes(category))return category+'|'+e.id;
    const s=selected(e,b)||{},get=k=>b[k]??s[k]??e[k];
    return stable({category,word:e.id,meaning:concept(senseMeaning(s)||b.e||e.e),enabled:b.enabled!==false,
      gender:get('gender'),number:get('number'),person:get('person'),base:get('base'),transitive:get('transitive'),takesTags:get('takesTags')||get('takesTag'),
      inflections:get('inflections'),forms:get('forms'),modifierTargets:get('modifierTargets'),modifierKind:get('modifierKind'),construction:b.construction,
      phrase:b.phraseTranslationOverride||null,p:b.p,g:b.g});
  }
  function compatibleBindings(e,a,b){
    const x=selected(e,a)||{},y=selected(e,b)||{};
    if(x.englishCountability&&y.englishCountability&&x.englishCountability!==y.englishCountability)return false;
    const props=s=>new Set([...(s.semanticTags||[]),...Object.keys(s.semanticProperties||{}).filter(k=>s.semanticProperties[k]===true)]);
    const px=props(x),py=props(y);return [...px].every(k=>py.has(k))||[...py].every(k=>px.has(k));
  }
  function bindingScore(e,b){const s=selected(e,b)||{};return (!b.auditOwned?1000:0)+(s.verification?.sourceSupported?100:0)+Object.keys(s.semanticProperties||{}).filter(k=>s.semanticProperties[k]===true).length+(s.englishCountability?5:0);}
  function label(e,b,category){
    const s=selected(e,b);if(b.construction||b.phraseTranslationOverride||!s)return null;
    const value=senseMeaning(s);if(!semantics?.selectSense)return null;
    const original=Object.assign({},e,b,{e:b.e||e.e}),proposed=Object.assign({},original,{e:value});
    const before=semantics.selectSense(original,{role:category}),after=semantics.selectSense(proposed,{role:category});
    // Labels are vocabulary data, not permission to change the selector's
    // behaviour (including primary-lemma guards for extended noun senses).
    return before.ok===after.ok&&before.senseId===after.senseId&&before.contextualMeaning===after.contextualMeaning?value:null;
  }
  function reviewedLabel(e,value){
    const edit=policy.learnerReview?.labels[e.id];if(!edit||protectedEntry(e))return value;
    if(norm(value)===norm(edit.from))return edit.to;
    // Only the exact annotations explicitly approved for this lexical record
    // may be omitted. Dictionary senses and other words' parentheses survive.
    let display=String(value||'');for(const annotation of edit.annotations)display=display.split(annotation).join('');
    return norm(display).replace(/\s+([,;])/g,'$1');
  }
  return Object.freeze({version:policy.version,policy,norm,meaning,concept,stable,lexicalKey,definitionKeys,morphology,morphologyCompatible,protectedEntry,utility,plan,identityKeys,bindingKey,compatibleBindings,bindingScore,label,reviewedLabel});
});
