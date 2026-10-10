'use strict';
// Execute each test file directly so managed environments cannot reduce
// discovery to one opaque file-level result. TAP preserves actual case counts.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{spawnSync}=require('node:child_process');
const repo=path.resolve(__dirname,'..'),reportDir=path.join(repo,'reports');
const {provenance}=require('./report-provenance');
const files=['tests','functions/test'].flatMap(directory=>fs.readdirSync(path.join(repo,directory)).filter(file=>file.endsWith('.test.js')).map(file=>directory+'/'+file)).sort();
const environment={...process.env};delete environment.NODE_TEST_CONTEXT;
const summary={provenance:provenance(),files:[],tests:0,pass:0,fail:0,cancelled:0,skipped:0,todo:0};
let transcript='',failed=false;
const scratch=fs.mkdtempSync(path.join(os.tmpdir(),'punjabi-test-results-'));
for(const file of files){
  const started=performance.now();
  const outputFile=path.join(scratch,path.basename(file)+'.tap'),descriptor=fs.openSync(outputFile,'w');
  const result=spawnSync(process.execPath,['--test-reporter=tap',file],{cwd:repo,encoding:'utf8',env:environment,stdio:['ignore',descriptor,descriptor]});
  fs.closeSync(descriptor);
  const output=fs.readFileSync(outputFile,'utf8');
  const stats={file,exitCode:result.status,durationMs:Math.round((performance.now()-started)*100)/100};
  for(const key of ['tests','pass','fail','cancelled','skipped','todo']){
    const matches=[...output.matchAll(new RegExp('^# '+key+' (\\d+)$','gm'))];
    stats[key]=matches.length?Number(matches[matches.length-1][1]):0;summary[key]+=stats[key];
  }
  if(result.status!==0||stats.fail||!stats.tests){failed=true;stats.error=result.error&&result.error.message||'Tests failed or no TAP case summary was produced.';}
  summary.files.push(stats);transcript+='\nFile: '+file+'\n'+output;
  console.log(file+': '+stats.pass+'/'+stats.tests+' passed'+(stats.skipped?' ('+stats.skipped+' skipped)':''));
}
summary.completedAt=new Date().toISOString();
if(provenance().inputSha256!==summary.provenance.inputSha256){failed=true;summary.error='Source inputs changed during tests; rerun against frozen sources.';}
summary.success=!failed;
fs.rmSync(scratch,{recursive:true,force:true});
fs.mkdirSync(reportDir,{recursive:true});fs.writeFileSync(path.join(reportDir,'automated-tests.txt'),transcript.trimStart());fs.writeFileSync(path.join(reportDir,'automated-tests-summary.json'),JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify({tests:summary.tests,pass:summary.pass,fail:summary.fail,skipped:summary.skipped,success:summary.success}));
if(failed)process.exitCode=1;
