'use strict';
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');let failed=false;
for(const directory of ['tests','functions/test'])for(const file of fs.readdirSync(path.join(root,directory)).filter(f=>f.endsWith('.test.js')).sort()){
 const result=spawnSync(process.execPath,[path.join(root,directory,file)],{cwd:root,stdio:'inherit'});if(result.status!==0)failed=true;
}
process.exitCode=failed?1:0;
