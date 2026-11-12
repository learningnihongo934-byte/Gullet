// Gullet game data: floors (the tower's organs), enemies, bosses, items (things the tower ate), basecamp upgrades.
export const TILE = 16, RW = 19, RH = 11, OX = 8, OY = 20, W = 320, H = 196;
export const CX = OX + RW * TILE / 2, CY = OY + RH * TILE / 2;
export const DOORS = { n: [9, 0], s: [9, 10], w: [0, 5], e: [18, 5] };
export const DIRS = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] };
export const OPP = { n: 's', s: 'n', w: 'e', e: 'w' };

export const FLOORS = [
  { name: 'The Gullet', plate: 'I', note: 'The throat. Warm, narrow, always swallowing.',
    pal: { floor: '#7d2f3d', floor2: '#8a3747', speck: '#62202f', vein: '#a8475a', wall: '#3a0f19', wall2: '#5a1d2a', gum: '#c45a70', lump: ['#2a0a12', '#6a2232', '#93394b', '#b8566a', '#dc8a98'], acid: '#bcd04a' },
    enemies: ['grub', 'grub', 'spitter', 'gnat'], boss: 'dangler' },
  { name: 'The Stomach', plate: 'II', note: 'Everything it ever ate ends up here, eventually.',
    pal: { floor: '#86452f', floor2: '#935037', speck: '#683222', vein: '#c08a3a', wall: '#3d1a10', wall2: '#5c2a1a', gum: '#d0884a', lump: ['#2a1008', '#6a3420', '#8f4e30', '#b47244', '#dca46a'], acid: '#d6e04a' },
    enemies: ['grub', 'slime', 'spitter', 'leech'], boss: 'churn' },
  { name: 'The Lungs', plate: 'III', note: 'It breathes in. Hold on to something.',
    pal: { floor: '#8a5c76', floor2: '#976983', speck: '#6c445e', vein: '#c79bb5', wall: '#3a2233', wall2: '#5a3550', gum: '#d3a0bf', lump: ['#24121e', '#5e3a52', '#83587a', '#a87ba0', '#d4acc8'], acid: '#a8d8c0' },
    enemies: ['gnat', 'antibody', 'spitter', 'burrower', 'gnat'], boss: 'bellows' },
  { name: 'The Bowels', plate: 'IV', note: 'Long, dark and coiled. Something lives in the coils.',
    pal: { floor: '#5e3a4a', floor2: '#6a4455', speck: '#452838', vein: '#8a6a3a', wall: '#24131c', wall2: '#3d2230', gum: '#9a6070', lump: ['#160a10', '#402434', '#5e3a4c', '#80566a', '#a8808e'], acid: '#a6c23a' },
    enemies: ['leech', 'slime', 'burrower', 'grub', 'crawler'], boss: 'coil' },
  { name: 'The Spine', plate: 'V', note: 'Bone the whole way up. It remembers every climber.',
    pal: { floor: '#6e2a2a', floor2: '#7a3232', speck: '#521c1c', vein: '#d8c8a8', wall: '#2a1414', wall2: '#cfc0a0', gum: '#f0e6cc', lump: ['#1a0c0c', '#8a7c64', '#b0a284', '#d4c8aa', '#f2ead6'], acid: '#c8d04a' },
    enemies: ['crawler', 'antibody', 'leech', 'spitter', 'crawler'], boss: 'marrow' },
  { name: 'The Heart', plate: 'VI', note: 'You can hear it from here. Every beat shakes the walls.',
    pal: { floor: '#7a0f1c', floor2: '#881624', speck: '#5a0812', vein: '#3a4a8a', wall: '#2a0308', wall2: '#4a0a14', gum: '#c0283c', lump: ['#180206', '#5a0a16', '#861424', '#b02a3a', '#d8566a'], acid: '#e05a4a' },
    enemies: ['antibody', 'leech', 'burrower', 'crawler', 'gnat'], boss: 'heart' },
];

export const ENEMIES = {
  grub: { hp: 7, r: 6, speed: 26, cost: 1, gore: '#e8dcc0' },
  spitter: { hp: 9, r: 7, speed: 0, cost: 2, gore: '#d27080' },
  gnat: { hp: 3.5, r: 5, speed: 66, cost: 1, fly: true, gore: '#7a5a9a' },
  leech: { hp: 10, r: 6, speed: 20, cost: 2, gore: '#8a1a2a' },
  slime: { hp: 12, r: 7, speed: 0, cost: 2, gore: '#d6d04a' },
  antibody: { hp: 16, r: 7, speed: 45, cost: 3, gore: '#f0f0f0' },
  burrower: { hp: 14, r: 7, speed: 52, cost: 3, gore: '#c07080' },
  crawler: { hp: 12, r: 6, speed: 70, cost: 3, gore: '#e0d4b0' },
};

export const BOSSES = {
  dangler: { name: 'The Dangler', hp: 150, r: 15 },
  churn: { name: 'The Churn', hp: 250, r: 21 },
  bellows: { name: 'Bellows', hp: 320, r: 22 },
  coil: { name: 'The Coil', hp: 400, r: 10 },
  marrow: { name: 'The Marrow King', hp: 480, r: 13 },
  heart: { name: 'The Heart', hp: 700, r: 23 },
};

export function baseStats() {
  return { dmg: 3.5, dmgMul: 1, fire: 0.38, shotSpeed: 190, range: 0.72, speed: 82, luck: 0, maxhp: 6,
    pierce: 0, bounce: 0, homing: 0, burn: 0, poison: 0, split: 0, triple: 0, chain: 0, explode: 0, leech: 0, crit: 0,
    orbit: 0, grow: 0, boomer: 0, knock: 1, stun: 0, flight: 0, shield: 0, big5: 0, dashCD: 0.8, discount: 0, magnet: 0,
    map: 0, prism: 0, candle: 0,
    vamp: 0, slowHit: 0, hook: 0, slowBullets: 0, revive: 0, bomb: 0, dashSpeed: 1, dashBurst: 0, hurtFreeze: 0, hurtBurst: 0,
    teethMul: 1, teethDrop: 0, piggy: 0, sizeUp: 0, twin: 0, back: 0, pinwheel: 0, acidproof: 0, critMul: 2.5, rage: 0, fragile: 0,
    wiggle: 0, capTeeth: 0, clearHeal: 0, bossDmg: 0, orbitDmg: 1, entryBlast: 0, eraser: 0, wallBurst: 0, aura: 0 };
}

// Items: everything here is something the tower swallowed. f = flavour line shown on pickup.
export const ITEMS = [
  { id: 'sword', name: "Knight's Sword", desc: '+1.5 damage', f: 'A knight went in first. This came back.', apply: s => { s.dmg += 1.5; } },
  { id: 'hat', name: "Wizard's Hat", desc: 'Salt seeks enemies', f: 'Still humming with a spell nobody finished.', apply: s => { s.homing += 1; } },
  { id: 'boot', name: 'Lucky Boot', desc: '+speed, +1 luck', f: 'Only the one. The other one is further down.', apply: s => { s.speed += 12; s.luck += 1; } },
  { id: 'fork', name: 'Dinner Fork', desc: 'Salt pierces enemies', f: 'It ate the whole table setting.', apply: s => { s.pierce += 1; } },
  { id: 'duck', name: 'Rubber Duck', desc: 'Salt bounces off walls', f: 'Squeaks when the walls squeeze.', apply: s => { s.bounce += 2; } },
  { id: 'pepper', name: 'Ghost Pepper', desc: 'Salt sets enemies burning', f: 'The tower regretted this one.', apply: s => { s.burn += 1; } },
  { id: 'bread', name: 'Moldy Bread', desc: 'Salt poisons and slows', f: 'Green on both sides now.', apply: s => { s.poison += 1; } },
  { id: 'fishbone', name: 'Fishbone', desc: 'Salt splits on hit', f: 'Stuck in its throat for a hundred years.', apply: s => { s.split += 1; } },
  { id: 'mirror', name: 'Mirror Shard', desc: 'Throw three at once, -20% damage', f: 'Seven years of bad luck, divided by three.', apply: s => { s.triple = 1; s.dmgMul *= 0.8; } },
  { id: 'bean', name: 'Coffee Bean', desc: 'Throw much faster', f: 'The tower did not sleep that week.', apply: s => { s.fire *= 0.75; } },
  { id: 'marble', name: 'Glass Marble', desc: '+shot speed, +range', f: 'Rolled all the way down from somewhere.', apply: s => { s.shotSpeed += 45; s.range += 0.25; } },
  { id: 'battery', name: 'Battery', desc: 'Hits can arc to nearby enemies', f: 'Tingles. Do not lick.', apply: s => { s.chain += 1; } },
  { id: 'firecracker', name: 'Firecracker', desc: 'Enemies explode when they die', f: 'Swallowed lit.', apply: s => { s.explode += 1; } },
  { id: 'leech', name: 'Pet Leech', desc: 'Kills can heal you', f: 'It likes you. That is the problem.', apply: s => { s.leech += 1; } },
  { id: 'apple', name: 'Apple Core', desc: '+1 heart', f: 'Someone ate the good part first.', apply: (s, p) => { s.maxhp += 2; if (p) p.hp += 2; } },
  { id: 'steak', name: 'Raw Steak', desc: '+2 hearts, slower, full heal', f: 'Rare. Very rare.', apply: (s, p) => { s.maxhp += 4; s.speed -= 8; if (p) p.hp = s.maxhp; } },
  { id: 'watch', name: 'Pocket Watch', desc: 'Dash recharges faster', f: 'Stopped at the exact second it was swallowed.', apply: s => { s.dashCD *= 0.55; } },
  { id: 'goldtooth', name: 'Gold Tooth', desc: 'Shops 30% cheaper, +10 teeth', f: 'The tower spat this one out twice.', apply: (s, p, g) => { s.discount = Math.min(0.6, s.discount + 0.3); if (g) g.teeth += 10; } },
  { id: 'magnet', name: 'Fridge Magnet', desc: 'Pickups fly to you', f: 'Says "World\'s Best Climber". Sure.', apply: s => { s.magnet += 1; } },
  { id: 'eye', name: 'Glass Eye', desc: 'Chance to land critical hits', f: 'It keeps looking at the weak spots.', apply: s => { s.crit += 0.15; } },
  { id: 'shell', name: 'Snail Shell', desc: 'Blocks the first hit in each room', f: 'The snail is fine. It moved out.', apply: s => { s.shield += 1; } },
  { id: 'kite', name: 'Kite String', desc: 'A salt ball circles you', f: 'The kite is still up there, somewhere.', apply: s => { s.orbit += 1; } },
  { id: 'tuning', name: 'Tuning Fork', desc: 'Salt grows as it flies', f: 'Rings at the pitch of a scream.', apply: s => { s.grow += 1; } },
  { id: 'candle', name: 'Birthday Candle', desc: 'Dashing leaves fire behind', f: 'Make a wish. Not that one.', apply: s => { s.candle += 1; } },
  { id: 'yoyo', name: 'Yo-yo', desc: 'Salt comes back to you', f: 'Walk the dog. Walk it right down the throat.', apply: s => { s.boomer = 1; s.range += 0.2; } },
  { id: 'dice', name: 'Loaded Die', desc: '+1 luck and two random boosts', f: 'Always lands on six. The tower hates that.', apply: (s, p) => { s.luck += 1; for (let i = 0; i < 2; i++) { const r = Math.floor(Math.random() * 4); if (r === 0) s.dmg += 0.8; else if (r === 1) s.fire *= 0.9; else if (r === 2) s.speed += 8; else { s.maxhp += 2; if (p) p.hp += 2; } } } },
  { id: 'thimble', name: 'Thimble', desc: 'Every 5th throw is huge', f: 'Protects a fingertip. Not much else.', apply: s => { s.big5 += 1; } },
  { id: 'map', name: 'Map Scrap', desc: 'Shows each floor\'s layout', f: 'Drawn by a climber who did not make it.', apply: s => { s.map = 1; } },
  { id: 'spoon', name: 'Silver Spoon', desc: 'Huge knockback, +0.5 damage', f: 'Born with it. Swallowed with it.', apply: s => { s.knock += 1.5; s.dmg += 0.5; } },
  { id: 'bell', name: 'Cat Bell', desc: 'Hits can stun', f: 'Where is the cat? Do not ask.', apply: s => { s.stun += 0.12; } },
  { id: 'feather', name: 'Pigeon Feather', desc: '+speed, float over acid', f: 'A whole pigeon went in. One feather left.', apply: s => { s.speed += 8; s.flight = 1; } },
  { id: 'prism', name: 'Prism', desc: 'Salt splits into three mid-air', f: 'Light does strange things in here.', apply: s => { s.prism += 1; } },
  { id: 'ring', name: 'Wedding Ring', desc: 'A little better at everything', f: 'Till death. Or digestion.', apply: s => { s.dmg += 0.5; s.fire *= 0.92; s.speed += 6; s.luck += 1; } },
  { id: 'pill', name: 'Old Pill', desc: '+30% damage, -1 heart', f: 'Expired before the tower was born.', apply: (s, p) => { s.dmgMul *= 1.3; if (s.maxhp > 2) { s.maxhp -= 2; if (p) p.hp = Math.min(p.hp, s.maxhp); } } },
  // ---- second batch
  { id: 'thumbtack', name: 'Thumbtack', desc: '+1 damage', f: 'Held a lost-cat poster to a wall. The wall was this.', apply: s => { s.dmg += 1; } },
  { id: 'shaker', name: 'Salt Shaker', desc: 'Throw 18% faster', f: 'Finally, a refill.', apply: s => { s.fire *= 0.82; } },
  { id: 'compass', name: 'Old Compass', desc: 'Salt drifts toward enemies, +range', f: 'Points at whatever is hungriest.', apply: s => { s.homing += 0.5; s.range += 0.15; } },
  { id: 'sneaker', name: 'Running Shoe', desc: '+speed', f: 'Still laced. Someone ran right out of it.', apply: s => { s.speed += 14; } },
  { id: 'bandage', name: 'Bandage', desc: '+1 heart, full heal', f: 'Clean, somehow.', apply: (s, p) => { s.maxhp += 2; if (p) p.hp = s.maxhp; } },
  { id: 'fang', name: 'Vampire Fang', desc: 'Hits sometimes heal you', f: 'It bit the tower once. The tower bit back.', apply: s => { s.vamp += 0.015; } },
  { id: 'slingshot', name: 'Slingshot', desc: '+shot speed, +0.5 damage', f: 'Confiscated, then swallowed.', apply: s => { s.shotSpeed += 60; s.dmg += 0.5; } },
  { id: 'gum', name: 'Bubble Gum', desc: 'Hits slow enemies down', f: 'Already chewed. Stays chewy forever.', apply: s => { s.slowHit += 1; } },
  { id: 'rubberband', name: 'Rubber Band', desc: 'Salt bounces once more, +range', f: 'Snapped off a stack of letters nobody sent.', apply: s => { s.bounce += 1; s.range += 0.2; } },
  { id: 'mustard', name: 'Mustard', desc: 'Salt burns and poisons a little', f: 'The tower has no taste. It tried anyway.', apply: s => { s.burn += 0.5; s.poison += 0.5; } },
  { id: 'chainlink', name: 'Chain Link', desc: 'Hits arc to more enemies', f: 'From a fence that used to keep things out.', apply: s => { s.chain += 1; } },
  { id: 'sparetooth', name: 'Spare Tooth', desc: 'Enemies drop more teeth, +5 teeth', f: 'Not yours. Not the tower\'s either.', apply: (s, p, g) => { s.teethDrop += 0.12; if (g) g.teeth += 5; } },
  { id: 'garlic', name: 'Garlic Clove', desc: 'Hurts enemies that get close', f: 'The only thing the tower spits out on purpose.', apply: s => { s.aura += 1; } },
  { id: 'fishhook', name: 'Fishhook', desc: 'Hits pull enemies to you, +0.5 damage', f: 'The line is still attached. Do not pull it.', apply: s => { s.hook += 1; s.dmg += 0.5; } },
  { id: 'hourglass', name: 'Hourglass', desc: 'Enemy shots fly 15% slower', f: 'Running backwards since it went down.', apply: s => { s.slowBullets += 0.15; } },
  { id: 'halo', name: 'Halo', desc: 'Block one more hit in each room', f: 'Whoever wore it did not need it any more.', apply: (s, p) => { s.shield += 1; if (p) p.shields = s.shield; } },
  { id: 'rabbitear', name: 'Rabbit Ear', desc: '+2 luck', f: 'The foot was taken. This is what was left.', apply: s => { s.luck += 2; } },
  { id: 'wishbone', name: 'Wishbone', desc: 'Once per floor, survive a killing blow', f: 'Somebody won the pull. Somebody did not.', apply: (s, p) => { s.revive += 1; if (p) p.revives = (p.revives || 0) + 1; } },
  { id: 'sparkler', name: 'Sparkler', desc: 'Every 6th throw explodes', f: 'Fourth of July, deep in the gut.', apply: s => { s.bomb += 1; } },
  { id: 'grease', name: 'Grease Tin', desc: 'Dash farther and more often', f: 'Slides right down. Slides right up, too.', apply: s => { s.dashSpeed *= 1.3; s.dashCD *= 0.85; } },
  { id: 'coughdrop', name: 'Cough Drop', desc: 'Dashing sprays salt all around you', f: 'Soothes nothing. Hurts plenty.', apply: s => { s.dashBurst += 1; } },
  { id: 'icecube', name: 'Ice Cube', desc: 'Hits can freeze enemies', f: 'Has not melted. Nobody knows why.', apply: s => { s.stun += 0.08; } },
  { id: 'snowglobe', name: 'Snow Globe', desc: 'Getting hit freezes every enemy', f: 'A tiny town, safe inside. Lucky them.', apply: s => { s.hurtFreeze += 1; } },
  { id: 'quill', name: 'Porcupine Quill', desc: 'Getting hit throws salt everywhere', f: 'The porcupine was a bad idea for everyone.', apply: s => { s.hurtBurst += 1; } },
  { id: 'penny', name: 'Lucky Penny', desc: 'Teeth are worth double', f: 'Heads. Always heads.', apply: s => { s.teethMul = 2; } },
  { id: 'piggy', name: 'Piggy Bank', desc: 'More damage the more teeth you carry', f: 'Rattles when the tower walks.', apply: s => { s.piggy += 1; } },
  { id: 'ruler', name: 'Ruler', desc: '+range', f: 'Twelve inches of the tower measured. Many miles to go.', apply: s => { s.range += 0.35; } },
  { id: 'pencil', name: 'Pencil Lead', desc: 'Salt pierces, +shot speed', f: 'Sharpened on a molar.', apply: s => { s.pierce += 1; s.shotSpeed += 20; } },
  { id: 'magnifier', name: 'Magnifying Glass', desc: 'Bigger salt, +20% damage', f: 'Everything looks worse up close in here.', apply: s => { s.sizeUp += 1; s.dmgMul *= 1.2; } },
  { id: 'cherries', name: 'Twin Cherries', desc: 'Throw two side by side, -15% damage', f: 'Two pits. Two problems.', apply: s => { s.twin = 1; s.dmgMul *= 0.85; } },
  { id: 'scratcher', name: 'Back Scratcher', desc: 'Also throw behind you', f: 'Reaches the spot nobody else can.', apply: s => { s.back = 1; } },
  { id: 'pinwheel', name: 'Pinwheel', desc: 'Every 4th throw goes in 8 directions', f: 'Spins in a wind that is really breath.', apply: s => { s.pinwheel += 1; } },
  { id: 'sugar', name: 'Sugar Cube', desc: '+speed, throw a bit faster', f: 'Pure energy. Pure regret.', apply: s => { s.speed += 6; s.fire *= 0.92; } },
  { id: 'lemon', name: 'Lemon Peel', desc: 'Salt poisons, acid can\'t hurt you', f: 'Sourer than the stomach. It respects that.', apply: s => { s.poison += 1; s.acidproof = 1; } },
  { id: 'firefly', name: 'Firefly Jar', desc: 'Two salt balls circle you', f: 'They glow brighter the deeper you go.', apply: s => { s.orbit += 2; } },
  { id: 'mosquito', name: 'Mosquito', desc: 'Kills heal you more often', f: 'Small, thirsty, on your side.', apply: s => { s.leech += 1; } },
  { id: 'monocle', name: 'Cracked Monocle', desc: '+10% crit chance, crits hit harder', f: 'The crack lines up with every weak spot.', apply: s => { s.crit += 0.1; s.critMul += 0.75; } },
  { id: 'nail', name: 'Rusty Nail', desc: 'Salt pierces and poisons', f: 'Tetanus is the least of your worries.', apply: s => { s.pierce += 1; s.poison += 0.5; } },
  { id: 'balloon', name: 'Balloon', desc: 'Float over acid, +speed', f: 'Still full of a birthday party\'s air.', apply: s => { s.flight = 1; s.speed += 10; } },
  { id: 'thunderegg', name: 'Thunder Egg', desc: 'Hits arc further, +0.5 damage', f: 'Crack it and the storm gets out.', apply: s => { s.chain += 1; s.dmg += 0.5; } },
  { id: 'ragetooth', name: 'Rage Tooth', desc: '+60% damage at half health or less', f: 'Grinds itself when you are scared.', apply: s => { s.rage += 1; } },
  { id: 'paperheart', name: 'Paper Heart', desc: '+50% damage, but hits cost a full heart', f: 'Folded by someone who meant it.', apply: s => { s.dmgMul *= 1.5; s.fragile = 1; } },
  { id: 'corkscrew', name: 'Corkscrew', desc: 'Salt wiggles as it flies, +0.7 damage', f: 'Opened the last bottle. Then the tower opened it.', apply: s => { s.wiggle += 1; s.dmg += 0.7; } },
  { id: 'bottlecap', name: 'Bottle Cap', desc: '+3 teeth every room you clear', f: 'Under the cap: TRY AGAIN.', apply: s => { s.capTeeth += 1; } },
  { id: 'cookie', name: 'Cookie Crumbs', desc: 'Clearing a room heals half a heart', f: 'A trail. Leading upward.', apply: s => { s.clearHeal += 1; } },
  { id: 'conch', name: 'Conch Shell', desc: '+30% damage to organs (bosses)', f: 'Hold it to your ear: a heartbeat.', apply: s => { s.bossDmg += 0.3; } },
  { id: 'sawblade', name: 'Saw Blade', desc: 'A salt ball circles you; circling salt hits twice as hard', f: 'Came off a lumber mill. With the lumber.', apply: s => { s.orbit += 1; s.orbitDmg *= 2; } },
  { id: 'popper', name: 'Party Popper', desc: 'Entering a fight blasts every enemy', f: 'Surprise!', apply: s => { s.entryBlast += 1; } },
  { id: 'toothbrush', name: 'Toothbrush', desc: 'Salt wipes out enemy shots', f: 'The tower has never once brushed.', apply: s => { s.eraser = 1; s.shotSpeed += 15; } },
  { id: 'shrapnel', name: 'Shrapnel', desc: 'Salt bursts into shards when it hits a wall', f: 'Bits of something that exploded long ago.', apply: s => { s.wallBurst += 1; } },
];
export const ITEM = Object.fromEntries(ITEMS.map(i => [i.id, i]));

// Basecamp upgrades, bought with marrow between climbs.
export const UPGRADES = [
  { id: 'hp', name: 'Thicker Skin', desc: '+1 starting heart', max: 3, cost: l => 40 + l * 45, apply: (s, l) => { s.maxhp += 2 * l; } },
  { id: 'dmg', name: 'Coarse Salt', desc: '+10% damage', max: 5, cost: l => 30 + l * 30, apply: (s, l) => { s.dmgMul *= 1 + 0.1 * l; } },
  { id: 'fire', name: 'Quick Wrists', desc: '+6% throw rate', max: 4, cost: l => 30 + l * 30, apply: (s, l) => { s.fire *= Math.pow(0.94, l); } },
  { id: 'speed', name: 'Climbing Boots', desc: '+5% move speed', max: 3, cost: l => 25 + l * 25, apply: (s, l) => { s.speed *= 1 + 0.05 * l; } },
  { id: 'dash', name: 'Rope Swing', desc: '-12% dash cooldown', max: 3, cost: l => 25 + l * 30, apply: (s, l) => { s.dashCD *= Math.pow(0.88, l); } },
  { id: 'luck', name: "Rabbit's Foot", desc: '+1 luck (more drops)', max: 2, cost: l => 60 + l * 60, apply: (s, l) => { s.luck += l; } },
  { id: 'teeth', name: 'Tooth Purse', desc: '+8 starting teeth', max: 3, cost: l => 25 + l * 25, apply: () => {} },
  { id: 'lunch', name: 'Packed Lunch', desc: 'Start every climb with a free pick of three', max: 1, cost: () => 160, apply: () => {} },
];

export function statsFor(meta) {
  const s = baseStats();
  const up = (meta && meta.up) || {};
  for (const u of UPGRADES) if (up[u.id]) u.apply(s, up[u.id]);
  return s;
}
