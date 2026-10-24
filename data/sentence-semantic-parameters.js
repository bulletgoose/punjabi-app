/* Sentence-only semantic parameters. Exact English definition heads and
 * source-sense qualifiers refine the existing taxonomy; browsing categories
 * and dictionary definitions are never rewritten. Development review is not
 * independent fluent-speaker verification. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.PUNJABI_SENTENCE_SEMANTIC_PARAMETERS=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  return {
    version:1,reviewStatus:'development-AI-assessed;native-review-pending',
    heads:{
      human:'person|human|man|woman|boy|girl|child|adult|baby|infant|friend|family|people|father|mother|parent|brother|sister|son|daughter|husband|wife|uncle|aunt|cousin|nephew|niece|grandfather|grandmother|grandson|granddaughter|teacher|student|doctor|farmer|worker|guest|stranger|servant|soldier|king|queen|prince|bride|bridegroom|brother-in-law|sister-in-law|son-in-law|daughter-in-law|father-in-law|mother-in-law|follower',
      liquid:'water|milk|tea|coffee|juice|mango juice|wine|beer|liquor|buttermilk|lassi|sherbet|lemonade|oil|petroleum|petrol|gasoline|diesel|mercury|ink|blood|soup|honey|ghee|cream',
      gas:'smoke|steam|oxygen|hydrogen|nitrogen|air|wind',
      celestial:'sun|moon|star|sky|cloud|rainbow|lightning|thunder|sunshine',
      portable:'pen|pencil|paper|eraser|notebook|chalk|ticket|passport|wallet|money|coin|currency|rupee|cash|computer|phone|telephone|mobile phone|camera|battery|luggage|stone|brick|seed|leaf|flower|root|branch|herb',
      smallAnimal:'cat|dog|bird|fish|insect|rabbit|hare|rat|mouse|squirrel|hen|chicken|duck|goose|pigeon|dove|parrot|sparrow|frog|turtle|tortoise|lamb|puppy|kitten',
      tall:'tree|plant|bush|shrub|bamboo|wheat|barley|maize|grass|building|house|wall|door|mountain|hill|cliff|peak|tower',
      length:'rope|road|street|river|stream|canal|bridge|snake|python|crocodile|carrot|cucumber|radish|branch|root|leaf|hair|arm|leg|finger|tail|scarf|shawl|cloth|garment|shirt|dress|skirt|coat|trousers|pants|curtain|blanket|bed|table|train|boat|ship|car|journey|story|poem|novel|letter|essay|report',
      depth:'cup|glass|bowl|pot|pan|bottle|bucket|basket|box|bag|sack|container|jar|jug|vase|room|house|well|cave|river|lake|sea|ocean|pond|canal|valley',
      surface:'floor|wall|roof|ceiling|door|window|road|street|land|earth|soil|field|plain|plateau|desert|shore|beach|table|chair|mirror|cloth|paper',
      transparent:'glass|water|sky|window|air',
      indoor:'home|house|room|bedroom|bathroom|kitchen|attic|office|school|classroom|library|shop|hospital|restaurant|prison|building',
      pluralEnglish:'clothes|trousers|pants|scissors|socks|shoes|gloves|people|cattle|teeth|feet|lips|grapes|peas|beans|lentils|chickpeas',
      massEnglish:'clothing|equipment|furniture|luggage|news|information|mathematics|knowledge|ginger|fresh ginger|garlic|turmeric|cumin|salt|cinnamon|pepper|cardamom|coriander|flour|cream|honey|meat|soil|sand|wood|timber|gold|silver|iron|steel|money|cash|wealth|health|work|education|music|poetry|rain|snow|air|smoke|steam',
      discreteFood:'egg|cake|biscuit|cookie|sandwich|samosa|pakora|laddu|ladoo|jalebi|chapati|paratha|roti',
      juicyFood:'mango|orange|lemon|lime|grape|grapes|watermelon|melon|peach|plum|cherry|sugarcane',
      slicedFood:'apple|mango|potato|peach|banana|carrot|cucumber|tomato|onion|cabbage|cauliflower|radish|turnip|eggplant|bitter melon|okra|lemon|lime|orange|pear|guava|papaya|pineapple|watermelon|melon|coconut|beetroot|bread|meat|cheese|cake|chapati|paratha'
    },
    // Properties are alternatives within a frame. Existing predicate-specific
    // affordances (readable, cuttable, etc.) remain an additional requirement.
    predicates:{
      weigh:{objectAny:['weighable'],family:'measurement'},
      lift:{objectAny:['liftable'],family:'manipulation'},carry:{objectAny:['portable'],family:'manipulation'},
      pull:{objectAny:['graspable'],family:'manipulation'},hold:{objectAny:['graspable'],family:'manipulation'},keep:{objectAny:['portable','digital'],family:'possession'},
      touch:{objectAny:['accessible'],family:'perception'},smell:{objectAny:['scentBearing'],family:'perception'},
      give:{objectAny:['transferable','communicative'],family:'transfer'},take:{objectAny:['transferable'],family:'transfer'},
      bring:{objectAny:['transferable'],family:'transfer'},send:{objectAny:['transferable','communicative'],family:'transfer'},
      buy:{objectAny:['purchasable'],family:'possession'},borrow:{objectAny:['transferable'],family:'possession'},
      distribute:{objectAny:['transferable'],family:'transfer'},share:{objectAny:['transferable'],family:'transfer'},'give away':{objectAny:['transferable'],family:'transfer'},
      allocate:{objectAny:['economic','abstract','quantity'],family:'allocation'},allot:{objectAny:['economic','abstract','quantity'],family:'allocation'},
      eat:{objectAny:['food'],family:'consumption'},chew:{objectAny:['solidFood'],family:'consumption'},nibble:{objectAny:['solidFood'],family:'consumption'},
      suck:{objectAny:['suckable'],family:'consumption'},taste:{objectAny:['food','drinkable'],family:'consumption'},drink:{objectAny:['drinkable'],family:'consumption'},
      cut:{objectAny:['cuttable'],family:'manipulation'},dig:{objectAny:['diggable'],family:'manipulation'},
      count:{objectAny:['countable-object','countable'],family:'measurement'},repair:{objectAny:['repairable'],family:'manipulation'},
      clean:{objectAny:['cleanable'],family:'manipulation'},wipe:{objectAny:['cleanable'],family:'manipulation'},
      sow:{objectAny:['plantable'],family:'cultivation'},water:{objectAny:['plantable'],family:'cultivation'},
      read:{objectAny:['readable'],family:'communication'},write:{objectAny:['writable'],family:'communication'},print:{objectAny:['writable'],family:'communication'},
      speak:{objectAny:['speakable'],family:'communication'},tell:{objectAny:['speakable'],family:'communication'},
      'listen to':{objectAny:['listenable'],family:'perception'},hear:{objectAny:['listenable'],family:'perception'},
      watch:{objectAny:['watchable'],family:'perception'},see:{objectAny:['watchable'],family:'perception'},
      learn:{objectAny:['learnable'],family:'cognition'},understand:{objectAny:['understandable'],family:'cognition',stative:true},
      consider:{objectAny:['abstract','communicative'],family:'cognition'},
      open:{objectAny:['openable'],family:'manipulation'},close:{objectAny:['closable'],family:'manipulation'},solve:{objectAny:['solvable'],family:'cognition'},answer:{objectAny:['answerable'],family:'communication'}
    },
    modifiers:{
      high:['heightBearing'],tall:['heightBearing'],long:['lengthBearing'],short:['lengthBearing','heightBearing'],deep:['depthBearing'],
      rough:['textureBearing'],smooth:['textureBearing'],hard:['solid'],solid:['solid'],soft:['textureBearing'],
      flat:['shapeBearing'],round:['shapeBearing'],straight:['lengthBearing','shapeBearing'],crooked:['lengthBearing','shapeBearing'],
      wet:['moistureBearing'],dry:['moistureBearing'],moist:['moistureBearing'],damp:['moistureBearing'],
      heavy:['weighable'],light:['weighable'],thick:['textureBearing','liquid'],thin:['textureBearing','liquid'],
      fresh:['freshnessBearing'],ripe:['produce'],unripe:['produce'],raw:['food','material'],
      clear:['transparent','communicative'],bright:['colourBearing'],dark:['colourBearing'],
      black:['colourBearing'],white:['colourBearing'],red:['colourBearing'],blue:['colourBearing'],green:['colourBearing'],yellow:['colourBearing'],brown:['colourBearing'],grey:['colourBearing'],gray:['colourBearing'],pink:['colourBearing'],purple:['colourBearing'],violet:['colourBearing'],orange:['colourBearing'],golden:['colourBearing'],
      broken:['breakable'],expensive:['purchasable','serviceProvider'],cheap:['purchasable','serviceProvider'],priceless:['purchasable','human'],
      hot:['temperatureBearing'],cold:['temperatureBearing'],warm:['temperatureBearing'],cool:['temperatureBearing'],lukewarm:['temperatureBearing'],
      sweet:['food','drinkable'],salty:['food','drinkable'],sour:['food','drinkable'],bitter:['food','drinkable'],
      empty:['container','space'],full:['container','space'],thorny:['plant'],prickly:['plant']
    },
    senseReviews:{
      'en-ਦੇਵਰ-pa-noun-c-mhp4HH':{gender:'m',status:'development-AI-correction;native-review-pending',reason:'The kinship noun devar takes masculine agreement; the imported feminine label is retained in the dictionary tags.'}
    }
  };
});
