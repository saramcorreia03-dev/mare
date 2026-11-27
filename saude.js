'use strict';

/* ============================================================
   Maré · Saúde
   Este ficheiro NÃO tem dados pessoais. Tudo o que registares
   (sintomas, medicação, consultas, ficha) fica só no teu aparelho,
   dentro de localStorage, e sai apenas se exportares a cópia de segurança.
   Não é diagnóstico: serve para veres padrões e levares à tua médica.
   ============================================================ */

const SYMPTOMS = ['Enxaqueca', 'Tosse ou pieira', 'Cólicas', 'Dormência ou formigueiro', 'Dor de barriga',
  'Cansaço fora do normal', 'Tontura', 'Sensibilidade a sons ou luz', 'Cansaço mental', 'Irritabilidade ou choro', 'Tensão no corpo'];
const LOADS = ['Barulho', 'Luzes ou ecrãs', 'Muita gente', 'Prazos ou imprevistos'];
const RESTS = [['cao', '🐕 Passeio calmo'], ['musica', '🎧 Música suave'], ['banho', '🛁 Banho'], ['resp', '🌬️ Respirar']];
const HARD_SYMPTOMS = ['Enxaqueca', 'Cólicas', 'Dormência ou formigueiro', 'Tontura'];
const DEFAULT_ALARMS = 'Dor no peito, falta de ar forte, desmaio, fraqueza súbita num braço ou numa perna, dor de cabeça súbita e muito forte, sangue nos vómitos ou fezes pretas: liga 112 ou vai à urgência.';
const QUOTES = [
  'Tudo flui ao meu favor.', 'Um passo de cada vez também é caminho.', 'O meu corpo merece cuidado.',
  'Hoje chega o que for possível.', 'Respiro fundo e sigo ao meu ritmo.', 'A maré sobe e desce, e eu com ela.',
  'Descansar também é avançar.', 'Há luz a entrar, mesmo devagar.', 'Cuidar de mim é trabalho que conta.',
  'O que é meu chega no tempo certo.', 'Escolho o que me faz bem hoje.', 'Sou paciente com o que ainda não sei.'
];
const EMERG_FIELDS = [
  ['nome', 'Nome', 1], ['contacto', 'Contacto de emergência (nome e telefone)', 1], ['medico', 'Médico de família', 1],
  ['sangue', 'Grupo sanguíneo', 1], ['cond', 'Condições de saúde', 3], ['meds', 'Medicação habitual', 3],
  ['alerg', 'Alergias e reações', 3], ['sens', 'Como me ajudar (sons, luz, toque, ritmo)', 3], ['notas', 'Outras notas', 2]
];

/* ---------- Estado ---------- */
function H() {
  const base = { logs: {}, meds: [], appts: [], exams: [], labs: [], recovery: false, inhalerReminder: false, emerg: {}, alarms: DEFAULT_ALARMS };
  S.health = Object.assign(base, S.health || {});
  return S.health;
}
const todayStr = () => ds(new Date());
const recoveryOn = () => H().recovery;
const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
const daysUntil = (s) => Math.round((parse(s) - parse(todayStr())) / 864e5);
const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ''));
function dailyQuote() {
  const d = new Date();
  return QUOTES[Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5) % QUOTES.length];
}
/* Dia a que o registo se refere: depois da meia-noite e até às 5h, é o dia anterior */
function logDate() { return ui.regDate || (new Date().getHours() < 5 ? addD(todayStr(), -1) : todayStr()); }
function ensureLog() {
  const h = H(), t = logDate();
  if (!h.logs[t]) h.logs[t] = { sym: [], meds: {} };
  const l = h.logs[t]; if (!l.sym) l.sym = []; if (!l.meds) l.meds = {};
  return l;
}
function hardDay(l) {
  if (!l) return false;
  return (l.pain != null && l.pain >= 6) || (l.overload != null && l.overload >= 7) || (l.painAM != null && l.painAM >= 6) || (l.energy != null && l.energy <= 3) ||
    (l.sleepQ != null && l.sleepQ <= 3) || (l.sleep != null && l.sleep !== '' && l.sleep < 5) ||
    (l.sym || []).some((s) => HARD_SYMPTOMS.includes(s));
}
function downloadFile(name, text, type) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/* ---------- Ícone e separador ---------- */
ICONS.saude = '<path d="M12 21s-7-4.5-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.5-9 9-9 9z"/>';
TABS.splice(4, 0, { id: 'saude', label: 'Saúde', title: 'Saúde' });

/* ---------- Treino de recuperação ---------- */
WORKOUTS.push({
  id: 'recup', title: 'Recuperação · mobilidade suave', short: 'Respiração e mobilidade sem esforço',
  blocks: [
    { section: 'Respirar', list: [
      { name: 'Respiração diafragmática', detail: 'deitada, mão na barriga. Se der dor ou formigueiro, pára', work: 90, rest: 10 }
    ] },
    { section: 'Mobilidade suave', list: [
      { name: 'Báscula de bacia deitada', detail: 'joelhos dobrados, ritmo lento', work: 45, rest: 10 },
      { name: 'Joelhos ao peito (suave)', detail: 'um de cada vez, sem forçar', work: 45, rest: 10 },
      { name: 'Rotação lombar deitada', detail: 'joelhos para um lado e para o outro, pouca amplitude', work: 50, rest: 10 },
      { name: 'Borboleta de anca deitada', detail: 'solas dos pés juntas, deixa os joelhos caírem', work: 50, rest: 10 },
      { name: 'Círculos de tornozelo', detail: 'cada pé, devagar', work: 40, rest: 10 },
      { name: 'Gémeos na parede', detail: 'só até sentires um esticar leve', work: 50, rest: 10 }
    ] },
    { section: 'Fechar', list: [
      { name: 'Respiração lenta', detail: 'olhos fechados, sem pressa', work: 60, rest: 0 }
    ] }
  ]
});

WORKOUTS.push({
  id: 'resp', title: 'Respiração guiada', short: 'Inspira 4 segundos, expira 6, durante uns 3 minutos',
  blocks: [{ section: 'Respirar', rounds: 18, work: 5, rest: 0, roundRest: 0, circuit: [
    { name: 'Inspira', detail: 'pelo nariz, devagar', work: 4 },
    { name: 'Expira', detail: 'pela boca, mais devagar', work: 6 }
  ] }]
});

/* ---------- Cartões na página Hoje ---------- */
function nextStepCard() {
  const hr = new Date().getHours(), h = H(), l = h.logs[hr < 5 ? addD(todayStr(), -1) : todayStr()];
  const amDone = l && (l.energy != null || l.sleep != null || l.painAM != null);
  const pmDone = l && (l.mood != null || l.pain != null);
  const left = physioToday().filter((e) => !((l && l.physio) || {})[e.id]).length;
  const box = (title, sub, btn) => `<div class="card note"><div class="label">Próximo passo</div><div class="between"><div><strong>${title}</strong><div class="small">${sub}</div></div>${btn}</div></div>`;
  if (hr >= 5 && hr < 15 && !amDone) return box('Bom dia. Como acordaste?', 'Registo da manhã, 30 segundos.', `<button class="btn small" data-a="goReg" data-v="manha">Registar</button>`);
  if (left) return box('Fisioterapia de hoje', `${left} exercício(s) por fazer.`, `<button class="btn small" data-a="goSub" data-v="fisio">Ver</button>`);
  if ((hr >= 19 || hr < 5) && !pmDone) return box('Como correu o dia?', 'Registo da noite, 1 minuto.', `<button class="btn small" data-a="goReg" data-v="noite">Registar</button>`);
  return '';
}

function healthBanner() {
  const h = H(), l = h.logs[logDate()];
  let o = '';
  const hr = new Date().getHours();
  const amDone = l && (l.energy != null || l.sleep != null || l.painAM != null);
  const pmDone = l && (l.mood != null || l.pain != null);
  if (l && l.overload != null && l.overload >= 7 && !(S.prefs && S.prefs.calm)) {
    o += `<div class="card warn"><strong>Dia com muitos estímulos.</strong><div class="small">Menos ecrã, mais silêncio e ar livre. Queres o modo calmo?</div><div class="mt"><button class="btn small" data-a="calm">Ligar modo calmo</button></div></div>`;
  } else if (hardDay(l) && !h.recovery) {
    o += `<div class="card warn"><strong>Hoje o corpo pede maré baixa.</strong><div class="small">Caminhada leve e mobilidade chegam. Queres só os treinos suaves?</div><div class="mt"><button class="btn small" data-a="recovery" data-v="1">Ligar modo recuperação</button></div></div>`;
  }
  o += restCard() + physioBanner() + cycleBanner();
  h.meds.forEach((m) => {
    if (!isDate(m.end)) return;
    const d = daysUntil(m.end);
    if (d < 0) o += `<div class="card warn"><strong>${esc(m.name)}</strong><div class="small">O fim da receita passou há ${-d} dia(s). Vê se precisas de renovar. <button class="link" data-a="tab" data-v="saude">Abrir</button></div></div>`;
    else if (d <= 14) o += `<div class="card note"><strong>${esc(m.name)}</strong><div class="small">A receita acaba daqui a ${d} dia(s). Convém renovar. <button class="link" data-a="tab" data-v="saude">Abrir</button></div></div>`;
  });
  h.appts.forEach((a) => {
    if (!isDate(a.date)) return;
    const d = daysUntil(a.date);
    if (d >= 0 && d <= 7) o += `<div class="card note"><strong>${esc(a.title)}</strong><div class="small">${d === 0 ? 'É hoje.' : d === 1 ? 'É amanhã.' : `Daqui a ${d} dias (${fmtShort(a.date)}).`}</div></div>`;
  });
  const p = S.weekplans[weekStart(0)], gid = p && p.set ? p.days[todayIdx()] : null;
  if (h.inhalerReminder && gid && GROUPS[gid] && GROUPS[gid].workout && !h.recovery) {
    o += `<div class="card note"><strong>Dia de treino.</strong><div class="small">Tens o inalador à mão?</div></div>`;
  }
  return o;
}

function recoveryCard() {
  const ci = S.checkins[todayStr()] || {};
  return `<div class="card good"><div class="label">Modo recuperação</div><div class="big">Hoje é dia de cuidar</div>
    <div class="small mt">Caminhada leve de 20 a 30 minutos ao ritmo que te sabe bem, ou só a mobilidade suave. Sem esforço para braços, prancha ou saltos. Se der dor ou formigueiro, pára.</div>
    <div class="mt"><button class="btn mint" data-a="openTimer" data-id="recup">Abrir timer · mobilidade suave</button></div>
    <div class="mt"><button class="btn ${ci.done ? 'mint' : 'ghost'}" data-a="toggleDone">${ci.done ? '✓ Feito' : 'Marcar como feito'}</button></div>
    <div class="mt"><button class="link small" data-a="recovery" data-v="0">Desligar modo recuperação</button></div></div>`;
}

/* ---------- Resumo para consulta ---------- */
function summaryText(days = 30) {
  const from = new Date(); from.setDate(from.getDate() - days);
  const logs = Object.entries(H().logs).filter(([d]) => parse(d) >= from).sort();
  if (!logs.length) return 'Sem registos nos últimos 30 dias.';
  const nums = (k) => logs.map(([, l]) => l[k]).filter((v) => v != null && v !== '' && !isNaN(v)).map(Number);
  const avg = (a) => (a.length ? (a.reduce((x, y) => x + y, 0) / a.length).toFixed(1).replace('.', ',') : '—');
  const cnt = (s) => logs.filter(([, l]) => (l.sym || []).includes(s)).length;
  const pain = nums('pain');
  const lines = [`Últimos ${days} dias, ${logs.length} dias com registo.`,
    `Dor (0 a 10): média ${avg(pain)}, ${pain.filter((v) => v >= 6).length} dia(s) com 6 ou mais.`,
    `Energia média ${avg(nums('energy'))}/10. Humor médio ${avg(nums('mood'))}/10. Sono médio ${avg(nums('sleep'))} h.`,
    `Stress médio ${avg(nums('stress'))}/10.`,
    `Sobrecarga sensorial média ${avg(nums('overload'))}/10.`,
    `Inalador usado ${nums('inhaler').reduce((a, b) => a + b, 0)} vez(es) no total.`];
  SYMPTOMS.forEach((s) => { const n = cnt(s); if (n) lines.push(`${s}: ${n} dia(s).`); });
  return lines.join('\n');
}

function clinicalCard() {
  const h = H(); if (!h.exams.length && !h.labs.length) return '';
  const exams = [...h.exams].sort((a, b) => String(b.date).localeCompare(String(a.date)));
  let o = `<div class="card"><h2>Histórico clínico</h2><div class="small">Exames e análises que importaste. Fica só neste aparelho.</div>`;
  if (exams.length) o += `<div class="stack mt">${exams.map((e) => `<details class="acc"><summary>${fmtShort(e.date)} · ${esc(e.title)}</summary><p>${e.place ? `<b>${esc(e.place)}.</b> ` : ''}${esc(e.result || '')}</p></details>`).join('')}</div>`;
  if (h.labs.length) {
    const by = {}; h.labs.forEach((r) => { (by[r.n] = by[r.n] || []).push(r); });
    o += `<div class="label mt">Análises</div><div class="stack mt">${Object.keys(by).sort((a, b) => a.localeCompare(b, 'pt')).map((n) => {
      const rows = by[n].sort((a, b) => String(a.d).localeCompare(String(b.d))), r0 = rows[rows.length - 1];
      const ref = r0.min != null || r0.max != null ? ` (ref. ${r0.min != null ? r0.min : ''}${r0.min != null && r0.max != null ? ' a ' : r0.max != null ? 'até ' : 'a partir de '}${r0.max != null ? r0.max : ''})` : '';
      return `<div><strong>${esc(n)}</strong><span class="small">${ref} ${esc(r0.u || '')}</span><div class="row mt">${rows.map((r) => {
        const out = (r.min != null && r.v < r.min) || (r.max != null && r.v > r.max);
        return `<span class="tag" style="margin:0;${out ? 'background:var(--terra-ink);color:#fff;font-weight:700' : ''}">${String(r.v).replace('.', ',')} · ${fmtShort(r.d)}</span>`;
      }).join('')}</div></div>`;
    }).join('')}</div>`;
  }
  return o + `</div>`;
}

function restCard() {
  const l = H().logs[logDate()] || {}, calm = S.prefs && S.prefs.calm, high = l.overload != null && l.overload >= 6;
  if (!calm && !high) return '';
  const r = l.rest || {};
  return `<div class="card good"><h2>Recuperar</h2><div class="small">Pequenas coisas que te fazem bem. Toca nas que fizeres.</div>
    <div class="row mt">${RESTS.map(([k, lb]) => pill(lb, r[k], 'rest', `data-v="${k}"`)).join('')}</div>
    <div class="mt"><button class="btn mint" data-a="openTimer" data-id="resp">Respiração guiada · 3 min</button></div></div>`;
}

/* ---------- Ecrã Saúde ---------- */
VIEWS.saude = function () {
  const h = H(), l = h.logs[logDate()] || { sym: [], meds: {} };
  const val = (k) => (l[k] == null || l[k] === '' ? '—' : l[k]);
  const sl = (k, label) => `<div class="lbl"><span>${label}</span><b id="v-${k}">${val(k)}</b></div>
    <input class="range" type="range" min="0" max="10" step="1" value="${l[k] == null ? 5 : l[k]}" data-c="hlog" data-k="${k}" data-live="v-${k}" aria-label="${label}">`;

  let R = '', M = '';
  const ld = logDate(), yest = addD(todayStr(), -1), wdn = (d) => DAYS[(parse(d).getDay() + 6) % 7];
  R += `<div class="card"><div class="label">A registar</div><div class="row mt">${pill(`Ontem · ${wdn(yest)} ${fmtShort(yest)}`, ld === yest, 'regDay', `data-v="${yest}"`)}${pill(`Hoje · ${wdn(todayStr())} ${fmtShort(todayStr())}`, ld === todayStr(), 'regDay', `data-v="${todayStr()}"`)}</div>
    <div class="row nowrap mt"><input type="date" id="reg-date" value="${ld}" max="${todayStr()}"><button class="btn ghost small" data-a="regPick">Ir para o dia</button></div>
    <div class="small mt">${ld !== todayStr() ? 'Estás a registar um dia que já passou.' : 'Depois da meia-noite, o registo da noite vai para o dia anterior.'}</div></div>`;

  const morning = `<div class="card" id="c-manha"><h2>🌅 Ao acordar</h2><div class="small">Por volta das 8h30.</div>
    <div class="lbl"><span>Horas de sono</span></div>
    <input type="number" inputmode="decimal" step="0.5" min="0" max="16" placeholder="ex: 7" value="${l.sleep == null ? '' : l.sleep}" data-c="hlog" data-k="sleep">
    ${sl('sleepQ', 'Como dormiste')}${sl('painAM', 'Dor ou formigueiro ao levantar')}${sl('energy', 'Energia')}</div>`;
  const night = `<div class="card" id="c-noite"><h2>🌙 À noite</h2><div class="small">Por volta das 22h30, antes de dormir.</div>
    ${sl('pain', 'Dor no pior momento do dia')}${sl('stress', 'Stress')}${sl('mood', 'Humor')}${sl('overload', 'Sobrecarga sensorial')}
    <div class="lbl"><span>O que pesou hoje</span></div>
    <div class="row">${LOADS.map((s) => pill(s, (l.load || []).includes(s), 'load', `data-v="${esc(s)}"`)).join('')}</div>
    <div class="lbl"><span>Sinais de hoje</span></div>
    <div class="row">${SYMPTOMS.map((s) => pill(s, (l.sym || []).includes(s), 'sym', `data-v="${esc(s)}"`)).join('')}</div>
    <div class="lbl"><span>Inalador (vezes hoje)</span></div>
    <div class="row"><button class="btn ghost small" data-a="inhaler" data-v="-1">−</button><b>${l.inhaler || 0}</b><button class="btn ghost small" data-a="inhaler" data-v="1">+</button></div>
    <div class="lbl"><span>Nota (o que caiu mal ou bem)</span></div>
    <textarea rows="2" data-c="hnote" placeholder="o que piorou ou melhorou">${esc(l.notes || '')}</textarea></div>`;
  R += new Date().getHours() < 15 ? morning + night : night + morning;

  R += `<div class="card ${h.recovery ? 'good' : ''}"><div class="between"><div><h2>Modo recuperação</h2><div class="small">Só caminhada e mobilidade suave. Os outros treinos ficam escondidos.</div></div>
    <button class="btn small ${h.recovery ? 'mint' : ''}" data-a="recovery" data-v="${h.recovery ? 0 : 1}">${h.recovery ? 'Ligado' : 'Ligar'}</button></div>
    <div class="row mt"><button class="pill${h.inhalerReminder ? ' on' : ''}" data-a="inhRem">Lembrar o inalador nos dias de treino</button></div></div>`;
  R += `<div class="card ${(S.prefs && S.prefs.calm) ? 'good' : ''}"><div class="between"><div><h2>Modo calmo</h2><div class="small">Sem decoração nem animações, timer silencioso, só o essencial.</div></div>
    <button class="btn small ${(S.prefs && S.prefs.calm) ? 'mint' : ''}" data-a="calm">${(S.prefs && S.prefs.calm) ? 'Ligado' : 'Ligar'}</button></div></div>`;

  M += `<div class="card"><h2>Medicação</h2>`;
  if (!h.meds.length) M += `<div class="small">Ainda sem medicação. Junta abaixo, com o fim da receita para te avisar a tempo.</div>`;
  h.meds.forEach((m) => {
    let badge = '';
    if (isDate(m.end)) { const d = daysUntil(m.end); badge = d < 0 ? '<span class="badge">terminou</span>' : d <= 14 ? `<span class="badge soon">${d} d</span>` : ''; }
    M += `<div class="med"><div><strong>${esc(m.name)}</strong>${badge}<div class="small">${esc(m.dose || '')}${isDate(m.end) ? ` · até ${fmtShort(m.end)}` : ''}</div></div>
      <div class="row nowrap"><button class="chk${l.meds && l.meds[m.id] ? ' on' : ''}" data-a="medTaken" data-id="${m.id}" aria-label="Tomada hoje">✓</button><button class="x" data-a="delMed" data-id="${m.id}" aria-label="Apagar">×</button></div></div>`;
  });
  M += `<div class="stack mt"><input type="text" id="hm-name" placeholder="Medicamento"><input type="text" id="hm-dose" placeholder="Dose e horas (ex: 1 comprimido às 8h)">
    <label class="small">Fim da receita (opcional)</label><input type="date" id="hm-end"><button class="btn small" data-a="addMed">Adicionar</button></div></div>`;

  const appts = [...h.appts].sort((a, b) => String(a.date).localeCompare(String(b.date)));
  M += `<div class="card"><h2>Consultas e vigilâncias</h2>`;
  if (!appts.length) M += `<div class="small">Exames, consultas, análises a repetir. Cada um pode ir para o teu calendário.</div>`;
  appts.forEach((a) => {
    const past = isDate(a.date) && daysUntil(a.date) < 0;
    M += `<div class="med" style="${past ? 'opacity:.5' : ''}"><div><strong>${esc(a.title)}</strong><div class="small">${isDate(a.date) ? fmtShort(a.date) : 'sem data'}</div></div>
      <div class="row nowrap">${isDate(a.date) ? `<button class="btn ghost small" data-a="ics" data-id="${a.id}">Calendário</button>` : ''}<button class="x" data-a="delAppt" data-id="${a.id}" aria-label="Apagar">×</button></div></div>`;
  });
  M += `<div class="stack mt"><input type="text" id="ha-title" placeholder="Ex: ecocardiograma"><input type="date" id="ha-date"><button class="btn small" data-a="addAppt">Adicionar</button></div></div>`;

  M += `<div class="card note"><h2>Sinais de alarme</h2><textarea rows="4" data-c="alarms">${esc(h.alarms)}</textarea><div class="small mt">Podes editar com o que a tua médica te disse.</div></div>`;

  M += `<div class="card"><h2>Resumo para a consulta</h2><textarea rows="7" readonly id="summary">${esc(summaryText())}</textarea>
    <div class="row mt"><button class="btn ghost small" data-a="copySummary">Copiar</button></div></div>`;

  M += `<div class="card"><h2>Ficha de emergência</h2><div class="small">Para imprimires ou guardares em PDF.</div>
    <div class="stack mt">${EMERG_FIELDS.map(([k, label, rows]) => `<label class="small">${label}</label>${rows === 1
      ? `<input type="text" data-c="emerg" data-k="${k}" value="${esc(h.emerg[k] || '')}">`
      : `<textarea rows="${rows}" data-c="emerg" data-k="${k}">${esc(h.emerg[k] || '')}</textarea>`}`).join('')}
    <button class="btn small" data-a="printSheet">Imprimir ou guardar PDF</button></div></div>`;

  M += popSettingCard() + clinicalCard() + weightsCard() + loadInsightsCard();
  M += `<div class="card"><h2>Importar agenda</h2><div class="small">Aulas, fisioterapia, consultas e prazos, a partir de um ficheiro. Ficam só neste aparelho. Dá para repetir sempre que a agenda mudar.</div>
    <div class="row mt"><label class="btn ghost small" style="cursor:pointer;display:inline-block">Escolher ficheiro<input type="file" accept="application/json" data-c="impAgenda" hidden></label></div></div>`;

  M += `<div class="card"><h2>Trazer o histórico (dashboard ou ficheiro)</h2><div class="small">Escolhe o ficheiro de cópia de segurança do dashboard. Registos, menstruação, exames, análises, ficha e vigilâncias com data passam para aqui, só neste aparelho.</div>
    <div class="row mt"><label class="btn ghost small" style="cursor:pointer;display:inline-block">Escolher ficheiro<input type="file" accept="application/json" data-c="impDash" hidden></label></div>
    <div class="small mt">Dica: em Progresso, exporta os dados de vez em quando e guarda o ficheiro no teu Drive.</div></div>`;



  const sub = ui.sub || 'registo';
  const tabs = [['registo', 'Registo'], ['ciclo', 'Ciclo'], ['fisio', 'Fisio'], ['mais', 'Mais']];
  let o = `<div class="row nowrap">${tabs.map(([id, lb]) => pill(lb, sub === id, 'goSub', `data-v="${id}"`)).join('')}</div>`;
  o += `<div class="sub">Fica só neste aparelho. Não é diagnóstico: serve para veres padrões e levares à tua médica.</div>`;
  if (sub === 'ciclo') o += cicloView();
  else if (sub === 'fisio') o += fisioView();
  else if (sub === 'mais') o += M;
  else o += R;
  return o;
};

/* ---------- Ações ---------- */
Object.assign(A, {
  calm: () => { const on = !(S.prefs && S.prefs.calm); S.prefs = Object.assign({}, S.prefs, { calm: on }); if (on) S.prefs.sound = 'silencio'; save(); render(); toast(on ? 'Modo calmo ligado' : 'Modo calmo desligado'); },
  load: (d) => { const l = ensureLog(); l.load = l.load || []; l.load = l.load.includes(d.v) ? l.load.filter((x) => x !== d.v) : [...l.load, d.v]; save(); render(); },
  rest: (d) => { const l = ensureLog(); l.rest = l.rest || {}; l.rest[d.v] = !l.rest[d.v]; save(); render(); },
  goReg: (d) => { ui.tab = 'saude'; ui.sub = 'registo'; ui.focus = 'c-' + d.v; render(); },
  regDay: (d) => { ui.regDate = d.v; render(); },
  regPick: () => { const v = $('#reg-date').value; if (!isDate(v) || v > todayStr()) { toast('Escolhe um dia que já tenha passado'); return; } ui.regDate = v; render(); },
  goSub: (d) => { ui.tab = 'saude'; ui.sub = d.v; window.scrollTo(0, 0); render(); },
  recovery: (d) => { H().recovery = d.v === '1'; ui.showAll = false; save(); render(); toast(d.v === '1' ? 'Modo recuperação ligado' : 'Modo recuperação desligado'); },
  showAll: () => { ui.showAll = true; render(); },
  inhRem: () => { const h = H(); h.inhalerReminder = !h.inhalerReminder; save(); render(); },
  sym: (d) => { const l = ensureLog(); l.sym = l.sym.includes(d.v) ? l.sym.filter((x) => x !== d.v) : [...l.sym, d.v]; save(); render(); },
  inhaler: (d) => { const l = ensureLog(); l.inhaler = Math.max(0, (l.inhaler || 0) + +d.v); save(); render(); },
  medTaken: (d) => { const l = ensureLog(); l.meds[d.id] = !l.meds[d.id]; save(); render(); },
  addMed: () => {
    const name = $('#hm-name').value.trim(); if (!name) { toast('Escreve o nome do medicamento'); return; }
    H().meds.push({ id: newId(), name, dose: $('#hm-dose').value.trim(), end: $('#hm-end').value || '' });
    save(); render(); toast('Medicação guardada');
  },
  delMed: (d) => { const h = H(); h.meds = h.meds.filter((m) => m.id !== d.id); save(); render(); },
  addAppt: () => {
    const title = $('#ha-title').value.trim(); if (!title) { toast('Escreve o que é'); return; }
    H().appts.push({ id: newId(), title, date: $('#ha-date').value || '' });
    save(); render(); toast('Guardado');
  },
  delAppt: (d) => { const h = H(); h.appts = h.appts.filter((a) => a.id !== d.id); save(); render(); },
  ics: (d) => {
    const a = H().appts.find((x) => x.id === d.id); if (!a || !isDate(a.date)) return;
    const nx = parse(a.date); nx.setDate(nx.getDate() + 1);
    const f = (s) => s.replace(/-/g, '');
    downloadFile('lembrete.ics', ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Mare//PT', 'BEGIN:VEVENT', `UID:${a.id}@mare`,
      `DTSTAMP:${f(a.date)}T000000Z`, `DTSTART;VALUE=DATE:${f(a.date)}`, `DTEND;VALUE=DATE:${f(ds(nx))}`,
      `SUMMARY:${a.title.replace(/[,;\r\n]/g, ' ')}`, 'BEGIN:VALARM', 'TRIGGER:-P1D', 'ACTION:DISPLAY', 'DESCRIPTION:Lembrete', 'END:VALARM',
      'END:VEVENT', 'END:VCALENDAR'].join('\r\n'), 'text/calendar');
  },
  copySummary: async () => {
    try { await navigator.clipboard.writeText($('#summary').value); toast('Copiado'); } catch (e) { toast('Seleciona o texto e copia'); }
  },
  printSheet: () => {
    const e = H().emerg;
    $('#sheet').innerHTML = `<h1>Ficha de emergência</h1>` + EMERG_FIELDS.map(([k, label]) => `<h3>${esc(label)}</h3><p>${esc(e[k] || '—')}</p>`).join('');
    try { window.print(); } catch (err) { toast('Não consegui abrir a impressão'); }
  }
});

Object.assign(C, {
  hlog: (el) => {
    const l = ensureLog(), k = el.dataset.k;
    if (el.value === '') delete l[k]; else l[k] = +el.value;
    save(); render();
  },
  hnote: (el) => { ensureLog().notes = el.value; save(); toast('Nota guardada'); },
  alarms: (el) => { H().alarms = el.value; save(); toast('Guardado'); },
  emerg: (el) => { H().emerg[el.dataset.k] = el.value; save(); toast('Guardado'); },
  impDash: (el) => {
    const f = el.files && el.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const data = JSON.parse(r.result), h = H();
        if (!data || typeof data !== 'object') throw new Error('inválido');
        let nDays = 0;
        Object.entries(data.days || {}).forEach(([date, e]) => {
          if (!isDate(date) || !e) return;
          const l = h.logs[date] || { sym: [], meds: {} };
          if (!l.sym) l.sym = []; if (!l.meds) l.meds = {};
          if (e.arm != null || e.neck != null) l.pain = Math.max(+e.arm || 0, +e.neck || 0) * 2;
          if (e.stress != null && e.stress !== '') l.stress = +e.stress * 2;
          if (e.overload != null && e.overload !== '') l.overload = +e.overload * 2;
          if (e.sleep != null && e.sleep !== '') l.sleep = +e.sleep;
          if (+e.migInt > 0 && !l.sym.includes('Enxaqueca')) l.sym.push('Enxaqueca');
          if (+e.cramp > 0 && !l.sym.includes('Cólicas')) l.sym.push('Cólicas');
          if (e.notes && !l.notes) l.notes = String(e.notes);
          h.logs[date] = l; nDays++;
        });
        const mens = Object.keys(data.days || {}).filter((d) => isDate(d) && data.days[d] && data.days[d].mens).sort();
        mens.forEach((d, i) => {
          if (i > 0 && dDiff(mens[i - 1], d) === 1) { const ps = cyc().periods; const last = ps.find((p) => p.start <= d && (!p.end || p.end >= addD(d, -1)) && dDiff(p.start, d) < 12); if (last) last.end = d; return; }
          if (!cyc().periods.some((p) => p.start === d)) cyc().periods.push({ start: d, end: '' });
        });
        (data.exams || []).forEach((x) => {
          if (x && isDate(x.d) && x.t && !h.exams.some((e) => e.date === x.d && e.title === x.t)) h.exams.push({ date: x.d, title: String(x.t), place: String(x.l || ''), result: String(x.r || '') });
        });
        (data.labs || []).forEach((x) => {
          if (x && isDate(x.d) && x.n && x.v != null && !h.labs.some((r) => r.d === x.d && r.n === x.n)) h.labs.push({ d: x.d, n: String(x.n).trim(), v: +x.v, u: x.u || '', min: x.min == null ? null : +x.min, max: x.max == null ? null : +x.max });
        });
        (data.meds || []).forEach((x) => {
          if (!x || !x.name) return;
          const old = x.was && h.meds.find((m) => m.name === x.was);
          if (old) { old.name = String(x.name); old.dose = String(x.dose || old.dose || ''); return; }
          if (!h.meds.some((m) => m.name === x.name)) h.meds.push({ id: newId(), name: String(x.name), dose: String(x.dose || ''), end: isDate(x.end) ? x.end : '' });
          // se já existem o nome novo e o antigo, tira o antigo
          if (x.was && h.meds.some((m) => m.name === x.name)) h.meds = h.meds.filter((m) => m.name !== x.was);
        });
        const fi = data.ficha || {}, map = { nome: 'f_nome', cond: 'f_cond', alerg: 'f_alerg', meds: 'f_med', medico: 'f_mf', sangue: 'f_sangue', notas: 'f_notas' };
        Object.entries(map).forEach(([k, src]) => { if (fi[src] && !h.emerg[k]) h.emerg[k] = String(fi[src]); });
        const contact = [fi.f_cont, fi.f_tel].filter(Boolean).join(' · ');
        if (contact && !h.emerg.contacto) h.emerg.contacto = contact;
        (data.vig || []).forEach((v) => {
          if (v && isDate(v.p) && !h.appts.some((a) => a.title === v.n && a.date === v.p)) h.appts.push({ id: newId(), title: String(v.n), date: v.p });
        });
        save(); render(); toast(`Importado: ${nDays} dia(s) de registos`);
      } catch (err) { toast('Ficheiro inválido'); }
    };
    r.readAsText(f);
  }
});

document.addEventListener('input', (e) => {
  const id = e.target && e.target.dataset && e.target.dataset.live;
  if (id) { const o = document.getElementById(id); if (o) o.textContent = e.target.value; }
});

/* ---------- Arranque ---------- */
if (/^#(manha|noite)$/.test(location.hash)) { ui.tab = 'saude'; ui.sub = 'registo'; ui.focus = 'c-' + location.hash.slice(1); }
render();
maybePop();
