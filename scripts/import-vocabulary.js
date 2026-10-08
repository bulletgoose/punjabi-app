#!/usr/bin/env node
'use strict';

// Dictionary text is a separately licensed dataset. Do not import generated
// conjugations, quotations or recordings through this vocabulary-only pipeline.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const https = require('node:https');

const SOURCE_URL = 'https://kaikki.org/dictionary/Punjabi/kaikki.org-dictionary-Punjabi.jsonl';
const LICENSE_URL = 'https://creativecommons.org/licenses/by-sa/4.0/';
const posNames = {noun:'noun',verb:'verb',adj:'adjective',adv:'adverb',pron:'pronoun',num:'numeral',conj:'conjunction',postp:'postposition',prep:'preposition',particle:'particle',det:'determiner',intj:'interjection',phrase:'phrase'};
const excludedSenseTags = new Set(['archaic','obsolete','historical','dated','dialectal','Western','Pakistan','derogatory','offensive','vulgar','nonstandard','misspelling','uncommon','rare','poetic','slang','abbreviation','pronunciation-spelling']);
const formTags = new Set(['form-of','alt-of','alternative']);
const topicNames = {essential:'Essential Communication',people:'People & Identity',family:'Family & Relationships',emotions:'Emotions & Personality',activities:'Everyday Activities',actions:'Actions & Verbs',food:'Food & Drink',produce:'Fruits & Vegetables',kitchen:'Cooking & Kitchen',restaurants:'Restaurants & Cafés',home:'Home & Living',clothing:'Clothing & Accessories',shopping:'Shopping & Money',numbers:'Numbers & Measurements',time:'Time & Dates',places:'Places & Locations',directions:'Directions & Navigation',travel:'Transport & Travel',airports:'Airports & Flights',accommodation:'Accommodation',tourism:'Tourism & Sightseeing',work:'Work & Occupations',business:'Business & Commerce',professional:'Professional Communication',education:'Education & Learning',technology:'Technology & Digital Life','social-media':'Social Media & Communication',health:'Health & Wellbeing',body:'Body & Appearance',medical:'Medical & Healthcare',safety:'Safety & Emergencies',nature:'Nature & Environment',weather:'Weather & Climate',disasters:'Natural Events & Disasters',sport:'Sport & Fitness',culture:'Entertainment & Culture',celebrations:'Celebrations & Traditions',romance:'Dating & Romance',opinions:'Opinions & Reasoning',storytelling:'Conversation & Storytelling',goals:'Goals & Aspirations',problems:'Problem Solving',society:'Society & Community',abstract:'Abstract Concepts',functional:'Grammar & Functional Words',general:'General Vocabulary'};
const topicParents = {produce:'food',kitchen:'food',restaurants:'food',directions:'places',airports:'travel',accommodation:'travel',tourism:'travel',business:'work',professional:'work','social-media':'technology',body:'health',medical:'health',weather:'nature',disasters:'nature',celebrations:'culture',romance:'family'};

// These are provisional browsing tags, never grammatical selectional features.
const topicRules = [
  ['produce', /\b(?:fruit|vegetable|apple|banana|mango|potato|tomato|onion|carrot|cucumber|cabbage|grape|melon|pea|peas|bean|beans|spinach)\b/i],
  ['kitchen', /\b(?:cook|cooking|kitchen|oven|stove|utensil|spoon|fork|knife|frying|boil|bake|flour|spice|cumin|turmeric|pepper|cardamom|cinnamon|clove|garlic)\b/i],
  ['restaurants', /\b(?:restaurant|cafe|café|waiter|waitress|menu|dining|dessert|meal)\b/i],
  ['food', /\b(?:food|drink|bread|rice|milk|tea|coffee|juice|butter|cheese|lentil|lentils|meat|egg|eggs|soup|sugar|salt|honey)\b/i],
  ['family', /\b(?:family|father|mother|parent|brother|sister|uncle|aunt|cousin|grandfather|grandmother|son|daughter|husband|wife|relative|kinship)\b/i],
  ['romance', /\b(?:romance|romantic|lover|sweetheart|kiss|dating|affection|beloved)\b/i],
  ['emotions', /\b(?:emotion|feeling|happy|sad|sadness|joy|anger|angry|fear|afraid|shame|proud|pride|jealous|anxiety|anxious|personality|kindness|smug)\b/i],
  ['people', /\b(?:person|people|human|man|woman|boy|girl|child|adult|identity|citizen|friend|neighbour|neighbor|stranger)\b/i],
  ['clothing', /\b(?:cloth|clothes|clothing|shirt|trousers|dress|skirt|coat|turban|hat|shoe|shoes|sock|socks|scarf|wear|garment|jewelry|jewellery|bracelet|necklace)\b/i],
  ['shopping', /\b(?:shopping|shop|purchase|buy|sale|sell|money|price|cost|cash|coin|currency|rupee|payment|wallet)\b/i],
  ['home', /\b(?:home|house|room|bed|bedroom|bathroom|furniture|chair|table|door|window|floor|roof|wall|household|blanket|pillow)\b/i],
  ['education', /\b(?:school|student|teacher|teach|learning|lesson|study|education|university|college|exam|classroom|library|book|pen|pencil|mathematics|science|dictionary|literacy)\b/i],
  ['airports', /\b(?:airport|flight|airplane|aeroplane|aircraft|aviation|boarding|pilot)\b/i],
  ['accommodation', /\b(?:hotel|hostel|lodging|guesthouse|accommodation|reservation)\b/i],
  ['tourism', /\b(?:tourism|tourist|sightseeing|monument|museum|attraction)\b/i],
  ['travel', /\b(?:travel|transport|journey|train|bus|car|bicycle|motorcycle|vehicle|boat|ship|ticket|passport|luggage|road|railway)\b/i],
  ['directions', /\b(?:direction|north|south|east|west|left|right|straight|turn|intersection|route|map|near|far)\b/i],
  ['places', /\b(?:place|location|city|town|village|country|street|market|park|building|station)\b/i],
  ['business', /\b(?:business|commerce|trade|company|merchant|profit|investment|finance|accounting|contract|enterprise)\b/i],
  ['professional', /\b(?:meeting|report|presentation|negotiation|management|manager|colleague|deadline|appointment|interview)\b/i],
  ['work', /\b(?:work|job|occupation|worker|employment|employee|office|profession|salary|wage|farmer|carpenter|labor|labour|engineer|sewadar)\b/i],
  ['social-media', /\b(?:social media|message|messaging|chat|email|e-mail|website|online|internet|broadcast)\b/i],
  ['technology', /\b(?:technology|digital|computer|software|hardware|telephone|phone|mobile|screen|keyboard|machine|electronic|electric|battery|network)\b/i],
  ['medical', /\b(?:medical|healthcare|hospital|doctor|nurse|medicine|drug|treatment|surgery|patient|disease|illness|infection|injury|wound|fever|cough|pain|cancer)\b/i],
  ['body', /\b(?:body|head|hair|eye|ear|nose|mouth|tooth|teeth|tongue|hand|arm|leg|foot|feet|finger|skin|bone|blood|heart|stomach|face)\b/i],
  ['health', /\b(?:health|healthy|wellbeing|well-being|rest|sleep|hygiene|cleanliness|diet|care)\b/i],
  ['safety', /\b(?:safety|safe|danger|emergency|rescue|accident|police|firefighter|alarm|security|protection)\b/i],
  ['disasters', /\b(?:earthquake|flood|drought|tsunami|avalanche|disaster|cyclone|hurricane)\b/i],
  ['weather', /\b(?:weather|rain|snow|wind|storm|cloud|thunder|lightning|temperature|climate|fog|sunny)\b/i],
  ['nature', /\b(?:nature|environment|animal|bird|fish|insect|tree|flower|plant|forest|river|lake|sea|ocean|mountain|earth|sun|moon|star|cat|dog|horse|cow|buffalo|goat|sheep|lion|tiger)\b/i],
  ['sport', /\b(?:sport|fitness|exercise|football|cricket|hockey|tennis|wrestling|athlete|competition|race|gym|swimming)\b/i],
  ['celebrations', /\b(?:celebration|festival|wedding|birthday|ceremony|tradition|ritual|diwali|vaisakhi|baisakhi|holi)\b/i],
  ['culture', /\b(?:culture|entertainment|music|song|sing|dance|film|cinema|theater|theatre|art|poetry|poem|literature|religion|sikhism|hinduism|islam|christianity)\b/i],
  ['numbers', /\b(?:number|numeral|measurement|measure|quantity|length|weight|metre|meter|kilogram|zero|one|two|three|four|five|six|seven|eight|nine|ten|hundred|thousand|million)\b/i],
  ['time', /\b(?:time|day|week|month|year|hour|minute|second|morning|evening|night|today|tomorrow|yesterday|season|date|calendar)\b/i],
  ['opinions', /\b(?:opinion|reason|reasoning|argument|believe|belief|agree|disagree|decision|logic|judgment|judgement|evidence)\b/i],
  ['storytelling', /\b(?:story|storytelling|narrative|conversation|dialogue|tale|speak|talk|speech|tell|say)\b/i],
  ['goals', /\b(?:goal|aspiration|ambition|hope|wish|desire|achievement|success|plan|intention|purpose)\b/i],
  ['problems', /\b(?:problem|solution|solve|difficulty|obstacle|challenge|mistake|error|repair|resolve|trouble)\b/i],
  ['society', /\b(?:society|community|government|politics|law|justice|democracy|election|public|social|organization|organisation|association|rights|welfare)\b/i],
  ['abstract', /\b(?:abstract|concept|idea|knowledge|truth|reality|existence|quality|state|freedom|thought|meaning|possibility|relationship|value)\b/i],
  ['essential', /\b(?:hello|goodbye|thanks|thank you|please|yes|no|welcome|sorry|help|greeting)\b/i],
  ['activities', /\b(?:walk|wash|read|write|eat|drink|play|run|sit|stand|clean|listen|look|see|come|go|do|make)\b/i]
];

function hash(value) { return crypto.createHash('sha256').update(value).digest('hex'); }
function clean(value) { return String(value || '').normalize('NFC').replace(/\s+/gu,' ').trim(); }
function englishGloss(value) {
  const text = clean(value);
  return text && text.length <= 110 && /[A-Za-z]/.test(text) && !/[<>]|\{\{|\[\[|�/.test(text) &&
    !/^(?:alternative|alternate|obsolete|archaic|misspelling|inflection|conjugation|plural|feminine|masculine|past tense|present tense|third-person|second-person|first-person) (?:form|spelling|of)\b/i.test(text) ? text : null;
}
function categoriesFor(english, sourceCategories, pos) {
  const material = english + ' ' + sourceCategories.join(' ');
  const ids = topicRules.filter(([,pattern])=>pattern.test(material)).map(([id])=>id);
  if (pos === 'verb') ids.push('actions');
  if (pos === 'num') ids.unshift('numbers');
  if (['pron','postp','prep','conj','det','particle'].includes(pos)) ids.unshift('functional');
  if (!ids.length) ids.push('general');
  const unique = [...new Set(ids)].slice(0,4);
  for (const id of [...unique]) if (topicParents[id] && !unique.includes(topicParents[id])) unique.push(topicParents[id]);
  return unique;
}

function build(raw, options = {}) {
  const counts = {sourceRecords:0,gurmukhiRecords:0,sourceSenses:0,acceptedSenses:0,excludedRecords:{},excludedSenses:{},categories:{},partsOfSpeech:{},gender:{},number:{}};
  const exclude = (bucket,reason) => { bucket[reason]=(bucket[reason]||0)+1; };
  const grouped = new Map();
  for (const line of raw.toString('utf8').split('\n')) {
    if (!line.trim()) continue;
    const row = JSON.parse(line); counts.sourceRecords++;
    const g = clean(row.word);
    if (!/[\u0a00-\u0a7f]/u.test(g)) { exclude(counts.excludedRecords,'other-script'); continue; }
    counts.gurmukhiRecords++;
    if (row.lang_code !== 'pa') { exclude(counts.excludedRecords,'other-language'); continue; }
    if (!posNames[row.pos]) { exclude(counts.excludedRecords,'excluded-part-of-speech'); continue; }
    if (!/^[\p{Script=Gurmukhi}\p{Mark}\s’'\-]+$/u.test(g) || g.length>80) { exclude(counts.excludedRecords,'unsupported-headword'); continue; }
    const romans = (row.forms || []).filter(f => (f.tags || []).includes('romanization')).map(f=>clean(f.form));
    const p = romans.find(r=>r && /[\p{Script=Latin}]/u.test(r) && /^[\p{Script=Latin}\p{Mark}\s’'\-().]+$/u.test(r) && !r.includes('�') && r.length<=100);
    if (!p) { exclude(counts.excludedRecords,'missing-valid-source-romanization'); continue; }
    for (const sense of row.senses || []) {
      counts.sourceSenses++;
      const tags = sense.tags || [];
      if (sense.form_of || sense.alt_of || tags.some(t=>formTags.has(t))) { exclude(counts.excludedSenses,'form-or-alternative'); continue; }
      if (tags.some(t=>excludedSenseTags.has(t))) { exclude(counts.excludedSenses,'restricted-register-or-dialect'); continue; }
      if (tags.some(t=>t.startsWith('error-'))) { exclude(counts.excludedSenses,'extraction-error'); continue; }
      const glosses = (sense.glosses || []).map(englishGloss).filter(Boolean);
      if (!glosses.length) { exclude(counts.excludedSenses,'missing-or-long-or-invalid-english-gloss'); continue; }
      const e = glosses[glosses.length-1];
      const key = g + '\u0000' + row.pos;
      if (!grouped.has(key)) grouped.set(key,{g,p,pos:row.pos,meanings:[],sourceCategories:new Set(),romans:new Set()});
      const item = grouped.get(key); item.romans.add(p);
      const meaningId = 'wt-sense-' + hash(key+'\u0000'+e).slice(0,20);
      if (item.meanings.some(m=>m.id===meaningId)) { exclude(counts.excludedSenses,'duplicate-meaning'); continue; }
      item.meanings.push({id:meaningId,english:e,sourceSenseId:sense.id||null,tags:tags.filter(t=>!t.startsWith('error-')),qualifiers:(sense.raw_tags||[]).map(clean).filter(Boolean)});
      for (const c of sense.categories||[]) { const name = typeof c === 'string' ? c : c.name; if (name && !/^Pages |^Punjabi (?:entries|terms|nouns|verbs|adjectives)/.test(name)) item.sourceCategories.add(name.replace(/^Punjabi /,'')); }
      counts.acceptedSenses++;
    }
  }
  const entries = [...grouped.entries()].sort(([a],[b])=>a<b?-1:a>b?1:0).map(([key,item])=>{
    const meaningTags = [...new Set(item.meanings.flatMap(m=>m.tags))];
    const genders = ['masculine','feminine'].filter(t=>meaningTags.includes(t));
    const gender = genders.length===1 ? (genders[0]==='masculine'?'m':'f') : null;
    const number = meaningTags.includes('plural-only')||meaningTags.includes('plural-normally') ? 'plural' : null;
    const categories = categoriesFor(item.meanings.map(m=>m.english).join(' '),[...item.sourceCategories],item.pos);
    const english = item.meanings[0].english;
    const entry = {id:'wt-pa-'+hash(key).slice(0,20),p:item.p,g:item.g,e:english,label:english,partOfSpeech:posNames[item.pos],gender,number,semanticTags:[],categories,gameCategory:topicNames[categories[0]],meanings:item.meanings,romanVariants:[...item.romans].sort(),source:{name:'English Wiktionary contributors via Kaikki / Wiktextract',url:'https://en.wiktionary.org/wiki/'+encodeURIComponent(item.g)+'#Punjabi',license:'CC-BY-SA-4.0',licenseUrl:LICENSE_URL},verifiedGrammar:false,quality:{status:'dictionary-import',nativeReviewed:false,grammarEligible:false,topicAssignment:'provisional-keyword-rules',dialect:'unspecified'}};
    counts.partsOfSpeech[entry.partOfSpeech]=(counts.partsOfSpeech[entry.partOfSpeech]||0)+1;
    counts.gender[gender||'unknown-or-mixed']=(counts.gender[gender||'unknown-or-mixed']||0)+1;
    counts.number[number||'unspecified']=(counts.number[number||'unspecified']||0)+1;
    for (const cat of categories) counts.categories[cat]=(counts.categories[cat]||0)+1;
    return entry;
  });
  const metadata = {schemaVersion:1,sourceName:'English Wiktionary via Kaikki / Wiktextract',sourceUrl:SOURCE_URL,sourceLandingPage:'https://kaikki.org/dictionary/Punjabi/index.html',sourceSha256:hash(raw),retrievedAt:options.retrievedAt||null,sourceDumpDate:options.dumpDate||null,sourceExtractionDate:options.extractionDate||null,license:'CC-BY-SA-4.0',licenseUrl:LICENSE_URL,attribution:'Adapted from English Wiktionary contributors, extracted by Kaikki using Wiktextract. Each entry links to the contributor history through its Wiktionary page.',modifications:'Filtered to Gurmukhi base entries with source romanization and concise English glosses; grouped senses by headword and part of speech; assigned stable IDs and provisional topic tags; excluded quoted examples, audio and conjugations.',entryCount:entries.length,uniqueHeadwordCount:new Set(entries.map(e=>e.g)).size,senseCount:counts.acceptedSenses,curationStatus:'Dictionary import; requires fluent Eastern Punjabi review',romanizationSystem:'Unmodified Wiktionary source romanization; conventions may vary by entry',nativeReviewed:false,grammarEligibleCount:0,frequencyRanked:false};
  return {entries,metadata,report:{...metadata,...counts,unrepresentedTopics:Object.keys(topicNames).filter(t=>!counts.categories[t])}};
}

function argsFor(argv) {
  const args = {};
  for (let i=0;i<argv.length;i++) {
    const name = argv[i];
    if (name==='--help'||name==='--inspect') args[name.slice(2)]=true;
    else if (['--input','--out','--report','--json','--download','--retrieved-at','--dump-date','--extraction-date','--expected-sha256'].includes(name) && argv[i+1] && !argv[i+1].startsWith('--')) args[name.slice(2)]=argv[++i];
    else throw new Error('Unknown option or missing value: '+name);
  }
  return args;
}
function download(destination, url = SOURCE_URL) {
  return new Promise((resolve,reject)=>{
    https.get(url,res=>{
      if (res.statusCode>=300 && res.statusCode<400 && res.headers.location) { res.resume(); return download(destination,new URL(res.headers.location,url).href).then(resolve,reject); }
      if (res.statusCode!==200) { res.resume(); return reject(new Error('Dictionary download returned HTTP '+res.statusCode)); }
      fs.mkdirSync(path.dirname(path.resolve(destination)),{recursive:true});
      const output = fs.createWriteStream(destination);
      res.pipe(output); output.on('finish',()=>output.close(resolve)); output.on('error',reject); res.on('error',reject);
    }).on('error',reject);
  });
}
function save(file, content) { fs.mkdirSync(path.dirname(path.resolve(file)),{recursive:true}); fs.writeFileSync(file,content); }

async function main() {
  const args = argsFor(process.argv.slice(2));
  if (args.help) { console.log('Usage: node scripts/import-vocabulary.js --input /path/to/punjabi.jsonl [--inspect] [--out data/vocabulary-expansion.js] [--report data/vocabulary-import-report.json] [--json data/vocabulary-expansion.json] [--retrieved-at YYYY-MM-DD] [--dump-date YYYY-MM-DD] [--extraction-date YYYY-MM-DD] [--expected-sha256 SHA256]\nOptional: --download /path/to/punjabi.jsonl downloads the public source before processing.'); return; }
  if (args.download) { await download(args.download); args.input=args.input||args.download; }
  if (!args.input) throw new Error('--input is required.');
  const raw = fs.readFileSync(args.input);
  if (args['expected-sha256'] && hash(raw)!==args['expected-sha256']) throw new Error('Source checksum differs from --expected-sha256; inspect the new release and verify its dates before importing.');
  const result = build(raw,{retrievedAt:args['retrieved-at'],dumpDate:args['dump-date'],extractionDate:args['extraction-date']});
  if (args.out) {
    const payload=JSON.stringify({entries:result.entries,metadata:result.metadata});
    save(args.out,'// Adapted dictionary dataset: CC BY-SA 4.0. See docs/VOCABULARY_SOURCES.md.\n(function(root,factory){\n  if(typeof module==="object"&&module.exports)module.exports=factory();\n  else {const data=factory();root.PUNJABI_VOCABULARY_EXPANSION=data.entries;root.PUNJABI_VOCABULARY_EXPANSION_META=data.metadata;}\n})(typeof globalThis!=="undefined"?globalThis:this,function(){return '+payload+';});\n');
  }
  if (args.report) save(args.report,JSON.stringify(result.report,null,2)+'\n');
  if (args.json) save(args.json,JSON.stringify({entries:result.entries,metadata:result.metadata},null,2)+'\n');
  console.log(JSON.stringify(result.report,null,2));
}
if (require.main===module) main().catch(error=>{console.error(error.message);process.exitCode=1;});
module.exports={build,categoriesFor,SOURCE_URL,LICENSE_URL};
