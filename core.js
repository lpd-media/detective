/* LPD Case Room: shared settings, relay, icons and helpers for admin.html, screen.html and join.html.
   Relay: Firebase Realtime Database (free Spark plan), append-only rooms lpd-trophy-XXXXX-h (from the detective console) and -p (from phones).
   Test overrides: ?relay=<url>&proto=fb|ntfy and ?live=<base url where join.html is hosted>. */
window.CFG = {
  fb: 'https://lpd-detective-demo-default-rtdb.firebaseio.com',
  live: 'https://lpd-media.github.io/detective/'
};
const _q = new URLSearchParams(location.search);
const PROTO = _q.get('proto') || 'fb';
const RELAY = (_q.get('relay') || (PROTO === 'fb' ? CFG.fb : 'https://ntfy.sh')).replace(/\/$/, '');
const AL = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
function topicFor(code, side) { return 'lpd-trophy-' + code + '-' + side; }
function relayQS() { return _q.get('relay') ? '&relay=' + encodeURIComponent(_q.get('relay')) + '&proto=' + PROTO : ''; }
function pub(topic, obj, tries) {
  const url = PROTO === 'fb' ? RELAY + '/rooms/' + topic + '.json' : RELAY + '/' + topic;
  tries = tries === undefined ? 3 : tries;
  const ctl = typeof AbortController === 'function' ? new AbortController() : null, tmo = ctl ? setTimeout(() => ctl.abort(), 8000) : 0;
  return fetch(url, { method: 'POST', body: JSON.stringify(obj), signal: ctl ? ctl.signal : undefined })
    .then(r => { clearTimeout(tmo); if (!r.ok) throw new Error(r.status); return true; }, e => { clearTimeout(tmo); throw e; })
    .catch(e => { if (tries <= 0) throw e; return new Promise(ok => setTimeout(ok, (4 - tries) * 700)).then(() => pub(topic, obj, tries - 1)); });
}
function sub(topic, fn, onstate, lastOnly) {
  let es = null, closed = false, retry = null;
  function open() {
    if (closed) return;
    if (PROTO === 'fb') {
      es = new EventSource(RELAY + '/rooms/' + topic + '.json' + (lastOnly ? '?orderBy=%22%24key%22&limitToLast=1' : ''));
      const take = e => { try { const d = JSON.parse(e.data); if (!d) return;
        if (d.path === '/') { if (d.data && typeof d.data === 'object') Object.keys(d.data).sort().forEach(k => fn(d.data[k], true)); }
        else if (d.data) fn(d.data, false); } catch (_) {} };
      es.addEventListener('put', e => { onstate && onstate(true); take(e); });
      es.addEventListener('patch', take);
      es.addEventListener('open', () => onstate && onstate(true));
    } else {
      es = new EventSource(RELAY + '/' + topic + '/sse?since=all');
      es.addEventListener('open', () => onstate && onstate(true));
      es.onmessage = e => { try { const m = JSON.parse(e.data); if (m.event === 'message') fn(JSON.parse(m.message), false); } catch (_) {} };
    }
    es.onerror = () => { onstate && onstate(false); if (es.readyState === 2) { clearTimeout(retry); retry = setTimeout(open, 3000); } };
  }
  open();
  return () => { closed = true; es && es.close(); };
}
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

/* Icons: simple line drawings (inline SVG, no emoji, no icon fonts) so they render the same on every computer and phone. */
const IC = {
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.6-4.6"/>',
  check: '<path d="M4.5 12.5l5 5L19.5 7"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><path d="M16 4.6a3.5 3.5 0 010 6.8M18 14.2c2.1.7 3.5 2.8 3.5 5.8"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>',
  gem: '<path d="M6.5 3.5h11l4 5.5L12 20.5 2.5 9z"/><path d="M2.5 9h19M9.5 3.5L12 20.5l2.5-17"/>',
  lighthouse: '<path d="M9 21.5l1.4-12.5h3.2L15 21.5z"/><path d="M8.5 9h7M10 6h4v3h-4z"/><path d="M11 6l1-2.5L13 6"/><path d="M3.5 21.5h17M2.5 5l4.5 2M21.5 5L17 7"/>',
  car: '<path d="M3 16.5v-3.5l2.2-5h13.6l2.2 5v3.5z"/><circle cx="7.5" cy="16.5" r="2"/><circle cx="16.5" cy="16.5" r="2"/><path d="M4 13h16"/>',
  ship: '<path d="M2.5 16.5l2.5 4h14l2.5-4z"/><path d="M5 16.5v-5.5h14v5.5"/><path d="M9 11V6.5h6V11M12 3v3.5"/>',
  film: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7.5 4v16M16.5 4v16M3 9h4.5M3 15h4.5M16.5 9H21M16.5 15H21"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0013 0M12 17.5V21"/>',
  award: '<circle cx="12" cy="9" r="6"/><path d="M8.6 13.8L7 22l5-3 5 3-1.6-8.2"/>',
  chart: '<path d="M5 20V11M11 20V5M17 20v-6M2.5 20.5h19"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7.5a4 4 0 018 0V11"/>',
  folder: '<path d="M3 6.5h6l2 2h10V19H3z"/>',
  fingerprint: '<path d="M12 11.5v4.5M8.5 8a5 5 0 018.5 3.5v2M7 11.5v2.5a8 8 0 001.2 4.3M12 3.5a8 8 0 018 8v1.5M4 11.5a8 8 0 012-5.3M15.5 21a10 10 0 001.4-5.2M12 7.5a4 4 0 00-4 4"/>',
  play: '<path d="M7 4.5l12.5 7.5L7 19.5z"/>',
  next: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  monitor: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.4 8-8 9-4.6-1-8-4-8-9V6z"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.2a2.5 2.5 0 014.9.6c0 1.6-2.5 2-2.5 3.7M12 17h.01"/>',
  alert: '<path d="M12 3.5l9.5 17h-19z"/><path d="M12 10v4.5M12 17.5h.01"/>',
  phone: '<rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18.5h2"/>',
  eye: '<path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  ear: '<path d="M7 9a5 5 0 0110 0c0 3-3 4-3 7a3 3 0 01-6 0"/><path d="M10 9.5a2 2 0 014 0"/>',
  note: '<path d="M5 3.5h10l4 4v13H5z"/><path d="M15 3.5v4h4M8 12h8M8 16h6"/>',
  anchor: '<circle cx="12" cy="5" r="2"/><path d="M12 7v14M8 11h8M4.5 14.5c.5 3.8 3.6 6.5 7.5 6.5s7-2.7 7.5-6.5"/>',
  eagle: '<path d="M2.5 8.5c3 0 5.5 1 7.5 3l2-4.5 2 4.5c2-2 4.5-3 7.5-3-1 3.5-3.5 6-6.5 6.5L12 21l-3-6.5C6 14 3.5 12 2.5 8.5z"/>',
  badge: '<path d="M12 2.5l2.2 2.3 3.1-.6.6 3.1 2.6 1.8-1.4 2.9 1.4 2.9-2.6 1.8-.6 3.1-3.1-.6L12 21.5l-2.2-2.3-3.1.6-.6-3.1-2.6-1.8L4.9 12 3.5 9.1l2.6-1.8.6-3.1 3.1.6z"/><path d="M12 8.5l1.1 2.2 2.4.3-1.8 1.7.5 2.4-2.2-1.2-2.2 1.2.5-2.4-1.8-1.7 2.4-.3z"/>',
  flame: '<path d="M12 2.5c1 3.5 5.5 5.5 5.5 10.5a5.5 5.5 0 01-11 0c0-2.5 1.2-4 2.5-5.2.2 1.8 1 3 2.2 3.4C10.6 8.5 11 5.5 12 2.5z"/>',
  chip: '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9.5 9.5h5v5h-5zM9 2.5V6M15 2.5V6M9 18v3.5M15 18v3.5M2.5 9H6M2.5 15H6M18 9h3.5M18 15h3.5"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>'
};
function icon(name, size, extra) {
  return '<svg class="ic" ' + (extra || '') + ' width="' + (size || 24) + '" height="' + (size || 24) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (IC[name] || IC.search) + '</svg>';
}
/* Evidence-marker tent: the answer label (A-D, or a check / X for Yes / No). */
function tent(label, size) {
  const s = size || 40, inner = label === 'yes' ? '<path d="M13 21l5 5 10-11" stroke="#0b1a33" stroke-width="3.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
    : label === 'no' ? '<path d="M14 14l12 12M26 14L14 26" stroke="#0b1a33" stroke-width="3.4" fill="none" stroke-linecap="round"/>'
    : '<text x="20" y="29" text-anchor="middle" font-family="Poppins,Arial,sans-serif" font-weight="700" font-size="19" fill="#0b1a33">' + label + '</text>';
  return '<svg class="tent" width="' + s + '" height="' + Math.round(s * .9) + '" viewBox="0 0 40 36" aria-hidden="true"><path d="M9 2.5h22l7.5 31h-37z" fill="#f2b705"/><path d="M1.5 33.5h37" stroke="#0b1a33" stroke-opacity=".35" stroke-width="2"/>' + inner + '</svg>';
}
/* The options a question offers, as [{label, sub, value, tag}] */
function optionsOf(c, r) {
  if (r.kind === 'word' || r.kind === 'order' || r.kind === 'draw') return [];
  if (r.kind === 'suspect') return c.suspects.map(s => ({ label: s.name, sub: s.role, value: s.id, tag: s.letter, img: s.img }));
  if (r.kind === 'spot') return [0, 1, 2, 3].map(i => ({ label: r.options ? r.options[i] : 'Marker ' + 'ABCD'[i], value: i, tag: 'ABCD'[i] }));
  if (r.kind === 'pics') return r.options.map((o, i) => ({ label: o.label, img: o.img, value: i, tag: 'ABCD'[i] }));
  if (r.kind === 'yn') return r.options.map((o, i) => ({ label: o, value: i, tag: i === 0 ? 'yes' : 'no' }));
  return r.options.map((o, i) => ({ label: o, value: i, tag: 'ABCD'[i] }));
}
const BLOCK = { test: t => isBad(t) };  /* kept for older callers: BLOCK.test(text) */
/* Classroom filter: catches swears, body/crude words and the usual dodges (l33t, spaces, dots, repeated letters). */
const BAD_SUB = ['murder','suicid','homosex','transgend','killedsomeone','killsomeone','shotsomeone','shootsomeone','killanyone','shotanyone','fuck','fuk','fck','fuq','shit','sh1t','bitch','biatch','cunt','pussy','puss','nigg','nigr','whore','slut','bastard','asshole','arsehole','porn','penis','penus','peen','vagina','vajay','vulva','douche','dildo','jizz','boner','horny','blowjob','handjob','masturb','orgasm','ejacul','testicle','scrotum','nutsack','ballsack','titties','titty','boobie','boobs','booty','butthole','buttcrack','peehole','weiner','wiener','schlong','dickhead','cocksucker','motherf','stfu','killyourself','kysnow','nazi','hitler','retard','queef','smegma','anus','condom','tampon','pubes','pubic','thong','hentai','onlyfans','sexy','sexting','nudes','naked','fart'];
const BAD_WORD = ['gay','gays','lesbian','lesbo','homo','homos','queer','bisexual','trans','tranny','kill','kills','killed','killing','killer','murder','murders','murdered','murderer','shoot','shoots','shot','shooting','dead','die','died','dying','blood','bloody','suicide','stab','stabbed','racist','sexist','single','girlfriend','boyfriend','anal','rapist','vag','vaj','ass','asses','arse','butt','butts','dick','dicks','dik','cock','cocks','fag','fags','sex','cum','tit','tits','boob','nude','pee','peepee','poop','poo','crap','piss','balls','nuts','pp','thot','hoe','hoes','kys','rape','raped','damn','dammit','hell','bra','panties','wtf','lmfao','stfu','gtfo','omfg','milf','dildo','turd','deez','ligma','sugma','suck','sucks','sucker','pecker','junk','nipple','nipples','crotch','groin','weed','vape','beer','drunk','idiot','dumbass','loser'];
/* order rounds: hide the printed time while students answer, show it at the reveal */
function noTime(s) { return String(s).replace(/^[^:]*?\d{1,2}:\d{2}\s*[AP]M[^:]*:\s*/i, ''); }
function isBad(t) {
  const low = String(t || '').toLowerCase().replace(/[0@4]/g, m => ({ '0': 'o', '@': 'a', '4': 'a' })[m]).replace(/[1!|]/g, 'i').replace(/3/g, 'e').replace(/[5$]/g, 's').replace(/7/g, 't').replace(/8/g, 'b');
  const ALLOW = /scunthorpe|therapist|analys|analog|canal|banal|penistone|cocktail|cockpit|peacock|hancock|dickens|dickinson|arsenal|shitake|shiitake|cumber|document|circumstanc|titan|title|constitut|competit|petit|repetit|pass|class|assass|assist|assign|assum|assembl|assess|grass|mass|bass|brass|glass|hello|shell|butter|button|buttress|scrap|hellen|michelle|rochelle/g;
  const squash = low.replace(ALLOW, '').replace(/[^a-z]/g, '').replace(/(.)\1+/g, '$1');
  const squash2 = low.replace(ALLOW, '').replace(/[^a-z]/g, '').replace(/(.)\1{2,}/g, '$1$1');
  if (BAD_SUB.some(w => { const d = w.replace(/(.)\1+/g, '$1'); return squash2.includes(w) || ((d === w || d.length >= 5) && squash.includes(d)); })) return true;
  const words = low.replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(Boolean);
  const w2 = words.map(w => w.replace(/(.)\1{2,}/g, '$1$1'));
  const wset = new Set(words.concat(w2, words.map(w => w.replace(/(.)\1+/g, '$1')), w2.map(w => w.replace(/s$/, ''))));
  if (BAD_WORD.some(w => wset.has(w))) return true;
  /* spaced-out letters: "p e n i s", "a s s" */
  const singles = low.match(/\b([a-z])(?:[\s._\-*]+[a-z]\b)+/g) || [];
  return singles.some(g => { const j = g.replace(/[^a-z]/g, ''); return BAD_WORD.some(w => w.length >= 3 ? j.includes(w) : j === w) || BAD_SUB.some(w => j.includes(w)); });
}
function cleanWord(v) { return String(v || '').toLowerCase().replace(/[^a-z0-9 '-]/g, ' ').replace(/\s+/g, ' ').trim().split(' ').slice(0, 3).join(' ').slice(0, 24); }
function isRight(r, v) {
  if (v === undefined || v === null || r.scored === false) return false;
  if (r.kind === 'word') {
    const w = cleanWord(v), toks = w.split(' ');
    if (toks.some(t => /^(not|no|dont|don't|never|without)$/.test(t))) return false;
    return !!(r.accept || []).some(a => a.includes(' ') ? (' ' + w + ' ').includes(' ' + a + ' ') || (' ' + w).includes(' ' + a) : toks.some(t => t.startsWith(a)));
  }
  return String(v) === String(r.answer);
}
function caseById(id) { return CASES.find(c => c.id === id) || CASES[0]; }
function clearedBy(c, pos) { const out = {}; c.rounds.forEach((r, i) => { if (i <= pos && r.clears) r.clears.forEach(id => out[id] = r.title); }); return out; }
/* An evidence photo; spot questions get lettered markers, `hit` = index of the right marker once revealed */
function evHTML(r, opt) {
  opt = opt || {};
  const mk = r.kind === 'spot' && r.marks ? r.marks.map((m, i) => `<span class="mk${opt.hit == null ? '' : i === opt.hit ? ' hit' : ' miss'}" style="left:${m[0]}%;top:${m[1]}%">${tent('ABCD'[i], opt.small ? 34 : 60)}</span>`).join('') : '';
  const kb = opt.still ? '' : ' kb' + (String(r.img || '').length % 3);  /* slow zoom/pan; markers move with the photo */
  return `<div class="ev"${opt.style ? ' style="' + opt.style + '"' : ''}><div class="kbw${kb}"><img src="${esc(r.img)}" alt=""${opt.blur ? ' id="blurimg" style="filter:blur(' + opt.blur + 'px)"' : ''}>${mk}</div></div>`;
}
function suspectsHTML(c, pos, given) {
  if (c.v >= 2) return c.suspects.map(x => `<div class="sus v2"${x.color ? ' style="border-top-color:' + ({ red: '#e5484d', blue: '#3b82f6', yellow: '#f2b705', green: '#22a06b' }[x.color]) + '"' : ''}><div class="ptop"><img class="pimg" src="${esc(x.img)}" alt="">${tent(x.letter, 40)}</div><h3>${esc(x.name)}</h3><div class="role">${esc(x.role)}</div><p>${esc(x.motive ? 'Motive: ' + x.motive : x.desc)}</p></div>`).join('');
  const cl = given || (pos == null ? {} : clearedBy(c, pos));
  return c.suspects.map(x => `<div class="sus${cl[x.id] ? ' cleared' : ''}">${cl[x.id] ? '<span class="vstamp">ALIBI VERIFIED</span>' : ''}<div class="sus-top"><div class="av">${icon('user', 40)}</div>${tent(x.letter, 38)}</div><h3>${esc(x.name)}</h3><div class="role">${esc(x.role)}</div><p>${esc(x.desc)}</p></div>`).join('');
}

/* Join avatars (no emoji) and squad names for team games */
/* Join avatars: 16 cartoon detectives (media/av/d1..d16.png). Old icon names still render as line icons. */
const AVATARS = Array.from({ length: 16 }, (_, i) => 'd' + (i + 1));
function avHTML(a, size, extra) {
  const s = size || 28;
  if (/^d([1-9]|1[0-6])$/.test(a || '')) return '<img class="avi" src="media/av/' + a + '.png" width="' + s + '" height="' + s + '" alt=""' + (extra ? ' ' + extra : '') + '>';
  return icon(a || 'badge', s, extra);
}
/* Funny random names (Andre 10.21.26: "a bunch of fake funny detective names") */
const SQUADS = ['The Clue Crew', 'The Hunch Bunch', 'Case Crackers', 'The Donut Squad', 'Fingerprint Fanatics', 'The Alibi Breakers', 'Red String Gang', 'The Snack Break Squad', 'Suspicious Potatoes', 'The Plot Twisters',
  'Magnifying Glass Mafia', 'The Sock Detectives', 'Team No Alibi', 'The Sticky Notes', 'Mystery Meatballs', 'The Night Owls', 'Evidence Bag Bandits', 'The Side-Eye Squad', 'The Usual Snacks', 'Trench Coat Club',
  'The Cold Case Crew', 'The Big Brain Bureau', 'Squad Goals Unit', 'The Fedora Five', 'Team Plot Armor', 'The Spoiler Alerts', 'Detective Pickles', 'The Paperclip Patrol', 'The Waffle Watch', 'Clue-tastrophe',
  'The Lost Keys Unit', 'The Hot Sauce Unit', 'Sus Squad', 'The Footprint Finders', 'Team Gut Feeling', 'The Whodunits', 'The Caffeine Cops', 'The Smoking Guns', 'Case Closed Crew', 'Lunch Money Lab'];
const NAME_TITLES = ['Det.', 'Inspector', 'Agent', 'Sgt.', 'Captain', 'Lt.', 'Officer', 'Chief'];
const NAME_FUNNY = ['Crumbs', 'Waffles', 'Pickles', 'Nacho Average', 'Sticky Note', 'Snack Break', 'Hot Sauce', 'Lost Keys', 'Squeaky Shoes', 'Pancake', 'Double Cheese', 'Paperclip', 'Mustard Stain',
  'Snoozebutton', 'Hunch', 'Noodles', 'Meatball', 'Sprinkles', 'Toast', 'Burrito', 'Donut Duty', 'Cliffhanger', 'Side-Eye', 'Big Clue', 'Tiny Clue', 'Plot Twist', 'Red Herring', 'No Alibi', 'Cold Fries',
  'Sock Puppet', 'Kazoo', 'Bubble Wrap', 'Lunch Money', 'Gym Socks', 'Wi-Fi', 'Group Chat', 'Spoiler Alert', 'Read Receipt', 'Mac N Cheese', 'Gut Feeling', 'Sus', 'Fun Size', 'Snickerdoodle', 'Hashbrown'];

const validId = id => typeof id === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(id);
