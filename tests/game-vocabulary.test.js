const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'game-vocabulary.js'), 'utf8'), context);

test('each requested game category has 30 distinct spoken and displayed words', () => {
  const categories = context.window.PUNJABI_GAME_VOCAB;
  assert.deepEqual(Object.keys(categories).sort(), ['BODY', 'CLOTHES', 'EDUCATION', 'EVERYDAY', 'FRUITS', 'NATURE', 'SPICES', 'VEGETABLES']);
  for (const [category, words] of Object.entries(categories)) {
    assert.equal(words.length, 30, `${category} needs 30 words`);
    assert.equal(new Set(words.map(word => word[1].normalize('NFC'))).size, 30, `${category} has repeated speech`);
    assert.equal(new Set(words.map(word => word[2].toLowerCase())).size, 30, `${category} has repeated English tiles`);
    for (const word of words) {
      assert.equal(word.length, 3);
      assert.ok(word[0].trim());
      assert.ok(/[\u0a00-\u0a7f]/.test(word[1]), `${category}: ${word[2]} needs Gurmukhi`);
      assert.ok(word[2].trim());
    }
  }
});
