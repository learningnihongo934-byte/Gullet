// Gullet game data: floors (the tower's organs), enemies, bosses, items (things the tower ate), basecamp upgrades.
export const TILE = 16, RW = 19, RH = 11, OX = 8, OY = 20, W = 320, H = 196;
export const CX = OX + RW * TILE / 2, CY = OY + RH * TILE / 2;
export const DOORS = { n: [9, 0], s: [9, 10], w: [0, 5], e: [18, 5] };
export const DIRS = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] };
export const OPP = { n: 's', s: 'n', w: 'e', e: 'w' };

export const FLOORS = [
  { name: 'The Gullet', plate: 'I', note: 'The throat. Warm, narrow, always swallowing.',
    pal: { floor: '#7d2f3d', floor2: '#8a3747', speck: '#62202f', vein: '#a8475a', wall: '#3a0f19', wall2: '#5a1d2a', gum: '#c45a70', lump: ['#2a0a12', '#6a2232', '#93394b', '#b8566a', '#dc8a98'], acid: '#bcd04a' },
    enemies: ['grub', 'grub', 'spitter', 'gnat', 'tick', 'molar'], boss: 'dangler' },
  { name: 'The Stomach', plate: 'II', note: 'Everything it ever ate ends up here, eventually.',
    pal: { floor: '#86452f', floor2: '#935037', speck: '#683222', vein: '#c08a3a', wall: '#3d1a10', wall2: '#5c2a1a', gum: '#d0884a', lump: ['#2a1008', '#6a3420', '#8f4e30', '#b47244', '#dca46a'], acid: '#d6e04a' },
    enemies: ['grub', 'slime', 'spitter', 'leech', 'bloat', 'acidfly'], boss: 'churn' },
  { name: 'The Lungs', plate: 'III', note: 'It breathes in. Hold on to something.',
    pal: { floor: '#8a5c76', floor2: '#976983', speck: '#6c445e', vein: '#c79bb5', wall: '#3a2233', wall2: '#5a3550', gum: '#d3a0bf', lump: ['#24121e', '#5e3a52', '#83587a', '#a87ba0', '#d4acc8'], acid: '#a8d8c0' },
    enemies: ['gnat', 'antibody', 'spitter', 'burrower', 'spore', 'wheezer'], boss: 'bellows' },
  { name: 'The Bowels', plate: 'IV', note: 'Long, dark and coiled. Something lives in the coils.',
    pal: { floor: '#5e3a4a', floor2: '#6a4455', speck: '#452838', vein: '#8a6a3a', wall: '#24131c', wall2: '#3d2230', gum: '#9a6070', lump: ['#160a10', '#402434', '#5e3a4c', '#80566a', '#a8808e'], acid: '#a6c23a' },
    enemies: ['leech', 'slime', 'burrower', 'crawler', 'tapeworm', 'polyp'], boss: 'coil' },
  { name: 'The Spine', plate: 'V', note: 'Bone the whole way up. It remembers every climber.',
    pal: { floor: '#6e2a2a', floor2: '#7a3232', speck: '#521c1c', vein: '#d8c8a8', wall: '#2a1414', wall2: '#cfc0a0', gum: '#f0e6cc', lump: ['#1a0c0c', '#8a7c64', '#b0a284', '#d4c8aa', '#f2ead6'], acid: '#c8d04a' },
    enemies: ['crawler', 'antibody', 'leech', 'spitter', 'vertebra', 'shardling'], boss: 'marrow' },
  { name: 'The Heart', plate: 'VI', note: 'You can hear it from here. Every beat shakes the walls.',
    pal: { floor: '#7a0f1c', floor2: '#881624', speck: '#5a0812', vein: '#3a4a8a', wall: '#2a0308', wall2: '#4a0a14', gum: '#c0283c', lump: ['#180206', '#5a0a16', '#861424', '#b02a3a', '#d8566a'], acid: '#e05a4a' },
    enemies: ['antibody', 'leech', 'burrower', 'crawler', 'clot', 'platelet'], boss: 'heart' },
  // ---- beyond the heart: only reached in Infinite mode
  { name: 'The Liver', plate: 'VII', note: 'Dark, heavy and full of bile. It filters everything, including you.',
    pal: { floor: '#4a2a3a', floor2: '#553242', speck: '#341c2a', vein: '#7a8a2a', wall: '#1c0c16', wall2: '#2e1626', gum: '#8a4a6a', lump: ['#12060c', '#3a1e2e', '#56304a', '#7a4a66', '#a07090'], acid: '#a6c23a' },
    enemies: ['bileblob', 'lobule', 'toxin', 'bloat', 'slime'], boss: 'bileduke' },
  { name: 'The Kidneys', plate: 'VIII', note: 'Two of everything here. Stones grind in the dark.',
    pal: { floor: '#6a3a2a', floor2: '#764432', speck: '#4e2a1e', vein: '#c8a070', wall: '#28140c', wall2: '#40221a', gum: '#b8705a', lump: ['#1a0c06', '#5a3424', '#7a4a34', '#9e6a4e', '#c89878'], acid: '#d6c04a' },
    enemies: ['stone', 'nephron', 'urchin', 'crawler', 'tapeworm'], boss: 'twins' },
  { name: 'The Tongue', plate: 'IX', note: 'Wet, wide and always tasting. You are on the menu.',
    pal: { floor: '#a24a5e', floor2: '#ae566a', speck: '#843a4c', vein: '#e88a9a', wall: '#3a1018', wall2: '#5a1c28', gum: '#f0a0b0', lump: ['#2a0a12', '#7a2a3e', '#a24a5e', '#c86a80', '#f0a0b0'], acid: '#e8e070' },
    enemies: ['tastebud', 'spitbug', 'papilla', 'tick', 'molar'], boss: 'taster' },
  { name: 'The Nerves', plate: 'X', note: 'Everything here is a signal. Some of them hurt.',
    pal: { floor: '#2a2a48', floor2: '#323256', speck: '#1e1e36', vein: '#8ad8ff', wall: '#0e0e1c', wall2: '#1c1c34', gum: '#6a8ac8', lump: ['#08081a', '#2a2a5a', '#3e3e7a', '#5a5aa2', '#8a8ad0'], acid: '#8ad8ff' },
    enemies: ['spark', 'synapse', 'axon', 'antibody', 'gnat'], boss: 'ganglion' },
  { name: 'The Eye', plate: 'XI', note: 'It sees you. It has always seen you.',
    pal: { floor: '#c8c0b8', floor2: '#d4ccc4', speck: '#a8a098', vein: '#c02a3e', wall: '#3a3a44', wall2: '#5a5a66', gum: '#e8e0d8', lump: ['#2a2a30', '#8a8a96', '#a8a8b4', '#c8c8d2', '#eeeef4'], acid: '#8ad0e0' },
    enemies: ['floater', 'tear', 'lash', 'wheezer', 'spark'], boss: 'optic' },
  { name: 'The Brain', plate: 'XII', note: 'The top of the tower. It has been thinking about you.',
    pal: { floor: '#9a7a86', floor2: '#a68692', speck: '#7a5a66', vein: '#d8a8b8', wall: '#2a1a22', wall2: '#4a2e3a', gum: '#e0b0c0', lump: ['#1a0e14', '#6a4e5a', '#8e6e7c', '#b494a2', '#dcc0cc'], acid: '#c8a0e0' },
    enemies: ['thought', 'neuron', 'migraine', 'spark', 'floater'], boss: 'mind' },
];
const ROMAN = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
export const roman = n => ROMAN.reduce((s, [v, r]) => { while (n >= v) { s += r; n -= v; } return s; }, '');
const flCache = {};
/** Floor fi in any mode: Infinite loops through all twelve body parts at rising tiers. */
export function FL(fi) { return flCache[fi] || (flCache[fi] = { ...FLOORS[fi % FLOORS.length], plate: roman(fi + 1), tier: Math.floor(fi / FLOORS.length), part: fi % FLOORS.length }); }

export const ENEMIES = {
  grub: { name: 'Grub', lore: 'Pale and patient. It only wants to get closer.', hp: 7, r: 6, speed: 26, cost: 1, gore: '#e8dcc0' },
  spitter: { name: 'Spitter', lore: 'A polyp with a grudge. It flashes before it spits.', hp: 9, r: 7, speed: 0, cost: 2, gore: '#d27080' },
  gnat: { name: 'Gnat', lore: 'Buzzes in crooked lines and flies over everything.', hp: 3.5, r: 5, speed: 66, cost: 1, fly: true, gore: '#7a5a9a' },
  leech: { name: 'Leech', lore: 'Shivers, then lunges in a dead straight line.', hp: 10, r: 6, speed: 20, cost: 2, gore: '#8a1a2a' },
  slime: { name: 'Bile Slime', lore: 'Hops after you, and splits in two when popped.', hp: 12, r: 7, speed: 0, cost: 2, gore: '#d6d04a' },
  antibody: { name: 'Antibody', lore: 'The tower\'s immune system. It circles, then charges.', hp: 16, r: 7, speed: 45, cost: 3, gore: '#f0f0f0' },
  burrower: { name: 'Burrower', lore: 'Swims under the floor and surfaces in a ring of spit.', hp: 14, r: 7, speed: 52, cost: 3, gore: '#c07080' },
  crawler: { name: 'Bone Crawler', lore: 'Zig-zags fast and flicks bone shards at you.', hp: 12, r: 6, speed: 70, cost: 3, gore: '#e0d4b0' },
  // ---- 30 more. ai = shared behaviour, the rest tunes it.
  tick: { name: 'Throat Tick', lore: 'Never alone. Comes in threes and bites in a blur.', ai: 'swarm', group: 3, hp: 2.5, r: 4, speed: 88, cost: 1.5, fly: true, gore: '#6a2232' },
  molar: { name: 'Molar Mimic', lore: 'Looks just like a tooth on the floor. It is not.', ai: 'mimic', hp: 9, r: 6, speed: 95, cost: 2, gore: '#f6ecd9' },
  bloat: { name: 'Bloater', lore: 'Waddles close, swells up and bursts. Do not be there.', ai: 'bomber', hp: 10, r: 7, speed: 30, cost: 2, gore: '#c8d04a' },
  acidfly: { name: 'Acid Moth', lore: 'Flutters about dripping acid where you need to stand.', ai: 'miner', hp: 6, r: 5, speed: 50, cost: 2, fly: true, gore: '#d6e04a' },
  spore: { name: 'Spore Pod', lore: 'Rooted in place. Breathes out slow spirals of spores.', ai: 'spinner', hp: 14, r: 7, speed: 0, cost: 3, gore: '#d4acc8' },
  wheezer: { name: 'Wheezer', lore: 'Keeps its distance, takes careful aim, and coughs once.', ai: 'sniper', hp: 9, r: 6, speed: 40, cost: 3, gore: '#a87ba0' },
  tapeworm: { name: 'Tapeworm', lore: 'Lines up, then charges wall to wall, bouncing off each one.', ai: 'charger', hp: 13, r: 6, speed: 0, cost: 3, gore: '#e8dcc0' },
  polyp: { name: 'Polyp Mother', lore: 'Sits and spawns grubs. Kill her first.', ai: 'summoner', child: 'grub', hp: 18, r: 8, speed: 0, cost: 3, gore: '#c07080' },
  vertebra: { name: 'Vertebra', lore: 'Bone-plated: your hits do half. Fires bone in a cross.', ai: 'armored', armor: 0.5, hp: 16, r: 7, speed: 18, cost: 3, gore: '#e0d4b0' },
  shardling: { name: 'Shardling', lore: 'Shatters into three smaller pieces that keep coming.', ai: 'chaser', split: 3, hp: 12, r: 7, speed: 34, cost: 2, gore: '#e0d4b0' },
  clot: { name: 'Blood Clot', lore: 'Leaps onto where you are and lands in a ring of blood.', ai: 'leaper', hp: 14, r: 7, speed: 0, cost: 3, gore: '#8a1424' },
  platelet: { name: 'Platelet', lore: 'Runs from you and patches up everything else.', ai: 'healer', hp: 8, r: 5, speed: 46, cost: 2, gore: '#e58494' },
  bileblob: { name: 'Bile Glob', lore: 'Splits in two. Then the two split in two.', ai: 'hopper', split: 2, gens: 2, hp: 16, r: 8, speed: 80, cost: 3, gore: '#a6c23a' },
  lobule: { name: 'Lobule', lore: 'A lump of liver that pulses out rings of bile.', ai: 'turret', pattern: 'ring', hp: 15, r: 7, speed: 0, cost: 3, gore: '#7a4a66' },
  toxin: { name: 'Toxin Wisp', lore: 'Fades out of sight, floats through walls, fades back in shooting.', ai: 'ghost', hp: 9, r: 5, speed: 40, cost: 3, fly: true, gore: '#a6c23a' },
  stone: { name: 'Kidney Stone', lore: 'Heavy, armoured and it does not stop when it hits a wall.', ai: 'charger', armor: 0.5, hp: 18, r: 7, speed: 0, cost: 3, gore: '#c8a070' },
  nephron: { name: 'Nephron', lore: 'Crawls along the walls and fires into the room.', ai: 'wallcrawler', hp: 11, r: 6, speed: 55, cost: 2, gore: '#b8705a' },
  urchin: { name: 'Salt Urchin', lore: 'Drifts toward you spraying spines in a spiral.', ai: 'spinner', hp: 14, r: 7, speed: 16, cost: 3, gore: '#e8dcc0' },
  tastebud: { name: 'Taste Bud', lore: 'Sits in the tongue and spits a five-way fan.', ai: 'turret', pattern: 'spread', hp: 13, r: 7, speed: 0, cost: 2, gore: '#f0a0b0' },
  spitbug: { name: 'Spit Bug', lore: 'Hops after you and spits every time it lands.', ai: 'hopper', shoot: 1, hp: 11, r: 6, speed: 95, cost: 2, gore: '#e8e070' },
  papilla: { name: 'Papilla', lore: 'A bump on the tongue that keeps sending out ticks.', ai: 'summoner', child: 'tick', hp: 16, r: 7, speed: 0, cost: 3, gore: '#c86a80' },
  spark: { name: 'Spark', lore: 'Vanishes, reappears beside you, and goes off.', ai: 'teleport', hp: 9, r: 5, speed: 0, cost: 3, gore: '#8ad8ff' },
  synapse: { name: 'Synapse', lore: 'Aims a line of light, then fires along it.', ai: 'sniper', hp: 10, r: 6, speed: 46, cost: 3, gore: '#8ad8ff' },
  axon: { name: 'Axon Eel', lore: 'Dashes three times in a row, each one aimed.', ai: 'dasher', hp: 12, r: 6, speed: 24, cost: 3, gore: '#5a5aa2' },
  floater: { name: 'Floater', lore: 'Drifts in a circle around you, taking shots.', ai: 'orbiter', hp: 13, r: 6, speed: 50, cost: 3, fly: true, gore: '#c8c8d2' },
  tear: { name: 'Tear Drop', lore: 'Leaps high and splashes down in a wide ring.', ai: 'leaper', ring: 12, hp: 12, r: 6, speed: 0, cost: 3, gore: '#8ad0e0' },
  lash: { name: 'Eyelash Mite', lore: 'Tiny, fast and never alone.', ai: 'swarm', group: 3, hp: 3, r: 4, speed: 96, cost: 1.5, fly: true, gore: '#3a3a44' },
  thought: { name: 'Stray Thought', lore: 'Blinks in and out, leaving rings behind.', ai: 'teleport', hp: 12, r: 6, speed: 0, cost: 3, gore: '#c8a0e0' },
  neuron: { name: 'Neuron', lore: 'Keeps its distance and heals whatever is hurting.', ai: 'healer', hp: 12, r: 6, speed: 44, cost: 3, gore: '#e0b0c0' },
  migraine: { name: 'Migraine', lore: 'Armoured, slow and spinning out pain in every direction.', ai: 'spinner', armor: 0.6, hp: 22, r: 8, speed: 12, cost: 4, gore: '#c8a0e0' },
};

export const BOSSES = {
  dangler: { lore: 'Hangs from the roof of the throat. It spits fans of blood and drips acid where you stand.', name: 'The Dangler', hp: 150, r: 15 },
  churn: { lore: 'The stomach itself. It leaps, lands on you, and spins out bile.', name: 'The Churn', hp: 250, r: 21 },
  bellows: { lore: 'Breathes you in, then blows everything back out at once.', name: 'Bellows', hp: 320, r: 22 },
  coil: { lore: 'A lamprey as long as the bowels. It charges, and its whole body spits.', name: 'The Coil', hp: 400, r: 10 },
  marrow: { lore: 'The crowned skull of the spine. It rams the walls and raises bone spikes.', name: 'The Marrow King', hp: 480, r: 13 },
  heart: { lore: 'Every beat is a ring of blood. The faster it beats, the closer you are.', name: 'The Heart', hp: 700, r: 23 },
  bileduke: { lore: 'Lord of the liver. Rains bile, spins it out, and sends globs after you.', name: 'The Bile Duke', hp: 820, r: 22 },
  twins: { lore: 'Two kidneys, one grudge. They circle each other and take turns.', name: 'The Twins', hp: 900, r: 12 },
  taster: { lore: 'The tip of the tongue. It licks the whole room clean, with you in it.', name: 'The Taster', hp: 980, r: 18 },
  ganglion: { lore: 'A knot of nerves. It draws lines of lightning and then fires them.', name: 'The Ganglion', hp: 1060, r: 18 },
  optic: { lore: 'The great eye. Its gaze is a beam that sweeps the room.', name: 'The Optic', hp: 1150, r: 22 },
  mind: { lore: 'The thing at the top. It is everywhere at once, and it remembers every climber.', name: 'The Mind', hp: 1300, r: 20 },
};

export function baseStats() {
  return { dmg: 3.5, dmgMul: 1, fire: 0.38, shotSpeed: 190, range: 0.72, speed: 82, luck: 0, maxhp: 6,
    pierce: 0, bounce: 0, homing: 0, burn: 0, poison: 0, split: 0, triple: 0, chain: 0, explode: 0, leech: 0, crit: 0,
    orbit: 0, grow: 0, boomer: 0, knock: 1, stun: 0, flight: 0, shield: 0, big5: 0, dashCD: 0.8, discount: 0, magnet: 0,
    map: 0, prism: 0, candle: 0,
    vamp: 0, slowHit: 0, hook: 0, slowBullets: 0, revive: 0, bomb: 0, dashSpeed: 1, dashBurst: 0, hurtFreeze: 0, hurtBurst: 0,
    teethMul: 1, teethDrop: 0, piggy: 0, sizeUp: 0, twin: 0, back: 0, pinwheel: 0, acidproof: 0, critMul: 2.5, rage: 0, fragile: 0,
    wiggle: 0, capTeeth: 0, clearHeal: 0, bossDmg: 0, orbitDmg: 1, entryBlast: 0, eraser: 0, wallBurst: 0, aura: 0,
    thorns: 0, dodge: 0, slowAll: 0, lvlHeal: 0, opener: 0, execute: 0, collector: 0, xpMul: 1, choices: 0, dashReset: 0, biteproof: 0,
    phase: 0, accel: 0, buddy: 0, splash: 0, still: 0, panic: 0, combo: 0, interest: 0, healMul: 1, bossHp: 0, weaken: 0, bossCut: 0,
    finisher: 0, deathBurst: 0 };
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
  // ---- third batch
  { id: 'anchor', name: "Ship's Anchor", desc: '+2 damage, slower', f: 'The ship is down here too, somewhere.', apply: s => { s.dmg += 2; s.speed -= 10; } },
  { id: 'whistle', name: 'Tin Whistle', desc: 'Throw 12% faster, +range', f: 'One blow and the walls flinch.', apply: s => { s.fire *= 0.88; s.range += 0.1; } },
  { id: 'jellybean', name: 'Jelly Bean', desc: 'A random small boost', f: 'Flavour: unknown. Colour: also unknown.', apply: s => { const r = Math.floor(Math.random() * 4); if (r === 0) s.dmg += 0.6; else if (r === 1) s.fire *= 0.92; else if (r === 2) s.speed += 6; else s.luck += 1; } },
  { id: 'sock', name: 'Lost Sock', desc: '+speed, +1 luck', f: 'So this is where they go.', apply: s => { s.speed += 8; s.luck += 1; } },
  { id: 'spectacles', name: 'Spectacles', desc: '+range, +shot speed', f: 'Now you can see exactly how bad it is.', apply: s => { s.range += 0.25; s.shotSpeed += 25; } },
  { id: 'bouncyball', name: 'Bouncy Ball', desc: 'Salt bounces twice more, +shot speed', f: 'Has not stopped bouncing in forty years.', apply: s => { s.bounce += 2; s.shotSpeed += 20; } },
  { id: 'cactus', name: 'Cactus Spine', desc: 'Enemies that touch you get hurt', f: 'The tower swallowed a whole desert once.', apply: s => { s.thorns += 1; } },
  { id: 'pocketknife', name: 'Pocket Knife', desc: '+1.2 damage, +5% crit', f: 'Seven tools. Only one matters.', apply: s => { s.dmg += 1.2; s.crit += 0.05; } },
  { id: 'carbattery', name: 'Car Battery', desc: 'Hits arc twice as far, throw a bit slower', f: 'Twelve volts of bad idea.', apply: s => { s.chain += 2; s.fire *= 1.1; } },
  { id: 'teacup', name: 'Teacup', desc: '+1 heart, full heal', f: 'Still warm. Do not ask from what.', apply: (s, p) => { s.maxhp += 2; if (p) p.hp = s.maxhp; } },
  { id: 'hambone', name: 'Ham Bone', desc: '+1 heart, +0.5 damage', f: 'Gnawed clean. Not by you.', apply: (s, p) => { s.maxhp += 2; s.dmg += 0.5; if (p) p.hp += 2; } },
  { id: 'locket', name: 'Locket', desc: '10% chance to shrug off a hit', f: 'The photo inside is of you.', apply: s => { s.dodge += 0.1; } },
  { id: 'cape', name: 'Torn Cape', desc: '8% chance to shrug off a hit, +speed', f: 'A hero wore it in. Nobody wore it out.', apply: s => { s.dodge += 0.08; s.speed += 6; } },
  { id: 'lantern', name: 'Oil Lantern', desc: 'Salt burns, +range', f: 'The only light some of these rooms have ever seen.', apply: s => { s.burn += 1; s.range += 0.1; } },
  { id: 'gardensnail', name: 'Garden Snail', desc: 'Every enemy moves 10% slower', f: 'Slowness is contagious.', apply: s => { s.slowAll += 0.1; } },
  { id: 'metronome', name: 'Metronome', desc: 'Dash recharges faster, throw a bit faster', f: 'Ticks in time with the heart.', apply: s => { s.dashCD *= 0.8; s.fire *= 0.95; } },
  { id: 'crayon', name: 'Red Crayon', desc: '+0.8 damage, bigger salt', f: 'Someone drew a door on the wall. It did not open.', apply: s => { s.dmg += 0.8; s.sizeUp += 0.5; } },
  { id: 'sticker', name: 'Lightning Sticker', desc: 'Hits can arc, +5% crit', f: 'Peeled off a lunchbox.', apply: s => { s.chain += 1; s.crit += 0.05; } },
  { id: 'wand', name: 'Fairy Wand', desc: 'Level-ups heal you, +1 luck', f: 'Leaves a tooth. Takes a tooth.', apply: s => { s.lvlHeal += 1; s.luck += 1; } },
  { id: 'dentures', name: 'Dentures', desc: 'Your first hit on each enemy does double', f: 'Bite first. Ask later.', apply: s => { s.opener += 1; } },
  { id: 'cleaver', name: 'Cleaver', desc: 'Finish off enemies under 15% health', f: 'The butcher was very thorough.', apply: s => { s.execute = Math.min(0.3, s.execute + 0.15); } },
  { id: 'album', name: "Collector's Album", desc: '+4% damage for every item you hold', f: 'Every page a little piece of the tower.', apply: s => { s.collector += 0.04; } },
  { id: 'sundial', name: 'Sundial', desc: '+25% XP', f: 'No sun in here. It works anyway.', apply: s => { s.xpMul += 0.25; } },
  { id: 'deck', name: 'Deck of Cards', desc: 'Level-ups show one more card', f: 'Fifty-two cards and a joker that bites.', apply: s => { s.choices = Math.min(2, s.choices + 1); } },
  { id: 'alarm', name: 'Alarm Clock', desc: 'Kills reset your dash', f: 'Rings at the worst possible moment. On purpose.', apply: s => { s.dashReset = 1; } },
  { id: 'helmet', name: 'Bike Helmet', desc: 'Walls can\'t bite you, +1 heart', f: 'Safety first, even in a stomach.', apply: (s, p) => { s.biteproof = 1; s.maxhp += 2; if (p) p.hp += 2; } },
  { id: 'rainboots', name: 'Rain Boots', desc: 'Acid can\'t hurt you, +speed', f: 'Puddle-proof. Bile-proof. Mostly.', apply: s => { s.acidproof = 1; s.speed += 4; } },
  { id: 'umbrella', name: 'Umbrella', desc: 'Block one more hit in each room', f: 'Opened indoors. That is how it got here.', apply: (s, p) => { s.shield += 1; if (p) p.shields = s.shield; } },
  { id: 'vitamins', name: 'Vitamins', desc: '+1 heart, +0.3 damage, +speed', f: 'Chewable. The tower chewed.', apply: (s, p) => { s.maxhp += 2; s.dmg += 0.3; s.speed += 4; if (p) p.hp += 2; } },
  { id: 'ghostcandle', name: 'Ghost Candle', desc: 'Salt passes through lumps and teeth', f: 'Its flame leans toward the walls.', apply: s => { s.phase = 1; } },
  { id: 'handfan', name: 'Hand Fan', desc: 'Salt speeds up as it flies', f: 'Fans the flames. Fans everything.', apply: s => { s.accel += 1; } },
  { id: 'tar', name: 'Tar Ball', desc: 'Hits slow enemies, +0.4 damage', f: 'Sticks to everything, especially regrets.', apply: s => { s.slowHit += 1; s.dmg += 0.4; } },
  { id: 'frog', name: 'Frog in a Jar', desc: 'A frog follows you and spits salt', f: 'It was swallowed before. It is used to this.', apply: s => { s.buddy += 1; } },
  { id: 'rat', name: 'Pet Rat', desc: 'A rat follows you and throws salt', f: 'Knows every shortcut in the tower.', apply: s => { s.buddy += 1; } },
  { id: 'ghost', name: 'Tiny Ghost', desc: 'A ghost follows you and throws salt, 5% dodge', f: 'A climber who never left. Friendly, mostly.', apply: s => { s.buddy += 1; s.dodge += 0.05; } },
  { id: 'crow', name: 'Crow Feather', desc: 'Salt seeks enemies, +speed', f: 'Crows know where the bodies are.', apply: s => { s.homing += 0.7; s.speed += 5; } },
  { id: 'lens', name: 'Contact Lens', desc: '+8% crit, +range', f: 'Fell out. Saw everything on the way down.', apply: s => { s.crit += 0.08; s.range += 0.1; } },
  { id: 'pinecone', name: 'Pinecone', desc: 'Every hit splashes nearby enemies', f: 'Opens in heat. It is very hot in here.', apply: s => { s.splash += 1; } },
  { id: 'hotsauce', name: 'Hot Sauce', desc: 'Salt burns, throw a bit faster', f: 'The label just says NO.', apply: s => { s.burn += 1; s.fire *= 0.95; } },
  { id: 'venom', name: 'Snake Venom', desc: 'Salt poisons heavily', f: 'The snake lost the fight. The venom won.', apply: s => { s.poison += 1.5; } },
  { id: 'knuckles', name: 'Brass Knuckles', desc: '+1 damage, big knockback, less range', f: 'For close conversations.', apply: s => { s.dmg += 1; s.knock += 1; s.range -= 0.1; } },
  { id: 'skate', name: 'Roller Skate', desc: '+speed, dash farther', f: 'One skate. The other one is in a lung.', apply: s => { s.speed += 16; s.dashSpeed *= 1.15; } },
  { id: 'eggtimer', name: 'Egg Timer', desc: '+40% damage while standing still', f: 'Three minutes. Then something hatches.', apply: s => { s.still += 0.4; } },
  { id: 'panic', name: 'Panic Button', desc: '+40% speed at 1 heart or less', f: 'Press in case of digestion.', apply: s => { s.panic += 0.4; } },
  { id: 'trophy', name: 'Trophy', desc: '+25% damage to organs, +1 luck', f: 'Participation award. You are participating.', apply: s => { s.bossDmg += 0.25; s.luck += 1; } },
  { id: 'ribbon', name: 'Prize Ribbon', desc: 'Clear a room without getting hit: +8% damage (up to +40%)', f: 'First place in not being eaten.', apply: s => { s.combo += 0.08; } },
  { id: 'purse', name: 'Coin Purse', desc: 'Clearing a room pays 1 tooth per 10 you carry', f: 'Teeth earn teeth. That is how the tower got so many.', apply: s => { s.interest += 1; } },
  { id: 'firstaid', name: 'First Aid Tin', desc: 'Hearts you pick up heal double', f: 'Expired, but the thought counts.', apply: s => { s.healMul = 2; } },
  { id: 'candyheart', name: 'Candy Heart', desc: 'Every organ you stop gives +1 heart', f: 'Says BE MINE. The tower already decided you are.', apply: s => { s.bossHp += 1; } },
  { id: 'broom', name: 'Broom', desc: 'Huge knockback, bigger salt', f: 'Sweeps things back where they came from.', apply: s => { s.knock += 1.5; s.sizeUp += 0.5; } },
  { id: 'lightbulb', name: 'Light Bulb', desc: 'Enemies show up 15% weaker', f: 'Things are less scary in the light.', apply: s => { s.weaken = Math.min(0.4, s.weaken + 0.15); } },
  { id: 'scissors', name: 'Scissors', desc: 'Organs start with 10% less health', f: 'Snip.', apply: s => { s.bossCut = Math.min(0.3, s.bossCut + 0.1); } },
  { id: 'horseshoe', name: 'Horseshoe', desc: '+2 luck, pickups fly to you', f: 'Nailed above a door that is now a throat.', apply: s => { s.luck += 2; s.magnet += 1; } },
  { id: 'bubblewrap', name: 'Bubble Wrap', desc: 'Block a hit each room, 5% dodge', f: 'Pop one every time you are scared. You will run out.', apply: (s, p) => { s.shield += 1; s.dodge += 0.05; if (p) p.shields = s.shield; } },
  { id: 'cheese', name: 'Moldy Cheese', desc: 'Salt poisons, +1 heart', f: 'Aged in a stomach. Very exclusive.', apply: (s, p) => { s.poison += 1; s.maxhp += 2; if (p) p.hp += 2; } },
  { id: 'glue', name: 'Glue Stick', desc: 'Hits slow enemies, +range', f: 'Holds anything together except your nerves.', apply: s => { s.slowHit += 1; s.range += 0.15; } },
  { id: 'dynamite', name: 'Dynamite', desc: 'Enemies explode on death; every 6th throw explodes', f: 'Fuse: short. Patience: shorter.', apply: s => { s.explode += 1; s.bomb += 1; } },
  { id: 'snowflake', name: 'Snowflake', desc: 'Hits can freeze and slow', f: 'Unique, like every other one.', apply: s => { s.stun += 0.1; s.slowHit += 0.5; } },
  { id: 'discoball', name: 'Disco Ball', desc: 'Salt splits mid-air, +5% crit', f: 'Spins to a beat nobody else can hear.', apply: s => { s.prism += 1; s.crit += 0.05; } },
  { id: 'pogo', name: 'Pogo Stick', desc: 'Dashing leaves fire, dash recharges faster', f: 'Boing. Burn. Boing.', apply: s => { s.candle += 1; s.dashCD *= 0.9; } },
  { id: 'lighter', name: 'Lighter', desc: 'Salt burns; dashing leaves fire', f: 'Flick. The tower flinches.', apply: s => { s.burn += 1; s.candle += 1; } },
  { id: 'kazoo', name: 'Kazoo', desc: 'Level-ups heal you, +10% XP', f: 'Plays one note: victory, sort of.', apply: s => { s.lvlHeal += 1; s.xpMul += 0.1; } },
  { id: 'shovel', name: 'Shovel', desc: '+50% damage to enemies under half health', f: 'Dig them a little deeper.', apply: s => { s.finisher += 0.5; } },
  { id: 'jaroteeth', name: 'Jar of Teeth', desc: '+15 teeth, shops 15% cheaper', f: 'Someone was collecting. Someone was the tower.', apply: (s, p, g) => { s.discount = Math.min(0.6, s.discount + 0.15); if (g) g.teeth += 15; } },
  { id: 'antenna', name: 'Antenna', desc: 'Salt seeks enemies, hits can arc', f: 'Picks up a station that only plays heartbeats.', apply: s => { s.homing += 1; s.chain += 0.5; } },
  { id: 'boneflute', name: 'Bone Flute', desc: 'Enemies burst into bone shards when they die', f: 'Plays the song of the last thing that died.', apply: s => { s.deathBurst += 1; } },
];

// Starting weapons, picked before each climb.
export const WEAPONS = [
  { id: 'salt', name: 'Salt', desc: 'Balanced throws. The tower hates it.', stats: 'Even damage, rate and range', apply: () => {} },
  { id: 'pepper', name: 'Pepper Spray', desc: 'A short cone of five stinging specks. Shreds anything up close.', stats: '5 specks, short range, fast', apply: s => { s.fire *= 0.85; s.range *= 0.42; s.shotSpeed *= 1.1; } },
  { id: 'sling', name: 'Pebble Sling', desc: 'Slow, heavy stones that knock enemies back and punch through.', stats: 'Huge damage, slow, pierces', apply: s => { s.fire *= 1.8; s.dmg *= 2.3; s.pierce += 1; s.knock += 1; s.shotSpeed *= 0.9; } },
  { id: 'vinegar', name: 'Vinegar Flask', desc: 'Lobbed flasks that burst into a burning puddle where they land.', stats: 'Area damage over time, slow', apply: s => { s.fire *= 1.35; s.dmg *= 1.2; s.shotSpeed *= 0.75; } },
  { id: 'boomerang', name: 'Bone Boomerang', desc: 'Always comes back, and cuts through everything on the way.', stats: 'Returns, pierces 3, slower', apply: s => { s.boomer = 1; s.pierce += 3; s.fire *= 1.4; s.dmg *= 1.45; s.range += 0.15; } },
  { id: 'matches', name: 'Matchsticks', desc: 'Rapid little flames that set whatever they touch burning.', stats: 'Very fast, weak, burns', apply: s => { s.fire *= 0.55; s.dmg *= 0.55; s.burn += 1; } },
];
// Unlocked by stopping each of the first six organs.
WEAPONS.push(
  { id: 'acid', boss: 'dangler', name: 'Acid Spitter', desc: 'Green globs that bounce off walls twice and poison what they touch.', stats: 'Bounces, poisons', apply: s => { s.bounce += 2; s.dmg *= 0.95; } },
  { id: 'cannon', boss: 'churn', name: 'Bile Cannon', desc: 'A heavy lobbed shot that explodes where it lands.', stats: 'Slow, big explosions', apply: s => { s.fire *= 2; s.dmg *= 1.5; s.shotSpeed *= 0.8; } },
  { id: 'horn', boss: 'bellows', name: 'Wind Horn', desc: 'A wide blast of air that hurls everything back and passes through.', stats: '7-wide wave, huge knockback', apply: s => { s.fire *= 1.3; s.range *= 0.55; s.knock += 2; s.pierce += 9; } },
  { id: 'lamprey', boss: 'coil', name: 'Lamprey Ring', desc: 'Salt that spirals outward around you, carving circles through the room.', stats: 'Spiralling shots, long life', apply: s => { s.range *= 1.7; s.dmg *= 1.05; s.pierce += 1; } },
  { id: 'lance', boss: 'marrow', name: 'Marrow Lance', desc: 'A blindingly fast shard of bone that goes through everything in a line.', stats: 'Very fast, long, pierces 5', apply: s => { s.shotSpeed *= 2.1; s.range *= 1.4; s.pierce += 5; s.dmg *= 1.5; s.fire *= 1.6; } },
  { id: 'heartstring', boss: 'heart', name: 'Heartstring', desc: 'Blood bolts that hunt down enemies and sometimes heal you.', stats: 'Homing, heals on hit', apply: s => { s.homing += 1.5; s.vamp += 0.02; } },
);
export const WEAPON = Object.fromEntries(WEAPONS.map(w => [w.id, w]));
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
  (WEAPON[meta && meta.weapon] || WEAPON.salt).apply(s);
  return s;
}

// ---- active items: one at a time, used with Q, recharged by kills
export const ACTIVES = [
  { id: 'pump', name: 'Stomach Pump', charge: 6, desc: 'Q: blast every enemy in the room', f: 'Everything comes back up eventually.' },
  { id: 'icetray', name: 'Ice Tray', charge: 4, desc: 'Q: freeze every enemy and wipe their shots', f: 'Cold enough to make the walls shiver.' },
  { id: 'gauze', name: 'Gauze Roll', charge: 6, desc: 'Q: heal a heart and gain a shield', f: 'Wrap it tight. It will hold. For now.' },
  { id: 'saltlick', name: 'Salt Lick', charge: 4, desc: 'Q: throw three times as fast for 4 seconds', f: 'Pure, crystal, furious.' },
  { id: 'smoke', name: 'Smoke Bomb', charge: 5, desc: 'Q: become untouchable for 2.5 seconds', f: 'Now you see me. Now the tower does not.' },
  { id: 'chicken', name: 'Rubber Chicken', charge: 5, desc: 'Q: drop a decoy that everything attacks', f: 'It squeaks. They cannot resist.' },
  { id: 'lodestone', name: 'Lodestone', charge: 5, desc: 'Q: drag enemies together, then blow them up', f: 'Pulls everything. Even trouble.' },
  { id: 'spittoon', name: 'Spittoon', charge: 3, desc: 'Q: turn every enemy shot into teeth', f: 'Waste not.' },
];
export const ACTIVE = Object.fromEntries(ACTIVES.map(a => [a.id, a]));

// ---- playable climbers. swap = palette swap of the base climber sprite.
export const CHARS = [
  { id: 'wren', name: 'Wren', desc: 'The first climber. Balanced, stubborn, hungry for the top.', quirk: 'No quirks. No excuses.', swap: {}, apply: () => {} },
  { id: 'brick', name: 'Brick', desc: 'A wall of a man. Two more hearts and a shell, but slow on his feet.', quirk: '+2 hearts, shield each room, slower, more knockback', swap: { r: 'o', R: 'n', n: 'K', N: 'K', g: 'S', G: 'K', h: 'H', H: 'N' }, unlock: { text: 'Reach plate II', test: m => (m.stats.best || 0) >= 2 }, apply: (s, p) => { s.maxhp += 4; s.speed -= 10; s.knock += 1; s.shield += 1; } },
  { id: 'pip', name: 'Pip', desc: 'Small, quick and very lucky. Harder to hit, easier to hurt.', quirk: 'Tiny hitbox, faster, +2 luck, one less heart', swap: { r: 'y', R: 'Y', n: 'y', N: 'Y', g: 'b', G: 'B' }, unlock: { text: 'Kill 150 things across all climbs', test: m => (m.stats.kills || 0) >= 150 }, apply: (s, p) => { s.speed += 14; s.luck += 2; s.maxhp = Math.max(2, s.maxhp - 2); if (p) p.r = 4; } },
  { id: 'mags', name: 'Old Mags', desc: 'A retired surgeon. She knows the tower from the inside.', quirk: 'Starts with an active item and 3 bombs', swap: { r: 'w', R: 'W', n: 'W', N: 'S', g: 'w', G: 'W' }, unlock: { text: 'Keep 25 different cards', test: m => (m.found || []).length >= 25 }, apply: (s, p, g) => { if (p) { p.bombs = 3; p.active = ACTIVES[Math.floor(Math.random() * ACTIVES.length)].id; p.charge = 99; } } },
  { id: 'hollow', name: 'Hollow', desc: 'A climber who died in here and kept going.', quirk: 'Floats over acid, walls cannot bite, shield each room, only 2 hearts', swap: { r: 'c', R: 'b', n: 'W', N: 'S', g: 'c', G: 'b', h: 'w', H: 'W' }, unlock: { text: 'Reach plate V', test: m => Math.max(m.stats.best || 0, m.stats.inf || 0) >= 5 }, apply: (s, p) => { s.flight = 1; s.biteproof = 1; s.shield += 1; s.maxhp = 4; } },
  { id: 'fang', name: 'Fang', desc: 'Raised by something down in the bowels. Bites back.', quirk: '+30% damage, thorns, kills can heal, but hearts heal half', swap: { r: 'R', R: 'k', n: 'K', N: 'k', g: 'N', G: 'k' }, unlock: { text: 'Stop The Heart', test: m => (m.beasts || {}).heart >= 1 }, apply: s => { s.dmgMul *= 1.3; s.thorns += 1; s.leech += 1; s.healMul = 0.5; } },
];
export const CHAR = Object.fromEntries(CHARS.map(c => [c.id, c]));

// ---- Mr. Tapewell, the parasite who runs every shop
export const SHOP_LINES = {
  greet: ['Teeth for trinkets, climber. Fair is fair.', 'Mind the floor. It is digesting.', 'Back again? The tower likes you. Not in a good way.', 'Everything here was swallowed. Everything is for sale.', 'Ah, a customer with all their limbs. Rare.', 'I have lived in here forty years. Business is good.'],
  buy: ['Pleasure doing business.', 'No refunds. Nothing comes back up.', 'A fine choice. The last owner thought so too.', 'Spend it before it spends you.'],
  broke: ['Come back with more teeth.', 'I do not do credit. Credit gets digested.', 'Teeth, climber. Teeth.'],
};

// ---- notes left by climbers who came before. Read in order across all climbs.
export const NOTES = [
  'Day 1. We went in through the mouth. Halvard says towers do not have mouths. Halvard is wrong.',
  'The walls breathe. If you stand still you can feel the whole place swallow.',
  'Salt works. Anything salt. Marta threw a whole shaker and the floor screamed.',
  'There is a parasite with a top hat running a shop. He wanted teeth. I paid. I am not proud.',
  'Lost Halvard in the stomach. Something big rose out of the acid and he just... went with it.',
  'Climbed a rope out of a hole in the ceiling. Every floor is a new organ. We are going UP through it.',
  'The lungs pulled us in and blew us out. I have not stopped coughing salt since.',
  'Found a pocket watch stopped at 3:14. Found a hundred more. Everything the tower eats, it keeps.',
  'The spine is lined with crowns. Climbers who got this far and stopped. I will not stop.',
  'I heard it. The heart. You hear it in your teeth before your ears.',
  'We stopped the heart. It went quiet. Then the walls kept moving anyway. The heart was not in charge.',
  'Past the heart there is more. Liver, kidneys. A tongue the size of a field. It tasted us.',
  'The nerves are lit like a city at night. Every step sends a message up. Something is listening.',
  'There is an eye. It does not blink. It watched us climb the whole way.',
  'The brain. It knows our names. It said them in the voices of everyone it has eaten.',
  'It told me the tower is not hungry for food. It is hungry for climbers. We are what keeps it alive.',
  'If you are reading this, I made it to the top and kept going. The tower goes round again. So do I.',
  'Do not stop climbing. Stopping is how it digests you.',
];

// ---- endings
export const ENDINGS = {
  heart: ['The heart gives one last beat and goes still.', 'For a long moment the whole tower holds its breath. Then, far above, something keeps moving.', 'The heart was never what kept it alive.', 'You can stop here. Or you can climb on, past the heart, in an Infinite climb.'],
  mind: ['The Mind folds in on itself and the voices go quiet, one by one.', 'In the silence you hear it, deep below: the mouth, opening again.', 'The tower is starting over. It always starts over.', 'Keep climbing.'],
};
