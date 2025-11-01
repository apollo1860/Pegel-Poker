// app.js
import { QUESTIONS } from './questions.js';

/* ========= STATE ========= */
const state = {
  players: [],                 // [{name}]
  currentRound: 1,
  totalRounds: 0,              // = players.length * 4

  // pro Runde
  qIndex: 0,                   // rotierend über QUESTIONS
  currentQuestion: null,
  answers: new Map(),          // name -> number
  folded: new Set(),           // ausgestiegen
  bets: new Map(),             // name -> number
  acted: new Set(),            // in aktueller Hinweisrunde gehandelt
  turnIdx: 0,                  // Index aktiver Spieler (in players)
  hintStep: 0                  // 0..4 (fünf Hinweise)
};

/* ========= DOM HELPERS ========= */
const $ = (sel) => document.querySelector(sel);
const fmt = (n) => Intl.NumberFormat('de-DE').format(n);

function showScreen(id){
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $(id).classList.add('active');
  window.scrollTo({top:0, behavior:'smooth'});
}

function spawnConfetti(){
  const box = $('#confetti-container');
  for(let i=0;i<28;i++){
    const c = document.createElement('div');
    c.className = 'confetti';
    c.style.left = Math.random()*100 + 'vw';
    c.style.setProperty('--h', Math.floor(Math.random()*360));
    c.style.animationDelay = (Math.random()*0.6)+'s';
    box.appendChild(c);
    setTimeout(()=> c.remove(), 2000);
  }
}

/* ========= ROUND SETUP ========= */
function freshRoundSetup(){
  state.answers = new Map();
  state.folded = new Set();
  state.bets = new Map();
  state.acted = new Set();
  state.hintStep = 0;

  state.currentQuestion = QUESTIONS[state.qIndex % QUESTIONS.length];
  state.qIndex++;

  state.players.forEach(p => state.bets.set(p.name, 0));
}

/* ========= TURN / FLOW UTILS ========= */
function nextActiveTurnIndex(fromIdx=0){
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

/* ========= RENDERERS ========= */
function renderStartDefaults(){
  // zwei Beispiel-Spieler
  addPlayerInput('Joko');
  addPlayerInput('Klaas');
}
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
  return [...new Set(names)];
}

function renderQuestion(){
  $('#round-info').textContent = `Runde ${state.currentRound} / ${state.totalRounds}`;
  $('#question-index-info').textContent = `Frage • ${state.currentQuestion.id.toUpperCase()}`;
  $('#question-text').textContent = state.currentQuestion.question;
}

function renderHandoffTo(name){
  $('#handoff-name').textContent = name;
}

function renderAnswer(name){
  $('#answering-player').textContent = `Antwort von: ${name}`;
  $('#answer-question').textContent = state.currentQuestion.question;
  $('#answer-input').value = '';
  $('#answer-input').focus();
}

function renderHintIntro(){
  $('#hint-round-info').textContent = `Runde ${state.currentRound} / ${state.totalRounds}`;
  $('#hint-number').textContent = (state.hintStep+1);
}

function renderBetting(){
  $('#bet-round-info').textContent = `Runde ${state.currentRound} / ${state.totalRounds}`;
  $('#hint-count').textContent = `Hinweis ${state.hintStep+1} / 5`;
  $('#hint-text').textContent = state.currentQuestion.hints[state.hintStep];

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

  const curName = state.players[state.turnIdx]?.name ?? '—';
  $('#turn-indicator').textContent = `Am Zug: ${curName}`;

  // Vorwahl für Bet-UI: aktueller Einsatz oder 1 im ersten Hinweis
  const current = state.bets.get(curName) ?? 0;
  const base = Math.max(current || (state.hintStep===0 ? 1 : 0), 0);
  $('#bet-amount').textContent = base;

  // Buttons
  $('#to-reveal-intro').disabled = !(state.hintStep >= 4 && everyoneActedThisHint());
}

function renderReveal(){
  $('#correct-answer').textContent = `Korrekte Antwort: ${fmt(state.currentQuestion.answer)}`;

  const list = $('#answers-list');
  list.innerHTML = '';

  const liveRows = [];
  state.players.forEach(p => {
    const name = p.name;
    if (state.folded.has(name)) return;
    if (!state.answers.has(name)) return;

    const ans = Number(state.answers.get(name));
    const bet = state.bets.get(name) ?? 0;
    const diff = Math.abs(ans - state.currentQuestion.answer);

    const line = document.createElement('div');
    line.className = 'answer-line';
    const left = document.createElement('div');
    left.innerHTML = `<strong>${name}</strong> antwortete: <span>${fmt(ans)}</span>`;
    const right = document.createElement('div');
    right.innerHTML = `Einsatz: <strong>${bet}</strong>`;
    line.appendChild(left); line.appendChild(right);
    list.appendChild(line);

    liveRows.push({name, ans, bet, diff});
  });

  liveRows.sort((a,b)=> a.diff - b.diff);

  let resultHTML = '';
  if (!liveRows.length){
    resultHTML = `<p>Niemand war aktiv – niemand verteilt, niemand trinkt.</p>`;
  } else if (liveRows.length >= 2 && liveRows[0].diff === liveRows[1].diff){
    resultHTML = `<p>Gleichstand bei der Nähe – <strong>es passiert nix</strong>.</p>`;
  } else {
    const w = liveRows[0];
    const totalToDistribute = state.players
      .filter(p => p.name !== w.name)
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

/* ========= FLOW: ANSWERS ========= */
function answersFlow(){
  // Reihenfolge: jeder Spieler nacheinander
  let idx = 0;
  const order = state.players.map(p => p.name);

  function toHandoff(){
    if (idx >= order.length){
      // Slide: Alle Antworten gesammelt
      showScreen('#all-answered-screen');
      return;
    }
    renderHandoffTo(order[idx]);
    showScreen('#handoff-screen');
  }

  $('#handoff-confirm').onclick = ()=>{
    const name = order[idx];
    renderAnswer(name);
    showScreen('#answer-screen');
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

/* ========= FLOW: HINTS / BETTING ========= */
function prepareAfterAllAnswered(){
  // Regel: alle starten mit mind. 1 Schluck Einsatz
  state.players.forEach(p => {
    const had = state.bets.get(p.name) ?? 0;
    state.bets.set(p.name, Math.max(1, had));
  });
  state.acted.clear();
  state.turnIdx = nextActiveTurnIndex(0);
}

function openHintIntro(){
  $('#to-next-hint-intro').disabled = true; // wird auf der Betting-Slide dynamisch gesetzt
  renderHintIntro();
  showScreen('#hint-intro-screen');
}

function toBettingSlide(){
  renderBetting();
  showScreen('#betting-screen');
}

/* ========= EVENT HANDLERS ========= */
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

    freshRoundSetup();
    renderQuestion();
    showScreen('#question-screen');
  };
}

function wireQuestionSlide(){
  $('#to-handoff').onclick = ()=> answersFlow();
}

function wireAllAnswered(){
  $('#to-hint-intro').onclick = ()=>{
    prepareAfterAllAnswered();
    openHintIntro();
  };
}

function wireHintIntro(){
  $('#show-betting').onclick = ()=>{
    // aktueller Hinweis sichtbar + Einsatzrunde
    renderBetting();
    showScreen('#betting-screen');
  };
}

function handleBetChange(delta){
  const name = state.players[state.turnIdx].name;
  const cur = Number($('#bet-amount').textContent);
  const next = Math.max(0, cur + delta);
  $('#bet-amount').textContent = next;
}

function handleBetConfirm({mode}){
  const name = state.players[state.turnIdx].name;
  let amt = Number($('#bet-amount').textContent);
  if (mode === 'call'){
    const maxBet = Math.max(...state.players.map(p => state.bets.get(p.name) ?? 0));
    amt = Math.max(maxBet, 1);
  }
  state.bets.set(name, amt);
  state.acted.add(name);

  renderBetting();

  if (everyoneActedThisHint()){
    // alle waren dran → „Nächster Hinweis“ freigeben
    $('#to-next-hint-intro').disabled = false;
  } else {
    // zum nächsten Spieler
    const next = nextActiveTurnIndex(state.turnIdx+1);
    if (next !== -1){
      state.turnIdx = next;
      renderBetting();
    }
  }
}

function handleFold(){
  const name = state.players[state.turnIdx].name;
  const currentBet = state.bets.get(name) ?? 0;
  if (currentBet > 0){
    alert(`${name} steigt aus und trinkt ${currentBet} Schluck(e).`);
  } else {
    alert(`${name} steigt aus (kein Einsatz).`);
  }
  state.folded.add(name);
  state.acted.add(name);
  renderBetting();

  if (everyoneActedThisHint()){
    $('#to-next-hint-intro').disabled = false;
  } else {
    const next = nextActiveTurnIndex(state.turnIdx+1);
    if (next !== -1){
      state.turnIdx = next;
      renderBetting();
    }
  }
}

function wireBetting(){
  $('#minus').onclick = ()=> handleBetChange(-1);
  $('#plus').onclick = ()=> handleBetChange(+1);

  $('#bet-confirm').onclick = ()=> handleBetConfirm({mode:'custom'});
  $('#bet-call').onclick =   ()=> handleBetConfirm({mode:'call'});
  $('#bet-fold').onclick =   ()=> handleFold();

  $('#to-next-hint-intro').onclick = ()=>{
    if (!everyoneActedThisHint()){
      alert('Noch nicht alle dran gewesen.');
      return;
    }
    if (state.hintStep < 4){
      state.hintStep++;
      state.acted.clear();
      state.turnIdx = nextActiveTurnIndex(0);
      renderHintIntro();
      showScreen('#hint-intro-screen');
    } else {
      // alle 5 Hinweise durch → Aufdeck-Intro
      $('#to-reveal-intro').disabled = false;
      showScreen('#reveal-intro-screen');
    }
  };

  $('#to-reveal-intro').onclick = ()=>{
    // Falls jemand sofort zur Aufdeckung will, wenn schon alle Hinweise durch sind
    showScreen('#reveal-intro-screen');
  };
}

function wireRevealIntro(){
  $('#go-reveal').onclick = ()=>{
    renderReveal();
    showScreen('#reveal-screen');
  };
}

function wireReveal(){
  $('#next-round').onclick = ()=>{
    state.currentRound++;
    if (state.currentRound > state.totalRounds){
      alert('Spiel beendet! Danke fürs Spielen 🍻');
      showScreen('#start-screen');
      return;
    }
    freshRoundSetup();
    renderQuestion();
    showScreen('#question-screen');
  };
}

/* ========= INIT ========= */
window.addEventListener('DOMContentLoaded', ()=>{
  // Startdefaults
  renderStartDefaults();

  // Start wiring
  wireStart();
  wireQuestionSlide();
  wireAllAnswered();
  wireHintIntro();
  wireBetting();
  wireRevealIntro();
  wireReveal();
});
