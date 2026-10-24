'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),policy=require('../data/vocabulary-cleanup-decisions.json');
policy.learnerReview=require('../data/vocabulary-review-decisions.json');
fs.writeFileSync(path.join(root,'data/vocabulary-cleanup-policy.js'),'/* Generated from vocabulary-cleanup-decisions.json; source definitions remain unchanged. */\n(function(root,factory){if(typeof module===\'object\'&&module.exports)module.exports=factory();else root.PUNJABI_VOCABULARY_CLEANUP_POLICY=factory();})(typeof globalThis!==\'undefined\'?globalThis:this,function(){return '+JSON.stringify(policy)+';});\n');
