// Step Dice (test): a drum step sequencer that writes its pattern as notes into a MIDI clip
// over LUNA's loop, so LUNA plays it sample-accurate. Every edit rewrites the loop's notes while
// it plays; the die rolls a new pattern, or a variation of this one.

(() => {
  const $ = (id) => document.getElementById(id);
  const VERSION = '1.0.0';
  const KEY = 'com.fedetrillo.stepdice.';
  const store = {
    get: (k) => { try { return JSON.parse(localStorage.getItem(KEY + k)); } catch { return null; } },
    set: (k, v) => { try { localStorage.setItem(KEY + k, JSON.stringify(v)); } catch { /* not fatal */ } },
  };

  const I18N = {
    es: { _name: 'Español', useTrack: 'Usar la seleccionada', noTarget: 'Sin pista: selecciona una de instrumento →', target: '<b>{t}</b> · {where} {from} → {to}', loop: 'bucle', sel: 'selección', barAt: 'compás',
      steps: 'Pasos', res: 'Figura', live: 'En directo', write: 'Escribir', dens: 'Densidad', sparse: 'poca', medium: 'media', dense: 'mucha', vary: 'Variar', copy: 'Copiar patrón', paste: 'Pegar patrón', clear: 'Borrar',
      diceTip: 'Patrón nuevo (respeta las filas bloqueadas)', roll: 'Tirar', rowDice: 'Dado para esta fila', lock: 'Bloquear fila', mute: 'Silenciar fila',
      hint: 'Clic: pone el golpe elegido (Mayús+clic: acento · Alt+clic: suave) · clic derecho: cambia la fuerza · encima de cada grupo: repetir el anterior, copiar, pegar y variar.',
      written: 'Escrito: {n} notas en {ms} ms', partial: 'El rango toca un clip MIDI sin cubrirlo: amplía el clip o elige un hueco libre.', failed: 'Error: {e}', copied: 'Patrón copiado', pasted: 'Patrón pegado', waiting: 'Esperando a LUNA…', noSession: 'Abre una sesión en LUNA.', report: 'Informe copiado', dark: 'Oscuro', grey: 'Gris',
      gen: 'Generador', kHits: 'Golpes', kPattern: 'Patrón', kShift: 'Desplazar', kVel: 'Fuerza', even: 'reparto', auto: 'Auto', generate: 'Generar', genRollTip: 'Patrón al azar para esta fila', rowEditTip: 'clic para editar en el generador; rueda: más o menos golpes', hit: 'Golpe', hitNormal: 'Normal', hitAccent: 'Acento', hitSoft: 'Suave', clip: 'Clip', clipPh: 'nombre…', repeatPrev: 'Repetir los 8 pasos anteriores aquí', blockCopy: 'Copiar estos pasos', blockPaste: 'Pegar aquí los pasos copiados', blockVary: 'Variar solo estos pasos', blockCopied: 'Pasos {b} copiados',
      rows: ['Bombo', 'Caja', 'Palmas', 'Charles cerrado', 'Charles abierto', 'Tom grave', 'Tom agudo', 'Crash'] },
    en: { _name: 'English', useTrack: 'Use selected', noTarget: 'No track: select an instrument track →', target: '<b>{t}</b> · {where} {from} → {to}', loop: 'loop', sel: 'selection', barAt: 'bar',
      steps: 'Steps', res: 'Note', live: 'Live', write: 'Write', dens: 'Density', sparse: 'low', medium: 'mid', dense: 'high', vary: 'Vary', copy: 'Copy pattern', paste: 'Paste pattern', clear: 'Clear',
      diceTip: 'New pattern (keeps locked rows)', roll: 'Roll', rowDice: 'Roll this row', lock: 'Lock row', mute: 'Mute row',
      hint: 'Click: places the chosen hit (Shift-click: accent · Alt-click: soft) · right-click: changes velocity · above each group: repeat the previous one, copy, paste and vary.',
      written: 'Written: {n} notes in {ms} ms', partial: 'The range touches a MIDI clip without covering it: extend the clip or pick an empty gap.', failed: 'Error: {e}', copied: 'Pattern copied', pasted: 'Pattern pasted', waiting: 'Waiting for LUNA…', noSession: 'Open a session in LUNA.', report: 'Report copied', dark: 'Dark', grey: 'Grey',
      gen: 'Generator', kHits: 'Hits', kPattern: 'Pattern', kShift: 'Shift', kVel: 'Velocity', even: 'even', auto: 'Auto', generate: 'Generate', genRollTip: 'Random pattern for this row', rowEditTip: 'click to edit in the generator; wheel: more or fewer hits', hit: 'Hit', hitNormal: 'Normal', hitAccent: 'Accent', hitSoft: 'Soft', clip: 'Clip', clipPh: 'name…', repeatPrev: 'Repeat the previous 8 steps here', blockCopy: 'Copy these steps', blockPaste: 'Paste the copied steps here', blockVary: 'Vary only these steps', blockCopied: 'Steps {b} copied',
      rows: ['Kick', 'Snare', 'Clap', 'Closed hat', 'Open hat', 'Low tom', 'High tom', 'Crash'] },
    ca: { _name: 'Català', useTrack: 'Fer servir la seleccionada', noTarget: 'Sense pista: selecciona’n una d’instrument →', target: '<b>{t}</b> · {where} {from} → {to}', loop: 'bucle', sel: 'selecció', barAt: 'compàs',
      steps: 'Passos', res: 'Figura', live: 'En directe', write: 'Escriure', dens: 'Densitat', sparse: 'poca', medium: 'mitjana', dense: 'molta', vary: 'Variar', copy: 'Copiar patró', paste: 'Enganxar patró', clear: 'Esborrar',
      diceTip: 'Patró nou (respecta les files bloquejades)', roll: 'Tirar', rowDice: 'Dau per a aquesta fila', lock: 'Bloquejar fila', mute: 'Silenciar fila',
      hint: 'Clic: posa el cop triat (Maj+clic: accent · Alt+clic: suau) · clic dret: canvia la força · damunt de cada grup: repetir l’anterior, copiar, enganxar i variar.',
      written: 'Escrit: {n} notes en {ms} ms', partial: 'El rang toca un clip MIDI sense cobrir-lo: allarga el clip o tria un buit.', failed: 'Error: {e}', copied: 'Patró copiat', pasted: 'Patró enganxat', waiting: 'Esperant LUNA…', noSession: 'Obre una sessió a LUNA.', report: 'Informe copiat', dark: 'Fosc', grey: 'Gris',
      gen: 'Generador', kHits: 'Cops', kPattern: 'Patró', kShift: 'Desplaçar', kVel: 'Força', even: 'repartit', auto: 'Auto', generate: 'Generar', genRollTip: 'Patró a l’atzar per a aquesta fila', rowEditTip: 'clic per editar al generador; roda: més o menys cops', hit: 'Cop', hitNormal: 'Normal', hitAccent: 'Accent', hitSoft: 'Suau', clip: 'Clip', clipPh: 'nom…', repeatPrev: 'Repetir aquí els 8 passos anteriors', blockCopy: 'Copiar aquests passos', blockPaste: 'Enganxar aquí els passos copiats', blockVary: 'Variar només aquests passos', blockCopied: 'Passos {b} copiats',
      rows: ['Bombo', 'Caixa', 'Picada de mans', 'Charles tancat', 'Charles obert', 'Tom greu', 'Tom agut', 'Crash'] },
    fr: { _name: 'Français', useTrack: 'Prendre la sélection', noTarget: 'Pas de piste : sélectionnez une piste d’instrument →', target: '<b>{t}</b> · {where} {from} → {to}', loop: 'boucle', sel: 'sélection', barAt: 'mesure',
      steps: 'Pas', res: 'Valeur', live: 'En direct', write: 'Écrire', dens: 'Densité', sparse: 'faible', medium: 'moyenne', dense: 'forte', vary: 'Varier', copy: 'Copier le motif', paste: 'Coller le motif', clear: 'Effacer',
      diceTip: 'Nouveau motif (garde les rangées verrouillées)', roll: 'Lancer', rowDice: 'Dé pour cette rangée', lock: 'Verrouiller la rangée', mute: 'Couper la rangée',
      hint: 'Clic : place le coup choisi (Maj+clic : accent · Alt+clic : doux) · clic droit : change la vélocité · au-dessus de chaque groupe : répéter le précédent, copier, coller et varier.',
      written: 'Écrit : {n} notes en {ms} ms', partial: 'La plage touche un clip MIDI sans le couvrir : allongez le clip ou choisissez un espace vide.', failed: 'Erreur : {e}', copied: 'Motif copié', pasted: 'Motif collé', waiting: 'En attente de LUNA…', noSession: 'Ouvrez une session dans LUNA.', report: 'Rapport copié', dark: 'Sombre', grey: 'Gris',
      gen: 'Générateur', kHits: 'Coups', kPattern: 'Motif', kShift: 'Décaler', kVel: 'Vélocité', even: 'régulier', auto: 'Auto', generate: 'Générer', genRollTip: 'Motif au hasard pour cette rangée', rowEditTip: 'clic pour éditer dans le générateur ; molette : plus ou moins de coups', hit: 'Coup', hitNormal: 'Normal', hitAccent: 'Accent', hitSoft: 'Doux', clip: 'Clip', clipPh: 'nom…', repeatPrev: 'Répéter ici les 8 pas précédents', blockCopy: 'Copier ces pas', blockPaste: 'Coller ici les pas copiés', blockVary: 'Varier seulement ces pas', blockCopied: 'Pas {b} copiés',
      rows: ['Grosse caisse', 'Caisse claire', 'Clap', 'Charleston fermé', 'Charleston ouvert', 'Tom basse', 'Tom aigu', 'Crash'] },
    de: { _name: 'Deutsch', useTrack: 'Auswahl nehmen', noTarget: 'Keine Spur: wähle eine Instrumentenspur →', target: '<b>{t}</b> · {where} {from} → {to}', loop: 'Loop', sel: 'Auswahl', barAt: 'Takt',
      steps: 'Schritte', res: 'Notenwert', live: 'Live', write: 'Schreiben', dens: 'Dichte', sparse: 'wenig', medium: 'mittel', dense: 'viel', vary: 'Variieren', copy: 'Pattern kopieren', paste: 'Pattern einfügen', clear: 'Löschen',
      diceTip: 'Neues Pattern (gesperrte Zeilen bleiben)', roll: 'Würfeln', rowDice: 'Diese Zeile würfeln', lock: 'Zeile sperren', mute: 'Zeile stumm',
      hint: 'Klick: setzt den gewählten Schlag (Umschalt-Klick: Akzent · Alt-Klick: leise) · Rechtsklick: ändert die Stärke · über jeder Gruppe: vorige wiederholen, kopieren, einfügen und variieren.',
      written: 'Geschrieben: {n} Noten in {ms} ms', partial: 'Der Bereich berührt einen MIDI-Clip, ohne ihn abzudecken: verlängere den Clip oder nimm eine Lücke.', failed: 'Fehler: {e}', copied: 'Pattern kopiert', pasted: 'Pattern eingefügt', waiting: 'Warte auf LUNA…', noSession: 'Öffne eine Session in LUNA.', report: 'Bericht kopiert', dark: 'Dunkel', grey: 'Grau',
      gen: 'Generator', kHits: 'Schläge', kPattern: 'Pattern', kShift: 'Verschieben', kVel: 'Stärke', even: 'gleichmäßig', auto: 'Auto', generate: 'Erzeugen', genRollTip: 'Zufälliges Pattern für diese Zeile', rowEditTip: 'Klick: im Generator bearbeiten; Mausrad: mehr oder weniger Schläge', hit: 'Schlag', hitNormal: 'Normal', hitAccent: 'Akzent', hitSoft: 'Leise', clip: 'Clip', clipPh: 'Name…', repeatPrev: 'Die vorigen 8 Schritte hier wiederholen', blockCopy: 'Diese Schritte kopieren', blockPaste: 'Kopierte Schritte hier einfügen', blockVary: 'Nur diese Schritte variieren', blockCopied: 'Schritte {b} kopiert',
      rows: ['Bassdrum', 'Snare', 'Clap', 'Hi-Hat geschlossen', 'Hi-Hat offen', 'Tom tief', 'Tom hoch', 'Crash'] },
    it: { _name: 'Italiano', useTrack: 'Usa la selezionata', noTarget: 'Nessuna traccia: selezionane una strumento →', target: '<b>{t}</b> · {where} {from} → {to}', loop: 'loop', sel: 'selezione', barAt: 'battuta',
      steps: 'Passi', res: 'Figura', live: 'Dal vivo', write: 'Scrivi', dens: 'Densità', sparse: 'bassa', medium: 'media', dense: 'alta', vary: 'Varia', copy: 'Copia pattern', paste: 'Incolla pattern', clear: 'Cancella',
      diceTip: 'Nuovo pattern (rispetta le righe bloccate)', roll: 'Tira', rowDice: 'Dado per questa riga', lock: 'Blocca riga', mute: 'Muta riga',
      hint: 'Clic: mette il colpo scelto (Maiusc+clic: accento · Alt+clic: morbido) · clic destro: cambia la forza · sopra ogni gruppo: ripeti il precedente, copia, incolla e varia.',
      written: 'Scritte {n} note in {ms} ms', partial: 'L’intervallo tocca un clip MIDI senza coprirlo: allunga il clip o scegli uno spazio vuoto.', failed: 'Errore: {e}', copied: 'Pattern copiato', pasted: 'Pattern incollato', waiting: 'In attesa di LUNA…', noSession: 'Apri una sessione in LUNA.', report: 'Rapporto copiato', dark: 'Scuro', grey: 'Grigio',
      gen: 'Generatore', kHits: 'Colpi', kPattern: 'Pattern', kShift: 'Sposta', kVel: 'Forza', even: 'regolare', auto: 'Auto', generate: 'Genera', genRollTip: 'Pattern a caso per questa riga', rowEditTip: 'clic per modificare nel generatore; rotella: più o meno colpi', hit: 'Colpo', hitNormal: 'Normale', hitAccent: 'Accento', hitSoft: 'Morbido', clip: 'Clip', clipPh: 'nome…', repeatPrev: 'Ripeti qui gli 8 passi precedenti', blockCopy: 'Copia questi passi', blockPaste: 'Incolla qui i passi copiati', blockVary: 'Varia solo questi passi', blockCopied: 'Passi {b} copiati',
      rows: ['Cassa', 'Rullante', 'Battito di mani', 'Charleston chiuso', 'Charleston aperto', 'Tom basso', 'Tom alto', 'Crash'] },
    pt: { _name: 'Português', useTrack: 'Usar a selecionada', noTarget: 'Sem faixa: seleciona uma de instrumento →', target: '<b>{t}</b> · {where} {from} → {to}', loop: 'loop', sel: 'seleção', barAt: 'compasso',
      steps: 'Passos', res: 'Figura', live: 'Ao vivo', write: 'Escrever', dens: 'Densidade', sparse: 'pouca', medium: 'média', dense: 'muita', vary: 'Variar', copy: 'Copiar padrão', paste: 'Colar padrão', clear: 'Apagar',
      diceTip: 'Padrão novo (respeita as linhas bloqueadas)', roll: 'Lançar', rowDice: 'Dado para esta linha', lock: 'Bloquear linha', mute: 'Silenciar linha',
      hint: 'Clique: põe o golpe escolhido (Shift+clique: acento · Alt+clique: suave) · clique direito: muda a força · por cima de cada grupo: repetir o anterior, copiar, colar e variar.',
      written: 'Escrito: {n} notas em {ms} ms', partial: 'O intervalo toca num clip MIDI sem o cobrir: alonga o clip ou escolhe um espaço vazio.', failed: 'Erro: {e}', copied: 'Padrão copiado', pasted: 'Padrão colado', waiting: 'À espera do LUNA…', noSession: 'Abre uma sessão no LUNA.', report: 'Relatório copiado', dark: 'Escuro', grey: 'Cinzento',
      gen: 'Gerador', kHits: 'Golpes', kPattern: 'Padrão', kShift: 'Deslocar', kVel: 'Força', even: 'regular', auto: 'Auto', generate: 'Gerar', genRollTip: 'Padrão ao acaso para esta linha', rowEditTip: 'clique para editar no gerador; roda: mais ou menos golpes', hit: 'Golpe', hitNormal: 'Normal', hitAccent: 'Acento', hitSoft: 'Suave', clip: 'Clip', clipPh: 'nome…', repeatPrev: 'Repetir aqui os 8 passos anteriores', blockCopy: 'Copiar estes passos', blockPaste: 'Colar aqui os passos copiados', blockVary: 'Variar só estes passos', blockCopied: 'Passos {b} copiados',
      rows: ['Bombo', 'Tarola', 'Palmas', 'Hi-hat fechado', 'Hi-hat aberto', 'Timbalão grave', 'Timbalão agudo', 'Crash'] },
  };
  let lang = store.get('lang') ?? (() => { for (const l of navigator.languages ?? [navigator.language]) { const c = String(l || '').slice(0, 2).toLowerCase(); if (I18N[c]) return c; } return 'en'; })();
  if (!I18N[lang]) lang = 'en';
  const t = (k, v = {}) => String(I18N[lang][k] ?? I18N.en[k] ?? k).replace(/\{(\w+)\}/g, (m, x) => (x in v ? String(v[x]) : m));
  let theme = store.get('theme') === 'grey' ? 'grey' : 'dark';
  let statusTimer;
  const say = (key, vars = {}, kind = '', ms = 0) => { clearTimeout(statusTimer); $('status').textContent = key ? t(key, vars) : ''; $('status').className = `status ${kind}`; if (ms) statusTimer = setTimeout(() => say(null), ms); };
  const log = [];
  const note = (what, extra = {}) => { log.push({ t: new Date().toISOString().slice(11, 23), what, ...extra }); if (log.length > 150) log.shift(); };
  const errText = (e) => String(e?.message || e);

  // ---- Pattern ---------------------------------------------------------------------------------
  // Rows are General MIDI drums by default; each row's note can be changed.
  const ROW_NOTES = [36, 38, 39, 42, 46, 45, 50, 49];
  const ROW_KIND = ['kick', 'snare', 'clap', 'chh', 'ohh', 'tom', 'tom', 'crash'];
  const VELS = [0, 100, 127, 60];
  const STEP_CHOICES = [8, 12, 16, 24, 32];
  const RES = { '1/8': 1 / 2, '1/16': 1 / 4, '1/32': 1 / 8, '1/8T': 1 / 3, '1/16T': 1 / 6 };
  const saved = store.get('state') ?? {};
  const st = {
    steps: saved.steps ?? 16, res: saved.res ?? '1/16', dens: saved.dens ?? 'medium', live: saved.live ?? true,
    notes: saved.notes ?? ROW_NOTES.slice(), locked: saved.locked ?? ROW_NOTES.map(() => false), muted: saved.muted ?? ROW_NOTES.map(() => false),
    grid: saved.grid ?? ROW_NOTES.map(() => new Array(32).fill(0)),
    hit: saved.hit ?? 100, clipName: saved.clipName ?? '', selRow: saved.selRow ?? 0, auto: saved.auto ?? true,
    gen: saved.gen ?? ROW_NOTES.map(() => ({ hits: 4, pattern: 0, shift: 0, vel: 100 })),
  };
  const saveState = () => store.set('state', st);
  const history = [JSON.stringify(st.grid)];
  let hpos = 0;
  const remember = () => { history.splice(hpos + 1); history.push(JSON.stringify(st.grid)); if (history.length > 50) history.shift(); hpos = history.length - 1; };
  let clipboard = store.get('clip');

  // How likely each kind of drum is on each step, by its place in the beat.
  function weight(kind, i, perBeat) {
    const pos = i % perBeat, beat = Math.floor(i / perBeat), onBeat = pos === 0, half = perBeat % 2 === 0 && pos === perBeat / 2;
    switch (kind) {
      case 'kick': return beat % 4 === 0 && onBeat ? 0.95 : beat % 2 === 0 && onBeat ? 0.6 : onBeat ? 0.25 : half ? 0.15 : 0.06;
      case 'snare': return (beat % 4 === 1 || beat % 4 === 3) && onBeat ? 0.92 : onBeat ? 0.05 : 0.07;
      case 'clap': return (beat % 4 === 1 || beat % 4 === 3) && onBeat ? 0.35 : 0.02;
      case 'chh': return onBeat ? 0.85 : half ? 0.75 : 0.3;
      case 'ohh': return half ? 0.25 : 0.03;
      case 'tom': return beat % 4 === 3 ? 0.18 : 0.03;
      case 'crash': return i === 0 ? 0.45 : 0;
      default: return 0.2;
    }
  }
  const DENS = { sparse: 0.6, medium: 1, dense: 1.45 };
  const perBeat = () => Math.max(1, Math.round(1 / RES[st.res]));
  function rollCell(r, i) {
    const p = Math.min(0.98, weight(ROW_KIND[r], i, perBeat()) * DENS[st.dens]);
    if (Math.random() >= p) return 0;
    const accent = i % perBeat() === 0 && Math.random() < 0.5;
    const ghost = ROW_KIND[r] === 'snare' && i % perBeat() !== 0;
    return ghost ? 60 : accent ? 127 : 100;
  }
  function roll(rows) {
    for (const r of rows) if (!st.locked[r]) for (let i = 0; i < st.steps; i++) st.grid[r][i] = rollCell(r, i);
  }
  function vary() {
    // Change about one cell in eight, the way the die would have rolled it.
    for (let r = 0; r < st.grid.length; r++) {
      if (st.locked[r]) continue;
      for (let i = 0; i < st.steps; i++) if (Math.random() < 0.12) st.grid[r][i] = st.grid[r][i] ? (Math.random() < 0.6 ? 0 : st.grid[r][i]) : rollCell(r, i);
    }
  }


  // ---- Row generator, in the spirit of Ableton's Rhythm generator -------------------------------
  // Hits spread over the steps (pattern 0 = evenly, Euclidean), other patterns are seeded
  // variations that still favour the strong steps for that drum, then shifted.
  const seeded = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let x = Math.imul(seed ^ (seed >>> 15), 1 | seed); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
  function genRow(r) {
    const g = st.gen[r], n = st.steps, k = Math.max(0, Math.min(n, g.hits));
    let on = new Array(n).fill(false);
    if (g.pattern === 0) { for (let j = 0; j < k; j++) on[Math.floor((j * n) / k)] = true; }
    else {
      const rnd = seeded(g.pattern * 7919 + r * 104729 + n);
      const score = Array.from({ length: n }, (_, i) => ({ i, v: (weight(ROW_KIND[r], i, perBeat()) + 0.08) * (0.35 + rnd()) }));
      score.sort((a, b) => b.v - a.v).slice(0, k).forEach(({ i }) => { on[i] = true; });
    }
    const sh = ((g.shift % n) + n) % n;
    if (sh) on = on.map((_, i) => on[(i - sh + n) % n]);
    for (let i = 0; i < n; i++) st.grid[r][i] = on[i] ? (st.grid[r][i] && g.vel === 100 ? st.grid[r][i] : g.vel) : 0;
  }

  // ---- Grid view ---------------------------------------------------------------------------------
  const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const midiName = (p) => `${NOTE_NAMES[p % 12]}${Math.floor(p / 12) - 1}`;
  let onChange = () => {};
  let audition = () => {};
  let nowStep = -1;
  // Drawn icons, so they follow the theme colour.
  const PIPS = { 1: [[2, 2]], 2: [[1, 1], [3, 3]], 3: [[1, 1], [2, 2], [3, 3]], 4: [[1, 1], [3, 1], [1, 3], [3, 3]], 5: [[1, 1], [3, 1], [2, 2], [1, 3], [3, 3]], 6: [[1, 1], [3, 1], [1, 2], [3, 2], [1, 3], [3, 3]] };
  const die = (face = 5) => `<svg viewBox="0 0 24 24" class="ico"><rect x="2.5" y="2.5" width="19" height="19" rx="5" fill="none" stroke="currentColor" stroke-width="1.8"/>${PIPS[face].map(([x, y]) => `<circle cx="${2.5 + x * 4.75}" cy="${2.5 + y * 4.75}" r="1.7" fill="currentColor"/>`).join('')}</svg>`;
  const lockIco = (on) => `<svg viewBox="0 0 24 24" class="ico"><rect x="5" y="10.5" width="14" height="10" rx="2.5" fill="${on ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.8"/><path d="M8 10.5V8a4 4 0 0 1 ${on ? '8 0v2.5' : '7.6-1.8'}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
  const copyIco = '<svg viewBox="0 0 24 24" class="ico"><rect x="8" y="8" width="12" height="12" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M16 5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>';
  const pasteIco = '<svg viewBox="0 0 24 24" class="ico"><rect x="5" y="5" width="14" height="16" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="9" y="3" width="6" height="4" rx="1.2" fill="currentColor"/><path d="M9 13h6M9 16.5h4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
  const repeatIco = '<svg viewBox="0 0 24 24" class="ico"><path d="M4 12a7 7 0 0 1 12-4.9M20 12a7 7 0 0 1-12 4.9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M16.5 3.5v4h-4M7.5 20.5v-4h4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const iconBtn = (html, title, onclick, cls = '') => { const b = document.createElement('button'); b.className = `ib ${cls}`; b.innerHTML = html; b.title = title; b.setAttribute('aria-label', title); b.onclick = onclick; return b; };

  // Blocks of 8 steps (6 for 12 steps), each with copy, paste, repeat-previous and a die.
  const blockLen = () => (st.steps % 8 === 0 ? 8 : st.steps / 2);
  let blockClip = store.get('blockClip');
  const edited = () => { remember(); saveState(); drawGrid(); onChange(); };
  function blockCopy(b) { const L = blockLen(); blockClip = st.grid.map((row) => row.slice(b * L, b * L + L)); store.set('blockClip', blockClip); say('blockCopied', { b: `${b * L + 1}–${b * L + L}` }, 'ok', 2000); drawGrid(); }
  function blockPaste(b, src) {
    const L = blockLen(), data = src ?? blockClip;
    if (!data) return;
    st.grid.forEach((row, r) => { for (let i = 0; i < L; i++) row[b * L + i] = data[r]?.[i % data[r].length] ?? 0; });
    edited();
  }
  function blockVary(b) {
    const L = blockLen();
    for (let r = 0; r < st.grid.length; r++) {
      if (st.locked[r]) continue;
      for (let i = b * L; i < b * L + L; i++) if (Math.random() < 0.2) st.grid[r][i] = st.grid[r][i] ? (Math.random() < 0.6 ? 0 : st.grid[r][i]) : rollCell(r, i);
    }
    edited();
  }

  function drawGrid() {
    const g = $('grid');
    g.style.gridTemplateColumns = `262px repeat(${st.steps}, minmax(16px, 1fr))`;
    const kids = [];
    const L = blockLen(), blocks = st.steps / L;
    // Block bar.
    kids.push(Object.assign(document.createElement('div'), { className: 'corner' }));
    for (let b = 0; b < blocks; b++) {
      const bar = document.createElement('div');
      bar.className = `block${b ? ' gap' : ''}`;
      bar.style.gridColumn = `${2 + b * L} / span ${L}`;
      const lab = Object.assign(document.createElement('span'), { className: 'blab', textContent: `${b * L + 1}–${b * L + L}` });
      bar.append(lab);
      if (b > 0) bar.append(iconBtn(repeatIco, t('repeatPrev'), () => blockPaste(b, st.grid.map((row) => row.slice((b - 1) * L, b * L)))));
      bar.append(iconBtn(copyIco, t('blockCopy'), () => blockCopy(b)), iconBtn(pasteIco, t('blockPaste'), () => blockPaste(b), blockClip ? '' : 'off'), iconBtn(die(3), t('blockVary'), () => blockVary(b)));
      kids.push(bar);
    }
    // Step numbers.
    kids.push(Object.assign(document.createElement('div'), { className: 'corner' }));
    for (let i = 0; i < st.steps; i++) {
      const n = document.createElement('div');
      n.className = `num${i % perBeat() === 0 ? ' beatn' : ''}${i % L === 0 && i ? ' gap' : ''}`;
      n.dataset.i = i;
      n.textContent = i % perBeat() === 0 ? String(i + 1) : '·';
      kids.push(n);
    }
    st.notes.forEach((pitch, r) => {
      const head = document.createElement('div'); head.className = `head${st.muted[r] ? ' muted' : ''}${st.selRow === r ? ' sel' : ''}`;
      const mute = Object.assign(document.createElement('button'), { className: `mute${st.muted[r] ? ' on' : ''}`, textContent: 'M', title: t('mute') });
      mute.onclick = () => { st.muted[r] = !st.muted[r]; saveState(); drawGrid(); onChange(); };
      const nm = Object.assign(document.createElement('span'), { className: 'nm', textContent: I18N[lang].rows[r] });
      nm.title = `${nm.textContent} · ${t('rowEditTip')}`;
      nm.onclick = () => { st.selRow = r; st.gen[r].hits = st.grid[r].slice(0, st.steps).filter(Boolean).length; saveState(); drawGrid(); drawGen(); };
      head.onwheel = (ev) => { ev.preventDefault(); st.selRow = r; const g = st.gen[r]; g.hits = Math.max(0, Math.min(st.steps, g.hits + (ev.deltaY < 0 ? 1 : -1))); genRow(r); edited(); drawGen(); };
      const sel = document.createElement('select');
      for (let p = 24; p <= 84; p++) sel.append(Object.assign(document.createElement('option'), { value: p, textContent: `${midiName(p)}` }));
      sel.value = pitch; sel.title = `${pitch} · ${midiName(pitch)}`;
      sel.onchange = () => { st.notes[r] = Number(sel.value); saveState(); onChange(true); };
      head.append(mute, nm, sel,
        iconBtn(die(5), t('rowDice'), () => { if (st.locked[r]) return; roll([r]); edited(); }, st.locked[r] ? 'off' : ''),
        iconBtn(lockIco(st.locked[r]), t('lock'), () => { st.locked[r] = !st.locked[r]; saveState(); drawGrid(); }, st.locked[r] ? 'on' : ''));
      kids.push(head);
      for (let i = 0; i < st.steps; i++) {
        const v = st.grid[r][i];
        const c = document.createElement('button');
        c.className = `cell${i % perBeat() === 0 ? ' beat' : ''}${v ? ' on' : ''}${v >= 127 ? ' acc' : v && v <= 60 ? ' soft' : ''}${i % L === 0 && i ? ' gap' : ''}${st.muted[r] ? ' dim' : ''}`;
        c.dataset.i = i;
        c.onclick = (ev) => { const want = ev.shiftKey ? 127 : ev.altKey ? 60 : st.hit; st.grid[r][i] = st.grid[r][i] === want ? 0 : want; if (st.grid[r][i]) audition(st.notes[r], want); edited(); };
        c.oncontextmenu = (ev) => { ev.preventDefault(); const k = VELS.indexOf(st.grid[r][i]); st.grid[r][i] = VELS[(k + 1) % VELS.length] || 100; audition(st.notes[r], st.grid[r][i]); edited(); };
        kids.push(c);
      }
    });
    g.replaceChildren(...kids);
    showNow(nowStep);
  }
  function showNow(i) {
    nowStep = i;
    for (const c of document.querySelectorAll('#grid .now')) c.classList.remove('now');
    if (i < 0) return;
    for (const c of document.querySelectorAll(`#grid [data-i="${i}"]`)) c.classList.add('now');
  }


  // A small drag knob: drag up or down, or use the wheel; double-click resets. It redraws itself,
  // so a drag is never interrupted by the rest of the window repainting.
  function knob(label, value, min, max, fmt, onSet, def) {
    const box = document.createElement('div'); box.className = 'knob';
    box.innerHTML = '<div class="kl"></div><svg viewBox="0 0 40 40"></svg><div class="kv"></div>';
    box.querySelector('.kl').textContent = label;
    const svg = box.querySelector('svg'), kv = box.querySelector('.kv');
    const pt = (deg, r) => { const rad = (deg - 90) * Math.PI / 180; return [20 + r * Math.cos(rad), 20 + r * Math.sin(rad)]; };
    const arc = (from, to) => { const [x1, y1] = pt(from, 15), [x2, y2] = pt(to, 15); return `M${x1.toFixed(2)} ${y1.toFixed(2)}A15 15 0 ${to - from > 180 ? 1 : 0} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`; };
    const paint = () => {
      const frac = (value - min) / (max - min || 1), a = -135 + frac * 270, [px, py] = pt(a, 10);
      svg.innerHTML = `<path d="${arc(-135, 135)}" class="ktrack"/>${frac > 0.001 ? `<path d="${arc(-135, a)}" class="kval"/>` : ''}<line x1="20" y1="20" x2="${px.toFixed(2)}" y2="${py.toFixed(2)}" class="kptr"/>`;
      kv.textContent = fmt(value);
    };
    const set = (v) => { v = Math.max(min, Math.min(max, Math.round(v))); if (v === value) return; value = v; paint(); onSet(v); };
    svg.onpointerdown = (ev) => {
      svg.setPointerCapture(ev.pointerId);
      const y0 = ev.clientY, v0 = value, span = max - min;
      svg.onpointermove = (e) => set(v0 + ((y0 - e.clientY) / 140) * Math.max(span, 12));
      svg.onpointerup = () => { svg.onpointermove = null; svg.onpointerup = null; };
    };
    svg.onwheel = (ev) => { ev.preventDefault(); set(value + (ev.deltaY < 0 ? 1 : -1)); };
    svg.ondblclick = () => set(def);
    paint();
    return box;
  }
  function drawGen() {
    const r = Math.min(st.selRow, st.notes.length - 1), g = st.gen[r];
    $('genName').textContent = I18N[lang].rows[r];
    $('genLabel').textContent = t('gen');
    const regen = () => { saveState(); if (st.auto) { genRow(r); edited(); } };
    $('knobs').replaceChildren(
      knob(t('kHits'), g.hits, 0, st.steps, (v) => String(v), (v) => { g.hits = v; regen(); }, 4),
      knob(t('kPattern'), g.pattern, 0, 64, (v) => (v ? String(v) : t('even')), (v) => { g.pattern = v; regen(); }, 0),
      knob(t('kShift'), g.shift, -(st.steps - 1), st.steps - 1, (v) => (v > 0 ? `+${v}` : String(v)), (v) => { g.shift = v; regen(); }, 0),
      knob(t('kVel'), g.vel, 1, 127, (v) => String(v), (v) => { g.vel = v; regen(); }, 100),
    );
    $('genAuto').classList.toggle('on', st.auto);
    $('genAuto').textContent = t('auto');
    $('genGo').textContent = t('generate');
    $('genRoll').innerHTML = die(4); $('genRoll').title = t('genRollTip');
  }
  $('genAuto').onclick = () => { st.auto = !st.auto; saveState(); drawGen(); };
  $('genGo').onclick = () => { genRow(Math.min(st.selRow, st.notes.length - 1)); edited(); };
  $('genRoll').onclick = () => { const r = Math.min(st.selRow, st.notes.length - 1); st.gen[r].pattern = 1 + Math.floor(Math.random() * 64); saveState(); genRow(r); edited(); drawGen(); };

  function paintStatic() {
    document.documentElement.lang = lang;
    document.documentElement.dataset.theme = theme;
    $('ver').textContent = `v${VERSION}`;
    $('lang').replaceChildren(...Object.keys(I18N).map((c) => Object.assign(document.createElement('option'), { value: c, textContent: I18N[c]._name })));
    $('lang').value = lang;
    for (const [id, name] of [['tDark', 'dark'], ['tGrey', 'grey']]) { $(id).classList.toggle('on', theme === name); $(id).title = t(name); }
    for (const [id, k] of Object.entries({ useTrack: 'useTrack', stepsLabel: 'steps', resLabel: 'res', live: 'live', write: 'write', densLabel: 'dens', copy: 'copy', paste: 'paste', clear: 'clear', hint: 'hint', hitLabel: 'hit', clipLabel: 'clip' })) $(id).textContent = t(k);
    $('dice').title = t('diceTip'); $('dice').innerHTML = `${die(5)}<span>${t('roll')}</span>`; $('vary').innerHTML = `${die(2)}<span>${t('vary')}</span>`;
    $('hit').replaceChildren(...[[100, 'hitNormal'], [127, 'hitAccent'], [60, 'hitSoft']].map(([v, k]) => { const b = Object.assign(document.createElement('button'), { textContent: t(k) }); b.classList.toggle('on', st.hit === v); b.classList.toggle('hitacc', v === 127); b.onclick = () => { st.hit = v; saveState(); paintStatic(); }; return b; }));
    $('clipName').value = st.clipName; $('clipName').placeholder = t('clipPh');
    $('steps').replaceChildren(...STEP_CHOICES.map((n) => Object.assign(document.createElement('option'), { value: n, textContent: n })));
    $('steps').value = st.steps;
    $('res').replaceChildren(...Object.keys(RES).map((n) => Object.assign(document.createElement('option'), { value: n, textContent: n })));
    $('res').value = st.res;
    $('dens').replaceChildren(...['sparse', 'medium', 'dense'].map((n) => { const b = Object.assign(document.createElement('button'), { textContent: t(n) }); b.classList.toggle('on', st.dens === n); b.onclick = () => { st.dens = n; saveState(); paintStatic(); }; return b; }));
    $('live').classList.toggle('on', st.live);
    $('paste').disabled = !clipboard;
    $('back').disabled = hpos <= 0; $('fwd').disabled = hpos >= history.length - 1;
    drawGrid();
    drawGen();
  }
  $('lang').onchange = () => { lang = $('lang').value; store.set('lang', lang); paintStatic(); onChange(true, true); };
  for (const b of [$('tDark'), $('tGrey')]) b.onclick = () => { theme = b.dataset.t; store.set('theme', theme); paintStatic(); };
  $('clipName').onchange = () => { st.clipName = $('clipName').value.trim().toUpperCase(); $('clipName').value = st.clipName; saveState(); onChange(); };
  $('steps').onchange = () => { st.steps = Number($('steps').value); saveState(); paintStatic(); onChange(true); };
  $('res').onchange = () => { st.res = $('res').value; saveState(); paintStatic(); onChange(true); };
  $('live').onclick = () => { st.live = !st.live; saveState(); paintStatic(); if (st.live) onChange(); };
  $('dice').onclick = () => { roll(st.grid.map((_, r) => r)); remember(); saveState(); paintStatic(); onChange(); };
  $('vary').onclick = () => { vary(); remember(); saveState(); paintStatic(); onChange(); };
  $('back').onclick = () => { if (hpos > 0) { hpos--; st.grid = JSON.parse(history[hpos]); saveState(); paintStatic(); onChange(); } };
  $('fwd').onclick = () => { if (hpos < history.length - 1) { hpos++; st.grid = JSON.parse(history[hpos]); saveState(); paintStatic(); onChange(); } };
  $('copy').onclick = () => { clipboard = { steps: st.steps, res: st.res, notes: st.notes.slice(), grid: st.grid.map((r) => r.slice()) }; store.set('clip', clipboard); say('copied', {}, 'ok', 2500); paintStatic(); };
  $('paste').onclick = () => { if (!clipboard) return; Object.assign(st, JSON.parse(JSON.stringify(clipboard))); remember(); saveState(); paintStatic(); say('pasted', {}, 'ok', 2500); onChange(true); };
  $('clear').onclick = () => { for (let r = 0; r < st.grid.length; r++) if (!st.locked[r]) st.grid[r].fill(0); remember(); saveState(); paintStatic(); onChange(); };
  paintStatic();

  let luna, built;
  async function build() {
    const s = luna.sessions.current();
    if (s === built) return;
    built = s;
    if (!s) { say('noSession'); return; }
    await s.ready();
    if (s !== built) return;
    await s.musical.ready();
    say(null);
    const tr = s.transport, tl = s.musical.timeline, ctx = s.context;
    const TPB = Luna.TICKS_PER_BEAT;
    const midi = new Luna.SendMidi(luna);
    let targetId = store.get(`target:${s.uid}`);
    const isInst = (x) => x && ['instrument', 'midi_matrix'].includes(x.trackType?.value);

    // The span the pattern fills: the loop when looping, else the selection, else the bar at the cursor.
    function span() {
      const L0 = tr.loopStart.value, L1 = tr.loopStop.value;
      if (tr.looping.value && typeof L0 === 'number' && L1 > L0) return { S: L0, E: L1, where: 'loop' };
      const S = ctx.selectionStart.value, E = ctx.selectionStop.value;
      if (typeof S === 'number' && typeof E === 'number' && E > S) return { S, E, where: 'sel' };
      const bar = tl.barBeat(tr.playStart.value ?? 0).bar;
      return { S: tl.tickAtBar(bar), E: tl.tickAtBar(bar + 1), where: 'barAt' };
    }
    function paintTarget() {
      const tk = targetId && s.tracks.byId(targetId);
      if (!tk) { $('target').textContent = t('noTarget'); $('write').disabled = true; return; }
      const sp = span();
      $('target').innerHTML = t('target', { t: tk.name.value.replace(/[<&]/g, ''), where: t(sp.where), from: tl.formatBarBeat(sp.S), to: tl.formatBarBeat(sp.E) });
      $('write').disabled = false;
    }
    $('useTrack').title = t('useTrack');
    $('useTrack').onclick = () => {
      const ids = ctx.selectionTracks.value ?? [];
      const tk = [...ids.map((id) => s.tracks.byId(id)), s.tracks.byId(ctx.lastSelectedTrack.value)].find(isInst);
      if (!tk) { say('noTarget', {}, 'bad', 4000); return; }
      targetId = tk.id; store.set(`target:${s.uid}`, targetId); paintTarget(); if (st.live) schedule(true);
    };
    audition = (pitch, vel) => {
      const tk = targetId && s.tracks.byId(targetId);
      if (!tk || tr.playing.value) return;
      midi.sendMidiNote(s.uid, tk.id, pitch, vel, true).catch(() => undefined);
      setTimeout(() => midi.sendMidiNote(s.uid, tk.id, pitch, 0, false).catch(() => undefined), 180);
    };

    // ---- Writing the pattern into the clip -----------------------------------------------------------
    function patternNotes(S, E) {
      const len = TPB * RES[st.res];
      const out = [];
      for (let base = S, rep = 0; base < E && rep < 4096; rep++, base = S + Math.round(rep * st.steps * len)) {
        for (let r = 0; r < st.notes.length; r++) {
          if (st.muted[r]) continue;
          for (let i = 0; i < st.steps; i++) {
            const v = st.grid[r][i];
            if (!v) continue;
            const at = base + Math.round(i * len);
            if (at >= E) continue;
            out.push({ pitch: st.notes[r], start: at, stop: Math.min(E, at + Math.round(len * 0.9)), velocity: v });
          }
        }
      }
      return out;
    }
    let writing = false, again = false, prevPitches = new Set(st.notes);
    async function writeNow() {
      const tk = targetId && s.tracks.byId(targetId);
      if (!tk) return;
      if (writing) { again = true; return; }
      writing = true;
      const t0 = performance.now();
      try {
        const { S, E } = span();
        const notes = patternNotes(S, E);
        const pitches = new Set([...st.notes, ...prevPitches]);
        prevPitches = new Set(st.notes);
        const lane = s.playlistFor(tk);
        await lane.clips.load();
        const over = lane.clips.items.filter((c) => c.stop.value > S && c.start.value < E);
        if (!over.length) {
          if (notes.length) {
            const { clip } = await lane.createNotes(notes.map((n) => ({ pitch: n.pitch, startTick: n.start, stopTick: n.stop, velocity: n.velocity })));
            if (st.clipName && clip?.name) await clip.name.set(st.clipName).catch(() => undefined);
          }
        } else {
          const clip = over.length === 1 && over[0].start.value <= S && over[0].stop.value >= E ? over[0] : null;
          if (!clip) throw new Error(t('partial'));
          await clip.midi.ready();
          const c0 = clip.start.value;
          const old = clip.midi.notes.items.filter((n) => pitches.has(n.pitch) && c0 + n.startTick >= S && c0 + n.startTick < E);
          await s.transaction('Step Dice', async () => {
            if (old.length) await clip.midi.deleteNotes(old);
            if (notes.length) await clip.addNotes(notes.map((n) => ({ pitch: n.pitch, tick: n.start - c0, lengthTicks: n.stop - n.start, velocity: n.velocity })));
          });
          await clip.midi.refresh().catch(() => undefined);
          if (st.clipName && clip.name && clip.name.value !== st.clipName) await clip.name.set(st.clipName).catch((e) => note('rename failed', { e: errText(e) }));
        }
        const ms = Math.round(performance.now() - t0);
        note('write', { notes: notes.length, ms, playing: tr.playing.value, S, E });
        say('written', { n: notes.length, ms }, 'ok', 2500);
      } catch (e) {
        note('write failed', { e: errText(e) });
        say('failed', { e: errText(e) }, 'bad', 6000);
      }
      writing = false;
      if (again) { again = false; void writeNow(); }
    }
    let timer;
    function schedule(force) { clearTimeout(timer); if (st.live || force) timer = setTimeout(() => void writeNow(), 40); }
    onChange = (force, viewOnly) => { paintTarget(); if (!viewOnly) schedule(false); void force; };
    $('write').onclick = () => void writeNow();

    // ---- The playhead on the grid ----------------------------------------------------------------------
    let raf = 0;
    tr.location.onChange?.(() => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const tick = tr.location.value?.tick;
        const { S, E } = span();
        if (!tr.playing.value || typeof tick !== 'number' || tick < S || tick >= E) { if (nowStep !== -1) showNow(-1); return; }
        const len = TPB * RES[st.res];
        const i = Math.floor(((tick - S) % (st.steps * len)) / len);
        if (i !== nowStep) showNow(i);
      });
    });

    $('ver').onclick = async (ev) => {
      if (!ev.altKey) return;
      const tk = targetId && s.tracks.byId(targetId);
      const text = JSON.stringify({ version: VERSION, target: tk?.name.value, span: span(), playing: tr.playing.value, looping: tr.looping.value, st: { steps: st.steps, res: st.res, live: st.live, notes: st.notes }, log }, null, 2);
      try { await navigator.clipboard.writeText(text); say('report', {}, 'ok', 2500); } catch { /* nothing */ }
    };
    for (const p of [tr.loopStart, tr.loopStop, tr.looping, ctx.selectionStart, ctx.selectionStop, tr.playStart]) p?.onChange?.(() => paintTarget());
    paintTarget();
  }

  (async () => {
    for (;;) {
      try { luna = await Luna.connect(); break; }
      catch { say('waiting'); await new Promise((r) => setTimeout(r, 1500)); }
    }
    Luna.bindShortcuts(luna, { onError: () => undefined });
    await luna.sessions.ready();
    luna.sessions.focused.onChange(() => void build());
    await build();
  })();
})();
