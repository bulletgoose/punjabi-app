// Lossless local migration backups; no network or account storage is used.
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./vendor/lz-string-1.5.0/lz-string'));
  else root.PunjabiCatalogBackup=factory(root.LZString);
})(typeof globalThis!=='undefined'?globalThis:this,function(codec){
  'use strict';
  function decode(value){
    const stored=JSON.parse(value);
    if(stored&&stored.encoding==='lz-string-utf16'){
      const raw=codec.decompressFromUTF16(stored.content);
      if(!raw)throw new Error('The vocabulary backup could not be decoded.');
      return JSON.parse(raw);
    }
    return stored;
  }
  function save(storage,key,raw){
    try{
      if(storage.getItem(key))return true;
      const content=codec.compressToUTF16(raw);
      if(codec.decompressFromUTF16(content)!==raw)return false;
      storage.setItem(key,JSON.stringify({version:1,encoding:'lz-string-utf16',content}));
      return true;
    }catch(error){return false;}
  }
  return Object.freeze({save,decode});
});
