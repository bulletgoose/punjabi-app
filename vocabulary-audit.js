/* Reproducible, sense-aware corpus assessment. Source-backed construction
 * permission is separate from fluent-speaker review. No network or storage. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./data/source-evidence'),require('./lexical-semantics'),require('./learning-context'),require('./data/authored-category-baselines'));
  else root.PunjabiVocabularyAudit=factory(root.PUNJABI_SOURCE_EVIDENCE,root.PunjabiLexicalSemantics,root.PunjabiLearningContext,root.PUNJABI_AUTHORED_CATEGORY_BASELINES);
})(typeof globalThis!=='undefined'?globalThis:this,function(sourceEvidence,semantics,learning,authoredBaselines){
  'use strict';
  const VERSION=1;
  const reference='https://pt.learnpunjabi.org/assets/a%20reference%20grammar_final.pdf';
  const list=v=>Array.isArray(v)?v:[];
  const unique=v=>Array.from(new Set(v));
  const key=v=>String(v||'').trim().toLowerCase().replace(/^(?:a|an|the|to) /,'').replace(/[.!]$/,'');
  const clone=v=>JSON.parse(JSON.stringify(v));
  const roles=['WHO','WHEN','WHERE','WHAT','HOW','WHY','ABOUT','VERB'];
  const assessmentRoles=roles.concat('ADJECTIVE','STATE');
  const evidenceByIdentity=new Map(Object.entries(sourceEvidence&&sourceEvidence.entries||{}).map(([id,e])=>[[e.g,e.p,e.partOfSpeech].join('\0'),{id,entry:e}]));
  function fingerprint(entry){
    const input=JSON.stringify([entry.g,entry.p,entry.e,entry.partOfSpeech].map(v=>String(v||'').normalize('NFC').trim().replace(/\s+/g,' ')));
    let a=2166136261,b=2246822519,c=3266489917,d=668265263;
    for(let i=0;i<input.length;i++){const n=input.charCodeAt(i);a=Math.imul(a^n,16777619);b=Math.imul(b^n,2246822519);c=Math.imul(c^n,3266489917);d=Math.imul(d^n,668265263);}
    return [a,b,c,d].map(h=>(h>>>0).toString(16).padStart(8,'0')).join('')+':'+input.length;
  }
  const heads=Object.create(null);
  // These are exact dictionary definition heads, not substring keywords.
  // Class evidence is limited to the sense's synonym clauses or the explicit
  // hypernym of a definition. A word elsewhere in an explanation grants no
  // category or grammatical permission.
  function register(words,categories,semanticTags,options){for(const word of words.split('|'))heads[word]={categories,semanticTags,...options};}
  register('person|human|man|woman|boy|girl|child|adult|baby|infant|youth|friend|neighbour|neighbor|stranger|guest|visitor|citizen|member|companion|owner|leader|ruler|king|queen|prince|princess|emperor|empress|officer|soldier|warrior|judge|prisoner|servant|slave|volunteer|pilgrim|sage|saint|monk|nun|priest|poet|author|writer|artist|singer|dancer|actor|actress|player|athlete|customer|patient|passenger|driver|pedestrian|freethinker|maverick|litterateur|white man|emir|chief|plutocrat',['people'],['human','animate'],{animate:true,human:true,countability:'countable'});
  register('teacher|student|pupil|professor|lecturer|farmer|carpenter|blacksmith|goldsmith|tailor|weaver|shoemaker|cobbler|barber|doctor|nurse|engineer|lawyer|advocate|merchant|trader|shopkeeper|worker|labourer|laborer|employee|employer|manager|clerk|accountant|cook|chef|waiter|waitress|journalist|newswriter|librarian|policeman|police officer|firefighter|pilot|musician|potter|gardener|fisherman|mason|plumber|painter|mechanic|porter|postman|peasant',['work','people'],['human','animate','occupation'],{animate:true,human:true,countability:'countable'});
  register('father|mother|parent|brother|sister|son|daughter|husband|wife|uncle|aunt|cousin|nephew|niece|grandfather|grandmother|grandson|granddaughter|sibling|bride|bridegroom|groom|mother-in-law|father-in-law|brother-in-law|sister-in-law|daughter-in-law|son-in-law',['family','people'],['human','animate','kinship'],{animate:true,human:true,countability:'countable'});
  register('animal|bird|fish|insect|mammal|reptile|amphibian|cat|dog|horse|cow|bull|buffalo|goat|sheep|ram|ewe|lamb|calf|camel|elephant|lion|tiger|leopard|bear|wolf|fox|jackal|monkey|donkey|mule|deer|rabbit|hare|rat|mouse|squirrel|pig|boar|snake|python|cobra|crocodile|lizard|tortoise|turtle|frog|toad|sparrow|crow|raven|pigeon|dove|parrot|peacock|hen|chicken|rooster|cock|duck|goose|eagle|hawk|owl|crane|whooping crane|vulture|swan|cuckoo|quail|ant|bee|wasp|fly|mosquito|butterfly|moth|beetle|spider|scorpion|locust|grasshopper|worm|earthworm|dragon',['animals'],['animal','animate'],{animate:true,human:false,countability:'countable'});
  register('tree|plant|flower|leaf|root|seed|branch|stem|bark|grass|herb|shrub|bush|vine|rose|lotus|jasmine|marigold|sunflower|tulip|bamboo|pine|oak|cedar|neem|peepal|banyan|sandalwood|agarwood|golden shower tree|wheat|barley|maize|cotton|sugarcane',['plants'],['plant'],{animate:false,human:false});
  register('mango|potato|peach|bitter melon|banana|cucumber|carrot|tomato|chili pepper|chilli pepper|mung bean|garlic|apple|orange|pear|guava|papaya|pineapple|pomegranate|watermelon|melon|grape|grapes|lemon|lime|cherry|plum|apricot|fig|date|dates|coconut|almond|walnut|cashew|pistachio|peanut|groundnut|raisin|onion|ginger|fresh ginger|radish|turnip|beetroot|cabbage|cauliflower|spinach|aubergine|eggplant|okra|pea|peas|bean|beans|lentil|lentils|chickpea|chickpeas',['produce'],['edible','giveable','takeable','concrete'],{animate:false,human:false});
  register('food|rice pudding|meat|sugar|cheese|pilaf|fried bread|biryani|scrambled-egg dish|cooked rice|honey|bread|rice|flour|butter|yogurt|yoghurt|curd|cream|ghee|egg|eggs|soup|porridge|pickle|jam|chutney|sweet|sweets|cake|biscuit|cookie|sandwich|roti|chapati|paratha|halwa|ladoo|laddu|jalebi|samosa|pakora|dessert|breakfast|lunch|dinner|meal',['food'],['edible','giveable','takeable','concrete'],{animate:false,human:false});
  register('milk|tea|coffee|water|juice|mango juice|lemonade|buttermilk|lassi|sherbet|wine|beer|liquor',['food'],['drinkable','giveable','takeable','concrete'],{animate:false,human:false,countability:'uncountable'});
  register('spice|salt|cumin|turmeric|pepper|cardamom|cinnamon|clove|coriander|fennel|fenugreek|ajwain|saffron|mustard|anise|nutmeg',['kitchen'],['ingredient','concrete'],{animate:false,human:false});
  register('house|home|room|bedroom|bathroom|kitchen|courtyard|attic|mansion|palace|hut|cottage|apartment|flat|dwelling|residence|building|school|college|university|library|hospital|clinic|office|shop|market|station|airport|hotel|hostel|restaurant|cafe|café|temple|mosque|church|gurdwara|gurudwara|prison|factory|warehouse|bank|post office|village|town|city|country|park|garden|farm|field|forest|road|street|bridge|port|harbour|harbor',['places'],['place','inanimate'],{animate:false,human:false,countability:'countable',locative:'in'});
  register('household',['family','home'],['collective','human'],{animate:true,human:true});
  register('mountain|hill|valley|river|lake|sea|ocean|island|desert|plain|plateau|coast|shore|beach|landscape|land|earth|world|continent|region|district|province|territory|waterfall|stream|pond|canal|well|cave|cliff|peak',['geography','nature'],['place','geographical'],{animate:false,human:false,locative:'at'});
  register('wood|timber|stone|sand|soil|clay|mud|metal|iron|steel|copper|brass|bronze|gold|silver|aluminium|aluminum|lead|tin|zinc|mercury|plastic|glass|rubber|leather|wool|silk|cement|concrete|brick|coal|charcoal|petroleum|oil|petrol|gasoline|diesel|fuel|wax|resin|ash|dust|smoke|steam|oxygen|hydrogen|nitrogen|carbon|sulphur|sulfur|material|substance|mineral|chemical|acid|poison',['materials'],['material','inanimate'],{animate:false,human:false,countability:'uncountable'});
  register('hammer|saw|axe|spade|shovel|hoe|plough|plow|sickle|scythe|drill|chisel|screwdriver|wrench|pliers|tongs|needle|scissors|razor|knife|blade|tool|equipment|machine|instrument|lever|pulley|rope|chain|nail|screw|bolt|lock|key',['tools'],['tool','concrete','giveable','takeable'],{animate:false,human:false,countability:'countable'});
  register('wall|roof|floor|ceiling|door|window|gate|stair|stairs|staircase|pillar|column|beam|foundation|fence|barrier|pavement|tunnel|dam|railway|highway|motorway|infrastructure|construction',['construction'],['structure','inanimate'],{animate:false,human:false});
  register('book|newspaper|newsletter|bulletin|magazine|letter|document|report|poem|story|tale|novel|essay|article|textbook|dictionary|encyclopedia|scripture|manuscript|pamphlet|booklet',['education','communication'],['readable','giveable','takeable','concrete'],{animate:false,human:false,countability:'countable'});
  register('pen|pencil|paper|eraser|notebook|chalk|ink|blackboard|slate|desk|classroom|lesson|exam|examination|education|learning|knowledge|literacy|mathematics|science|history|geography',['education'],['educational'],{animate:false,human:false});
  register('language|word|sentence|phrase|letter|alphabet|syllable|vowel|consonant|grammar|noun|verb|adjective|adverb|pronoun|infinitive|translation|interpretation|meaning|speech|conversation|dialogue|discussion|message|announcement|news|communication|question|answer|reply|request|petition|supplication|command|order|instruction|direction|title|heading',['communication'],['communication'],{animate:false,human:false});
  register('physique|complexion|appearance|beauty|build',['appearance'],['appearance'],{animate:false,human:false});
  register('body|head|hair|eye|ear|nose|mouth|tooth|teeth|tongue|hand|arm|leg|foot|feet|finger|thumb|toe|skin|bone|blood|heart|stomach|face|neck|shoulder|chest|back|waist|hip|knee|elbow|wrist|ankle|palm|forehead|chin|cheek|lip|lips|eyebrow|eyelash|beard|moustache|mustache|brain|lung|liver|kidney|intestine|intestines|vein|artery|muscle|nerve|breast|navel|skeleton|flesh',['anatomy'],['anatomical'],{animate:false,human:false});
  register('cloth|clothes|clothing|garment|shirt|trousers|pants|dress|skirt|coat|turban|hat|cap|shoe|shoes|sock|socks|scarf|shawl|sari|saree|salwar|kameez|kurta|pyjamas|pajamas|sweater|jacket|vest|belt|glove|gloves|veil|uniform|jewelry|jewellery|bracelet|necklace|ring|earring|bangle',['clothing'],['wearable','giveable','takeable','concrete'],{animate:false,human:false});
  register('table|chair|bed|sofa|stool|bench|cup|glass|plate|bowl|pot|pan|bottle|bucket|basket|box|bag|sack|container|jar|jug|vase|lamp|candle|mirror|clock|watch|comb|brush|soap|towel|blanket|pillow|mattress|curtain|carpet|mat|fan|umbrella|toy|ball|broom|dustbin|bin|utensil|spoon|fork|dish|kettle|tray|furniture|object|item|thing|incense stick|perfume|scent|attar',['objects'],['concrete','giveable','takeable'],{animate:false,human:false});
  register('car|bus|train|bicycle|motorcycle|motorbike|scooter|rickshaw|cart|wagon|truck|lorry|boat|ship|airplane|aeroplane|aircraft|helicopter|vehicle|ticket|passport|luggage|journey|travel|transport',['travel'],['transport'],{animate:false,human:false});
  register('computer|phone|telephone|mobile phone|smartphone|screen|keyboard|mouse|software|hardware|internet|website|email|e-mail|radio|television|camera|battery|electricity|network|technology',['technology'],['technology'],{animate:false,human:false});
  register('money|coin|currency|rupee|cash|price|cost|payment|wallet|purchase|sale|shop|shopping|wealth|riches|wage|salary|income|debt|loan|profit|loss|investment|trade|business|commerce|company|contract',['shopping','business'],['economic'],{animate:false,human:false});
  register('health|disease|illness|fever|cough|pain|wound|injury|medicine|treatment|surgery|infection|cancer|insomnia|sleeplessness|hygiene|cleanliness|diet',['health','medical'],['health'],{animate:false,human:false});
  register('happiness|joy|pleasure|sorrow|grief|sadness|anger|fear|shame|pride|jealousy|love|affection|hatred|anxiety|regret|concern|passion|desire|wish|hope',['emotions'],['emotion'],{animate:false,human:false});
  register('kindness|politeness|respect|reverence|courtesy|civility|honesty|courage|bravery|cowardice|generosity|greed|patience|humility|arrogance|intelligence|wisdom|wit|character|personality|discipline',['personality'],['character'],{animate:false,human:false});
  register('reason|cause|effect|result|consequence|influence|impact|condition|purpose',['causality'],['abstract','causal'],{animate:false,human:false});
  register('number|numeral|quantity|amount|majority|minority|length|width|breadth|height|depth|weight|size|distance|volume|speed|measurement|measure|half|quarter|third|part|portion|piece|fraction|percent|percentage',['quantities'],['quantity'],{animate:false,human:false});
  register('time|day|week|month|year|hour|minute|second|morning|evening|night|afternoon|dawn|dusk|season|date|calendar|spring|summer|autumn|winter|january|february|march|april|may|june|july|august|september|october|november|december|monday|tuesday|wednesday|thursday|friday|saturday|sunday',['time'],['temporal'],{animate:false,human:false});
  register('sun|moon|star|sky|fire|rain|snow|wind|storm|cloud|thunder|lightning|fog|mist|weather|climate|temperature|heat|cold|darkness|light|rainbow|sunshine',['nature','weather'],['natural'],{animate:false,human:false});
  register('government|politics|law|justice|democracy|election|society|community|nation|organization|organisation|association|rights|welfare|crime|offence|offense|bureaucracy|officialdom|authority|power|freedom|liberation|independence',['society'],['social'],{animate:false,human:false});
  register('music|song|dance|film|cinema|theatre|theater|art|poetry|literature|religion|ritual|ceremony|festival|celebration|wedding|birthday|tradition|card game|spades',['culture'],['cultural'],{animate:false,human:false});
  register('idea|thought|concept|truth|reality|existence|quality|state|possibility|relationship|value|belief|faith|creed|doctrine|principle|opinion|decision|judgment|judgement|estimate|guess|conjecture|evidence|logic|understanding|eternity|beginning|end|problem|solution|difficulty|mistake|error|success|failure|achievement|goal|plan|intention',['abstract'],['abstract'],{animate:false,human:false});
  register('heroic man|young man|old man|rich man|poor man|blind man|deaf man|young woman|old woman',['people'],['human','animate'],{animate:true,human:true});
  for(const h of ['teacher','student','pupil','professor','lecturer'])heads[h].categories=unique(heads[h].categories.concat('education'));
  for(const h of ['house','home','room','bedroom','bathroom','kitchen','courtyard','attic','mansion','hut','cottage','apartment','flat'])heads[h].categories=unique(heads[h].categories.concat('home'));
  for(const h of ['road','street','bridge','port','harbour','harbor','station','airport'])heads[h].categories=unique(heads[h].categories.concat('travel'));
  const topicMap={'Animals':['animals'],'Mammals':['animals'],'Birds':['animals'],'Insects':['animals'],'Reptiles':['animals'],'Fish':['animals'],'Plants':['plants'],'Trees':['plants'],'Flowers':['plants'],'Fruits':['produce'],'Vegetables':['produce'],'Root vegetables':['produce'],'Food and drink':['food'],'Foods':['food'],'Beverages':['food'],'Natural materials':['materials'],'Metals':['materials'],'Chemical elements':['materials'],'Tools':['tools'],'Buildings':['construction','places'],'Occupations':['work','people'],'Family':['family','people'],'Body':['anatomy'],'Body parts':['anatomy'],'Clothing':['clothing'],'Books':['education','communication'],'Linguistics':['communication'],'Languages':['communication'],'Card games':['culture'],'Geography':['geography'],'Transport':['travel'],'Vehicles':['travel'],'Months':['time'],'Days of the week':['time'],'Units of measure':['quantities'],'Numbers':['numbers'],'Colors':['appearance']};
  const contextual={
    'wood, timber':'wood','physique, body, build, frame':'physique','order, instruction':'order','spades, symbol ♠.':'spades',
    'house, home':'house','building, place':'building','desire, wish, love':'desire','newspaper, newsletter, bulletin':'newspaper',
    'freedom, liberation, independence':'freedom','command, order, instruction, direction':'order','chairperson':'chairperson',
    'mansion, a large building':'mansion','officer; bureaucrat':'officer','newswriter, journalist':'journalist'
  };
  // Explicit ontology mappings from the source's topical categories. The
  // patterns refer to taxonomic labels, never words occurring in a gloss.
  const sourceTopicGroups=[
    [/^(?:Anatomy|Bodily fluids|Physiology|Organs|Hair|Eye|Skin|Face|Mouth|Feces)$/u,['anatomy']],
    [/^Plant anatomy$/u,['plants']],
    [/^(?:Religion|Sikhism|Hinduism|Islam|Christianity|Buddhism|Jainism|Judaism|Zoroastrianism|Sufism|Mythology|Afterlife|Monasticism|God|Gods|Occult|Astrology|Burial|Mythological creatures)$/u,['culture']],
    [/^(?:Female family members|Male family members|Family members|Marriage|Love)$/u,['family']],
    [/^(?:People|Women|Male people|Female people|Ethnonyms|Demonyms|Heads of state)$/u,['people']],
    [/^(?:Healthcare occupations|Legal occupations|Military ranks)$/u,['work','people']],
    [/^(?:Grammar|Gurmukhi letter names|Writing|Typography|Punctuation marks|Diacritical marks|Lexicography|Semantics|Orthography|Tenses|Language|Talking|Communication|Rhetoric|Journalism|Dictionaries|Reference works|Newspapers)$/u,['communication']],
    [/^(?:Landforms|Bodies of water|Administrative divisions|Places|Housing|Places of worship|National capitals|Cities(?: in .+)?|Places in .+|States of .+|Polities|Prison|India|Texas, USA|Seoul|Islamabad)$/u,['geography','places']],
    [/^(?:Astronomy|Sun|Nature|Natural resources|Water|Fire|Light|Combustion)$/u,['nature']],
    [/^(?:Weather|Rain|Wind|Temperature|Clouds|Atmospheric phenomena|Climatology)$/u,['weather']],
    [/^(?:Time|Seasons|Calendar|Timekeeping|Age|(?:Hindu lunar|Nanakshahi|Islamic) calendar months)$/u,['time']],
    [/^(?:Fabrics|Jewelry|Headwear|Footwear|Neckwear|Eyewear|Skirts)$/u,['clothing']],
    [/^(?:Gums and resins|Liquids|Gems|Minerals|Woods|Alloys|Alkali metals|Chalcogens|Pnictogens|Gold|Iron|Dyes|Fibers|Hides|Fats and oils|Acids|Paper|Flax)$/u,['materials']],
    [/^(?:Weapons|Swords|Firearms|Explosives|Simple machines|Machines|Pumps|Writing instruments|Cutlery|Horse tack)$/u,['tools']],
    [/^(?:Architecture|Architectural elements|Roads|Walls and fences|Urban studies)$/u,['construction']],
    [/^(?:Food and drink containers|Containers|Furniture|Bedding|Toiletries|Kitchenware|Bags|Clocks|Laundry)$/u,['objects']],
    [/^(?:Breads|Sweets|Grains|Legumes|Nuts|Stone fruits|Pome fruits|Vigna beans|Phaseolus beans|Desserts|Meals|Snacks|Ice cream|Meats|Eggs|Cakes and pastries|Brassicas|Peppers)$/u,['food','produce']],
    [/^(?:Spices|Herbs|Spices and herbs|Condiments|Seasonings|Cooking)$/u,['kitchen']],
    [/^(?:Dairy products|Milk|Alcoholic beverages|Beverages)$/u,['food']],
    [/^(?:Disease|Diseases|Pathology|Medicine|Medical signs and symptoms|Pain|Disability|Sleep|Healthcare|Pharmacology|Pharmacy|Oncology|Diets|Pregnancy)$/u,['medical','health']],
    [/^(?:Emotions|Fear|Hatred|Personality|Human behaviour|Philanthropy)$/u,['emotions','personality']],
    [/^(?:Thinking|Mind|Psychology|Philosophy|Logic)$/u,['opinions','abstract']],
    [/^(?:Law|Politics|Government|Monarchy|Military|War|Crime|Murder|Violence|Law enforcement|Society|Forms of government|Ideologies|Socialism|Communism|Marxism|Capitalism|Imperialism|Feudalism|Maoism|Indian politics|Anthropology|Human migration)$/u,['society']],
    [/^(?:Finance|Money|Banking|Economics|Currency|Business|Insurance)$/u,['business','shopping']],
    [/^(?:Chess|Sports|Racquet sports|Martial arts|Playground games|Ball games|Athletes|Exercise|Equestrianism|Archery|Gymnastics|Yoga)$/u,['sport']],
    [/^(?:Music|Musical instruments|Musical genres|String instruments|Percussion instruments|Film|Literature|Poetry|Narratology|Art|Dances|Theater|Comedy|Drama|Board games|Dice games|Games|Entertainment|Heraldry)$/u,['culture']],
    [/^(?:Christmas|Festivals|Holidays|Parties)$/u,['celebrations']],
    [/^(?:Vehicles|Travel|Rail transportation|Aircraft|Aviation|Watercraft|Nautical)$/u,['travel']],
    [/^(?:Telephony|Telecommunications|Electronics|Electricity|Computer science|Computing|Television|Social media|Media)$/u,['technology']],
    [/^(?:Mathematics|Geometry|Statistics|Shapes|Units of measure|SI units|Four)$/u,['quantities','numbers']],
    [/^(?:Education|Sciences|Physics|Chemistry|Biology|Applied sciences|Engineering|Optics|Electromagnetism|Particle physics|Proteins|Enzymes|Beekeeping|Agriculture|Horticulture|Weaving|Crafts|Botany|Zoology)$/u,['education']],
    [/^(?:.* (?:family|subfamily|tribe|order|genus) plants|Conifers|Grasses|Shrubs|Succulents|Oaks|Fig trees|Palm trees|Bamboos|Mushrooms|Cacti|Crucifers|Alliums|Thistles|Nightshades|Poppies|Spurges|Sedges|Amaranths and goosefoots|Composites|Solanums)$/u,['plants']],
    [/^(?:Mammals|Reptiles|Fish|Insects|Snakes|Female animals|Male animals|Baby animals|Fowls|Starlings|Camelids|Bovines|Herons|Goats|Primates|Foxes|Pigs|Cats|Rodents|Chickens|Cranes \(birds\)|Shrikes|Gulls|Ursids|Horses|Panthers|Columbids|Dogs|Sheep|Anurans|Even-toed ungulates|Cuckoos|Kites \(birds\)|Hoopoes and hornbills|Vultures|Bats|Plovers and lapwings|Antelopes|Owls|Pipits and wagtails|Lizards|Carnivores|Arthropods|Cattle|Parrots|Equids|Freshwater birds|Terns|Muscicapids|Cyprinids|Mollusks|Ratites|Wolves|Butterflies|Falconids|Crickets and grasshoppers|Vespids|Dipterans|Rallids|Seabirds|Piciforms|Thrushes|Kingfishers|Suboscines|Warblers|Coraciiforms|Storks|True bugs|Beetles|Lagomorphs|Cervids|Corvids|Crustaceans|Erinaceids|Arachnids|Birds of prey)$/u,['animals']]
  ];
  function sourceTopicCategories(topic){return topicMap[topic]||sourceTopicGroups.find(([pattern])=>pattern.test(topic))?.[1]||[];}
  const adjectiveHeads=Object.create(null);
  // Preserve limiting dictionary contexts before a generic adjective head
  // authorizes a modifier. These exact sense mappings distinguish explanatory
  // contrasts from restrictions; unfamiliar contexts remain unresolved.
  const modifierContextRules={
    'en-ਔਖਾ-pa-adj-760Xpzrp':{status:'supported',kind:'explanatory-contrast'},
    'en-ਹੌਲ਼ਾ-pa-adj-QmsDokQc':{status:'supported',kind:'explanatory-contrast',gloss:'light'},
    'en-ਕਰਾਰਾ-pa-adj-~6F6uCi3':{status:'unresolved-target',targets:['blow'],reason:'The source restricts this severe/deep sense to a blow; no reviewed blow target class is available.'},
    'en-ਕੋਰਾ-pa-adj-D2cyBcCt':{status:'unresolved-target',targets:['unused-earthen-pot'],reason:'The source restricts this new/unused sense to an earthen pot; generic containers do not establish material or use history.'},
    'en-ਕੋਰਾ-pa-adj-9tq4uL-u':{status:'unresolved-target',targets:['unwashed-unbleached-cloth'],reason:'The source restricts this new sense to cloth not yet washed or bleached; generic physical objects or wearables do not establish that context.'},
    'en-ਖਸਤਾ-pa-adj-hbULCmtJ':{status:'unresolved-target',targets:['condition-state'],reason:'The source specifies a poor/miserable condition; the current generic human/animal targets do not establish this condition sense.'},
    'en-ਗੂੜ੍ਹਾ-pa-adj-5rtWib7s':{status:'unresolved-target',targets:['colour'],reason:'The source restricts this dark sense to colour; a reviewed colour complement construction is required.'},
    'en-ਗੋਰਾ-pa-adj-pBHVRr2o':{status:'supported',targets:['cattle'],gloss:'brown'},
    'en-ਗੱਭਣ-pa-adj-qxsj40JQ':{status:'unresolved-target',targets:['pregnancy-compatible-animal'],reason:'The source particularly describes pregnant animals; grammatical gender alone does not establish biological or reproductive compatibility.'},
    'en-ਧੂੰਆਂਧਾਰ-pa-adj-LOF3Neso':{status:'supported',targets:['rain'],gloss:'heavy'},
    'en-ਫਿੱਕਾ-pa-adj-~CwllZzL':{status:'supported',targets:['human'],gloss:'aloof',modifierKind:'state'},
    'en-ਮਾੜਾ-pa-adj-in3iW05u':{status:'supported',targets:['physical-object'],gloss:'bad'},
    'en-ਮਾੜਾ-pa-adj-lnR3OS4C':{status:'supported',targets:['human'],gloss:'poor'},
    'en-ਮਿੱਠਾ-pa-adj-iZ-216Yu':{status:'supported',targets:['edible','drinkable'],gloss:'sweet'},
    'en-ਲਾਖਾ-pa-adj-~ee8V8~O':{status:'supported',targets:['human'],gloss:'dark-complexioned',modifierKind:'state'},
    'en-ਲਾਖਾ-pa-adj-U0cRpHnc':{status:'supported',targets:['horse'],gloss:'black'}
  };
  function sourceModifierContext(sense,evidence,pos){
    if(pos!=='adjective'||!evidence)return null;
    const context=/[()]/.test(sense.english)||list(sense.qualifiers).length||/\b(?:for|of|used in|used with|especially|chiefly|only|in relation to|black-skinned|dark-complexioned)\b/.test(sense.english)||list(sense.tags).includes('figuratively');
    if(!context)return null;
    const rule=modifierContextRules[sense.sourceSenseId]||{status:'unresolved-target',targets:['source-context-review-required'],reason:'The limiting or figurative source context has no reviewed modifier-target mapping.'};
    return {...rule,method:'exact-source-sense-modifier-context',sourceSenseId:sense.sourceSenseId,definition:sense.english,qualifiers:list(sense.qualifiers).slice(),nativeReviewed:false};
  }
  function adjective(words,kind,targets,categories){for(const word of words.split('|'))adjectiveHeads[word]={kind,targets,categories};}
  adjective('new|old|big|large|small|little|clean|dirty|filthy|heavy|light|long|short|wide|broad|narrow|thin|thick|tall|high|low|deep|shallow|flat|round|straight|crooked|soft|hard|solid|rough|smooth|wet|dry|moist|damp|empty|full|broken|fresh|raw|ripe|unripe|hot|warm|cold|cool|lukewarm|bitter|sweet|sour|salty|black|white|red|blue|green|yellow|brown|grey|gray|pink|purple|violet|orange|golden|bright|dark','physical',['physical-object'],['descriptions','appearance']);
  adjective('good|bad|useful|useless|beautiful|expensive|cheap|priceless|valuable|invaluable|common|rare|ordinary|strange|wonderful|easy|difficult|complete|incomplete','evaluation',['physical-object','human','abstract'],['descriptions']);
  adjective('happy|sad|angry|afraid|tired|hungry|thirsty|ready|alone|young|blind|deaf|sick|ill|healthy|naked|pregnant|married|unmarried|rich|poor','state',['human','animal'],['emotions','health']);
  adjective('honest|dishonest|kind|gentle|cruel|brave|cowardly|clever|intelligent|wise|foolish|stupid|polite|rude|lazy|active|generous|selfish|greedy|humble|proud|arrogant|patient|impatient|innocent|guilty|obstinate|cantankerous|quarrelsome|silent','personality',['human'],['personality']);
  for(const h of Object.keys(adjectiveHeads))if(adjectiveHeads[h].kind==='physical')adjectiveHeads[h].categories=['descriptions'];
  for(const h of 'black|white|red|blue|green|yellow|brown|grey|gray|pink|purple|violet|orange|golden'.split('|'))adjectiveHeads[h].categories=['colors'];
  topicMap.Colors=['colors'];
  const adverbMappings={
    'today':['WHEN','today',['present','past','future']], 'tomorrow':['WHEN','tomorrow',['future']], 'yesterday':['WHEN','yesterday',['past']],
    'day after tomorrow':['WHEN','the day after tomorrow',['future']], 'day before yesterday':['WHEN','the day before yesterday',['past']],
    'last year':['WHEN','last year',['past']], 'the year before last':['WHEN','the year before last',['past']],
    'now, at present, currently':['WHEN','now',['present']], 'this time':['WHEN','this time',['present','past','future']],
    'nowadays, these days':['WHEN','nowadays',['present']], 'often, frequently':['WHEN','often',['present','past']],
    'daily, every day, regularly':['WHEN','every day',['present','past','future']], 'every day, daily':['WHEN','every day',['present','past','future']],
    'always, constantly, continually, ever':['WHEN','always',['present','past']], 'always, ever, for ever':['WHEN','always',['present','past']],
    'perpetually, constantly, continually':['WHEN','continually',['present','past']], 'perpetually, incessantly':['WHEN','continually',['present','past']],
    'shortly, soon':['WHEN','soon',['future']], 'on that day':['WHEN','on that day',['past','future']], 'that day, on that day':['WHEN','on that day',['past','future']],
    'then':['WHEN','then',['past','future']], 'in the morning':['WHEN','in the morning',['present','past','future']], 'at dawn':['WHEN','at dawn',['present','past','future']],
    'in the past':['WHEN','in the past',['past']], 'previously, earlier, before':['WHEN','previously',['past']],
    'later, afterwards, after':['WHEN','later',['past','future']], 'after, later, subsequently':['WHEN','later',['past','future']],
    'later, in future':['WHEN','later',['future']], 'for the time being, (as of) now, currently':['WHEN','for now',['present']],
    'yet; still; for now.':['WHEN','for now',['present']],
    'quickly, rapidly, hastily':['HOW','quickly'], 'quickly, hastily':['HOW','quickly'], 'quickly, at once':['HOW','quickly'],
    'fast, swiftly':['HOW','quickly'], 'carefully, cautiously, quietly':['HOW','carefully'],
    'well':['HOW','well'], 'separately; apart.':['HOW','separately'], 'alone, solo':['HOW','alone'],
    'suddenly, all of a sudden':['HOW','suddenly'], 'irregularly, haphazardly; improperly':['HOW','irregularly'],
    'temporarily, for the time being':['HOW','temporarily'], 'face to face':['HOW','face to face'],
    'orally, by word of mouth; from memory':['HOW','orally'], 'in cash':['HOW','in cash'],
    'for nothing, purposelessly':['WHY','for no reason'], 'under compulsion, under duress':['WHY','under compulsion'],
    'here':['WHERE','here'], 'there':['WHERE','there'], 'somewhere':['WHERE','somewhere'],
    'on the ground; on the floor':['WHERE','on the ground']
  };
  const englishCountHeads=new Set(('person|human|man|woman|boy|girl|child|adult|baby|infant|youth|friend|guest|visitor|neighbour|neighbor|farmer|teacher|student|doctor|nurse|engineer|worker|family member|book|newspaper|newsletter|bulletin|magazine|letter|document|report|poem|story|tale|novel|essay|article|dictionary|notebook|pen|pencil|house|home|room|bedroom|bathroom|kitchen|courtyard|attic|mansion|palace|hut|cottage|apartment|flat|building|school|college|university|library|hospital|clinic|office|shop|market|station|airport|hotel|hostel|restaurant|temple|mosque|church|gurdwara|village|town|city|country|park|garden|farm|field|forest|road|street|bridge|port|mountain|hill|valley|river|lake|sea|ocean|island|desert|plain|plateau|coast|shore|beach|continent|region|district|province|territory|waterfall|stream|pond|canal|well|cave|cliff|peak|tree|plant|flower|leaf|root|seed|branch|stem|bush|shrub|rose|lotus|animal|bird|fish|insect|cat|dog|horse|cow|bull|buffalo|goat|sheep|camel|elephant|lion|tiger|bear|wolf|fox|monkey|donkey|deer|rabbit|pig|snake|python|eagle|sparrow|crow|pigeon|parrot|peacock|hen|duck|owl|crane|ant|bee|butterfly|spider|scorpion|worm|mango|potato|peach|banana|cucumber|carrot|tomato|apple|orange|pear|guava|pineapple|lemon|onion|eggplant|radish|turnip|cabbage|pea|bean|lentil|chickpea|egg|cake|biscuit|cookie|sandwich|hammer|saw|axe|spade|shovel|hoe|plough|sickle|drill|chisel|screwdriver|wrench|needle|razor|knife|blade|tool|instrument|lever|pulley|rope|chain|nail|screw|bolt|lock|key|wall|roof|floor|ceiling|door|window|gate|stair|staircase|pillar|column|beam|foundation|fence|barrier|tunnel|dam|shirt|dress|skirt|coat|turban|hat|cap|shoe|sock|scarf|shawl|sari|kurta|sweater|jacket|vest|belt|glove|veil|uniform|bracelet|necklace|ring|earring|bangle|table|chair|bed|sofa|stool|bench|cup|plate|bowl|pot|pan|bottle|bucket|basket|box|bag|sack|container|jar|jug|vase|lamp|candle|mirror|clock|watch|comb|brush|towel|blanket|pillow|mattress|curtain|carpet|mat|fan|umbrella|toy|ball|broom|dustbin|bin|utensil|spoon|fork|dish|kettle|tray|object|item|thing|incense stick|car|bus|train|bicycle|motorcycle|scooter|rickshaw|cart|wagon|truck|boat|ship|airplane|aeroplane|aircraft|helicopter|vehicle|ticket|passport|journey|computer|phone|telephone|screen|keyboard|camera|battery|coin|rupee|price|payment|wallet|purchase|sale|wage|salary|loan|company|contract|body|head|eye|ear|nose|mouth|tooth|tongue|hand|arm|leg|foot|finger|thumb|toe|bone|heart|stomach|face|neck|shoulder|chest|back|waist|hip|knee|elbow|wrist|ankle|palm|forehead|chin|cheek|lip|eyebrow|beard|brain|lung|liver|kidney|muscle|nerve|breast|navel|skeleton|physique|order|instruction|command|question|answer|reply|request|message|word|sentence|phrase|syllable|vowel|consonant|noun|verb|pronoun|reason|cause|effect|result|consequence|condition|purpose|number|quantity|amount|measurement|piece|fraction|idea|thought|concept|quality|possibility|relationship|belief|opinion|decision|estimate|guess|problem|solution|difficulty|mistake|error|achievement|goal|plan|intention|brick|chemical|star|cloud|storm|rainbow').split('|'));
  const englishMassHeads=new Set('wood|timber|sand|soil|clay|mud|iron|steel|copper|brass|bronze|gold|silver|aluminium|lead|mercury|plastic|rubber|leather|wool|silk|cement|concrete|coal|charcoal|petroleum|oil|petrol|gasoline|diesel|fuel|wax|resin|ash|dust|smoke|steam|oxygen|hydrogen|nitrogen|carbon|sugar|honey|meat|cheese|rice|flour|butter|yogurt|yoghurt|curd|cream|ghee|food|milk|tea|coffee|water|juice|lemonade|buttermilk|lassi|wine|beer|money|cash|wealth|work|furniture|clothing|jewelry|jewellery|equipment|luggage|information|news|knowledge|education|music|literature|poetry|health|illness|pain|love|happiness|anger|fear|rain|snow|wind|heat|cold|darkness|light|fire|weather|freedom|justice|authority|power|intelligence|wisdom|politeness|respect|kindness'.split('|'));
  // Bounded object affordances for the reviewed transitive predicate senses.
  // These match complete source definition heads, not broad materials or
  // browsing topics. Shared requirements use their safe intersection: seed
  // works for both sow/water, and wipe/clean share physical surfaces.
  const objectAffordances={
    cuttable:{heads:new Set('wood|timber|paper|cloth|rope|string|cord'.split('|')),verbs:['cut'],scope:'Cuttable non-metal solid materials and fibres; never liquids or anatomical senses.'},
    diggable:{heads:new Set('soil|earth|ground|land|field'.split('|')),verbs:['dig'],scope:'Physical ground or cultivated field; excludes the planet Earth and abstract fields.'},
    'countable-object':{heads:new Set('book|coin|apple|mango|potato|carrot|onion|egg|chair|table|cup|plate|bowl|bottle|pen|pencil|seed|shirt|hat|shoe|sock|brick|key|button'.split('|')),verbs:['count'],scope:'Discrete physical items for enumeration; independent of Punjabi grammatical countability.',compatibilityAlias:'countable'},
    repairable:{heads:new Set('cloth|garment|shirt|trousers|pants|dress|skirt|coat|scarf|shawl|sari|saree|salwar|kameez|kurta|sock|socks|turban|blanket|curtain|rope'.split('|')),verbs:['repair'],scope:'Mendable textile garments/fabrics or rope; does not authorize arbitrary machines, bodies or abstractions.'},
    cleanable:{heads:new Set('floor|table|chair|window|mirror|cup|plate|bowl|glass'.split('|')),verbs:['wipe','clean'],scope:'Wipeable physical surfaces or household vessels; never an abstract table, whole room or person.'},
    plantable:{heads:new Set(['seed']),verbs:['sow','water'],scope:'Seed as the shared supported object of sowing/watering; trees and seedlings await predicate-specific constraints.'}
  };
  function affordancesFor(sense,description,source){
    if(!source||!description||description.method!=='exact-sense-definition-head')return [];
    const choices=String(sense.english||'').split(/[,;]/).map(v=>v.trim().replace(/\([^)]*\)/g,'').trim()).filter(Boolean);
    return Object.entries(objectAffordances).filter(([tag,rule])=>rule.heads.has(description.head)&&(!(tag==='diggable')||choices.every(choice=>choice!=='Earth'&&rule.heads.has(key(choice))))).map(([tag,rule])=>({tag,verbs:rule.verbs,scope:rule.scope,compatibilityAlias:rule.compatibilityAlias||null,head:description.head,method:'reviewed-source-definition-head-object-affordance',sourceSenseId:sense.sourceSenseId,nativeReviewed:false}));
  }
  englishCountHeads.add('language');
  const weekdays=new Set('monday|tuesday|wednesday|thursday|friday|saturday|sunday'.split('|'));
  const calendarPeriods=new Set('january|february|march|april|may|june|july|august|september|october|november|december|spring|summer|autumn|winter'.split('|'));
  function categoryClosure(ids){const output=unique(ids);for(let i=0;i<output.length;i++){const parent=learning&&learning.categories&&learning.categories[output[i]]&&learning.categories[output[i]].parentId;if(parent&&!output.includes(parent))output.push(parent);}return output;}
  function descriptor(sense,evidence,pos){
    const english=sense.english||'',clause=english.replace(/\([^)]*\)/g,'').split(/[;,]/)[0].trim();
    if(pos==='adjective'){
      const property=adjectiveHeads[key(clause)];
      return property?{head:key(clause),definition:{categories:property.categories,semanticTags:['property'],modifierTargets:property.targets,modifierKind:property.kind},method:'reviewed-adjective-definition-head'}:{head:null,definition:{categories:['descriptions'],semanticTags:['property']},method:'source-part-of-speech;semantic-context-unresolved'};
    }
    if(pos==='adverb'||pos==='phrase'){
      const mapping=adverbMappings[english];
      if(mapping)return {head:null,definition:{categories:[{WHEN:'time',WHERE:'places',HOW:'activities',WHY:'causality'}[mapping[0]]],semanticTags:[{WHEN:'temporal',WHERE:'locative',HOW:'manner',WHY:'causal'}[mapping[0]]],adverbMapping:mapping},method:'exact-source-adverb-sense'};
    }
    const whole=heads[key(clause)];
    if(whole)return {head:key(clause),definition:whole,method:'exact-sense-definition-head'};
    // Only an explicit definition hypernym can grant a classification. Merely
    // containing e.g. "body" in a longer sentence does not match this pattern.
    const hypernym=clause.match(/^(?:(?:a|an|the) )?(?:(?:kind|type|species|form) of )?([a-z -]+?)(?: that | which | who | used | with | for | of |,|$)/i);
    if(hypernym&&heads[key(hypernym[1])])return {head:key(hypernym[1]),definition:heads[key(hypernym[1])],method:'explicit-definition-hypernym'};
    if(pos==='verb')return {head:null,definition:{categories:['actions'],semanticTags:['action']},method:'source-part-of-speech'};
    if(pos==='numeral')return {head:null,definition:{categories:['numbers'],semanticTags:['quantity']},method:'source-part-of-speech'};
    if(['pronoun','postposition','preposition','conjunction','particle','determiner'].includes(pos))return {head:null,definition:{categories:['functional'],semanticTags:[]},method:'source-part-of-speech'};
    return null;
  }
  function sourceForms(evidence,sense){const source=evidence&&evidence.senses[sense.dictionarySenseId||sense.id];return source?list(evidence.formSets[source.formSet]):[];}
  function formCell(forms,tags){const candidates=forms.filter(f=>tags.every(t=>f.tags.includes(t))&&!f.tags.includes('vocative'));const distinct=unique(candidates.map(f=>f.g+'\0'+f.p));return distinct.length===1?candidates[0]:null;}
  function enrich(entry){
    const result=Object.assign({},entry),id=entry.primaryId||String(entry.id||'').replace(/^lex:/,'');
    const categoryBaseline=authoredBaselines&&authoredBaselines.entries&&authoredBaselines.entries[id];
    const originalAuthoredIdentity=!entry.importedDataset&&!(sourceEvidence&&sourceEvidence.entries&&sourceEvidence.entries[id])&&categoryBaseline&&fingerprint(entry)===categoryBaseline.fingerprint&&!list(entry.userModifiedLexicalFields).length;
    const originalVerbRole=list(entry.authoredRoles).some(r=>['VERB','VERBS'].includes(r));
    const personCells=['1sg','2sg','3sg','1pl','2pl','3pl'];
    const preservedAuthoredVerb=!!(originalAuthoredIdentity&&originalVerbRole&&entry.partOfSpeech==='verb'&&entry.root&&entry.gScript&&entry.gScript.root&&personCells.every(person=>typeof(entry.forms&&entry.forms[person])==='string'&&entry.forms[person].trim()&&typeof(entry.gScript.forms&&entry.gScript.forms[person])==='string'&&entry.gScript.forms[person].trim()));
    const preservedAuthoredPronoun=!!(originalAuthoredIdentity&&list(entry.authoredRoles).includes('WHO')&&entry.partOfSpeech==='pronoun'&&personCells.includes(entry.person)&&['sg','pl'].includes(entry.number)&&entry.person.endsWith(entry.number));
    let stored=sourceEvidence&&sourceEvidence.entries&&sourceEvidence.entries[entry.dictionaryEntryId||id];
    let dictionaryEntryId=stored?entry.dictionaryEntryId||id:null;
    if(!stored){
      // The central registry merges exact lexical duplicates into existing
      // canonical IDs. Source evidence follows that alias without renumbering
      // either the canonical entry or its already-stable legacy sense.
      const candidate=evidenceByIdentity.get([entry.g,entry.p,entry.partOfSpeech].join('\0'));
      const dictionarySource=list(entry.sources).concat(entry.source||[]).some(s=>s&&/^https:\/\/en\.wiktionary\.org\/wiki\//.test(s.url||''));
      if(candidate&&dictionarySource&&Object.values(candidate.entry.senses).some(s=>key(s.english)===key(entry.e))){stored=candidate.entry;dictionaryEntryId=candidate.id;}
    }
    const evidence=stored&&stored.g===entry.g&&stored.p===entry.p&&stored.partOfSpeech===entry.partOfSpeech?stored:null;
    const senses=semantics.normalizeSenses(entry).map(source=>{
      const sense=Object.assign({},source);
      let ev=evidence&&evidence.senses[sense.dictionarySenseId||sense.id];
      if(!ev&&evidence){const matched=Object.entries(evidence.senses).filter(([,s])=>key(s.english)===key(sense.english));if(matched.length===1){sense.dictionarySenseId=matched[0][0];ev=matched[0][1];sense.sourceSenseId=ev.sourceSenseId;}}
      // Dictionary definition and an editor's display translation remain
      // distinct. The canonical e/meanings fields are never overwritten.
      if(ev){sense.english=ev.english;sense.tags=unique(list(source.tags).concat(ev.tags||[]));}
      const d=descriptor(sense,ev,entry.partOfSpeech);
      const exactTopics=list(ev&&ev.topics).filter(t=>(!t.disambiguation||t.disambiguation==='100')&&sourceTopicCategories(t.name).length);
      const restricted=/\b(?:form of|plural of|singular of|spelling of|stem of)\b/i.test(sense.english)||list(sense.tags).some(t=>['in-compounds','in-plural','participle','suffix'].includes(t));
      const cats=d?d.definition.categories:[];
      sense.categories=categoryClosure(unique(cats.concat(exactTopics.flatMap(t=>sourceTopicCategories(t.name)))));
      if(!sense.categories.length)sense.categories=['general'];
      sense.semanticTags=unique(list(source.semanticTags).concat(d?d.definition.semanticTags:[],semantics.normalizeSenses(entry).length===1?list(entry.semanticTags):[]));
      if(sense.semanticTags.some(t=>['concrete','material','plant','animal','tool','structure','transport','technology'].includes(t)))sense.semanticTags=unique(sense.semanticTags.concat('physical-object'));
      sense.semanticProperties=d?Object.assign({},d.definition,{categories:undefined,semanticTags:undefined}):{};
      if(d&&['baby','infant'].includes(d.head))sense.semanticProperties.ageClass='infant';
      if(d&&['cup','glass','plate','bowl','pot','pan','bottle','bucket','basket','box','bag','sack','container','jar','jug','vase','cupboard','kettle','tray'].includes(d.head))sense.semanticTags=unique(sense.semanticTags.concat('container'));
      if(sense.semanticTags.includes('place'))sense.semanticTags=unique(sense.semanticTags.concat('physical-object','space'));
      if(entry.partOfSpeech==='noun'&&ev&&d&&d.method==='exact-sense-definition-head'){
        if(d.head==='rain')sense.semanticTags=unique(sense.semanticTags.concat('rain'));
        if(['cow','bull','calf'].includes(d.head))sense.semanticTags=unique(sense.semanticTags.concat('cattle'));
        if(d.head==='horse')sense.semanticTags=unique(sense.semanticTags.concat('horse'));
      }
      if(d&&englishCountHeads.has(d.head)&&sense.semanticTags.some(t=>['readable','tool','wearable'].includes(t)))sense.semanticTags=unique(sense.semanticTags.concat('loanable'));
      const affordances=entry.partOfSpeech==='noun'?affordancesFor(sense,d,ev):[];
      sense.objectCompatibilityEvidence=affordances;
      sense.semanticTags=unique(sense.semanticTags.concat(affordances.flatMap(a=>[a.tag,a.compatibilityAlias].filter(Boolean))));
      const tags=list(sense.tags),gender=tags.includes('masculine')&&!tags.includes('feminine')?'m':tags.includes('feminine')&&!tags.includes('masculine')?'f':null;
      sense.gender=gender||entry.gender||null;
      sense.countability=tags.includes('uncountable')?'uncountable':tags.includes('countable')?'countable':null;
      sense.englishCountability=d&&englishCountHeads.has(d.head)?'countable':d&&englishMassHeads.has(d.head)?'uncountable':null;
      sense.englishCountabilityEvidence=sense.englishCountability?{method:'reviewed-English-definition-head',head:d.head,scope:'English article rendering only; does not verify Punjabi countability.'}:null;
      sense.number=!stored&&entry.number?entry.number:tags.includes('plural-normally')||tags.includes('plural')?'pl':entry.partOfSpeech==='noun'?'sg':entry.number||null;
      if(d&&d.definition.modifierTargets){sense.modifierTargets=d.definition.modifierTargets;sense.modifierKind=d.definition.modifierKind;}
      if(d&&['sweet','bitter','sour','salty','raw','ripe','unripe'].includes(d.head))sense.modifierTargets=['edible','drinkable'];
      if(d&&['empty','full'].includes(d.head))sense.modifierTargets=['container','space'];
      const modifierContext=sourceModifierContext(sense,ev,entry.partOfSpeech);
      if(modifierContext){sense.modifierRestriction=modifierContext;if(modifierContext.targets)sense.modifierTargets=modifierContext.targets.slice();if(modifierContext.modifierKind)sense.modifierKind=modifierContext.modifierKind;}
      const concise=semantics.conciseGloss(sense.english,entry);
      const headLinks=list(ev&&ev.links).map(key);
      const authored=contextual[sense.english];
      // A dictionary-linked definition head is a particular English lexical
      // choice. We require both definition structure and an actual source
      // link; arbitrary comma-separated first text never supplies a gloss.
      sense.contextualGloss=source.contextualGloss||authored||(d&&d.definition.adverbMapping?d.definition.adverbMapping[1]:null)||concise||(d&&d.method!=='explicit-definition-hypernym'&&d.head&&headLinks.includes(d.head)?d.head:null);
      if(modifierContext&&modifierContext.gloss)sense.contextualGloss=modifierContext.gloss;
      const legacyPredicate=!/^wt-pa-/.test(id)&&entry.partOfSpeech==='verb'&&entry.root&&entry.forms&&entry.gScript&&(entry.verifiedGrammar!==false||preservedAuthoredVerb)&&semantics.authoredPredicateMeaning&&semantics.authoredPredicateMeaning(entry,sense);
      if(legacyPredicate){sense.contextualGloss=legacyPredicate;sense.contextualMeaningEvidence={method:'authored-predicate-base-matches-complete-definition-alternative',base:entry.base,nativeReviewed:false};}
      const verbSense=list(entry.eligibleSenses).find(s=>typeof s==='string'?s===sense.id:s.senseId===sense.id);
      if(entry.partOfSpeech==='verb'&&verbSense){
        const base=verbSense.base||entry.base;sense.contextualGloss='to '+base;
        if(['walk','run','jump','crawl','swim','go','come','arrive','return','depart','rise','stand','sit','sit down','climb','fall','stroll','wander','roam'].includes(base)){sense.categories=categoryClosure(sense.categories.concat('movement'));sense.semanticTags=unique(sense.semanticTags.concat('motion'));}
      }
      if(sense.english==='order, instruction')sense.semanticTags=unique(sense.semanticTags.concat('directive','giveable'));
      sense.classification={status:d&&!d.method.includes('unresolved')||exactTopics.length?ev?'source-supported':'authored-assessed':'unresolved',categoryStatus:sense.categories.some(c=>c!=='general')?'supported':'unresolved',method:d&&d.method||'source-topic',head:d&&d.head||null,evidence:{sourceSenseId:sense.sourceSenseId||null,definition:sense.english,unambiguousTopics:exactTopics.map(t=>t.name)}};
      const humanReview=source.verification&&source.verification.fluentSpeakerReview;
      const nativeReviewed=!!(humanReview&&humanReview.status==='reviewed'&&humanReview.reviewer&&humanReview.reviewedAt);
      sense.verification={sourceSupported:!!ev,nativeReviewed,fluentSpeakerReview:nativeReviewed?clone(humanReview):null,status:ev?'snapshot-aligned;fluent-review-pending':'authored-or-user-data;fluent-review-pending'};
      sense.sourceForms=clone(sourceForms(evidence,sense));
      sense.compatibleRoles=[];
      sense.sentenceEligible=!restricted&&!!sense.contextualGloss&&!(modifierContext&&modifierContext.status==='unresolved-target');
      sense.restrictionReason=modifierContext&&modifierContext.status==='unresolved-target'?modifierContext.reason:restricted?'Inflected, alternative or construction-restricted dictionary sense requires a separate lexical review.':!sense.contextualGloss?'Dictionary definition lacks an unambiguous concise contextual rendering.':null;
      return sense;
    });
    result.senses=senses;
    if(evidence)result.dictionaryEntryId=dictionaryEntryId;
    const imported=!!entry.importedDataset||!!(sourceEvidence&&sourceEvidence.entries&&sourceEvidence.entries[id]);
    const untouchedSeed=categoryBaseline&&fingerprint(entry)===categoryBaseline.fingerprint&&JSON.stringify(list(entry.categories).slice().sort())===JSON.stringify(categoryBaseline.categories);
    const reviewedHead=senses.some(s=>s.classification.head&&s.classification.status!=='unresolved');
    if(!entry.userModifiedCategories&&(imported||untouchedSeed&&reviewedHead)){
      result.categories=unique(senses.flatMap(s=>s.categories));
      if(untouchedSeed&&!imported)result.categoryMigration={status:'corrected-unchanged-authored-default',reference:authoredBaselines.metadata.reference,baselineFingerprint:categoryBaseline.fingerprint};
    }
    result.semanticTags=unique(list(entry.semanticTags).concat(senses.flatMap(s=>s.semanticTags)));
    result.roleEligibility=Object.fromEntries(assessmentRoles.map(role=>[role,{eligible:false,senseIds:[],constructionIds:[],reason:'Required construction metadata is unresolved.',constructionsBySense:{},bindingBySense:{}}]));
    const add=(role,sense,constructionIds,extra)=>{
      const r=result.roleEligibility[role];r.eligible=true;r.senseIds=unique(r.senseIds.concat(sense.id));r.constructionIds=unique(r.constructionIds.concat(constructionIds));r.reason=null;
      if(extra){if(extra.construction)r.constructionsBySense[sense.id]=extra.construction;if(extra.binding)r.bindingBySense[sense.id]=extra.binding;if(!r.construction&&extra.construction)r.construction=extra.construction;if(!r.binding&&extra.binding)r.binding=extra.binding;}sense.compatibleRoles=unique(sense.compatibleRoles.concat(role));
    };
    const nominal=senses.filter(s=>entry.partOfSpeech==='noun'&&s.sentenceEligible&&s.verification.sourceSupported&&['m','f'].includes(s.gender)&&s.number==='sg');
    if(nominal.length){
      const preferred=nominal[0];result.gender=unique(nominal.map(s=>s.gender)).length===1?preferred.gender:entry.gender;result.number='sg';result.verifiedGrammar=true;
      // Direct base noun use does not authorize its plural/oblique or arbitrary
      // action combinations. Nominal description works without edible tags.
      for(const sense of nominal){
        add('WHAT',sense,['nominal-description','nominal-identification','nominal-possession']);
        const properties=sense.semanticProperties;
        if(properties.human===true&&!sense.semanticTags.includes('collective')){sense.person='3sg';sense.englishPerson='3sg';add('WHO',sense,['nominal-subject','human-habitual-subject']);result.person='3sg';result.englishPerson='3sg';}
        const oblique=formCell(sense.sourceForms,['oblique','singular']);
        if(oblique){
          sense.inflections={oblique:oblique.p};sense.gScript={inflections:{oblique:oblique.g}};
          if(sense.id===preferred.id){result.inflections=Object.assign({},entry.inflections,sense.inflections);result.gScript=Object.assign({},entry.gScript,{inflections:sense.gScript.inflections});}
          add('ABOUT',sense,['topic-postposition'],{construction:{type:'postpositional-phrase',case:'oblique',senseId:sense.id,form:{p:oblique.p,g:oblique.g},postposition:{p:'bāre',g:'ਬਾਰੇ',e:'about'},englishPrefix:'about'}});
          if(properties.locative){
            const onSurface=['road','street','island','mountain','hill','coast','shore','beach','bridge'].includes(sense.classification.head);
            add('WHERE',sense,['location-statement','destination'],{construction:{type:'postpositional-phrase',case:'locative',senseId:sense.id,form:{p:oblique.p,g:oblique.g},postposition:onSurface?{p:'te',g:'ਤੇ',e:'on'}:{p:'vich',g:'ਵਿੱਚ',e:'in'},englishPrefix:onSurface?'on':'in',englishArticle:sense.englishCountability==='countable'?'indefinite':null}});
          }
          if(weekdays.has(sense.classification.head)||calendarPeriods.has(sense.classification.head)){
            const day=weekdays.has(sense.classification.head);sense.timeContexts=['present','past','future'];
            add('WHEN',sense,['calendar-postposition'],{construction:{type:'postpositional-phrase',case:'oblique',senseId:sense.id,form:{p:oblique.p,g:oblique.g},postposition:day?{p:'nū̃',g:'ਨੂੰ',e:'on'}:{p:'vich',g:'ਵਿੱਚ',e:'in'},englishPrefix:day?'on':'in'},binding:{timeContexts:sense.timeContexts,time:'any'}});
          }
          if(['fear','illness','disease','pain','love','happiness','anger','rain','cold','heat','storm'].includes(sense.classification.head))add('WHY',sense,['causal-postposition'],{construction:{type:'postpositional-phrase',case:'oblique',senseId:sense.id,form:{p:oblique.p,g:oblique.g},postposition:{p:'karke',g:'ਕਰਕੇ',e:'because of'},englishPrefix:'because of'}});
        }
      }
      result.grammarReview={status:'source-supported-bounded-constructions;native-review-pending',nativeReviewed:false,method:'Explicit source-sense gender and dictionary base form; direct singular nominal constructions. Oblique permission only from one unambiguous matching source declension cell.',scope:'Per-sense direct singular nominal phrases; explicit source obliques where present. Semantic action restrictions remain independent.',references:[{url:reference,sections:'5.4–5.5 noun forms; 8.2 postpositions; 8.5 agreement'}]};
    }
    const verbReady=entry.partOfSpeech==='verb'&&entry.root&&entry.forms&&entry.gScript&&(entry.verifiedGrammar===true||!imported&&(entry.verifiedGrammar!==false||preservedAuthoredVerb)&&senses.some(s=>s.contextualMeaningEvidence));
    if(preservedAuthoredVerb&&verbReady||preservedAuthoredPronoun)result.verifiedGrammar=true;
    if(verbReady)for(const sense of senses.filter(s=>s.sentenceEligible&&(!list(entry.eligibleSenses).length||entry.eligibleSenses.some(v=>typeof v==='string'?v===s.id:v.senseId===s.id)))){
      const profile=list(entry.eligibleSenses).find(v=>typeof v==='string'?v===sense.id:v.senseId===sense.id);
      const binding=profile&&typeof profile==='object'?{base:profile.base,transitive:profile.transitive,takesTags:profile.requiredObjectTags,selectedSenseId:sense.id}:{selectedSenseId:sense.id};
      add('VERB',sense,['habitual-present','progressive'].concat(entry.perfective?'simple-past':[],entry.future?'finite-future':[]),{binding});
    }
    let adjectiveReady=false,adverbReady=false;
    for(const sense of senses){
      if(!sense.verification.sourceSupported||!sense.sentenceEligible)continue;
      if(entry.partOfSpeech==='adjective'&&sense.modifierTargets){
        const cells={m:formCell(sense.sourceForms,['direct','masculine','singular']),f:formCell(sense.sourceForms,['direct','feminine','singular']),pl:formCell(sense.sourceForms,['direct','masculine','plural']),fpl:formCell(sense.sourceForms,['direct','feminine','plural'])};
        const indeclinable=sense.tags.includes('indeclinable');
        if(indeclinable||Object.values(cells).every(Boolean)){
          sense.forms=Object.fromEntries(Object.entries(cells).map(([k,v])=>[k,indeclinable?entry.p:v.p]));
          sense.gScript={forms:Object.fromEntries(Object.entries(cells).map(([k,v])=>[k,indeclinable?entry.g:v.g]))};
          sense.indeclinable=indeclinable;adjectiveReady=true;
          add('ADJECTIVE',sense,['nominal-description','adjectival-agreement'],{binding:{forms:sense.forms,gScript:sense.gScript,modifierTargets:sense.modifierTargets,modifierKind:sense.modifierKind,indeclinable}});
          if(sense.modifierKind==='state'||sense.modifierKind==='personality')add('STATE',sense,['human-state-description'],{binding:{forms:sense.forms,gScript:sense.gScript}});
          if(!result.forms||!result.gScript){result.forms=sense.forms;result.gScript=sense.gScript;result.indeclinable=indeclinable;result.modifierTargets=sense.modifierTargets;result.modifierKind=sense.modifierKind;}
          result.verifiedGrammar=true;
        }
      }
      const mapping=adverbMappings[sense.english];
      if(mapping&&['adverb','phrase'].includes(entry.partOfSpeech)){
        const [role,,timeContexts]=mapping;adverbReady=true;result.verifiedGrammar=true;
        if(timeContexts)sense.timeContexts=timeContexts;
        add(role,sense,[{WHEN:'temporal-adverb',WHERE:'locative-adverb',HOW:'manner-adverb',WHY:'reason-adverb'}[role]],{binding:timeContexts?{timeContexts,time:timeContexts.length===1?timeContexts[0]:'any'}:{}});
      }
    }
    // Preserve original authored role phrases; importing a time/location noun
    // does not grant an adverbial phrase. These phrases have their own grammar.
    if(!imported&&(entry.verifiedGrammar!==false||preservedAuthoredVerb&&verbReady||preservedAuthoredPronoun)){
      for(const authoredRole of list(entry.authoredRoles)){
        const role=authoredRole==='VERBS'?'VERB':authoredRole;
        for(const sense of senses.filter(s=>s.sentenceEligible))if(result.roleEligibility[role]){
          if(preservedAuthoredPronoun){sense.person=entry.person;sense.englishPerson=entry.englishPerson||entry.person;}
          add(role,sense,['authored-construction']);
        }
      }
    }
    const userEdited=list(entry.userModifiedLexicalFields).length>0;
    if(userEdited){result.verifiedGrammar=false;for(const status of Object.values(result.roleEligibility)){status.eligible=false;status.reason='User-edited lexical or grammatical metadata requires construction revalidation.';}}
    const completeGrammar=!userEdited&&(nominal.length>0||!!verbReady||adjectiveReady||adverbReady||assessmentRoles.some(r=>result.roleEligibility[r].eligible));
    const unresolved=[];
    if(userEdited)unresolved.push('User-edited lexical or grammatical metadata requires construction revalidation; the edit remains preserved.');
    if(!evidence&&imported)unresolved.push('Source lexical identity differs from the checksum-aligned evidence; user edits require revalidation.');
    if(!completeGrammar)unresolved.push(entry.partOfSpeech==='verb'?'Conjugation/argument profile not supported.':entry.partOfSpeech==='noun'?'No unrestricted, source-gendered sense with a concise contextual meaning.':'No supported inflection/placement construction profile.');
    if(senses.some(s=>s.classification.status==='unresolved'))unresolved.push('Some senses lack a verified semantic definition head or unambiguous source topic.');
    if(senses.some(s=>!s.contextualGloss))unresolved.push('Some dictionary glosses require contextual translation review.');
    if(senses.some(s=>s.modifierRestriction&&s.modifierRestriction.status==='unresolved-target'))unresolved.push('Some adjective senses have limiting source contexts without supported modifier-target constructions.');
    const hasMorphology=nominal.some(s=>!!formCell(s.sourceForms,['direct','singular'])||!!formCell(s.sourceForms,['oblique','singular']))||adjectiveReady||entry.morphologicalValidation&&entry.morphologicalValidation.status==='source-crosschecked-rule'||!!(entry.grammarReview&&entry.grammarReview.morphologyEvidence)||!!verbReady;
    result.assessment={version:VERSION,assessed:true,method:'Checksum-aligned dictionary senses, exact semantic definition heads, unambiguous source topics and bounded grammar construction rules.',
      dataCompleteness:{status:entry.g&&entry.p&&entry.e&&entry.partOfSpeech?'complete-core':'incomplete',grammar:completeGrammar?'complete-for-supported-constructions':'unresolved',semantics:senses.length>0&&senses.every(s=>['source-supported','authored-assessed'].includes(s.classification.status))?'complete':'partial',fieldsMissing:['gender','number'].filter(f=>entry.partOfSpeech==='noun'&&result[f]==null)},
      schemaValidation:{status:senses.length>0&&new Set(senses.map(s=>s.id)).size===senses.length&&senses.every(s=>s.id&&s.english)?'valid':'invalid'},
      sourceVerification:{status:evidence?'snapshot-aligned':'unresolved',sourceSha256:evidence?sourceEvidence.metadata.sourceSha256:null,matchedSenses:senses.filter(s=>s.verification.sourceSupported).length},
      morphologicalValidation:{status:hasMorphology?'source-cell-or-reference-supported':'direct-base-only-or-unresolved',scope:hasMorphology?'Explicit supported forms only; not all noun declensions or verb tenses.':'No plural or oblique is inferred from spelling.'},
      constructionCompatibility:{status:assessmentRoles.some(r=>result.roleEligibility[r].eligible)?'supported':'restricted',constructionIds:unique(assessmentRoles.flatMap(r=>result.roleEligibility[r].constructionIds)),authoredEvidence:preservedAuthoredVerb&&verbReady||preservedAuthoredPronoun?{method:'preserved-historical-authored-role-and-complete-construction-fields',reference:authoredBaselines.metadata.reference,lexicalFingerprint:categoryBaseline.fingerprint,scope:preservedAuthoredVerb?'Existing authored six-person habitual forms; additional aspects remain dependent on their own supported profiles.':'Existing authored personal pronoun person/number and subject role.',nativeReviewed:false}:null},
      linguisticConfidence:{level:evidence&&completeGrammar?'source-supported-bounded':evidence?'dictionary-supported':'unresolved',limitations:['Independent fluent-speaker verification pending.']},
      fluentSpeakerReview:{status:senses.length>0&&senses.every(s=>s.verification.nativeReviewed)?'reviewed':'pending',reviewer:senses.length>0&&senses.every(s=>s.verification.nativeReviewed)?senses[0].verification.fluentSpeakerReview.reviewer:null},
      sentenceGenerationEligibility:{eligible:assessmentRoles.some(r=>result.roleEligibility[r].eligible),roles:assessmentRoles.filter(r=>result.roleEligibility[r].eligible)},unresolvedReasons:unresolved};
    result.quality=Object.assign({},entry.quality,{grammarEligible:result.assessment.sentenceGenerationEligibility.eligible,nativeReviewed:result.assessment.fluentSpeakerReview.status==='reviewed',topicAssignment:imported?'sense-source-evidence-audited':entry.quality&&entry.quality.topicAssignment||'authored-preserved',assessmentVersion:VERSION});
    return result;
  }
  function enrichCorpus(entries){return list(entries).map(enrich);}
  function summarize(entries){
    const rows=list(entries),count=predicate=>rows.filter(predicate).length;
    return {totalAssessed:count(e=>e.assessment&&e.assessment.assessed),completeGrammar:count(e=>e.assessment&&e.assessment.dataCompleteness.grammar==='complete-for-supported-constructions'),completeSemantics:count(e=>e.assessment&&e.assessment.dataCompleteness.semantics==='complete'),sourceSupported:count(e=>e.assessment&&e.assessment.sourceVerification.status==='snapshot-aligned'),morphologySupported:count(e=>e.assessment&&e.assessment.morphologicalValidation.status==='source-cell-or-reference-supported'),fluentReviewed:count(e=>e.assessment&&e.assessment.fluentSpeakerReview.status==='reviewed'),requiringFurtherReview:count(e=>!e.assessment||e.assessment.fluentSpeakerReview.status!=='reviewed'),eligible:count(e=>e.assessment&&e.assessment.sentenceGenerationEligibility.eligible),roles:Object.fromEntries(roles.map(r=>[r,count(e=>e.roleEligibility&&e.roleEligibility[r]&&e.roleEligibility[r].eligible)])),auxiliaryRoles:Object.fromEntries(['ADJECTIVE','STATE'].map(r=>[r,count(e=>e.roleEligibility&&e.roleEligibility[r]&&e.roleEligibility[r].eligible)])),categories:Object.fromEntries(unique(rows.flatMap(e=>e.categories||[])).sort().map(c=>[c,count(e=>list(e.categories).includes(c))]))};
  }
  function validateCategories(entries,options){
    options=options||{};
    const issues=[],labels=new Map(),categories=options.categories||learning&&learning.categories||{};
    for(const c of Object.values(categories)){const normalized=key(c.label);if(labels.has(normalized))issues.push({type:'duplicate-category-label',category:c.id,other:labels.get(normalized)});labels.set(normalized,c.id);if(c.parentId&&!categories[c.parentId])issues.push({type:'orphaned-category',category:c.id,parentId:c.parentId});}
    for(const entry of list(entries)){
      if(!list(entry.categories).length)issues.push({type:'uncategorized-entry',id:entry.id});
      if(new Set(entry.categories||[]).size!==list(entry.categories).length)issues.push({type:'duplicate-category-assignment',id:entry.id});
      for(const category of list(entry.categories))if(!categories[category])issues.push({type:'unknown-category',id:entry.id,category});
      const assessed=list(entry.senses).filter(s=>s.classification&&(s.classification.categoryStatus==='supported'||s.classification.status!=='unresolved'));
      if(assessed.length){
        const supported=unique(assessed.flatMap(s=>s.categories||[]));
        for(const category of list(entry.categories))if(category!=='general'&&!supported.includes(category)&&!(category==='people'&&entry.partOfSpeech==='pronoun'&&(entry.person||list(entry.authoredRoles).includes('WHO')))){
          const originalId=entry.primaryId||String(entry.id||'').replace(/^lex:/,'');
          const baseline=authoredBaselines&&authoredBaselines.entries&&authoredBaselines.entries[originalId];
          const historicalContext=['essential','storytelling'].includes(category)&&baseline&&fingerprint(entry)===baseline.fingerprint&&baseline.categories.includes(category);
          issues.push(historicalContext?{type:'learning-context-assignment',severity:'info',id:entry.id,category,reason:'Preserved authored communication or storytelling context; this is not a lexical semantic category assertion.',reference:authoredBaselines.metadata.reference}:{type:'unsupported-category-assignment',id:entry.id,category,reason:'No assessed lexical sense supplies category evidence; retain user choices but queue for review.'});
        }
      }
      for(const sense of list(entry.senses)){
        if(sense.classification&&sense.classification.status==='unresolved')issues.push({type:'unresolved-sense-category',id:entry.id,senseId:sense.id,reason:'No unambiguous source topic or semantic definition head.'});
        if(list(sense.semanticTags).includes('material')&&list(sense.categories).some(c=>['body','anatomy','appearance'].includes(c))){
          const alternatives=String(sense.english||'').split(/[,;]/).map(key);
          const hasAnatomicalAlternative=alternatives.some(a=>heads[a]&&heads[a].semanticTags.includes('anatomical'));
          issues.push({type:hasAnatomicalAlternative?'possible-internal-polysemy':'semantic-category-conflict',id:entry.id,senseId:sense.id,reason:hasAnatomicalAlternative?'The source grouped material and anatomical alternatives in one sense; a reviewer may need to distinguish sub-senses.':'Material sense has an unsupported anatomical classification.'});
        }
        if(list(sense.semanticTags).includes('human')&&list(sense.categories).includes('animals'))issues.push({type:'semantic-category-conflict',id:entry.id,senseId:sense.id});
      }
    }
    return issues;
  }
  function categoryCorrectionReport(before,after){
    const byId=new Map(list(before).map(e=>[e.primaryId||String(e.id).replace(/^lex:/,''),e]));
    const changes=[];
    for(const entry of list(after)){
      const original=byId.get(entry.primaryId||String(entry.id).replace(/^lex:/,''));
      if(!original)continue;
      const oldCategories=list(original.categories),newCategories=list(entry.categories);
      if(JSON.stringify(oldCategories.slice().sort())===JSON.stringify(newCategories.slice().sort()))continue;
      changes.push({id:entry.id,gurmukhi:entry.g,before:oldCategories,after:newCategories,removed:oldCategories.filter(c=>!newCategories.includes(c)),added:newCategories.filter(c=>!oldCategories.includes(c)),senseCategories:list(entry.senses).map(s=>({senseId:s.id,english:s.english,contextualGloss:s.contextualGloss,categories:s.categories,evidence:s.classification}))});
    }
    return {entriesChanged:changes.length,movedOutOfGeneral:changes.filter(c=>c.before.includes('general')&&!c.after.includes('general')).length,movedIntoGeneral:changes.filter(c=>!c.before.includes('general')&&c.after.includes('general')).length,changes};
  }
  return Object.freeze({version:VERSION,enrich,enrichCorpus,summarize,validateCategories,categoryCorrectionReport,fingerprint});
});
