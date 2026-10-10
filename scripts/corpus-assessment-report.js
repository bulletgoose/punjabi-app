#!/usr/bin/env node
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const audit=require('../vocabulary-audit');
const grammar=require('../grammar-engine');
const {entries}=require('../data/vocabulary-expansion');
const source=require('../data/source-evidence');
const reviews=new Map(require('../data/grammar-ready-vocabulary').map(e=>[e.id,e]));
const after=entries.map(entry=>audit.enrich(Object.assign({},entry,reviews.get(entry.id),grammar.enrichVerb(entry))));
const categories=audit.categoryCorrectionReport(entries,after);
const issues=audit.validateCategories(after);
const reviewQueue=after.filter(e=>e.assessment.unresolvedReasons.length).map(e=>({id:e.id,gurmukhi:e.g,partOfSpeech:e.partOfSpeech,reasons:e.assessment.unresolvedReasons,senses:e.senses.filter(s=>s.classification.status==='unresolved'||!s.contextualGloss||s.restrictionReason).map(s=>({id:s.id,english:s.english,reason:s.restrictionReason||'Semantic classification remains unresolved.'}))}));
const report={scope:'Imported source records only; full canonical application measurements are reports/complete-integration-audit.json. No generated phrase counts are included as lexical entries.',sourceEvidence:source.metadata,summary:audit.summarize(after),categoryCorrections:categories,classificationIssues:issues,reviewQueue};
fs.mkdirSync(path.join(__dirname,'../reports'),{recursive:true});
fs.writeFileSync(path.join(__dirname,'../reports/corpus-assessment.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({summary:report.summary,changedCategories:categories.entriesChanged,movedOutOfGeneral:categories.movedOutOfGeneral,movedIntoGeneral:categories.movedIntoGeneral,reviewQueue:reviewQueue.length,issues:issues.reduce((r,i)=>(r[i.type]=(r[i.type]||0)+1,r),{})},null,2));
