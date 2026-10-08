'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {build} = require('../scripts/import-vocabulary');

function row(word,roman,pos,senses,extra={}) {
  return Object.assign({word,lang_code:'pa',pos,forms:roman?[{form:roman,tags:['romanization']}]:[],senses},extra);
}
function source(rows) { return Buffer.from(rows.map(r=>JSON.stringify(r)).join('\n')); }

test('keeps homonym meanings together while separating parts of speech and preserving stable IDs',()=>{
  const rows=[row('ਖਾਣਾ','khāṇā','noun',[{id:'food',glosses:['food'],tags:['masculine']}]),row('ਖਾਣਾ','khāṇā','verb',[{id:'eat',glosses:['to eat'],tags:['transitive']}]),row('ਪਾਣੀ','pāṇī','noun',[{id:'water',glosses:['water'],tags:['masculine']},{id:'juice',glosses:['juice'],tags:['masculine']}])];
  const first=build(source(rows)); const reordered=build(source([...rows].reverse()));
  assert.deepEqual(first.entries,reordered.entries);
  assert.equal(first.entries.length,3);
  assert.equal(first.entries.find(e=>e.g==='ਪਾਣੀ').meanings.length,2);
  assert.equal(new Set(first.entries.map(e=>e.id)).size,3);
});

test('filters inflections, marked dialect and unsupported records without inventing missing metadata',()=>{
  const rows=[row('ਮੁੰਡੇ','muṇḍe','noun',[{glosses:['plural of ਮੁੰਡਾ'],form_of:[{word:'ਮੁੰਡਾ'}]}]),row('ਬੱਚਾ','baccā','noun',[{glosses:['child']}]),row('ਸ਼ਬਦ','shabad','noun',[{glosses:['word'],tags:['dialectal']}]),row('ਪੇਸ਼ਾ',null,'noun',[{glosses:['profession']}]),row('ਪੰਜਾਬ','pañjāb','name',[{glosses:['Punjab']}]),row('کتاب','kitāb','noun',[{glosses:['book']}])];
  const result=build(source(rows));
  assert.equal(result.entries.length,1);
  assert.equal(result.entries[0].gender,null);
  assert.equal(result.entries[0].number,null);
  assert.equal(result.entries[0].p,'baccā');
  assert.equal(result.report.excludedSenses['form-or-alternative'],1);
  assert.equal(result.report.excludedSenses['restricted-register-or-dialect'],1);
  assert.equal(result.report.excludedRecords['missing-valid-source-romanization'],1);
});

test('dictionary data carries attribution and never promotes imported conjugations or examples into grammar',()=>{
  const result=build(source([row('ਕਰਨਾ','karnā','verb',[{glosses:['to do'],examples:[{text:'quotation that must not be imported',type:'quotation'}]}],{forms:[{form:'karnā',tags:['romanization']},{form:'invalid morphology',tags:['error-unrecognized-form']}],sounds:[{audio:'external.ogg'}]})]));
  const entry=result.entries[0];
  assert.equal(entry.source.license,'CC-BY-SA-4.0');
  assert.match(entry.source.url,/en\.wiktionary\.org/);
  assert.equal(entry.verifiedGrammar,false);
  assert.equal(entry.quality.nativeReviewed,false);
  assert.equal(entry.quality.grammarEligible,false);
  assert.deepEqual(entry.semanticTags,[]);
  assert.equal(entry.forms,undefined);
  assert.equal(entry.examples,undefined);
  assert.equal(entry.sounds,undefined);
  assert.equal(JSON.stringify(entry).includes('quotation that'),false);
});
