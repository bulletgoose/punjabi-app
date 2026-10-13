'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),backup=require('../catalog-backup');
function storage(){const rows=new Map();return {getItem:key=>rows.get(key)||null,setItem:(key,value)=>rows.set(key,value)};}
test('migration backup preserves Unicode, personal edits, saved sentences and memory data exactly',()=>{
 const saved={saved:[{roman:'main',gurmukhi:'ਮੈਂ',english:'My personal translation 😀'}],learning:{last_review:'2026-10-13',correct:42},entries:Array.from({length:200},(_,id)=>({id,p:'kitāb',g:'ਕਿਤਾਬ',e:'book',meanings:['book','volume']}))},raw=JSON.stringify(saved),s=storage();
 assert.equal(backup.save(s,'backup',raw),true);assert.deepEqual(backup.decode(s.getItem('backup')),saved);assert.ok(s.getItem('backup').length<raw.length/2);
});
test('existing backups remain untouched and legacy plain JSON remains readable',()=>{
 const s=storage(),original=JSON.stringify({saved:['original']});s.setItem('backup',original);
 assert.equal(backup.save(s,'backup',JSON.stringify({saved:['replacement']})),true);assert.equal(s.getItem('backup'),original);assert.deepEqual(backup.decode(original),{saved:['original']});
});
test('a storage quota failure blocks migration rather than deleting unrelated data',()=>{
 const s=storage();s.setItem('existing','preserve');const rejecting={getItem:s.getItem,setItem(){throw new Error('QuotaExceededError');}};
 assert.equal(backup.save(rejecting,'backup',JSON.stringify({saved:['mine']})),false);assert.equal(s.getItem('existing'),'preserve');assert.equal(s.getItem('backup'),null);
});
