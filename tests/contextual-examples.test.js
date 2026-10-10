const test=require('node:test');
const assert=require('node:assert/strict');
const {buildExamples}=require('../scripts/translation-examples');

test('the contextual examples report reproduces at least twenty real source-linked generated sentences',()=>{
  const report=buildExamples();
  assert.ok(report.examples.length>=20);assert.ok(report.coverage.categories.length>=10);
  assert.ok(report.coverage.examplesWithImportedMultipleDictionaryMeanings>=2);
  assert.match(report.markdown,/CC BY-SA 4\.0/);assert.match(report.markdown,/fluent-speaker review/);
  assert.match(report.markdown,/wood, timber/);assert.match(report.markdown,/physique, body, build, frame/);
  for(const sentence of report.examples){
    assert.ok(sentence.gurmukhi&&sentence.roman&&sentence.english&&sentence.sentenceBreakdown.length);
    assert.doesNotMatch(sentence.english,/undefined|NaN|[,;/]/);
    assert.ok(sentence.sentenceBreakdown.some(part=>(part.lexicalSelections||[]).length));
  }
  const wood=report.examples.find(sentence=>sentence.sentenceBreakdown.some(part=>part.gurmukhi==='ਕਾਠ'));
  assert.ok(wood);assert.match(wood.english,/wood/);assert.doesNotMatch(wood.english,/timber|physique|body|frame/);
  const order=report.examples.find(sentence=>sentence.sentenceBreakdown.some(part=>part.gurmukhi==='ਹੁਕਮ'));
  assert.ok(order);assert.match(order.english,/order/);assert.doesNotMatch(order.english,/instruction|spades/);
  for(const noun of ['ਕੁਰਸੀ','ਦਰਵਾਜ਼ਾ']){
    const sentence=report.examples.find(sentence=>sentence.sentenceBreakdown.some(part=>part.gurmukhi===noun));
    assert.ok(sentence);const adjective=sentence.sentenceBreakdown.find(part=>part.role==='description');
    assert.ok(adjective);assert.equal(adjective.lexicalSelections[0].senseId,'wt-sense-4ba7713b31e4654c4379');
    assert.doesNotMatch(sentence.gurmukhi,/ਕੋਰ[ਾੀੇ]/,'the source sense restricted to earthen pots does not describe a chair or door');
  }
  const iron=report.examples.find(sentence=>sentence.sentenceBreakdown.some(part=>part.gurmukhi==='ਲੋਹਾ'));
  assert.ok(iron);assert.equal(iron.sentenceBreakdown.find(part=>part.role==='description').lexicalSelections[0].senseId,'wt-sense-412d2ef8ee5dc9b0fe0a');
  assert.doesNotMatch(iron.gurmukhi,/ਧੂੰਆਂਧਾਰ/,'the source rain adjective does not describe iron');
});
