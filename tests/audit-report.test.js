'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {templateReachability}=require('../scripts/audit-report');

function fixture(vocab,templates,assemble){
  const state={vocab,templates,verbs:[]};
  return {
    state,
    lexical:{resolveId(_,id){return 'lex:'+id;},snapshot(){return {unchanged:true};}},
    grammar:{metadataFor(template){return {requiredRoles:template.roles};},dependenciesFor(){return [];}},
    context:{assembleWithState:assemble}
  };
}
function output(id,category,role,senseId){
  return {gurmukhi:'ਚੰਗਾ',vocabularyIds:[id],sentenceBreakdown:[{
    vocabularyId:id,vocabularyIds:[id],category,role,
    lexicalSelections:senseId?[{vocabularyId:id,senseId}]:[]
  }]};
}

test('a shared lexical ID in another role cannot prove the forced role',()=>{
  const row={id:'shared',vocabularyId:'lex:shared',enabled:true};
  const f=fixture({WHO:[row],WHAT:[row]},[{id:'P-test',enabled:true,roles:['subject','object']}],()=>output('lex:shared','WHAT','object'));
  const report=templateReachability(f);
  assert.equal(report.byRole.WHO.demonstratedLexicalEntries,0);
  assert.equal(report.byRole.WHAT.demonstratedLexicalEntries,1);
  assert.equal(report.demonstratedEntries,1);
});

test('alternate sense bindings are tried without inflating lexical entry counts',()=>{
  const rows=['restricted','supported'].map(sense=>({id:sense,vocabularyId:'lex:shared',selectedSenseId:sense,enabled:true}));
  const f=fixture({WHAT:rows},[{id:'P-test',enabled:true,roles:['object']}],(_,projection)=>{
    const row=projection.vocab.WHAT[0];
    return row.selectedSenseId==='supported'?output(row.vocabularyId,'WHAT','object','supported'):null;
  });
  const report=templateReachability(f);
  assert.equal(report.byRole.WHAT.enabledLexicalEntries,1);
  assert.equal(report.byRole.WHAT.demonstratedLexicalEntries,1);
  assert.equal(report.byRole.WHAT.reached[0].bindingId,'supported');
  assert.equal(report.byRole.WHAT.reached[0].senseId,'supported');
});

test('legacy state predicate breakdowns count for STATE without proving ADJECTIVE bindings',()=>{
  const row={id:'state-happy',vocabularyId:'lex:state-happy',enabled:true};
  const f=fixture({STATE:[row],ADJECTIVE:[row]},[{id:'P28',pattern:'state',enabled:true,roles:['subject','description','auxiliary']}],()=>output(row.vocabularyId,'HOW'));
  const report=templateReachability(f);
  assert.equal(report.byRole.STATE.demonstratedLexicalEntries,1);
  assert.equal(report.byRole.ADJECTIVE.demonstratedLexicalEntries,0);
});
