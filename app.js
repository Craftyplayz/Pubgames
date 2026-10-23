(() => {
  'use strict';

  // ---------- Game catalogue (mirrors README.md) ----------

  const CATEGORIES = [
    { name: 'Darts & Throwing', games: [
      ['501 / 301', '2+', 'Count down from 501 (or 301) to exactly zero, finishing on a double.'],
      ['Cricket', '2+', 'Close out the numbers 15–20 and the bull by hitting each three times.'],
      ['Around the Clock', '1+', 'Hit 1 through 20 in order, then the bull.'],
      ['Killer', '3+', 'Each player gets a number; become a "killer" and knock out opponents\' lives.'],
      ['Shanghai', '2+', 'Score on each number in turn; a single, double and treble in one round wins instantly.'],
      ['Bat and Trap', '2 teams', 'Traditional Kent game of striking a ball from a trap and bowling at a target.'],
      ['Aunt Sally', '2 teams', 'Throw sticks at a wooden "dolly" balanced on a post (popular in Oxfordshire).'],
      ['Cornhole', '2–4', 'Toss beanbags at a raised board with a hole in it.'],
    ] },
    { name: 'Cue & Table', games: [
      ['Pool (8-Ball)', '2', 'Pot your group (spots/stripes or reds/yellows), then the black.'],
      ['9-Ball', '2', 'Pot balls in numerical order; potting the 9 legally wins.'],
      ['Killer Pool', '3+', 'Each player has lives; lose one each time you fail to pot.'],
      ['Kelly Pool', '2+', 'Each player secretly draws a numbered pea; the first to legally pot the ball matching their number wins.'],
      ['Snooker', '2', 'Alternate reds and colours to build breaks, then clear the colours in order.'],
      ['Bar Billiards', '2+', 'Pot balls into holes in the table while avoiding the mushroom-shaped skittles.'],
      ['Table Football (Foosball)', '2–4', 'Spin rods to kick the ball into the opponent\'s goal.'],
      ['Shove Ha\'penny', '2', 'Push coins up a board into scoring beds.'],
      ['Table Skittles', '2+', 'Swing a ball on a chain around a post to knock down pins.'],
      ['Air Hockey', '2', 'Strike a puck on a cushion of air into the opponent\'s goal.'],
    ] },
    { name: 'Cards', games: [
      ['Cribbage', '2–4', 'Score by making combinations of cards, pegging points on a board.'],
      ['Euchre', '4', 'Trick-taking game with a trump suit and the bowers.'],
      ['Don', '4', 'Trick-taking game popular in Northern England for winning point cards.'],
      ['Nap (Napoleon)', '2–6', 'Bid how many of five tricks you can win.'],
      ['Brag', '3+', 'British ancestor of poker, played with three-card hands.'],
      ['Poker', '2+', 'Bet on the strength of your hand (Texas Hold\'em is the usual pub variant).'],
      ['Whist', '4', 'Classic partnership trick-taking game.'],
      ['Ring of Fire (Kings)', '3+', 'Drinking game where each drawn card triggers a rule.'],
      ['Higher or Lower', '2+', 'Guess whether the next card is higher or lower.'],
    ] },
    { name: 'Board & Tile', games: [
      ['Dominoes', '2–4', 'Match tile ends; Fives and Threes is the traditional pub scoring variant.'],
      ['Chess', '2', 'The classic strategy game.'],
      ['Draughts (Checkers)', '2', 'Jump and capture your opponent\'s pieces.'],
      ['Backgammon', '2', 'Race your checkers around the board and bear them off.'],
      ['Connect Four', '2', 'Drop counters to make four in a row.'],
      ['Jenga', '2+', 'Remove blocks from a tower without toppling it.'],
    ] },
    { name: 'Bowling & Outdoor', games: [
      ['Skittles', '2 teams', 'Roll a ball (or "cheese") to knock down nine pins.'],
      ['Bowls', '2+', 'Roll biased bowls as close as possible to the jack.'],
      ['Quoits', '2+', 'Throw rings over a pin set in clay.'],
      ['Pétanque (Boules)', '2–6', 'Throw metal balls close to a small target ball.'],
      ['Ring the Bull', '1+', 'Swing a ring on a string to hook it onto a hook on the wall.'],
      ['Toad in the Hole', '2+', 'Toss brass coins into a hole in a lead-topped table.'],
    ] },
    { name: 'Quiz & Social', games: [
      ['Pub Quiz', 'Teams', 'Rounds of general-knowledge questions, often weekly.'],
      ['Music Bingo', 'Any', 'Mark off songs on your card as they play.'],
      ['Karaoke', 'Any', 'Sing along to backing tracks.'],
      ['Meat Raffle', 'Any', 'Buy tickets for a prize draw of meat (an Australian and Northern English tradition).'],
      ['Fruit Machine', '1', 'Coin-operated slot machine with nudges and holds.'],
      ['Quiz Machine', '1–2', 'Coin-operated trivia game.'],
      ['Arm Wrestling', '2', 'Test of strength across the table.'],
      ['Spoof', '2+', 'Guess the total number of coins held in everyone\'s hands.'],
      ['Liar\'s Dice', '2+', 'Bluffing game of bidding on hidden dice.'],
      ['Shut the Box', '1+', 'Roll dice and flip down numbered tiles that add up to the roll.'],
    ] },
  ];

  const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const GAMES = [];
  CATEGORIES.forEach((c) => c.games.forEach(([name, players, desc]) => {
    GAMES.push({ id: slug(name), name, players, desc, cat: c.name });
  }));

  const TRACKERS = { 'kelly-pool': mountKelly };

  // ---------- Helpers ----------

  const esc = (s) => String(s).replace(/[&<>"']/g, (ch) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

  const store = {
    get(key) { try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; } },
    set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage unavailable */ } },
  };

  function shuffle(list) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function playersLabel(p) {
    if (p === '1') return '1 player';
    if (/^[\d–+]+$/.test(p)) return `${p} players`;
    if (p === 'Any') return 'Any number of players';
    return p;
  }

  // Standard pool ball colours: 1–8 solids, 9–15 stripes of the same colours.
  const BALL_COLORS = ['', '#f3c623', '#1d4fb8', '#d0342c', '#57308f', '#f07f1d', '#178049', '#7d1f2b', '#151515'];

  function ball(n, size = '', extra = '') {
    const color = BALL_COLORS[n > 8 ? n - 8 : n];
    return `<span class="ball ${n > 8 ? 'stripe' : 'solid'} ${size} ${extra}" style="--ball:${color}" aria-hidden="true">`
      + `<span class="ball-num">${n}</span></span>`;
  }

  // ---------- Game picker ----------

  const catsEl = document.getElementById('cats');
  const chipsEl = document.getElementById('chips');
  const gameEl = document.getElementById('game');
  const app = { cat: 'Cue & Table', gameId: 'kelly-pool' };

  const currentGame = () => GAMES.find((g) => g.id === app.gameId) || GAMES[0];

  function renderPicker() {
    catsEl.innerHTML = CATEGORIES.map((c) => (
      `<button type="button" class="cat" data-cat="${esc(c.name)}" aria-pressed="${c.name === app.cat}">${esc(c.name)}</button>`
    )).join('');
    chipsEl.innerHTML = GAMES.filter((g) => g.cat === app.cat).map((g) => (
      `<button type="button" class="chip" data-game="${g.id}" aria-pressed="${g.id === app.gameId}">${esc(g.name)}`
      + `${TRACKERS[g.id] ? '<span class="chip-tag">Tracker</span>' : ''}</button>`
    )).join('');
    const active = chipsEl.querySelector('[aria-pressed="true"]');
    if (active) chipsEl.scrollLeft = active.offsetLeft - chipsEl.offsetLeft - 16;
  }

  function renderGame() {
    const g = currentGame();
    gameEl.innerHTML = `
      <div class="game-head">
        <p class="eyebrow">${esc(g.cat)} · ${esc(playersLabel(g.players))}</p>
        <h1>${esc(g.name)}</h1>
        <p class="lede">${esc(g.desc)}</p>
      </div>
      <div id="tracker"></div>`;
    const root = document.getElementById('tracker');
    if (TRACKERS[g.id]) {
      TRACKERS[g.id](root);
    } else {
      root.innerHTML = `
        <div class="card empty">
          <p><strong>No tracker for ${esc(g.name)} yet.</strong> Kelly Pool has a full tracker with secret peas and a public scoreboard.</p>
          <button type="button" class="btn" data-game="kelly-pool">Open Kelly Pool</button>
        </div>`;
    }
  }

  function selectGame(id) {
    const g = GAMES.find((x) => x.id === id);
    if (!g) return;
    app.gameId = g.id;
    app.cat = g.cat;
    try { history.replaceState(null, '', `#${g.id}`); } catch (e) { /* not allowed in some frames */ }
    renderPicker();
    renderGame();
  }

  // ---------- Kelly Pool tracker ----------
  //
  // Public info: shooting order, whose turn it is, which balls are down and who potted them,
  // who is out (their pea is revealed once they are), and the game log.
  // Private info: each player's pea number(s). Shown only behind a hand-off screen,
  // optionally locked with a 4-digit PIN, and hidden again automatically.

  const KELLY_KEY = 'pubgames.kelly.v1';
  const MAX_PLAYERS = 15;
  const PEEK_SECONDS = 15;

  let K = null;
  let kRoot = null;
  const view = { pending: null, peek: null, error: '', confirmReset: false }; // per-device, never saved
  let peekTimer = null;
  let resetTimer = null;

  function freshKelly(names, opts = {}) {
    return {
      phase: 'setup',
      names: names || ['Sam', 'Priya', 'Tom', 'Jo'],
      example: !names,
      peas: opts.peas || 1,
      usePin: opts.usePin !== undefined ? opts.usePin : true,
      players: [],
      dealIndex: 0,
      dealStage: 'handoff',
      rack: {},
      turn: 0,
      log: [],
      winner: null,
      winReason: '',
      history: [],
    };
  }

  function loadKelly() {
    const saved = store.get(KELLY_KEY);
    K = saved && saved.phase ? saved : freshKelly();
    K.dealStage = 'handoff'; // never reopen on a secret after a reload
  }

  const saveKelly = () => store.set(KELLY_KEY, K);
  const maxPeas = () => Math.max(1, Math.min(3, Math.floor(15 / K.names.length)));
  const playerById = (id) => K.players.find((p) => p.id === id);
  const ownerOf = (n) => K.players.find((p) => p.balls.includes(n));
  const shooter = () => K.players[K.turn];
  const inPlayers = () => K.players.filter((p) => !p.out);
  const addLog = (text, kind = '') => K.log.unshift({ text, kind });

  function snapshot() {
    const { history: h, ...rest } = K;
    h.push(JSON.stringify(rest));
    if (h.length > 60) h.shift();
  }

  function undo() {
    const prev = K.history.pop();
    if (!prev) return;
    const h = K.history;
    K = JSON.parse(prev);
    K.history = h;
  }

  function advanceTurn() {
    const n = K.players.length;
    for (let i = 1; i <= n; i++) {
      const j = (K.turn + i) % n;
      if (!K.players[j].out) { K.turn = j; return; }
    }
  }

  function startDeal() {
    const names = K.names.map((n, i) => n.trim() || `Player ${i + 1}`);
    const peas = Math.min(K.peas, Math.floor(15 / names.length));
    const balls = shuffle(Array.from({ length: 15 }, (_, i) => i + 1));
    Object.assign(K, {
      phase: 'deal', names, peas, dealIndex: 0, dealStage: 'handoff',
      rack: {}, turn: 0, log: [], winner: null, winReason: '', history: [],
      players: names.map((name, i) => ({
        id: i, name, out: false, pin: null,
        balls: balls.slice(i * peas, (i + 1) * peas).sort((a, b) => a - b),
      })),
    });
  }

  function finish(winner, reason) {
    K.phase = 'over';
    K.winner = winner ? winner.id : null;
    K.winReason = reason;
    addLog(reason, 'win');
  }

  function recordPot(n, legal) {
    snapshot();
    const s = shooter();
    if (!legal) {
      addLog(`${s.name} potted the ${n} on a foul. It goes back on the spot and the turn passes.`, 'foul');
      advanceTurn();
      return;
    }
    K.rack[n] = { by: s.id };
    const owner = ownerOf(n);
    if (owner === s) {
      finish(s, `${s.name} wins by potting the ${n}, their own pea.`);
      return;
    }
    if (owner && owner.balls.every((b) => K.rack[b])) {
      owner.out = true;
      addLog(`${s.name} potted the ${n}. That was ${owner.name}'s last pea, so ${owner.name} is out.`, 'out');
      const alive = inPlayers();
      if (alive.length === 1) {
        finish(alive[0], `${alive[0].name} wins as the last player standing.`);
        return;
      }
    } else {
      addLog(`${s.name} potted the ${n} and keeps shooting.`);
    }
    if (Object.keys(K.rack).length === 15) finish(null, 'The table is clear with no winner.');
  }

  function miss() {
    snapshot();
    const s = shooter();
    advanceTurn();
    addLog(`${s.name} missed. ${shooter().name} to shoot.`);
  }

  function closePeek() {
    clearTimeout(peekTimer);
    view.peek = null;
    view.error = '';
  }

  function showPeek() {
    view.peek.stage = 'show';
    view.error = '';
    clearTimeout(peekTimer);
    peekTimer = setTimeout(() => { closePeek(); kRender(); }, PEEK_SECONDS * 1000);
  }

  function kAction(act, el) {
    switch (act) {
      case 'add':
        if (K.names.length < MAX_PLAYERS) K.names.push('');
        K.peas = Math.min(K.peas, maxPeas());
        break;
      case 'remove':
        if (K.names.length > 2) K.names.splice(Number(el.dataset.i), 1);
        break;
      case 'shuffle':
        K.names = shuffle(K.names);
        break;
      case 'deal':
        startDeal();
        break;
      case 'deal-show':
        K.dealStage = 'show';
        view.error = '';
        break;
      case 'deal-hide': {
        const p = K.players[K.dealIndex];
        if (K.usePin) {
          const pin = (document.getElementById('kp-pin-set') || {}).value || '';
          if (!/^\d{4}$/.test(pin)) { view.error = 'Enter exactly 4 digits.'; break; }
          p.pin = pin;
        }
        view.error = '';
        K.dealIndex += 1;
        K.dealStage = 'handoff';
        if (K.dealIndex >= K.players.length) {
          K.phase = 'play';
          addLog(`Peas drawn. ${K.players[0].name} breaks.`);
        }
        break;
      }
      case 'deal-cancel':
        K = freshKelly(K.players.map((p) => p.name), K);
        break;
      case 'pot':
        if (K.phase === 'play') view.pending = Number(el.dataset.n);
        break;
      case 'legal':
      case 'foul':
        if (view.pending) recordPot(view.pending, act === 'legal');
        view.pending = null;
        break;
      case 'cancel-pot':
        view.pending = null;
        break;
      case 'miss':
        view.pending = null;
        miss();
        break;
      case 'undo':
        view.pending = null;
        undo();
        break;
      case 'peek':
        view.peek = { id: Number(el.dataset.id), stage: 'handoff' };
        view.error = '';
        break;
      case 'peek-next': {
        const p = playerById(view.peek.id);
        if (K.usePin && p.pin) view.peek.stage = 'pin';
        else showPeek();
        break;
      }
      case 'unlock': {
        const p = playerById(view.peek.id);
        const pin = (document.getElementById('kp-pin-check') || {}).value || '';
        if (pin === p.pin) showPeek();
        else view.error = 'That PIN doesn\'t match. Try again.';
        break;
      }
      case 'peek-close':
        closePeek();
        break;
      case 'reset':
        if (view.confirmReset) {
          clearTimeout(resetTimer);
          view.confirmReset = false;
          K = freshKelly(K.players.map((p) => p.name), K);
        } else {
          view.confirmReset = true;
          clearTimeout(resetTimer);
          resetTimer = setTimeout(() => { view.confirmReset = false; kRender(); }, 4000);
        }
        break;
      case 'again':
        K = freshKelly(K.players.map((p) => p.name), K);
        startDeal();
        break;
      case 'edit':
        K = freshKelly(K.players.map((p) => p.name), K);
        break;
      default:
        return;
    }
    saveKelly();
    kRender();
  }

  // ----- Kelly views -----

  function setupHTML() {
    const n = K.names.length;
    const peaOptions = [1, 2, 3].filter((x) => x <= maxPeas())
      .map((x) => `<option value="${x}"${x === K.peas ? ' selected' : ''}>${x}</option>`).join('');
    return `
      <div class="board">
        <section class="card">
          <div class="card-top"><h2>New game</h2></div>
          <p class="muted">Every player draws a secret pea numbered 1 to 15. Pot your own ball legally to win. If someone else pots it, you're out.</p>
          <div class="field-label">Players <span class="muted">· shooting order, ${n} of ${MAX_PLAYERS}</span></div>
          ${K.example ? '<p class="note">Example names. Replace them with your group.</p>' : ''}
          <ol class="name-list">
            ${K.names.map((nm, i) => `
              <li>
                <span class="order">${i + 1}</span>
                <input id="kp-name-${i}" class="input" type="text" value="${esc(nm)}" data-name="${i}" maxlength="20" placeholder="Player ${i + 1}" aria-label="Player ${i + 1} name" autocomplete="off">
                <button type="button" class="icon-btn" data-act="remove" data-i="${i}" aria-label="Remove ${esc(nm || `player ${i + 1}`)}"${n <= 2 ? ' disabled' : ''}>×</button>
              </li>`).join('')}
          </ol>
          <div class="row">
            <button type="button" class="btn ghost" data-act="add"${n >= MAX_PLAYERS ? ' disabled' : ''}>Add player</button>
            <button type="button" class="btn ghost" data-act="shuffle">Shuffle order</button>
          </div>
          <div class="options">
            <label class="opt" for="kp-peas">Peas each <select id="kp-peas" class="input">${peaOptions}</select></label>
            <label class="opt" for="kp-usepin"><input type="checkbox" id="kp-usepin"${K.usePin ? ' checked' : ''}> Lock each pea with a 4-digit PIN</label>
          </div>
          <div class="row"><button type="button" class="btn primary big" data-act="deal">Draw the peas</button></div>
        </section>
        <section class="card who">
          <h3>Who sees what</h3>
          <div class="who-block">
            <span><span class="vis public">Public</span></span>
            <ul>
              <li>Shooting order and whose turn it is</li>
              <li>Which balls are down, and who potted each</li>
              <li>Who is out, with their pea revealed</li>
              <li>The game log</li>
            </ul>
          </div>
          <div class="who-block">
            <span><span class="vis private">Private</span></span>
            <ul>
              <li>Your pea number, shown only after a hand-off screen</li>
              <li>Locked with your PIN if the table chooses</li>
              <li>Hides itself after ${PEEK_SECONDS} seconds</li>
            </ul>
          </div>
          <h3>House rules used</h3>
          <ol class="rules">
            <li>Shoot in order. Hit the lowest-numbered ball first.</li>
            <li>After a legal pot, keep shooting. After a miss, the turn passes.</li>
            <li>A ball potted on a foul goes back on the spot and the turn passes.</li>
            <li>Pot your own pea legally and you win straight away.</li>
            <li>If all your peas are potted by others, you're out.</li>
            <li>The last player still in wins.</li>
          </ol>
        </section>
      </div>`;
  }

  function dealHTML() {
    const p = K.players[K.dealIndex];
    const progress = `Drawing peas · ${K.dealIndex + 1} of ${K.players.length}`;
    if (K.dealStage === 'handoff') {
      return `
        <section class="card handoff">
          <div class="secret">
            <p class="eyebrow">${progress}</p>
            <h2>Pass the device to ${esc(p.name)}</h2>
            <p class="muted">Everyone else, look away.</p>
            <button type="button" class="btn primary big" data-act="deal-show">I'm ${esc(p.name)}. Show my pea</button>
            <button type="button" class="btn ghost" data-act="deal-cancel">Back to players</button>
          </div>
        </section>`;
    }
    const one = p.balls.length === 1;
    return `
      <section class="card handoff">
        <form class="secret" data-form="deal-hide" autocomplete="off">
          <p class="eyebrow">Only ${esc(p.name)} should see this</p>
          <div class="ball-row">${p.balls.map((b) => ball(b, 'xl')).join('')}</div>
          <p>Your ${one ? 'pea is' : 'peas are'} <strong>${p.balls.join(' and ')}</strong>.
            ${one ? `Pot the ${p.balls[0]} legally to win. If anyone else pots it, you're out.`
              : 'Pot any of them legally to win. If others pot all of them, you\'re out.'}</p>
          ${K.usePin ? `
            <label for="kp-pin-set" class="muted">Set a 4-digit PIN so only you can check it later</label>
            <input id="kp-pin-set" class="input pin" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="4" autocomplete="off" data-focus>
            ${view.error ? `<p class="error">${esc(view.error)}</p>` : ''}` : ''}
          <button type="submit" class="btn primary big">Hide and pass on</button>
        </form>
      </section>`;
  }

  function tableHTML() {
    const over = K.phase === 'over';
    const s = shooter();
    const winner = over && K.winner !== null ? playerById(K.winner) : null;

    const status = over
      ? `<section class="card banner win">
          <p class="eyebrow">Game over</p>
          <h2>${winner ? `${esc(winner.name)} wins` : 'No winner'}</h2>
          <p>${esc(K.winReason)}</p>
          <div class="row">
            <button type="button" class="btn primary" data-act="again">Play again</button>
            <button type="button" class="btn ghost" data-act="edit">Change players</button>
            <button type="button" class="btn ghost" data-act="undo"${K.history.length ? '' : ' disabled'}>Undo last shot</button>
          </div>
        </section>`
      : `<section class="card banner">
          <div class="card-top"><p class="eyebrow">At the table</p><span class="vis public">Public</span></div>
          <h2><span class="dot"></span>${esc(s.name)} to shoot</h2>
          <p class="muted">Tap a ball when it drops. A legal pot keeps the shooter at the table.</p>
        </section>`;

    const rack = Array.from({ length: 15 }, (_, i) => i + 1).map((n) => {
      const pot = K.rack[n];
      const by = pot ? playerById(pot.by).name : '';
      return `<button type="button" class="rack-slot${pot ? ' is-potted' : ''}${view.pending === n ? ' is-pending' : ''}"
          data-act="pot" data-n="${n}"${pot || over ? ' disabled' : ''}
          aria-label="Ball ${n}${pot ? `, potted by ${esc(by)}` : ', on the table'}">
          ${ball(n)}<span class="slot-cap">${pot ? esc(by) : '&nbsp;'}</span>
        </button>`;
    }).join('');

    const pending = view.pending && !over ? `
      <div class="pending" role="group" aria-label="Record the pot">
        <p>The <strong>${view.pending}</strong> dropped on ${esc(s.name)}'s shot. Was it legal?</p>
        <div class="row">
          <button type="button" class="btn primary" data-act="legal">Legal pot</button>
          <button type="button" class="btn warn" data-act="foul">Foul, respot it</button>
          <button type="button" class="btn ghost" data-act="cancel-pot">Cancel</button>
        </div>
      </div>` : '';

    const tableCard = `
      <section class="card">
        <div class="card-top"><h3>Balls</h3><span class="muted">${15 - Object.keys(K.rack).length} on the table</span></div>
        <div class="rack" role="group" aria-label="Balls 1 to 15">${rack}</div>
        ${pending}
        ${over ? '' : `
          <div class="split-row">
            <button type="button" class="btn" data-act="miss">Miss · next player</button>
            <button type="button" class="btn ghost" data-act="undo"${K.history.length ? '' : ' disabled'}>Undo</button>
          </div>`}
      </section>`;

    const log = `
      <section class="card">
        <div class="card-top"><h3>Game log</h3><span class="vis public">Public</span></div>
        <ol class="log">${K.log.map((e) => `<li class="${e.kind}">${esc(e.text)}</li>`).join('')}</ol>
      </section>`;

    const players = `
      <section class="card">
        <div class="card-top"><h3>Players</h3><span class="vis public">Public</span></div>
        <ol class="players">
          ${K.players.map((p, i) => {
            const reveal = over || p.out;
            let state = 'In';
            let cls = '';
            if (over && p.id === K.winner) { state = 'Winner'; cls = 'is-win'; }
            else if (p.out) { state = 'Out'; cls = 'is-out'; }
            else if (!over && i === K.turn) { state = 'Shooting'; cls = 'is-turn'; }
            const peas = p.balls.map((b) => (reveal
              ? ball(b, 'sm', K.rack[b] ? 'potted' : '')
              : '<span class="pea-hidden" title="Secret pea">?</span>')).join('');
            return `<li class="player ${cls}">
                <span class="order">${i + 1}</span>
                <span class="pname">${esc(p.name)}</span>
                <span class="peas" aria-label="${reveal ? `Peas: ${p.balls.join(', ')}` : 'Peas hidden'}">${peas}</span>
                <span class="pill ${cls}">${state}</span>
              </li>`;
          }).join('')}
        </ol>
      </section>`;

    const privateCard = over ? '' : `
      <section class="card">
        <div class="card-top"><h3>Check your pea</h3><span class="vis private">Private</span></div>
        <p class="muted">Covers the screen and shows one player's pea${K.usePin ? ' after their PIN' : ''}.</p>
        <div class="peek-list">
          ${inPlayers().map((p) => `<button type="button" class="btn" data-act="peek" data-id="${p.id}">${esc(p.name)}</button>`).join('')}
        </div>
        <div class="row">
          <button type="button" class="btn ghost danger" data-act="reset">${view.confirmReset ? 'Tap again to abandon this game' : 'Abandon game'}</button>
        </div>
      </section>`;

    return `
      <div class="board">
        <div class="col">${status}${tableCard}${log}</div>
        <div class="col">${players}${privateCard}</div>
      </div>`;
  }

  function peekHTML() {
    if (!view.peek) return '';
    const p = playerById(view.peek.id);
    let body;
    if (view.peek.stage === 'handoff') {
      body = `
        <p class="eyebrow">Private</p>
        <h2 id="peek-title">Pass the device to ${esc(p.name)}</h2>
        <p class="muted">Everyone else, look away.</p>
        <button type="button" class="btn primary big" data-act="peek-next" data-focus>I'm ${esc(p.name)}</button>
        <button type="button" class="btn ghost" data-act="peek-close">Cancel</button>`;
    } else if (view.peek.stage === 'pin') {
      body = `
        <form data-form="unlock" autocomplete="off">
          <p class="eyebrow">Private</p>
          <h2 id="peek-title">${esc(p.name)}, enter your PIN</h2>
          <input id="kp-pin-check" class="input pin" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="4" autocomplete="off" aria-label="PIN" data-focus>
          ${view.error ? `<p class="error">${esc(view.error)}</p>` : ''}
          <button type="submit" class="btn primary big">Show my pea</button>
          <button type="button" class="btn ghost" data-act="peek-close">Cancel</button>
        </form>`;
    } else {
      body = `
        <p class="eyebrow">Only ${esc(p.name)} should see this</p>
        <h2 id="peek-title">Your ${p.balls.length === 1 ? 'pea' : 'peas'}</h2>
        <div class="ball-row">${p.balls.map((b) => ball(b, 'xl', K.rack[b] ? 'potted' : '')).join('')}</div>
        <p class="muted">Hides automatically after ${PEEK_SECONDS} seconds.</p>
        <button type="button" class="btn primary big" data-act="peek-close" data-focus>Hide</button>`;
    }
    return `<div class="privacy" role="dialog" aria-modal="true" aria-labelledby="peek-title"><div class="secret">${body}</div></div>`;
  }

  function kRender() {
    if (!kRoot || !kRoot.isConnected) return;
    let html;
    if (K.phase === 'setup') html = setupHTML();
    else if (K.phase === 'deal') html = dealHTML();
    else html = tableHTML();
    kRoot.innerHTML = html + peekHTML();
    const focus = kRoot.querySelector('[data-focus]');
    if (focus) focus.focus();
  }

  function mountKelly(root) {
    kRoot = root;
    kRender();
  }

  // ---------- Events ----------

  document.addEventListener('click', (e) => {
    const cat = e.target.closest('[data-cat]');
    if (cat) { app.cat = cat.dataset.cat; renderPicker(); return; }
    const game = e.target.closest('[data-game]');
    if (game) { selectGame(game.dataset.game); return; }
    const act = e.target.closest('[data-act]');
    if (act && kRoot && kRoot.contains(act)) kAction(act.dataset.act, act);
  });

  document.addEventListener('submit', (e) => {
    const form = e.target.closest('[data-form]');
    if (!form) return;
    e.preventDefault();
    kAction(form.dataset.form, form);
  });

  document.addEventListener('input', (e) => {
    const t = e.target;
    if (t.dataset && t.dataset.name !== undefined) {
      K.names[Number(t.dataset.name)] = t.value;
      K.example = false;
      saveKelly();
    }
  });

  document.addEventListener('change', (e) => {
    const t = e.target;
    if (t.id === 'kp-peas') { K.peas = Number(t.value); saveKelly(); }
    if (t.id === 'kp-usepin') { K.usePin = t.checked; saveKelly(); }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && view.peek) { closePeek(); kRender(); }
  });

  // ---------- Boot ----------

  loadKelly();
  const fromHash = location.hash.slice(1);
  if (GAMES.some((g) => g.id === fromHash)) {
    const g = GAMES.find((x) => x.id === fromHash);
    app.gameId = g.id;
    app.cat = g.cat;
  }
  renderPicker();
  renderGame();
})();
