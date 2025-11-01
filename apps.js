// app.js
import { QUESTIONS } from './questions.js';

/* ---------- State ---------- */
const state = {
  players: [],                 // [{name, active:true}]
  currentRound: 1,
  totalRounds: 0,              // = players.length * 4
  // pro Runde:
  qIndex: 0,                   // rotierende Frage-Auswahl
  currentQuestion: null,
  answers: new Map(),          // name -> number
  folded: new Set(),           // Spieler, die ausgestiegen sind
  bets: new Map(),             // name -> number (gesetzte Schlucke)
  acted: new Set(),            // wer hat in dieser Hinweis-Runde gehandelt
  turnIdx: 0,                  // Index des aktiven Spielers (nur der, der noch nicht done/folded ist)
  hintStep: 0                  // 0..4 (fünf Hinweise)
};

/* ---------- Helpers ---------- */
const $ = (sel) => document.querySelector(sel);
const fmt = (n) => Intl.NumberFormat('de-DE').format(n);

function showScreen(id){
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $(id).classList.add('active');
  // kleine Scroll-Top
  window.scrollTo({top:0, behavior:'smooth'});
}

function freshRoundSetup(){
  state.answers = new Map();
  state.folded = new Set();
  state.bets = new Map();
  state.acted = new Set();
  state.hintStep = 0;

  // neue Frage holen (rotierend)
  state.currentQuestion = QUESTIONS[state.qIndex % QUESTIONS.length];
  state.qIndex++;

  // jeder startet automatisch mit 1 Schluck, nachdem alle Antworten abgegeben sind (regelkonform)
  state.players.forEach(p => state.bets.set(p.name, 0));
}

function nextActiveTurnIndex(fromIdx=0){
  const alive = state.players
    .map((p, i) => ({...p, i}))
    .filter(p => !state.folded.has(p.name));
  if (!alive.length) return -1;

  // Kreise, bis jemand noch "pending" ist (nicht acted in dieser Hint-Runde)
  for(let shift=0; shift<state.players.length; shift++){
    const idx = (fromIdx + shift) % state.players.length;
    const name = state.players[idx].name;
    if (!state.folded.has(name) && !state.acted.has(name)) return idx;
  }
  return -1;
}

function everyoneActedThisHint(){
  const alive = state.players.filter(p => !state.folded.has(p.name));
  return alive.length > 0 && alive.every(p => state.acted.has(p.name));
}

function spawnConfetti(){
  const box = $('#confetti-container');
  for(let i=0;i<24;i++){
    const c = document.createElement('div');
    c.className = 'confetti';
    c.style.left = Math.random()*100 + 'vw';
    c.style.setProperty('--h', Math.floor(Math.random()*360));
    c.style.animationDelay = (Math.random()*0.6)+'s';
    box.appendChild(c);
    setTimeout(()=> c.remove(), 2000);
  }
}

/* ---------- Start UI ---------- */
function addPlayerInput(value=""){
  const wrap = document.createElement('div');
  wrap.className = 'player-line';
  const inp = document.createElement('input');
  inp.placeholder = "Spielername";
  inp.value = value;
  wrap.appendChild(inp);
  $('#player-inputs').appendChild(wrap);
}

function collectPlayerNames(){
  const names = Array.from(document.querySelectorAll('#player-inputs input'))
    .map(i => i.value.trim())
    .filter(Boolean);
  // eindeutige Namen
  return [...new Set(names)];
}

/* ---------- Renders ---------- */
function renderQuestionScreen(){
  $('#round-info').textContent = `Runde ${state.currentRound} / ${state.totalRounds}`;
  $('#question-index-info').textContent = `Frage • ${state.currentQuestion.id.toUpperCase()}`;
  $('#question-text').textContent = state.currentQuestion.question;
}

function renderHandoffTo(name){
  $('#handoff-title').textContent = 'Gib das Handy an …';
  $('#handoff-name').textContent = name;
}

function renderAnswerScreen(name){
  $('#answering-player').textContent = `Antwort von: ${name}`;
  $('#answer-question').textContent = state.currentQuestion.question;
  $('#answer-input').value = '';
  $('#answer-input').focus();
}

function renderBetting(){
  $('#bet-round-info').textContent = `Runde ${state.currentRound} / ${state.totalRounds}`;
  $('#hint-count').textContent = `Hinweis ${state.hintStep+1} / 5`;
  $('#hint-text').textContent = state.currentQuestion.hints[state.hintStep];

  // Liste
  const panel = $('#players-panel');
  panel.innerHTML = '';
  state.players.forEach((p, idx) => {
    const name = p.name;
    const pill = document.createElement('div');
    pill.className = 'player-pill';
    let statusClass = 'pending';
    if (state.folded.has(name)) statusClass = 'folded';
    else if (state.acted.has(name)) statusClass = 'done';
    pill.classList.add(statusClass);

    const left = document.createElement('div');
    left.className = 'name';
    left.textContent = name;

    const right = document.createElement('div');
    right.className = 'bet';
    const b = state.bets.get(name) ?? 0;
    right.textContent = `${b} Schluck(e)`;

    pill.appendChild(left);
    pill.appendChild(right);
    panel.appendChild(pill);
  });

  // Turn indicator
  const curName = state.players[state.turnIdx]?.name ?? '—';
  $('#turn-indicator').textContent = `Am Zug: ${curName}`;

  // Bet amount vorbefüllen: Standard = aktueller Einsatz (zum Korrigieren) oder minimal 1 bei Hinweis 1
  const current = state.bets.get(curName) ?? 0;
  const base = Math.max(current || (state.hintStep===0 ? 1 : 0), 0);
  $('#bet-amount').textContent = base;
}

function renderReveal(){
  $('#correct-answer').textContent = `Korrekte Antwort: ${fmt(state.currentQuestion.answer)}`;

  const list = $('#answers-list');
  list.innerHTML = '';

  // Distanz berechnen (nur nicht gefoldete zählen)
  const livePlayers = state.players.filter(p => !state.folded.has(p.name) && state.answers.has(p.name));
  const rows = [];
  livePlayers.forEach(p => {
    const ans = Number(state.answers.get(p.name));
    const bet = state.bets.get(p.name) ?? 0;
    const diff = Math.abs(ans - state.currentQuestion.answer);

    const line = document.createElement('div');
    line.className = 'answer-line';
    const left = document.createElement('div');
    left.innerHTML = `<strong>${p.name}</strong> antwortete: <span>${fmt(ans)}</span>`;
    const right = document.createElement('div');
    right.innerHTML = `Einsatz: <strong>${bet}</strong>`;
    line.appendChild(left); line.appendChild(right);
    list.appendChild(line);

    rows.push({name:p.name, ans, bet, diff});
  });

  // Gewinner bestimmen (kleinste diff)
  rows.sort((a,b)=> a.diff - b.diff);
  let resultHTML = '';
  if (!rows.length){
    resultHTML = `<p>Niemand war aktiv – niemand verteilt, niemand trinkt. 🤷‍♂️</p>`;
  } else if (rows.length >= 2 && rows[0].diff === rows[1].diff){
    resultHTML = `<p>Gleichstand (gleiche Nähe) – <strong>es passiert nix</strong>.</p>`;
  } else {
    const w = rows[0];
    const totalToDistribute = state.players
      .filter(p => p.name !== w.name)    // alle anderen
      .reduce((sum, p) => sum + (state.bets.get(p.name) ?? 0), 0);

    resultHTML = `
      <p>🏆 Gewinner: <strong>${w.name}</strong></p>
      <p>Darf <strong>${fmt(totalToDistribute)}</strong> Schluck(e) <em>verteilen</em>.</p>
      <p>Alle Verlierer trinken ihre eigenen Einsätze selbst.</p>
    `;
    spawnConfetti();
  }
  $('#result-box').innerHTML = resultHTML;
}

/* ---------- Flow Controllers ---------- */
function startAnswersFlow(){
  // Gehe reihum: Handoff -> Answer -> Handoff -> ...
  let idx = 0;
  const order = state.players.map(p => p.name);

  const toHandoff = () => {
    if (idx >= order.length){
      // alle beantwortet -> automatisch jeden auf 1 Schluck setzen (Regel)
      state.players.forEach(p => {
        if (!state.folded.has(p.name)){
          const had = state.bets.get(p.name) ?? 0;
          state.bets.set(p.name, Math.max(1, had)); // mindestens 1
        }
      });
      // Weiter zu Hint/Bets
      state.acted.clear(); // neue Hint-Runde
      state.turnIdx = nextActiveTurnIndex(0);
      showScreen('#betting-screen');
      renderBetting();
      updateButtonsForBetting();
      return;
    }
    renderHandoffTo(order[idx]);
    showScreen('#handoff-screen');
  };

  $('#handoff-confirm').onclick = ()=>{
    const name = order[idx];
    renderAnswerScreen(name);
    showScreen('#answer-screen');
    $('#answer-input').focus();
  };

  $('#answer-submit').onclick = ()=>{
    const name = order[idx];
    const raw = $('#answer-input').value.trim().replace(',', '.');
    const val = Number(raw);
    if (!isFinite(val)){
      alert('Bitte eine Zahl eingeben.');
      return;
    }
    state.answers.set(name, val);
    idx++;
    toHandoff();
  };

  toHandoff();
}

function updateButtonsForBetting(){
  // enable/disable reveal / next hint
  $('#reveal-answers').disabled = !(state.hintStep >= 4); // nach 5. Hinweis aktiv
}

function nextHintOrReveal(){
  if (state.hintStep < 4){
    // nächste Hinweisrunde
    state.hintStep++;
    state.acted.clear();
    state.turnIdx = nextActiveTurnIndex(0);
    renderBetting();
    updateButtonsForBetting();
  }
}

function moveTurnForward(){
  // Wenn alle aktiven Spieler acted haben -> Buttons für nächsten Hinweis/Reveals sind eh schon da
  if (everyoneActedThisHint()) return; // warten auf Nutzer, um "Nächster Hinweis" zu drücken
  // sonst nächsten pending Spieler finden
  const next = nextActiveTurnIndex(state.turnIdx+1);
  if (next === -1) return;
  state.turnIdx = next;
  renderBetting();
}

function handleBetChange(delta){
  const name = state.players[state.turnIdx].name;
  const cur = Number($('#bet-amount').textContent);
  const next = Math.max(0, cur + delta);
  $('#bet-amount').textContent = next;
}

function handleBetConfirm({mode}){
  const name = state.players[state.turnIdx].name;
  // Einsatz bestimmen
  let amt = Number($('#bet-amount').textContent);
  if (mode === 'call'){
    // Mitgehen = auf höchsten aktuellen Einsatz angleichen
    const maxBet = Math.max(...state.players.map(p => state.bets.get(p.name) ?? 0));
    amt = Math.max(maxBet, 1);
  }
  state.bets.set(name, amt);
  state.acted.add(name);

  // Status aktualisieren
  renderBetting();

  // Wenn alle acted -> Nutzer kann "Nächster Hinweis" drücken
  if (everyoneActedThisHint()){
    // nichts – Benutzer steuert den Button
  } else {
    moveTurnForward();
  }
}

function handleFold(){
  const name = state.players[state.turnIdx].name;
  const currentBet = state.bets.get(name) ?? 0;
  // Regel: „Wenn man rausgeht, muss man sie trinken“
  if (currentBet > 0){
    alert(`${name} steigt aus und trinkt ${currentBet} Schluck(e).`);
  } else {
    alert(`${name} steigt aus (kein Einsatz).`);
  }
  state.folded.add(name);
  state.acted.add(name);
  renderBetting();
  moveTurnForward();
}

/* ---------- Event Wiring ---------- */
function wireStart(){
  $('#add-player').onclick = ()=> addPlayerInput('');
  $('#remove-player').onclick = ()=>{
    const items = $('#player-inputs').children;
    if (items.length) items[items.length-1].remove();
  };
  $('#start-game').onclick = ()=>{
    const names = collectPlayerNames();
    if (names.length < 2){
      alert('Mindestens 2 Spieler.');
      return;
    }
    state.players = names.map(n => ({name:n}));
    state.totalRounds = state.players.length * 4;
    state.currentRound = 1;
    state.qIndex = 0;

    // Vorbereitung Runde 1
    freshRoundSetup();
    renderQuestionScreen();
    showScreen('#question-screen');
  };
  // 2 Default-Inputs
  addPlayerInput('Joko');
  addPlayerInput('Klaas');
}

function wireQuestion(){
  $('#begin-answers').onclick = ()=> startAnswersFlow();
}

function wireBetting(){
  $('#minus').onclick = ()=> handleBetChange(-1);
  $('#plus').onclick = ()=> handleBetChange(+1);

  $('#bet-confirm').onclick = ()=> handleBetConfirm({mode:'custom'});
  $('#bet-call').onclick = ()=> handleBetConfirm({mode:'call'});

  $('#bet-fold').onclick = ()=> handleFold();

  $('#next-hint').onclick = ()=>{
    if (!everyoneActedThisHint()){
      alert('Noch nicht alle dran gewesen.');
      return;
    }
    nextHintOrReveal();
  };

  $('#reveal-answers').onclick = ()=>{
    // Aufdecken nur nach letztem Hinweis
    renderReveal();
    showScreen('#reveal-screen');
  };
}

function wireReveal(){
  $('#next-round').onclick = ()=>{
    // nächste Runde
    state.currentRound++;
    if (state.currentRound > state.totalRounds){
      alert('Spiel beendet! Danke fürs Spielen 🍻');
      // zurück zum Start
      showScreen('#start-screen');
      return;
    }
    freshRoundSetup();
    renderQuestionScreen();
    showScreen('#question-screen');
  };
}

/* ---------- Init ---------- */
window.addEventListener('DOMContentLoaded', ()=>{
  wireStart();
  wireQuestion();
  wireBetting();
  wireReveal();
});
