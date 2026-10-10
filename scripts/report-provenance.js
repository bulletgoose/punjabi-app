'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const repo=path.resolve(__dirname,'..');
function provenance(){
  const files=[...new Set(['index.html','service-worker.js',...fs.readdirSync(repo).filter(file=>file.endsWith('.js')),
    ...fs.readdirSync(path.join(repo,'data')).filter(file=>file.endsWith('.js')).map(file=>'data/'+file),
    ...fs.readdirSync(path.join(repo,'scripts')).filter(file=>file.endsWith('.js')).map(file=>'scripts/'+file),
    ...['tests','functions/test'].flatMap(directory=>fs.readdirSync(path.join(repo,directory)).filter(file=>file.endsWith('.test.js')).map(file=>directory+'/'+file))])].sort();
  const digest=crypto.createHash('sha256');for(const file of files)digest.update(file+'\0').update(fs.readFileSync(path.join(repo,file)));
  return {producedAt:new Date().toISOString(),nodeVersion:process.version,inputSha256:digest.digest('hex'),inputFiles:files};
}
module.exports={provenance};
