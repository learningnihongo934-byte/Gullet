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
    map: 0, prism: 0, candle: 0 };
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
  { id: 'eye', name: 'Glass Eye', desc: 'Chance to crit for 2.5x', f: 'It keeps looking at the weak spots.', apply: s => { s.crit += 0.15; } },
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
