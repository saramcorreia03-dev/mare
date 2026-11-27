'use strict';

/* ============================================================
   Maré · Ciclo menstrual (registo, padrões e literacia)
   Sem dados pessoais no código. As datas ficam só no aparelho.
   As estimativas são aproximadas e não servem como método contracetivo.
   ============================================================ */

const FLOW = ['Spotting', 'Leve', 'Médio', 'Intenso'];
const PHASES = {
  mens: {
    name: 'Menstrual', icon: '🌑',
    what: 'O estrogénio e a progesterona estão baixos. O útero liberta o revestimento e começa um novo ciclo. As prostaglandinas, substâncias que fazem o útero contrair, estão por trás das cólicas.',
    feel: 'Cólicas, cansaço, dor nas costas ou de cabeça, mais sensibilidade. Há quem se sinta mais leve a partir do 2.º ou 3.º dia.',
    help: 'Calor na barriga, caminhada leve e mobilidade, hidratação e alimentos com ferro (leguminosas, ovos, carne, folhas verdes) junto com vitamina C. Se as cólicas forem fortes, fala com a médica sobre o que podes tomar.',
    mare: 'Maré baixa ou média. Ouve o corpo.'
  },
  fol: {
    name: 'Folicular', icon: '🌱',
    what: 'O estrogénio sobe aos poucos e um folículo no ovário amadurece. O corpo prepara-se para ovular.',
    feel: 'Muitas pessoas notam mais energia, humor mais estável e mais vontade de treinar e socializar. Não acontece a toda a gente, e é por isso que o teu registo conta mais do que a teoria.',
    help: 'Boa altura para treinos mais exigentes ou coisas novas, se o corpo deixar. Proteína em cada refeição ajuda a recuperar.',
    mare: 'Maré média ou alta, se te sentires bem.'
  },
  ovu: {
    name: 'Ovulação (janela)', icon: '☀️',
    what: 'Um pico de hormona luteinizante (LH) faz o ovário libertar um óvulo, em geral cerca de 14 dias antes da menstruação seguinte. A janela fértil dura uns 5 a 6 dias.',
    feel: 'Muco cervical transparente e elástico, ligeira dor de um dos lados da barriga, mais energia e libido. Alguns estudos sugerem ligamentos um pouco mais soltos nesta fase.',
    help: 'Aquecimento completo antes de saltos e mudanças de direção, e hidratação. A estimativa de uma app não é método contracetivo.',
    mare: 'Boa fase de energia. Cuida das articulações.'
  },
  lut: {
    name: 'Lútea', icon: '🌕',
    what: 'Depois da ovulação sobe a progesterona e a temperatura corporal basal aumenta cerca de 0,3 a 0,5 °C. Se não houver gravidez, as hormonas descem no fim da fase e a menstruação chega.',
    feel: 'Mais fome e desejo de doce, retenção de líquidos, sono mais leve, irritabilidade ou tristeza nos dias antes da menstruação. A queda de estrogénio nessa altura é um gatilho conhecido de enxaqueca menstrual.',
    help: 'Refeições regulares com proteína e fibra, magnésio vindo da comida (frutos secos, sementes, folhas verdes), luz do dia e sono regular. Exercício moderado costuma ajudar o humor. Fala com a médica antes de tomar suplementos.',
    mare: 'Maré média, a passar a baixa nos últimos dias se o corpo pedir.'
  }
};
const CYCLE_FLAGS = [
  'Ciclos repetidamente mais curtos que 21 dias ou mais longos que 35.',
  'Três meses ou mais sem menstruação (fora de gravidez).',
  'Sangramento que encharca um penso ou tampão em menos de 2 horas, ou coágulos grandes.',
  'Dor que te impede de fazer o dia, mesmo com o que costumas tomar.',
  'Sangramento entre menstruações ou depois de relações.',
  'Mudanças bruscas no teu padrão habitual.'
];
const METRICS = [['energy', 'Energia'], ['mood', 'Humor'], ['pain', 'Dor'], ['sleepQ', 'Sono'], ['overload', 'Sobrecarga'], ['stress', 'Stress']];

const dDiff = (a, b) => Math.round((parse(b) - parse(a)) / 864e5);
const addD = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return ds(d); };
function cyc() { const h = H(); if (!h.cycle) h.cycle = { periods: [] }; if (!h.cycle.periods) h.cycle.periods = []; return h.cycle; }
function periods() { return [...cyc().periods].filter((p) => isDate(p.start)).sort((a, b) => a.start.localeCompare(b.start)); }

function cycleStats() {
  const ps = periods(), lens = [];
  for (let i = 1; i < ps.length; i++) { const d = dDiff(ps[i - 1].start, ps[i].start); if (d >= 15 && d <= 60) lens.push(d); }
  const r = lens.slice(-6);
  const avg = r.length ? Math.round(r.reduce((a, b) => a + b, 0) / r.length) : null;
  return { ps, lens: r, avg, min: r.length ? Math.min(...r) : null, max: r.length ? Math.max(...r) : null };
}

function phaseOf(date, st) {
  st = st || cycleStats();
  const before = st.ps.filter((p) => p.start <= date);
  if (!before.length) return null;
  const p = before[before.length - 1], day = dDiff(p.start, date) + 1, L = st.avg || 28;
  if (day > Math.max(L + 10, 45)) return null;
  const P = isDate(p.end) ? Math.max(2, dDiff(p.start, p.end) + 1) : 5;
  const ov = Math.max(P + 3, L - 14);
  const ph = day <= P ? 'mens' : day < ov - 1 ? 'fol' : day <= ov + 1 ? 'ovu' : 'lut';
  return { day, ph, L, ov, P };
}

function nextPeriod(st) {
  if (!st.ps.length) return null;
  const last = st.ps[st.ps.length - 1].start, L = st.avg || 28;
  const lo = addD(last, st.min && st.lens.length > 1 ? st.min : L - 3), hi = addD(last, st.max && st.lens.length > 1 ? st.max : L + 3);
  return { date: addD(last, L), lo, hi, spread: st.lens.length > 1 ? st.max - st.min : null };
}

/* ---------- Padrões aprendidos a partir dos registos ---------- */
function cyclePatterns() {
  const st = cycleStats(), logs = H().logs, by = {};
  Object.keys(PHASES).forEach((k) => { by[k] = { days: 0, sums: {}, ns: {}, sym: {} }; });
  let total = 0;
  Object.entries(logs).forEach(([date, l]) => {
    const p = phaseOf(date, st); if (!p) return;
    const b = by[p.ph]; b.days++; total++;
    METRICS.forEach(([k]) => { if (l[k] != null && l[k] !== '') { b.sums[k] = (b.sums[k] || 0) + Number(l[k]); b.ns[k] = (b.ns[k] || 0) + 1; } });
    (l.sym || []).forEach((s) => { b.sym[s] = (b.sym[s] || 0) + 1; });
  });
  const avg = (b, k) => (b.ns[k] ? b.sums[k] / b.ns[k] : null);
  const insights = [];
  METRICS.forEach(([k, label]) => {
    const rows = Object.keys(by).map((ph) => ({ ph, n: by[ph].ns[k] || 0, v: avg(by[ph], k) })).filter((r) => r.n >= 3);
    if (rows.length < 2) return;
    const better = (k === 'pain' || k === 'overload' || k === 'stress') ? -1 : 1;
    const sorted = [...rows].sort((a, b) => (a.v - b.v) * better);
    const worst = sorted[0], others = rows.filter((r) => r !== worst);
    const oAvg = others.reduce((a, r) => a + r.v, 0) / others.length;
    const gap = (oAvg - worst.v) * better;
    if (gap >= 1.5) insights.push(`${label} ${better < 0 ? 'mais alta' : 'mais baixa'} na fase ${PHASES[worst.ph].name.toLowerCase()} (média ${worst.v.toFixed(1).replace('.', ',')} contra ${oAvg.toFixed(1).replace('.', ',')} nas outras).`);
  });
  const syms = {};
  Object.keys(by).forEach((ph) => Object.entries(by[ph].sym).forEach(([s, n]) => { (syms[s] = syms[s] || []).push([ph, n]); }));
  Object.entries(syms).forEach(([s, arr]) => {
    const tot = arr.reduce((a, [, n]) => a + n, 0); if (tot < 3) return;
    const top = [...arr].sort((a, b) => b[1] - a[1])[0];
    if (top[1] / tot >= 0.6) insights.push(`${s}: ${top[1]} de ${tot} dias foram na fase ${PHASES[top[0]].name.toLowerCase()}.`);
  });
  return { by, avg, total, insights, st };
}

/* ---------- Ecrã ---------- */
const PILL_REGIMES = [['21/7', '21 dias + 7 de pausa'], ['24/4', '24 dias + 4 de pausa'], ['continua', 'Contínua (sem pausa)'], ['outro', 'Outro']];
const pillOn = () => !!cyc().pill && !!cyc().pill.on;
function pillCard() {
  const cy = cyc(), p = cy.pill || {}, l = H().logs[logDate()] || {};
  let o = `<div class="card"><h2>Pílula e SOP</h2><div class="small">Isto muda a forma de ler o ciclo, por isso é bom anotar.</div>
    <div class="row mt">${pill('Tomo a pílula', !!p.on, 'pillOn', 'data-v="1"')}${pill('Tenho SOP', !!cy.sop, 'sopOn', 'data-v="1"')}</div>`;
  if (p.on) {
    o += `<div class="stack mt"><input type="text" id="pill-name" placeholder="Nome da pílula (opcional)" value="${esc(p.name || '')}" data-c="pillName">
      <div class="row">${PILL_REGIMES.map(([id, lb]) => pill(lb, p.regime === id, 'pillRegime', `data-v="${id}"`)).join('')}</div>
      <label class="small">Hora habitual</label><input type="time" id="pill-time" value="${esc(p.time || '22:00')}" data-c="pillTime">
      <button class="btn ${l.pill ? 'mint' : ''}" data-a="pillTaken">${l.pill ? '✓ Pílula de hoje tomada' : 'Tomei a pílula hoje'}</button></div>
      <div class="small mt">Com a pílula, a menstruação costuma ser uma hemorragia de privação, não um ciclo natural. As fases (ovulação, fase lútea) e as previsões abaixo são só estimativas e podem não corresponder ao que o teu corpo faz.</div>`;
  }
  if (cy.sop) o += `<div class="small mt">Com SOP, os ciclos podem ser longos ou irregulares, e isso é comum. A app aceita ciclos de 15 a 60 dias, mas as previsões ficam menos fiáveis. Se passarem muitos meses sem menstruação, fala com a médica.</div>`;
  return o + `</div>`;
}

function cicloView() {
  const h = H(), st = cycleStats(), today = todayStr(), l = h.logs[today] || {};
  const cur = phaseOf(today, st), nxt = nextPeriod(st);
  let o = pillCard();

  o += `<div class="card ${cur ? 'good' : ''}"><div class="label">Hoje</div>`;
  if (cur) {
    const P = PHASES[cur.ph];
    o += `<div class="big">${P.icon} Dia ${cur.day} · fase ${P.name.toLowerCase()}${pillOn() ? ' (estimativa)' : ''}</div><div class="small mt">${P.mare}</div>`;
    if (nxt) o += `<div class="small mt">Próxima menstruação por volta de <b>${fmtShort(nxt.date)}</b>${nxt.spread != null ? ` (entre ${fmtShort(nxt.lo)} e ${fmtShort(nxt.hi)})` : ' (estimativa, ainda com poucos ciclos)'}.${daysUntil(nxt.date) < -2 ? ' A previsão já passou. Os ciclos variam, mas se passarem meses sem menstruar fala com a médica.' : ''}</div>`;
  } else {
    o += `<div class="big">Ainda sem ciclo registado</div><div class="small mt">Marca o primeiro dia da tua última menstruação e a app começa a acompanhar.</div>`;
  }
  o += `<div class="row mt"><button class="btn small" data-a="periodStart">Começou hoje</button><button class="btn ghost small" data-a="periodEnd">Terminou hoje</button></div>
    <div class="lbl"><span>Fluxo de hoje</span></div>
    <div class="row">${FLOW.map((f) => pill(f, l.flow === f, 'flow', `data-v="${f}"`)).join('')}</div>
    <div class="lbl"><span>Esqueceste-te de marcar? Escolhe o primeiro dia</span></div>
    <div class="row nowrap"><input type="date" id="pd-date"><button class="btn small" data-a="periodAdd">Adicionar</button></div></div>`;

  const pat = cyclePatterns();
  o += `<div class="card"><h2>O que a app aprendeu contigo</h2>`;
  if (pat.total < 10) {
    o += `<div class="small">Precisa de uns 2 ciclos de registos (manhã e noite) para perceber o teu padrão. Por agora tem ${pat.total} dia(s) ligados a uma fase.</div>`;
  } else {
    if (pat.insights.length) o += `<div class="stack">${pat.insights.map((t) => `<div>• ${esc(t)}</div>`).join('')}</div><div class="small mt">São padrões nos teus registos, não certezas. Mostra à tua médica.</div>`;
    else o += `<div class="small">Ainda não se vê um padrão claro entre fases. Continua a registar.</div>`;
    o += `<div class="mt">${Object.keys(PHASES).map((ph) => {
      const b = pat.by[ph]; if (!b.days) return '';
      return `<div class="hist"><div><strong>${PHASES[ph].icon} ${PHASES[ph].name}</strong><div class="small">${b.days} dia(s)</div></div><div class="small" style="text-align:right">${METRICS.map(([k, lb]) => { const v = pat.avg(b, k); return v == null ? '' : `${lb} ${v.toFixed(1).replace('.', ',')}`; }).filter(Boolean).join(' · ')}</div></div>`;
    }).join('')}</div>`;
  }
  o += `</div>`;

  o += `<div class="card"><h2>Literacia: as quatro fases</h2><div class="small">Toca para abrir. É informação geral; o teu corpo pode ser diferente.</div><div class="stack mt">` +
    Object.keys(PHASES).map((ph) => { const P = PHASES[ph]; return `<details class="acc"${cur && cur.ph === ph ? ' open' : ''}><summary>${P.icon} ${P.name}</summary>
      <p><b>O que acontece.</b> ${P.what}</p><p><b>Como te podes sentir.</b> ${P.feel}</p><p><b>O que pode ajudar.</b> ${P.help}</p><p><b>Na Maré.</b> ${P.mare}</p></details>`; }).join('') + `</div></div>`;

  o += `<div class="card"><h2>Quando falar com a médica</h2><div class="stack">${CYCLE_FLAGS.map((t) => `<div>• ${t}</div>`).join('')}</div></div>`;

  o += `<details class="card acc"><summary>Como a app calcula</summary><p>Usa as datas em que a menstruação começou. A duração do ciclo é a média dos teus últimos ciclos (28 dias enquanto só houver um). A ovulação estima-se cerca de 14 dias antes da menstruação seguinte. É uma estimativa: se os teus ciclos forem irregulares, as datas podem falhar, e a margem mostra isso. Não serve como método contracetivo.</p></details>`;

  const rev = [...st.ps].reverse();
  o += `<div class="card"><h2>Histórico</h2>`;
  if (!rev.length) o += `<div class="small">Sem registos.</div>`;
  rev.forEach((p, i) => {
    const prev = rev[i + 1], len = prev ? dDiff(prev.start, p.start) : null;
    o += `<div class="med"><div><strong>${fmtShort(p.start)}${isDate(p.end) ? ' a ' + fmtShort(p.end) : ''}</strong><div class="small">${len ? `ciclo anterior: ${len} dias` : 'primeiro registo'}</div></div><button class="x" data-a="delPeriod" data-id="${p.start}" aria-label="Apagar">×</button></div>`;
  });
  o += `</div>`;
  return o;
}

/* ---------- Ações ---------- */
function addPeriod(date) {
  const c = cyc();
  if (c.periods.some((p) => p.start === date)) { toast('Esse dia já está registado'); return false; }
  c.periods.push({ start: date, end: '' }); save(); return true;
}
Object.assign(A, {
  periodStart: () => { if (addPeriod(todayStr())) { render(); toast('Primeiro dia registado'); } },
  periodEnd: () => {
    const ps = periods(); if (!ps.length) { toast('Ainda não há menstruação registada'); return; }
    ps[ps.length - 1].end = todayStr(); save(); render(); toast('Fim registado');
  },
  periodAdd: () => {
    const v = $('#pd-date').value; if (!isDate(v)) { toast('Escolhe uma data'); return; }
    if (addPeriod(v)) { render(); toast('Guardado'); }
  },
  delPeriod: (d) => { const c = cyc(); c.periods = c.periods.filter((p) => p.start !== d.id); save(); render(); },
  flow: (d) => { const l = ensureLog(); l.flow = l.flow === d.v ? null : d.v; save(); render(); }
});

/* Cartão na página Hoje */
function cycleBanner() {
  const st = cycleStats(), cur = phaseOf(todayStr(), st); if (!cur) return '';
  const P = PHASES[cur.ph], pre = cur.ph === 'lut' && cur.day >= cur.L - 3;
  const txt = pre ? 'Estás nos dias antes da menstruação. Cansaço e humor mais sensível são comuns. Maré média ou baixa pode cair bem.'
    : cur.ph === 'mens' && cur.day <= 2 ? 'Primeiros dias da menstruação. Calor, hidratação e movimento leve podem ajudar.' : '';
  if (!txt) return '';
  return `<div class="card note"><strong>${P.icon} Dia ${cur.day} do ciclo · ${P.name.toLowerCase()}</strong><div class="small">${txt} <button class="link" data-a="goSub" data-v="ciclo">Saber mais</button></div></div>`;
}

Object.assign(A, {
  pillOn: () => { const cy = cyc(); cy.pill = Object.assign({ on: false, regime: '21/7', time: '22:00', name: '' }, cy.pill || {}); cy.pill.on = !cy.pill.on; save(); render(); },
  sopOn: () => { const cy = cyc(); cy.sop = !cy.sop; save(); render(); },
  pillRegime: (d) => { cyc().pill.regime = d.v; save(); render(); },
  pillTaken: () => { const l = ensureLog(); l.pill = !l.pill; save(); render(); }
});
C.pillName = (el) => { cyc().pill.name = el.value; save(); };
C.pillTime = (el) => { cyc().pill.time = el.value; save(); };
