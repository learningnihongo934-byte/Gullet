// Sandbox panel: spawn anything, paint the room, hand yourself any kit. Tab shows or hides it.
import { ENEMIES, BOSSES, ITEMS, ITEM, WEAPONS, ACTIVES, ACTIVE, CHARS, FLOORS, OX, OY, TILE, W, H } from './data.js';
import { SPR, climberSprite } from './sprites.js';

const $ = s => document.querySelector(s);
const TILES = [['.', 'Floor'], ['o', 'Flesh lump'], ['t', 'Tooth'], ['~', 'Acid'], ['#', 'Wall']];
const PROPS = [['pod', 'Flesh pod'], ['bones', 'Bone pile'], ['sac', 'Bile sac'], ['pore', 'Pore'], ['spikes', 'Spike floor']];

export function mountSandbox({ getGame, meta, saveMeta, sfx, toast, bossPics, canvas }) {
  const panel = $('#sandbox'), grid = $('#sbGrid'), info = $('#sbInfo');
  let tab = 'spawn', tool = null, painting = false, speed = 1, infBombs = false;
  const urls = new Map();
  const url = c => { let u = urls.get(c); if (!u) { u = c.toDataURL(); urls.set(c, u); } return u; };
  const btn = (img, label, onClick, on) => {
    const b = document.createElement('button'); b.className = 'sbb' + (on ? ' on' : ''); b.title = label;
    b.innerHTML = img ? `<img alt="" src="${img}"><span>${label}</span>` : `<span>${label}</span>`;
    b.onclick = () => { onClick(b); sfx('pick'); };
    return b;
  };
  const head = text => { const h = document.createElement('div'); h.className = 'sbh'; h.textContent = text; grid.appendChild(h); };
  const setTool = (t, label) => { tool = t; info.textContent = t ? `Click in the room: ${label}` : 'Mouse throws salt'; render(); };

  function render() {
    const g = getGame(); if (!g) return;
    const p = g.players[0];
    document.querySelectorAll('#sbTabs button').forEach(b => b.classList.toggle('on', b.dataset.t === tab));
    grid.innerHTML = '';
    if (tab === 'spawn') {
      head('Monsters');
      for (const [id, d] of Object.entries(ENEMIES)) grid.appendChild(btn(url(SPR[id].c), d.name, () => setTool({ k: 'spawn', id }, d.name), tool && tool.id === id));
      head('Organs');
      const BP = bossPics();
      for (const [id, d] of Object.entries(BOSSES)) grid.appendChild(btn(url(BP[id]), d.name, () => setTool({ k: 'spawn', id }, d.name), tool && tool.id === id));
      head('Room');
      grid.appendChild(btn(null, 'Clear enemies', () => g.sbClear('enemies')));
      grid.appendChild(btn(null, g.frozen ? 'Unfreeze AI' : 'Freeze AI', () => { g.frozen = !g.frozen; render(); }, g.frozen));
    }
    if (tab === 'build') {
      head('Paint tiles (drag)');
      for (const [ch, name] of TILES) grid.appendChild(btn(null, name, () => setTool({ k: 'tile', ch }, name), tool && tool.ch === ch));
      head('Place things');
      for (const [k, name] of PROPS) grid.appendChild(btn(SPR['pr_' + k] ? url(SPR['pr_' + k].c) : null, name, () => setTool({ k: 'prop', id: k }, name), tool && tool.id === k));
      grid.appendChild(btn(null, 'Eraser', () => setTool({ k: 'erase' }, 'erase'), tool && tool.k === 'erase'));
      grid.appendChild(btn(null, 'No tool (throw)', () => setTool(null)));
      head('Body part');
      FLOORS.forEach((F, i) => grid.appendChild(btn(null, `${F.plate} ${F.name.replace('The ', '')}`, () => { g.sbFloor(i); render(); }, g.fi === i)));
      head('Layouts');
      grid.appendChild(btn(null, 'Clear room', () => g.sbClear('room')));
      for (let i = 0; i < 3; i++) {
        const slot = (meta.sbSlots || [])[i];
        grid.appendChild(btn(null, `Save to slot ${i + 1}`, () => { meta.sbSlots = meta.sbSlots || []; meta.sbSlots[i] = { fi: g.fi, tiles: g.room.tiles.slice(), props: g.props.filter(q => !q.dead).map(q => ({ k: q.k, x: q.x, y: q.y })) }; saveMeta(); toast(`<div class="ds">Saved to slot ${i + 1}.</div>`, 1500); render(); }));
        if (slot) grid.appendChild(btn(null, `Load slot ${i + 1}`, () => { g.sbLoad(slot); render(); }));
      }
    }
    if (tab === 'kit') {
      head('Weapon');
      for (const w of WEAPONS) grid.appendChild(btn(url(SPR['w_' + w.id].c), w.name, () => { g.sbRebuild(p, meta, w.id, p.char); render(); }, p.weapon === w.id));
      head('Climber');
      for (const c of CHARS) grid.appendChild(btn(url(climberSprite(c, null, 'a').c), c.name, () => { g.sbRebuild(p, meta, p.weapon, c.id); render(); }, p.char === c.id));
      head('Active item');
      for (const a of ACTIVES) grid.appendChild(btn(url(SPR['a_' + a.id].c), a.name, () => { p.active = a.id; p.charge = 99; render(); }, p.active === a.id));
      head('Supplies');
      grid.appendChild(btn(url(SPR.bomb.c), '+5 bombs', () => { p.bombs += 5; }));
      grid.appendChild(btn(url(SPR.tooth.c), '+50 teeth', () => { g.teeth += 50; }));
      grid.appendChild(btn(url(SPR.heart.c), 'Full heal', () => { p.hp = p.st.maxhp; }));
      grid.appendChild(btn(url(SPR.heart.c), '+1 heart', () => { p.st.maxhp += 2; p.hp += 2; }));
      grid.appendChild(btn(url(SPR.cache.c), 'Level up', () => g.levelUp()));
      grid.appendChild(btn(null, 'Charge active', () => { p.charge = 99; }));
    }
    if (tab === 'cards') {
      const box = document.createElement('div'); box.className = 'sbsearch';
      box.innerHTML = `<input id="sbFind" placeholder="Search 150 cards" autocomplete="off"><button class="sbb" id="sbStrip"><span>Remove all cards</span></button>`;
      grid.appendChild(box);
      const list = document.createElement('div'); list.className = 'sbcards'; grid.appendChild(list);
      const fill = q => {
        list.innerHTML = '';
        for (const it of ITEMS) {
          if (q && !(it.name + ' ' + it.desc).toLowerCase().includes(q)) continue;
          const n = p.items.filter(x => x === it.id).length;
          const b = btn(url(SPR['i_' + it.id].c), `${it.name}${n ? ' ×' + n : ''}`, () => { g.giveItem(p, it.id); fill($('#sbFind').value.toLowerCase()); });
          b.title = `${it.name}: ${it.desc}`; list.appendChild(b);
        }
      };
      fill('');
      $('#sbFind').oninput = e => fill(e.target.value.toLowerCase());
      $('#sbStrip').onclick = () => { p.items = []; g.sbRebuild(p, meta, p.weapon, p.char); fill(''); };
    }
    if (tab === 'world') {
      head('Rules');
      grid.appendChild(btn(null, g.god ? 'God mode: on' : 'God mode: off', () => { g.god = !g.god; render(); }, g.god));
      grid.appendChild(btn(null, infBombs ? 'Infinite bombs: on' : 'Infinite bombs: off', () => { infBombs = !infBombs; render(); }, infBombs));
      grid.appendChild(btn(null, g.frozen ? 'Enemy AI: frozen' : 'Enemy AI: on', () => { g.frozen = !g.frozen; render(); }, g.frozen));
      head('Game speed');
      for (const s of [0.25, 0.5, 1, 2]) grid.appendChild(btn(null, s + '×', () => { speed = s; render(); }, speed === s));
    }
  }
  document.querySelectorAll('#sbTabs button').forEach(b => b.onclick = () => { tab = b.dataset.t; render(); });

  // placing things with the mouse
  const toRoom = e => { const r = canvas.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H]; };
  const apply = (x, y, first) => {
    const g = getGame(); if (!g || !tool) return;
    const tx = Math.floor((x - OX) / TILE), ty = Math.floor((y - OY) / TILE);
    if (tool.k === 'tile') g.sbTile(tx, ty, tool.ch);
    else if (tool.k === 'erase') g.sbErase(x, y);
    else if (first && tool.k === 'spawn') g.sbSpawn(tool.id, x, y);
    else if (first && tool.k === 'prop') g.sbProp(tool.id, OX + tx * TILE + 8, OY + ty * TILE + 8);
  };
  canvas.addEventListener('mousedown', e => { if (!panel.classList.contains('hidden') && tool) { e.stopImmediatePropagation(); painting = true; apply(...toRoom(e), true); } }, true);
  canvas.addEventListener('mousemove', e => { if (painting && tool && (tool.k === 'tile' || tool.k === 'erase')) apply(...toRoom(e), false); });
  addEventListener('mouseup', () => { painting = false; });

  return {
    open() { panel.classList.remove('hidden'); setTool(null); render(); },
    close() { panel.classList.add('hidden'); tool = null; },
    toggle() { if (panel.classList.contains('hidden')) this.open(); else { panel.classList.add('hidden'); } },
    get speed() { return speed; },
    tick() { const g = getGame(); if (infBombs && g) g.players[0].bombs = Math.max(g.players[0].bombs, 9); },
    refresh: render,
    get toolActive() { return !!tool && !panel.classList.contains('hidden'); },
  };
}
