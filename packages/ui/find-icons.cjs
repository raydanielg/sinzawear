const icons = require('@hugeicons/core-free-icons');
const names = Object.keys(icons);
const relevant = names.filter(n => /Star|Heart|Award|Sparkle|Truck|Globe|User|Target|Eye|Crown|Gem|Bag|Store|Tag|Gift|Rocket|Sun|Moon|Check|Arrow|Instagram|Mail|Phone|Location|Medal|Trophy|Shield|Leaf|Fire|Spark|Diamond|Shirt|Dress|Scissor|Needle|Thread|Fabric|Ribbon|Shopping|Cart|Quality|Customer|Hand|World|Recycle|Nature|Cloth/i.test(n));
console.log(relevant.slice(0, 100).join('\n'));
