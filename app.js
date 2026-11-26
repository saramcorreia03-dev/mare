'use strict';

/* ============================================================
   Maré — rotina cíclica de treino e alimentação
   Tudo corre no aparelho: os registos ficam em localStorage.
   ============================================================ */

/* ---------- Dados fixos ---------- */
const DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const DAYS_LONG = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

const GROUPS = {
  pernas:    { label: 'Pernas (unilateral)', color: '#B8532F', workout: 'sexta' },
  core:      { label: 'Lombar + Core',       color: '#52702F', workout: 'quarta' },
  bracos:    { label: 'Braços',              color: '#A8691A', workout: 'quinta' },
  saltos:    { label: 'Saltos e equilíbrio', color: '#8A6A1F', workout: 'terca' },
  caminhada: { label: 'Caminhada',           color: '#7A5842' },
  descanso:  { label: 'Descanso',            color: '#8C7260' }
};

const TEMPLATES = {
  alta:  ['pernas', 'saltos', 'core', 'bracos', 'pernas', 'caminhada', 'descanso'],
  media: ['pernas', 'caminhada', 'core', 'descanso', 'bracos', 'caminhada', 'descanso'],
  baixa: ['caminhada', 'descanso', 'core', 'descanso', 'caminhada', 'descanso', 'descanso']
};
const MODES = [
  { id: 'alta', label: 'Maré alta' },
  { id: 'media', label: 'Média' },
  { id: 'baixa', label: 'Maré baixa' }
];

const INGREDIENTS = ['Frango', 'Ovos', 'Iogurte grego', 'Batata-doce', 'Brócolos', 'Atum', 'Queijo fresco',
  'Aveia', 'Fruta', 'Bacalhau', 'Grão-de-bico', 'Tapioca', 'Cenoura'];

// Valores aproximados, para dar uma ideia e não para contar ao grama.
const MEALS = [
  { id: 1,  type: 'Pequeno-almoço', name: 'Iogurte grego, aveia e fruta',        kcal: 320, protein: 22, base: ['Iogurte grego', 'Aveia', 'Fruta'] },
  { id: 2,  type: 'Pequeno-almoço', name: 'Ovos mexidos com aveia',              kcal: 350, protein: 24, base: ['Ovos', 'Aveia'] },
  { id: 10, type: 'Pequeno-almoço', name: 'Iogurte proteico com fruta',          kcal: 200, protein: 20, base: ['Iogurte grego', 'Fruta'] },
  { id: 11, type: 'Pequeno-almoço', name: 'Tapioca com ovo e queijo fresco',     kcal: 290, protein: 20, base: ['Tapioca', 'Ovos', 'Queijo fresco'] },
  { id: 3,  type: 'Principal',      name: 'Frango grelhado, batata-doce e brócolos', kcal: 480, protein: 42, base: ['Frango', 'Batata-doce', 'Brócolos'] },
  { id: 4,  type: 'Principal',      name: 'Atum, batata-doce e brócolos',        kcal: 420, protein: 36, base: ['Atum', 'Batata-doce', 'Brócolos'] },
  { id: 5,  type: 'Principal',      name: 'Omelete de frango e brócolos',        kcal: 390, protein: 38, base: ['Ovos', 'Frango', 'Brócolos'] },
  { id: 12, type: 'Principal',      name: 'Salada de grão-de-bico com bacalhau', kcal: 380, protein: 32, base: ['Bacalhau', 'Grão-de-bico'] },
  { id: 13, type: 'Principal',      name: 'Bacalhau com batata-doce e salada',   kcal: 430, protein: 34, base: ['Bacalhau', 'Batata-doce'] },
  { id: 6,  type: 'Lanche',         name: 'Queijo fresco com pepino',            kcal: 140, protein: 14, base: ['Queijo fresco'] },
  { id: 7,  type: 'Lanche',         name: 'Ovos cozidos (2)',                    kcal: 155, protein: 13, base: ['Ovos'] },
  { id: 8,  type: 'Lanche',         name: 'Iogurte grego com fruta',             kcal: 180, protein: 15, base: ['Iogurte grego', 'Fruta'] },
  { id: 9,  type: 'Lanche',         name: 'Atum com bolachas de arroz',          kcal: 210, protein: 20, base: ['Atum'] },
  { id: 14, type: 'Lanche',         name: 'Cenoura com queijo fresco',           kcal: 130, protein: 13, base: ['Cenoura', 'Queijo fresco'] }
];

const SLOTS = [
  { k: 'breakfast', label: 'Pequeno-almoço', types: ['Pequeno-almoço'] },
  { k: 'lunch',     label: 'Almoço',         types: ['Principal'] },
  { k: 'snack',     label: 'Lanche',         types: ['Lanche'] },
  { k: 'dinner',    label: 'Jantar',         types: ['Principal'] }
];

/* ---------- Treinos com timer ---------- */
const WORKOUTS = [
  {
    id: 'terca', title: 'Terça · Saltos e equilíbrio', short: 'Pliometria, ginga, equilíbrio e mobilidade',
    blocks: [
      { section: 'Aquecimento', list: [
        { name: 'Mobilidade de tornozelo', detail: 'círculos + flexão e extensão', work: 40, rest: 10 },
        { name: 'Mobilidade de anca', detail: 'círculos amplos, cada direção', work: 40, rest: 10 },
        { name: 'Ativação de core', detail: 'prancha suave', work: 30, rest: 15 }
      ] },
      { section: 'Pliometria', rounds: 2, work: 35, rest: 15, roundRest: 60, circuit: [
        { name: 'Jump squats', detail: 'agacha e salta, aterra suave' },
        { name: 'Saltos laterais', detail: 'de um lado para o outro, controlado' },
        { name: 'Skater jumps', detail: 'salto lateral, aterra numa perna' },
        { name: 'Saltos com mudança de direção', detail: 'salta e muda de direção no ar' },
        { name: 'Saltos verticais', detail: 'salta o mais alto que conseguires, aterra suave' },
        { name: 'Joelhos altos no sítio', detail: 'rápido, braços a ajudar' },
        { name: 'Polichinelos', detail: 'ritmo forte e constante' }
      ] },
      { section: 'Ginga e agilidade', rounds: 3, work: 45, rest: 10, roundRest: 30, circuit: [
        { name: 'Ginga contínua', detail: 'balanço de um lado para o outro, sem parar' },
        { name: 'Esquivas laterais', detail: 'desce o tronco e desvia, alterna os lados' },
        { name: 'Passos rápidos no sítio', detail: 'pés leves, joelhos ligeiramente dobrados' }
      ] },
      { section: 'Equilíbrio', list: [
        { name: 'Equilíbrio numa perna', detail: 'olhos abertos, depois fechados', work: 30, rest: 15 },
        { name: 'Equilíbrio na outra perna', detail: 'o mesmo, perna trocada', work: 30, rest: 15 },
        { name: 'Transferência de peso (ginga)', detail: 'lado a lado, ritmo controlado', work: 40, rest: 15 },
        { name: 'Agachamento numa perna com apoio', detail: 'mão na parede, desce devagar', work: 30, rest: 15 },
        { name: 'Agachamento na outra perna', detail: 'perna trocada', work: 30, rest: 20 }
      ] },
      { section: 'Mobilidade final', list: [
        { name: 'Alongamento de gémeos', detail: 'cada perna, empurra a parede', work: 60, rest: 0 },
        { name: 'Alongamento de anca e quadríceps', detail: 'posição de avanço', work: 60, rest: 0 },
        { name: 'Respiração lenta', detail: 'baixar o ritmo cardíaco', work: 45, rest: 0 }
      ] }
    ]
  },
  {
    id: 'quarta', title: 'Quarta · Lombar e core', short: '7 exercícios, 4 voltas',
    blocks: [
      { section: 'Aquecimento', list: [
        { name: 'Gato-vaca', detail: '10 reps, ritmo lento', work: 40, rest: 10 },
        { name: 'Rotação de tronco em pé', detail: '10 para cada lado', work: 40, rest: 10 },
        { name: 'Ativação — prancha suave', detail: 'liga o core antes do esforço', work: 20, rest: 15 }
      ] },
      { section: 'Lombar + Core', rounds: 4, work: 40, rest: 10, roundRest: 35, circuit: [
        { name: 'Bird-dog com pausa', detail: 'estica, aguenta 3 seg, troca devagar' },
        { name: 'Superman com pausa', detail: 'sobe, aguenta 3 seg no topo, desce devagar' },
        { name: 'Prancha com toque no ombro', detail: 'ritmo lento, a anca não mexe' },
        { name: 'Ponte de glúteos a 1 perna', detail: 'outra perna esticada no ar, aperta no topo' },
        { name: 'Prancha lateral com elevação de anca', detail: 'cada lado: desce e sobe a anca sem tocar' },
        { name: 'Elevação de pernas deitada', detail: 'sobe normal, desce em 3-4 seg' },
        { name: 'Mountain climbers controlados', detail: 'ritmo médio, joelho ao peito' }
      ] },
      { section: 'Mobilidade final', list: [
        { name: 'Torção lombar deitada', detail: 'joelhos para um lado, depois para o outro', work: 60, rest: 0 },
        { name: 'Gato-vaca lento', detail: 'respira fundo em cada posição', work: 45, rest: 0 },
        { name: 'Respiração lenta', detail: 'baixar o ritmo cardíaco', work: 45, rest: 0 }
      ] }
    ]
  },
  {
    id: 'quinta', title: 'Quinta · Braços', short: '7 exercícios, 4 voltas',
    blocks: [
      { section: 'Aquecimento', list: [
        { name: 'Círculos de ombro', detail: '10 para cada direção, amplos', work: 40, rest: 10 },
        { name: 'Rotação de pulso', detail: '10 para cada direção, cada mão', work: 30, rest: 10 },
        { name: 'Ativação — flexão suave', detail: 'poucas reps, ritmo lento', work: 20, rest: 15 }
      ] },
      { section: 'Braços', rounds: 4, work: 40, rest: 10, roundRest: 35, circuit: [
        { name: 'Flexões com descida lenta', detail: 'desce em 4 seg, sobe normal' },
        { name: 'Dips na cadeira', detail: 'desce devagar, aguenta 2 seg em baixo' },
        { name: 'Prancha com toque no ombro', detail: 'ritmo lento, a anca não mexe' },
        { name: 'Flexões com pausa a meio', detail: 'pára 2 seg a meio da descida' },
        { name: 'Y-T-W deitada', detail: 'de barriga para baixo: Y, depois T, depois W' },
        { name: 'Dips com elevação de perna', detail: 'uma perna esticada no ar, alterna' },
        { name: 'Prancha alta, toque no ombro oposto', detail: 'mais lento, mais controlo' }
      ] },
      { section: 'Mobilidade final', list: [
        { name: 'Alongamento de peito', detail: 'braço na parede, roda o tronco', work: 45, rest: 0 },
        { name: 'Alongamento de tríceps', detail: 'cada braço, atrás da cabeça', work: 45, rest: 0 },
        { name: 'Respiração lenta', detail: 'baixar o ritmo cardíaco', work: 45, rest: 0 }
      ] }
    ]
  },
  {
    id: 'sexta', title: 'Sexta · Pernas unilateral', short: '7 exercícios, 4 voltas',
    blocks: [
      { section: 'Aquecimento', list: [
        { name: 'Círculos de anca', detail: '10 para cada direção', work: 40, rest: 10 },
        { name: 'Balanços de perna', detail: 'para a frente e para trás, cada perna', work: 40, rest: 10 },
        { name: 'Ativação — agachamento suave', detail: 'poucas reps, ritmo lento', work: 20, rest: 15 }
      ] },
      { section: 'Pernas (unilateral)', rounds: 4, work: 40, rest: 10, roundRest: 35, circuit: [
        { name: 'Agachamento búlgaro — perna A', detail: 'pé de trás na cadeira, desce devagar' },
        { name: 'Agachamento búlgaro — perna B', detail: 'troca de perna' },
        { name: 'Afundo lateral — lado A', detail: 'desce devagar, aguenta 1 seg em baixo' },
        { name: 'Afundo lateral — lado B', detail: 'troca de lado' },
        { name: 'Elevação de gémeos — perna A', detail: 'sobe até à ponta do pé, desce lento' },
        { name: 'Elevação de gémeos — perna B', detail: 'troca de perna' },
        { name: 'Agachamento numa perna com pausa', detail: 'apoio na parede, aguenta 2 seg em baixo' }
      ] },
      { section: 'Mobilidade final', list: [
        { name: 'Alongamento de gémeos', detail: 'cada perna, empurra a parede', work: 45, rest: 0 },
        { name: 'Alongamento de anca e quadríceps', detail: 'posição de avanço', work: 45, rest: 0 },
        { name: 'Respiração lenta', detail: 'baixar o ritmo cardíaco', work: 45, rest: 0 }
      ] }
    ]
  },
  {
    id: 'dois', title: 'Treino a dois', short: 'Mesmo tempo, reps livres, sem comparar',
    blocks: [
      { section: 'Aquecimento', list: [
        { name: 'Círculos de anca', detail: '10 para cada direção', work: 40, rest: 10 },
        { name: 'Gato-vaca', detail: '10 reps, ritmo lento', work: 40, rest: 10 },
        { name: 'Rotação de tronco em pé', detail: '10 para cada lado', work: 40, rest: 0 }
      ] },
      { section: 'Intervalos', rounds: 3, rest: 0, roundRest: 0, circuit: [
        { name: 'Caminhada rápida / esquivas', detail: 'ritmo alto, juntos, mesma cadência', work: 120 },
        { name: 'Ritmo normal', detail: 'recupera a respiração', work: 60 }
      ] },
      { section: 'Lombar + Core', rounds: 3, work: 30, rest: 15, roundRest: 45, circuit: [
        { name: 'Bird-dog', detail: 'reps livres, controlado' },
        { name: 'Superman', detail: 'aguenta 2 seg no topo' },
        { name: 'Prancha com toque no ombro', detail: 'a anca não mexe' },
        { name: 'Ponte de glúteos', detail: 'aperta no topo' }
      ] },
      { section: 'Pernas (unilateral)', rounds: 3, work: 30, rest: 15, roundRest: 45, circuit: [
        { name: 'Agachamento búlgaro — perna A', detail: 'pé de trás na cadeira' },
        { name: 'Agachamento búlgaro — perna B', detail: 'troca de perna' },
        { name: 'Afundo lateral — lado A', detail: 'desce devagar' },
        { name: 'Afundo lateral — lado B', detail: 'troca de lado' },
        { name: 'Elevação de gémeos — perna A', detail: 'sobe até à ponta do pé' },
        { name: 'Elevação de gémeos — perna B', detail: 'troca de perna' }
      ] },
      { section: 'Mobilidade final', list: [
        { name: 'Torção lombar deitada', detail: 'joelhos para um lado, depois para o outro', work: 60, rest: 0 },
        { name: 'Alongamento de anca', detail: 'posição de pombo ou semelhante', work: 90, rest: 0 },
        { name: 'Respiração lenta', detail: 'em sincronia, olhos fechados', work: 60, rest: 0 }
      ] }
    ]
  }
];

/* ---------- Utilitários ---------- */
const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = (n) => String(n).padStart(2, '0');
const ds = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const mondayOf = (d) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
const weekStart = (off = 0) => { const m = mondayOf(new Date()); m.setDate(m.getDate() + 7 * off); return ds(m); };
const todayIdx = () => (new Date().getDay() + 6) % 7;
const fmtShort = (s) => parse(s).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' });
const fmtTime = (sec) => `${Math.floor(sec / 60)}:${pad(sec % 60)}`;

/* ---------- Estado e armazenamento ---------- */
const KEY = 'mare:v1';
const defaults = () => ({ weekplans: {}, mealplans: {}, checkins: {}, weights: [], notes: {}, prefs: {} });
function load() {
  try { return Object.assign(defaults(), JSON.parse(localStorage.getItem(KEY) || '{}')); }
  catch (e) { return defaults(); }
}
let S = load();
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); }
  catch (e) { toast('Sem espaço para guardar. Exporta os dados e apaga fotos antigas.'); }
}

const ui = { tab: 'hoje', weekOffset: 0, openDay: todayIdx(), ing: [], mealFilter: 'Todos' };

function plan(off) {
  const k = weekStart(off);
  if (!S.weekplans[k]) S.weekplans[k] = { mode: 'media', days: [...TEMPLATES.media], set: false };
  return S.weekplans[k];
}
function mealplan(off) {
  const k = weekStart(off);
  if (!S.mealplans[k]) S.mealplans[k] = { days: DAYS.map(() => ({ breakfast: null, lunch: null, snack: null, dinner: null })) };
  return S.mealplans[k];
}
const mealById = (id) => MEALS.find((m) => m.id === id);

/* ---------- Interface geral ---------- */
const ICONS = {
  hoje: '<path d="M3 12c3-4 6-4 9 0s6 4 9 0"/><path d="M3 18c3-4 6-4 9 0s6 4 9 0"/><path d="M3 6c3-4 6-4 9 0s6 4 9 0"/>',
  semana: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 11h18"/>',
  treinos: '<path d="M6 8v8M18 8v8M3 10v4M21 10v4M6 12h12"/>',
  comida: '<path d="M6 3v8a3 3 0 0 0 3 3v7M9 3v8M12 3v8a3 3 0 0 1-3 3M17 3c-2 2-2 6 0 8v10"/>',
  progresso: '<path d="M3 17l6-6 4 4 8-9"/><path d="M15 6h6v6"/>'
};
const TABS = [
  { id: 'hoje', label: 'Hoje', title: 'Hoje' },
  { id: 'semana', label: 'Semana', title: 'A tua semana' },
  { id: 'treinos', label: 'Treinos', title: 'Treinos com timer' },
  { id: 'comida', label: 'Comida', title: 'Base de refeições' },
  { id: 'progresso', label: 'Progresso', title: 'Progresso' }
];

function renderNav() {
  $('#nav').innerHTML = TABS.map((t) =>
    `<button class="${ui.tab === t.id ? 'on' : ''}" data-a="tab" data-v="${t.id}"><svg viewBox="0 0 24 24">${ICONS[t.id]}</svg>${t.label}</button>`).join('');
}

function render() {
  const y = window.scrollY;
  const t = TABS.find((x) => x.id === ui.tab);
  $('#title').textContent = t.title;
  $('#view').innerHTML = VIEWS[ui.tab]();
  document.body.classList.toggle('calm', !!(S.prefs && S.prefs.calm));
  renderNav();
  const f = ui.focus && document.getElementById(ui.focus);
  if (f) { ui.focus = null; f.scrollIntoView(); } else window.scrollTo(0, y);
}

let toastTimer = null;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg; el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 3200);
}

const pill = (label, on, a, data = '') => `<button class="pill${on ? ' on' : ''}" data-a="${a}" ${data}>${esc(label)}</button>`;

function mealRow(m, on, data) {
  return `<button class="meal${on ? ' on' : ''}" data-a="pickMeal" ${data}><span class="nm">${esc(m.name)}</span><span class="mt2">${m.kcal} kcal · ${m.protein} g P</span></button>`;
}

/* ---------- Ecrãs ---------- */
const VIEWS = {
  hoje() {
    const idx = todayIdx(), today = ds(new Date());
    const p = S.weekplans[weekStart(0)];
    const gid = p && p.set ? p.days[idx] : null;
    const g = gid ? GROUPS[gid] : null;
    const ci = S.checkins[today] || {};
    let h = `<div class="quote">${esc(typeof dailyQuote === 'function' ? dailyQuote() : '')}</div><div class="sub" style="text-align:center">${DAYS_LONG[idx]}, ${fmtShort(today)}</div>`;
    if (typeof nextStepCard === 'function') h += nextStepCard() + agendaCard();
    if (typeof healthBanner === 'function') h += healthBanner();

    if (idx === 6) {
      h += `<div class="card note"><strong>Domingo é dia de maré.</strong><div class="small">Escolhe a maré, o treino e as refeições da próxima semana. <button class="link" data-a="goNext">Abrir plano</button></div></div>`;
    }

    if (typeof recoveryOn === 'function' && recoveryOn()) {
      h += recoveryCard();
    } else if (!g) {
      h += `<div class="card"><h2>Ainda não há plano para esta semana</h2><div class="small">Escolhe a maré e os dias em "Semana".</div><div class="mt"><button class="btn" data-a="tab" data-v="semana">Planear a semana</button></div></div>`;
    } else {
      const w = g.workout ? WORKOUTS.find((x) => x.id === g.workout) : null;
      h += `<div class="card" style="border-color:${g.color}"><div class="label" style="color:${g.color}">Hoje</div><div class="big" style="color:${g.color}">${esc(g.label)}</div>`;
      if (gid === 'descanso') h += `<div class="small mt">Dia de descanso. Podes fazer só um alongamento suave.</div>`;
      if (gid === 'caminhada') h += `<div class="small mt">30 a 45 minutos de caminhada. Se for com o cão, melhor ainda.</div>`;
      if (w && typeof workoutHint === 'function') h += workoutHint(w);
      if (w) h += `<div class="mt"><button class="btn" data-a="openTimer" data-id="${w.id}">Abrir timer · ${esc(w.title)}</button></div>`;
      h += `</div>`;

      if (gid !== 'descanso') {
        h += `<div class="card"><h2>Registo do dia</h2>
          <label class="photo">
            <input type="file" accept="image/*" capture="environment" data-c="photo" hidden>
            ${ci.photo ? `<img src="${ci.photo}" alt="foto do treino">` : '📷 Adicionar foto do treino'}
          </label>
          <div class="mt"><button class="btn ${ci.done ? 'mint' : 'ghost'}" data-a="toggleDone">${ci.done ? '✓ Marcado como feito' : 'Marcar como feito (sem foto)'}</button></div>
          ${ci.photo ? `<div class="mt"><button class="link small" data-a="removePhoto">Remover foto</button></div>` : ''}
        </div>`;
      }
    }

    // Refeições do dia
    const mp = S.mealplans[weekStart(0)];
    const day = mp && mp.days[idx];
    const items = day ? SLOTS.map((s) => ({ s, m: day[s.k] ? mealById(day[s.k]) : null })).filter((x) => x.m) : [];
    h += `<div class="card"><h2>Refeições de hoje</h2>`;
    if (!items.length) {
      h += `<div class="small">Ainda sem refeições para hoje. Define-as em "Semana".</div>`;
    } else {
      h += `<div class="stack">` + items.map(({ s, m }) => `<div><div class="label">${s.label}</div><div class="between"><span>${esc(m.name)}</span><span class="small">${m.kcal} kcal</span></div></div>`).join('') + `</div>`;
      const kcal = items.reduce((a, x) => a + x.m.kcal, 0), pr = items.reduce((a, x) => a + x.m.protein, 0);
      h += `<div class="small mt">Total planeado: ~${kcal} kcal · ~${pr} g de proteína</div>`;
    }
    h += `</div>`;
    return h;
  },

  semana() {
    const off = ui.weekOffset, p = plan(off), mp = mealplan(off), k = weekStart(off);
    const sun = parse(k); sun.setDate(sun.getDate() + 6);
    let h = `<div class="row">${pill('Esta semana', off === 0, 'weekOff', 'data-v="0"')}${pill('Próxima semana', off === 1, 'weekOff', 'data-v="1"')}</div>
      <div class="sub">${fmtShort(k)} a ${fmtShort(ds(sun))}</div>`;

    h += `<div class="card"><h2>Que maré é esta semana?</h2><div class="small">Escolhe o modo. Não é falhar, é ritmo.</div>
      <div class="row mt">${MODES.map((m) => pill(m.label, p.mode === m.id && p.set, 'mode', `data-v="${m.id}"`)).join('')}</div>
      <div class="mt"><button class="btn ghost small" data-a="repeatWeek">Repetir a semana anterior</button></div></div>`;

    h += `<div class="card"><h2>Plano de treino</h2><div class="stack">` +
      DAYS.map((d, i) => `<label class="dayrow"><span>${d}</span><select data-c="dayGroup" data-i="${i}">${
        Object.entries(GROUPS).map(([id, g]) => `<option value="${id}"${p.days[i] === id ? ' selected' : ''}>${g.label}</option>`).join('')
      }</select>${typeof agendaTag === 'function' ? agendaTag(i) : ''}</label>`).join('') + `</div></div>`;
    if (typeof loadCard === 'function') h += loadCard() + weekAgenda();

    // Refeições por dia
    const filtered = MEALS.filter((m) => !ui.ing.length || m.base.some((b) => ui.ing.includes(b)));
    const open = ui.openDay;
    h += `<div class="card"><h2>Refeições por dia (meal prep)</h2><div class="small">Filtra pelos ingredientes-base para não variares demasiado.</div>
      <div class="row mt">${INGREDIENTS.map((i) => pill(i, ui.ing.includes(i), 'ing', `data-v="${esc(i)}"`)).join('')}</div>
      <div class="daytabs mt">${DAYS.map((d, i) => {
        const dd = mp.days[i]; const has = dd.breakfast || dd.lunch || dd.snack || dd.dinner;
        return `<button class="${open === i ? 'on' : ''}${has ? ' has' : ''}" data-a="mealDay" data-v="${i}">${d}</button>`;
      }).join('')}</div>`;
    SLOTS.forEach((s) => {
      h += `<div class="mt"><div class="label">${DAYS[open]} · ${s.label}</div><div class="stack mt">` +
        (filtered.filter((m) => s.types.includes(m.type)).map((m) => mealRow(m, mp.days[open][s.k] === m.id, `data-slot="${s.k}" data-id="${m.id}"`)).join('') || '<div class="small">Nenhuma opção com estes ingredientes.</div>') + `</div></div>`;
    });
    h += `<div class="row mt"><button class="btn ghost small" data-a="copyDay">Copiar ${DAYS[open]} para todos os dias</button><button class="btn ghost small" data-a="clearDay">Limpar ${DAYS[open]}</button></div></div>`;

    // Lista de compras
    const count = {};
    mp.days.forEach((dd) => SLOTS.forEach((s) => { const m = dd[s.k] && mealById(dd[s.k]); if (m) m.base.forEach((b) => { count[b] = (count[b] || 0) + 1; }); }));
    const entries = Object.entries(count).sort((a, b) => b[1] - a[1]);
    h += `<div class="card"><h2>Ingredientes da semana</h2>` + (entries.length
      ? `<div class="small">Para a lista de compras. O número é em quantas refeições aparece.</div><div class="row mt">${entries.map(([n, c]) => `<span class="tag">${esc(n)} × ${c}</span>`).join('')}</div>`
      : `<div class="small">Escolhe refeições acima e a lista aparece aqui.</div>`) + `</div>`;
    return h;
  },

  treinos() {
    let h = `<div class="sub">Escolhe um treino e carrega em começar. O ecrã fica ligado enquanto o timer corre.</div>`;
    const rec = typeof recoveryOn === 'function' && recoveryOn() && !ui.showAll;
    if (rec) h += `<div class="card warn"><strong>Modo recuperação ligado.</strong><div class="small">Só aparece o treino suave. <button class="link" data-a="showAll">Ver todos os treinos</button></div></div>`;
    WORKOUTS.filter((w) => !rec || w.id === 'recup' || w.id === 'resp').forEach((w) => {
      const mins = Math.round(buildSeq(w).reduce((a, s) => a + s.d, 0) / 60);
      h += `<div class="card"><div class="between"><div><div class="big" style="font-size:17px">${esc(w.title)}</div><div class="small">${esc(w.short)} · ~${mins} min</div></div><button class="btn small" data-a="openTimer" data-id="${w.id}">Começar</button></div></div>`;
    });
    return h;
  },

  comida() {
    const types = ['Todos', 'Pequeno-almoço', 'Principal', 'Lanche'];
    const label = { 'Principal': 'Almoço / jantar' };
    const list = ui.mealFilter === 'Todos' ? MEALS : MEALS.filter((m) => m.type === ui.mealFilter);
    let h = `<div class="row">${types.map((t) => pill(label[t] || t, ui.mealFilter === t, 'mealFilter', `data-v="${t}"`)).join('')}</div>
      <div class="small">Valores aproximados, só para teres uma ideia. Proteína alta e poucas calorias.</div>`;
    list.forEach((m) => {
      h += `<div class="card"><div class="between"><strong>${esc(m.name)}</strong><span class="small">${esc(label[m.type] || m.type)}</span></div>
        <div class="small mt">🔥 ${m.kcal} kcal · ${m.protein} g de proteína</div>
        <div>${m.base.map((b) => `<span class="tag">${esc(b)}</span>`).join('')}</div></div>`;
    });
    return h;
  },

  progresso() {
    const today = ds(new Date());
    const doneAll = Object.values(S.checkins).filter((c) => c.done).length;
    const ws = weekStart(0); const wsDate = parse(ws);
    const doneWeek = Object.entries(S.checkins).filter(([d, c]) => c.done && parse(d) >= wsDate).length;
    const weights = [...S.weights].sort((a, b) => a.date.localeCompare(b.date));

    let h = `<div class="card"><div class="between"><div><div class="label">Esta semana</div><div class="big">${doneWeek} treinos</div></div><div style="text-align:right"><div class="label">No total</div><div class="big">${doneAll}</div></div></div></div>`;

    h += `<div class="card"><div class="between"><h2>Peso</h2><span class="small">uma vez por semana, ao domingo</span></div>
      <div class="row nowrap mt"><input id="kg" inputmode="decimal" placeholder="ex: 64,3"><button class="btn small" data-a="addWeight">Guardar</button></div>`;
    if (weights.length > 1) h += weightChart(weights.slice(-8));
    h += `</div>`;

    h += `<div class="card"><h2>Histórico por semana</h2>`;
    if (!weights.length) h += `<div class="small">Ainda sem registos.</div>`;
    else {
      const rev = [...weights].reverse();
      rev.forEach((w, i) => {
        const prev = rev[i + 1]; const diff = prev ? Math.round((w.kg - prev.kg) * 10) / 10 : null;
        const cls = diff === null ? '' : diff > 0 ? 'up' : diff < 0 ? 'down' : 'eq';
        h += `<div class="hist"><div><div><strong>Semana de ${fmtShort(ds(mondayOf(parse(w.date))))}</strong></div><div class="small">${fmtShort(w.date)}</div></div>
          <div><strong>${String(w.kg).replace('.', ',')} kg</strong> ${diff === null ? '' : `<span class="${cls}">${diff > 0 ? '+' + diff : diff === 0 ? '=' : diff}</span>`}</div></div>`;
      });
    }
    h += `</div>`;

    const photos = Object.entries(S.checkins).filter(([, c]) => c.photo).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 6);
    if (photos.length) {
      h += `<div class="card"><h2>Fotos de treino</h2><div class="thumbs">${photos.map(([d, c]) => `<figure><img src="${c.photo}" alt=""><figcaption>${fmtShort(d)}</figcaption></figure>`).join('')}</div></div>`;
    }

    h += `<div class="card"><h2>Como te sentes hoje?</h2><textarea rows="3" data-c="note" placeholder="energia, ciclo, stress, motivação…">${esc(S.notes[today] || '')}</textarea><div class="small mt">Guarda sozinho quando saíres da caixa.</div></div>`;

    h += `<div class="card"><h2>Cópia de segurança</h2><div class="small">Os dados ficam só neste aparelho. Exporta de vez em quando, ou para passares para outro aparelho.</div>
      <div class="row mt"><button class="btn ghost small" data-a="export">Exportar dados</button>
      <label class="btn ghost small" style="cursor:pointer;display:inline-block">Importar dados<input type="file" accept="application/json" data-c="import" hidden></label></div></div>`;
    return h;
  }
};

function weightChart(ws) {
  const W = 300, H = 90, min = Math.min(...ws.map((w) => w.kg)) - 0.5, max = Math.max(...ws.map((w) => w.kg)) + 0.5;
  const pt = (w, i) => [10 + (i / (ws.length - 1)) * (W - 20), H - 10 - ((w.kg - min) / (max - min || 1)) * (H - 20)];
  const pts = ws.map(pt);
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;margin-top:14px" role="img" aria-label="Evolução do peso">
    <polyline fill="none" stroke="#52702F" stroke-width="2.5" points="${pts.map((p) => p.join(',')).join(' ')}"/>
    ${pts.map((p) => `<circle cx="${p[0]}" cy="${p[1]}" r="3.5" fill="#C9714E"/>`).join('')}</svg>`;
}

/* ---------- Ações ---------- */
const A = {
  tab: (d) => { ui.tab = d.v; window.scrollTo(0, 0); render(); },
  goNext: () => { ui.weekOffset = 1; ui.tab = 'semana'; window.scrollTo(0, 0); render(); },
  weekOff: (d) => { ui.weekOffset = +d.v; render(); },
  mode: (d) => { const p = plan(ui.weekOffset); p.mode = d.v; p.days = [...TEMPLATES[d.v]]; p.set = true; save(); render(); },
  ing: (d) => { ui.ing = ui.ing.includes(d.v) ? ui.ing.filter((x) => x !== d.v) : [...ui.ing, d.v]; render(); },
  mealDay: (d) => { ui.openDay = +d.v; render(); },
  pickMeal: (d) => {
    const day = mealplan(ui.weekOffset).days[ui.openDay];
    day[d.slot] = day[d.slot] === +d.id ? null : +d.id; save(); render();
  },
  copyDay: () => {
    const mp = mealplan(ui.weekOffset); const src = mp.days[ui.openDay];
    mp.days = DAYS.map(() => ({ ...src })); save(); render(); toast('Copiado para todos os dias');
  },
  clearDay: () => { mealplan(ui.weekOffset).days[ui.openDay] = { breakfast: null, lunch: null, snack: null, dinner: null }; save(); render(); },
  mealFilter: (d) => { ui.mealFilter = d.v; render(); },
  toggleDone: () => {
    const t = ds(new Date()); const c = S.checkins[t] || {};
    S.checkins[t] = { ...c, done: !c.done }; save(); render();
  },
  removePhoto: () => { const t = ds(new Date()); if (S.checkins[t]) { delete S.checkins[t].photo; save(); render(); } },
  addWeight: () => {
    const v = parseFloat(String($('#kg').value).replace(',', '.'));
    if (!v || v < 20 || v > 300) { toast('Escreve um peso válido, por exemplo 64,3'); return; }
    const t = ds(new Date());
    S.weights = S.weights.filter((w) => w.date !== t); S.weights.push({ date: t, kg: v }); save(); render(); toast('Peso guardado');
  },
  export: () => {
    const blob = new Blob([JSON.stringify(S)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `mare-${ds(new Date())}.json`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  },
  openTimer: (d) => openTimer(d.id),
  tSound: () => { SOUND = SOUND === 'som' ? 'vibra' : SOUND === 'vibra' ? 'silencio' : 'som'; S.prefs = Object.assign({}, S.prefs, { sound: SOUND }); save(); if (SOUND === 'som') beep(520, 0.1); if (SOUND === 'vibra') buzz(60); drawTimer(); },
  tPlay: () => tToggle(), tNext: () => tNext(), tPrev: () => tPrev(), tRestart: () => tRestart(), tClose: () => tClose(),
  tMarkDone: () => {
    const t = ds(new Date()); const c = S.checkins[t] || {};
    S.checkins[t] = { ...c, done: true }; save(); tClose(); render(); toast('Treino registado em hoje');
  }
};

const C = {
  dayGroup: (el) => { const p = plan(ui.weekOffset); p.days[+el.dataset.i] = el.value; p.mode = 'custom'; p.set = true; save(); render(); },
  note: (el) => { S.notes[ds(new Date())] = el.value; save(); toast('Nota guardada'); },
  photo: async (el) => {
    const f = el.files && el.files[0]; if (!f) return;
    try {
      const url = await shrink(f);
      const t = ds(new Date()); const c = S.checkins[t] || {};
      S.checkins[t] = { ...c, done: true, photo: url }; save(); render();
    } catch (e) { toast('Não consegui ler a foto'); }
  },
  import: (el) => {
    const f = el.files && el.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const data = JSON.parse(r.result);
        if (typeof data !== 'object' || !data) throw new Error('inválido');
        S = Object.assign(defaults(), data); save(); render(); toast('Dados importados');
      } catch (e) { toast('Ficheiro inválido'); }
    };
    r.readAsText(f);
  }
};

document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-a]'); if (!t) return;
  const f = A[t.dataset.a]; if (f) f(t.dataset, t);
});
document.addEventListener('change', (e) => {
  const t = e.target.closest('[data-c]'); if (!t) return;
  const f = C[t.dataset.c]; if (f) f(t, e);
});

function shrink(file, max = 520) {
  return new Promise((res, rej) => {
    const img = new Image(); const url = URL.createObjectURL(file);
    img.onload = () => {
      const r = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * r); c.height = Math.round(img.height * r);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url); res(c.toDataURL('image/jpeg', 0.65));
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('img')); };
    img.src = url;
  });
}

/* ============================================================
   Timer
   ============================================================ */
function buildSeq(w) {
  const s = [];
  w.blocks.forEach((b) => {
    if (b.list) {
      b.list.forEach((e) => {
        s.push({ t: 'work', sec: b.section, name: e.name, detail: e.detail, d: e.work, tag: '' });
        if (e.rest > 0) s.push({ t: 'rest', sec: b.section, d: e.rest });
      });
    } else {
      for (let r = 0; r < b.rounds; r++) {
        b.circuit.forEach((e, i) => {
          s.push({ t: 'work', sec: b.section, name: e.name, detail: e.detail, d: e.work || b.work, tag: `volta ${r + 1}/${b.rounds}` });
          const rest = i === b.circuit.length - 1 ? b.roundRest : b.rest;
          if (rest > 0) s.push({ t: 'rest', sec: b.section, d: rest });
        });
      }
    }
  });
  while (s.length && s[s.length - 1].t === 'rest') s.pop();
  return s;
}

let T = null;       // estado do timer
let audioCtx = null;
let wakeLock = null;

let SOUND = 'vibra'; // 'som' | 'vibra' | 'silencio'
function beep(freq = 660, dur = 0.18) {
  if (SOUND !== 'som') return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.frequency.value = freq; o.connect(g); g.connect(audioCtx.destination);
    g.gain.setValueAtTime(0.18, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    o.start(); o.stop(audioCtx.currentTime + dur);
  } catch (e) { /* sem som, não faz mal */ }
}
const buzz = (ms) => { if (SOUND === 'silencio') return; try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* ignora */ } };
async function wake() { try { if (navigator.wakeLock) wakeLock = await navigator.wakeLock.request('screen'); } catch (e) { /* ignora */ } }
function unwake() { try { if (wakeLock) wakeLock.release(); } catch (e) { /* ignora */ } wakeLock = null; }
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && T && T.running) wake(); });

function openTimer(id) {
  const w = WORKOUTS.find((x) => x.id === id); if (!w) return;
  SOUND = (S.prefs && S.prefs.sound) || ((S.prefs && S.prefs.calm) ? 'silencio' : 'vibra');
  const seq = buildSeq(w);
  T = { w, seq, idx: 0, left: seq[0].d, running: false, endAt: 0, iv: null, done: false };
  $('#timer').hidden = false; document.body.style.overflow = 'hidden';
  drawTimer();
}
function tClose() {
  if (T) { clearInterval(T.iv); T = null; }
  unwake(); $('#timer').hidden = true; $('#timer').innerHTML = ''; document.body.style.overflow = '';
}
function tToggle() {
  if (!T || T.done) return;
  if (T.running) { T.running = false; clearInterval(T.iv); unwake(); }
  else {
    T.running = true; T.endAt = Date.now() + T.left * 1000;
    T.iv = setInterval(tTick, 250); wake(); beep(520, 0.1);
  }
  drawTimer();
}
function tTick() {
  if (!T || !T.running) return;
  const left = Math.max(0, Math.ceil((T.endAt - Date.now()) / 1000));
  if (left !== T.left) {
    T.left = left; updateTime();
    if (left > 0 && left <= 3) beep(800, 0.08);
  }
  if (left <= 0) tNext();
}
function tNext() {
  if (!T) return;
  if (T.idx + 1 >= T.seq.length) {
    T.done = true; T.running = false; clearInterval(T.iv); unwake(); beep(1200, 0.4); buzz([200, 100, 200]);
    drawTimer(); return;
  }
  const cur = T.seq[T.idx], nxt = T.seq[T.idx + 1];
  T.idx++; T.left = nxt.d;
  if (T.running) T.endAt = Date.now() + T.left * 1000;
  beep(nxt.t === 'work' ? (nxt.sec !== cur.sec ? 990 : 660) : 440, 0.2); buzz(nxt.t === 'work' ? 120 : 40);
  drawTimer();
}
function tPrev() {
  if (!T || T.done) return;
  if (T.idx > 0) T.idx--;
  T.left = T.seq[T.idx].d;
  if (T.running) T.endAt = Date.now() + T.left * 1000;
  drawTimer();
}
function tRestart() {
  if (!T) return;
  clearInterval(T.iv); unwake();
  T.idx = 0; T.left = T.seq[0].d; T.running = false; T.done = false; drawTimer();
}

function elapsed() {
  let before = 0; for (let i = 0; i < T.idx; i++) before += T.seq[i].d;
  return before + (T.seq[T.idx].d - T.left);
}
function updateTime() {
  const tm = $('#t-time'), bar = $('#t-bar');
  if (tm) tm.textContent = fmtTime(T.left);
  if (bar) bar.style.width = Math.min(100, (elapsed() / T.total) * 100) + '%';
}

const ICON_PLAY = '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
const ICON_PAUSE = '<svg viewBox="0 0 24 24"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>';
const ICON_NEXT = '<svg viewBox="0 0 24 24"><path d="M6 5l9 7-9 7zM16 5h2v14h-2z"/></svg>';
const ICON_PREV = '<svg viewBox="0 0 24 24"><path d="M18 5l-9 7 9 7zM6 5h2v14H6z"/></svg>';
const ICON_RESET = '<svg viewBox="0 0 24 24"><path d="M12 5V2L7 6l5 4V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7z"/></svg>';

function drawTimer() {
  if (!T) return;
  T.total = T.seq.reduce((a, s) => a + s.d, 0);
  const el = $('#timer');
  const head = `<div class="ttop"><div><div class="label">Maré · ${esc(T.w.title)}</div></div><div class="row nowrap"><button class="btn ghost small" data-a="tSound" aria-label="Som">${SOUND === 'som' ? '🔔 Som' : SOUND === 'vibra' ? '📳 Vibração' : '🔕 Silêncio'}</button><button class="btn ghost small" data-a="tClose">Fechar</button></div></div>`;

  if (T.done) {
    el.innerHTML = `<div class="tw">${head}<div class="tbar"><i style="width:100%"></i></div>
      <div class="tdone"><div style="font-size:48px">🌊</div><div class="big">Treino completo</div>
      <div class="sub">Bom trabalho. Regista-o para ficar no teu histórico.</div>
      <button class="btn mint" data-a="tMarkDone">Registar como feito hoje</button>
      <button class="btn ghost" data-a="tRestart">Recomeçar</button></div></div>`;
    return;
  }

  const cur = T.seq[T.idx];
  let nxt = T.seq[T.idx + 1]; if (nxt && nxt.t === 'rest') nxt = T.seq[T.idx + 2];
  const secs = [...new Set(T.seq.map((s) => s.sec))];
  const curSecIdx = secs.indexOf(cur.sec);

  const list = secs.map((sec, si) => {
    const names = [...new Set(T.seq.filter((s) => s.sec === sec && s.t === 'work').map((s) => s.name))];
    return `<div><div class="sec">${esc(sec)}</div>${names.map((n) =>
      `<div class="it${cur.sec === sec && cur.name === n ? ' cur' : ''}${si < curSecIdx ? ' past' : ''}">${esc(n)}</div>`).join('')}</div>`;
  }).join('');

  el.innerHTML = `<div class="tw">${head}
    <div class="tbar"><i id="t-bar"></i></div>
    <div class="label" style="text-align:center;margin-bottom:6px">${esc(cur.sec)}</div>
    <div class="tcard${cur.t === 'rest' ? ' rest' : ''}">
      <div class="st">${cur.t === 'rest' ? 'Descanso' : esc(cur.tag || 'Vai')}</div>
      <div class="nm">${cur.t === 'rest' ? 'Respira' : esc(cur.name)}</div>
      ${cur.t === 'work' ? `<div class="dt">${esc(cur.detail)}</div>` : ''}
      <div class="tm" id="t-time">${fmtTime(T.left)}</div>
      ${nxt ? `<div class="nx">a seguir: ${esc(nxt.name)}</div>` : '<div class="nx">último bloco</div>'}
    </div>
    <div class="tctl">
      <button data-a="tPrev" aria-label="Anterior">${ICON_PREV}</button>
      <button class="main" data-a="tPlay" aria-label="${T.running ? 'Pausa' : 'Começar'}">${T.running ? ICON_PAUSE : ICON_PLAY}</button>
      <button data-a="tNext" aria-label="Saltar">${ICON_NEXT}</button>
      <button data-a="tRestart" aria-label="Recomeçar">${ICON_RESET}</button>
    </div>
    <div class="tlist">${list}</div></div>`;
  updateTime();
}

/* O arranque (render) está no fim de saude.js */
