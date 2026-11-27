'use strict';

/* ============================================================
   Maré · Histórico
   Painel com tudo o que registaste e o que aconteceu: gráficos,
   ciclo, treinos e dia a dia. Lê só os dados que estão no aparelho.
   ============================================================ */

TABS.forEach((t) => { if (t.id === 'progresso') { t.label = 'Histórico'; t.title = 'Histórico'; } });

const HM = [
  ['energy', 'Energia', 10, 'var(--sage-ink)'], ['mood', 'Humor', 10, 'var(--accent-ink)'], ['pain', 'Dor', 10, 'var(--terra-ink)'],
  ['stress', 'Stress', 10, 'var(--terra-ink)'], ['overload', 'Sobrecarga sensorial', 10, '#7A5C9E'], ['sleep', 'Sono (horas)', 10, '#3F6E8C']
];
const PH_COLOR = { mens: 'var(--terra)', fol: 'var(--sage)', ovu: 'var(--accent)', lut: '#C9A8D6' };
const nz = (v) => (v == null || v === '' || isNaN(v) ? null : Number(v));
const num1 = (v) => (Math.round(v * 10) / 10).toString().replace('.', ',');
const wd = (d) => DAYS[(parse(d).getDay() + 6) % 7];

function rangeDates(n) { const o = []; for (let i = n - 1; i >= 0; i--) o.push(addD(todayStr(), -i)); return o; }

function hChart(dates, key, label, max, color) {
  const logs = H().logs, W = 300, Hh = 76, n = dates.length;
  const pts = dates.map((d, i) => ({ i, v: nz((logs[d] || {})[key]) })).filter((p) => p.v != null);
  if (!pts.length) return '';
  const x = (i) => 8 + (n === 1 ? 0 : (i / (n - 1)) * (W - 16)), y = (v) => Hh - 10 - (Math.min(v, max) / max) * (Hh - 20);
  const avg = pts.reduce((a, p) => a + p.v, 0) / pts.length, last = pts[pts.length - 1];
  return `<div class="card"><div class="between"><strong>${label}</strong><span class="small">média ${num1(avg)} · último ${num1(last.v)}</span></div>
    <svg viewBox="0 0 ${W} ${Hh}" style="width:100%;margin-top:8px" role="img" aria-label="${label}">
      <line x1="8" x2="${W - 8}" y1="${y(0)}" y2="${y(0)}" stroke="var(--line)"/><line x1="8" x2="${W - 8}" y1="${y(max / 2)}" y2="${y(max / 2)}" stroke="var(--line)" stroke-dasharray="3 4"/>
      ${pts.length > 1 ? `<polyline fill="none" stroke="${color}" stroke-width="2" stroke-opacity=".55" points="${pts.map((p) => `${x(p.i).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ')}"/>` : ''}
      ${pts.map((p) => `<circle cx="${x(p.i).toFixed(1)}" cy="${y(p.v).toFixed(1)}" r="3.2" fill="${color}"/>`).join('')}</svg>
    <div class="between small"><span>${fmtShort(dates[0])}</span><span>${pts.length} dia(s) com registo</span><span>${fmtShort(dates[n - 1])}</span></div></div>`;
}

function dayHasData(d) {
  const l = H().logs[d], c = S.checkins[d];
  const hasLog = l && (['pain', 'painAM', 'energy', 'mood', 'stress', 'overload', 'sleep', 'sleepQ'].some((k) => nz(l[k]) != null) || (l.sym || []).length || l.notes || l.inhaler || l.flow || l.place || l.pill);
  return !!(hasLog || (c && (c.done || c.photo)) || agendaFor(d).length);
}

function dayDetail(d) {
  const l = H().logs[d] || {}, c = S.checkins[d] || {}, evs = agendaFor(d), ph = pillOn() ? null : phaseOf(d);
  const row = (k, v) => (v ? `<div class="between" style="align-items:flex-start"><span class="small">${k}</span><span style="text-align:right">${v}</span></div>` : '');
  const nn = (k) => (nz(l[k]) != null ? num1(nz(l[k])) : '');
  const rests = Object.keys(l.rest || {}).filter((k) => l.rest[k]).map((k) => (RESTS.find((r) => r[0] === k) || [k, k])[1]).join(', ');
  const phy = Object.keys(l.physio || {}).filter((k) => l.physio[k]).length;
  const dl = evs.length ? dayLoad(d) : null;
  return `<div class="stack" style="margin-top:8px">
    ${row('Onde', l.place ? esc(l.place) : '')}${row('Pílula', (l.pill ? 'tomada ✓' : '') + (pillOn() && packInfo(d) ? ` · dia ${packInfo(d).n} de ${packInfo(d).tot}${packInfo(d).pause ? ' (pausa)' : ''}` : ''))}
    ${row('Sono', nn('sleep') ? nn('sleep') + ' h' + (nn('sleepQ') ? ` · qualidade ${nn('sleepQ')}` : '') : (nn('sleepQ') ? 'qualidade ' + nn('sleepQ') : ''))}
    ${row('Ao levantar', nn('painAM') ? 'dor ' + nn('painAM') : '')}${row('Energia', nn('energy'))}${row('Humor', nn('mood'))}${row('Dor', nn('pain'))}${row('Stress', nn('stress'))}${row('Sobrecarga', nn('overload'))}
    ${row('Sinais', (l.sym || []).map(esc).join(', '))}${row('Pesou', (l.load || []).map(esc).join(', '))}${row('Inalador', l.inhaler ? l.inhaler + ' vez(es)' : '')}${row('Recuperar', rests)}
    ${row('Treino', c.done ? '✓ feito' : '')}${row('Fisioterapia', phy ? phy + ' exercício(s) feito(s)' : '')}${row('Ciclo', ph ? `dia ${ph.day} · ${PHASES[ph.ph].name.toLowerCase()}${l.flow ? ' · fluxo ' + l.flow.toLowerCase() : ''}` : (l.flow ? 'fluxo ' + l.flow.toLowerCase() : ''))}
    ${row('Nota', l.notes ? esc(l.notes) : '')}
    ${c.photo ? `<img src="${c.photo}" alt="" style="width:96px;height:96px;object-fit:cover;border-radius:10px">` : ''}
    ${evs.length ? `<div class="label">Agenda · carga ${LEVELS[dl.level][0].toLowerCase()}</div>${evs.map(evLine).join('')}` : ''}</div>`;
}

function daySummaryChips(d) {
  const l = H().logs[d] || {}, c = S.checkins[d] || {}, ch = [];
  if (nz(l.energy) != null) ch.push(`⚡${num1(nz(l.energy))}`);
  if (nz(l.mood) != null) ch.push(`🙂${num1(nz(l.mood))}`);
  if (nz(l.pain) != null) ch.push(`dor ${num1(nz(l.pain))}`);
  if (nz(l.stress) != null) ch.push(`stress ${num1(nz(l.stress))}`);
  if (nz(l.sleep) != null) ch.push(`${num1(nz(l.sleep))} h`);
  if (l.place) ch.push('📍' + esc(l.place));
  if (c.done) ch.push('✓ treino');
  const evs = agendaFor(d); if (evs.length) ch.push(`${evs.length} comp.`);
  const ph = pillOn() ? null : phaseOf(d); if (ph && ph.ph === 'mens') ch.push('🌑');
  return ch.join(' · ');
}

const _progressoFotos = VIEWS.progresso;
VIEWS.progresso = function () {
  const sub = ui.hsub || 'resumo', n = ui.hrange || 30, dates = rangeDates(n);
  const tabs = [['resumo', 'Resumo'], ['dias', 'Dia a dia'], ['fotos', 'Peso e fotos']];
  let o = `<div class="row nowrap">${tabs.map(([id, lb]) => pill(lb, sub === id, 'hsub', `data-v="${id}"`)).join('')}</div>`;
  if (sub === 'fotos') return o + _progressoFotos();
  o += `<div class="row nowrap">${[7, 30, 90].map((r) => pill(`${r} dias`, n === r, 'hrange', `data-v="${r}"`)).join('')}</div>`;

  const logs = H().logs, withLog = dates.filter((d) => dayHasData(d) && (logs[d] || (S.checkins[d] && S.checkins[d].done)));
  const anyData = Object.keys(logs).length || Object.keys(S.checkins).length || S.weights.length || agendaAll().length;
  if (!anyData) {
    return o + `<div class="card"><h2>Ainda não há nada para mostrar</h2><div class="small">Quando registares ou importares o teu histórico, aparece tudo aqui.</div>
      <div class="row mt"><button class="btn small" data-a="goReg" data-v="manha">Registar hoje</button><button class="btn ghost small" data-a="goSub" data-v="mais">Trazer o histórico</button></div></div>`;
  }

  if (sub === 'dias') {
    const days = dates.filter(dayHasData).reverse();
    o += `<div class="sub">Toca num dia para ver tudo o que aconteceu.</div>`;
    if (!days.length) return o + `<div class="card"><div class="small">Sem registos nestes ${n} dias.</div></div>`;
    return o + `<div class="stack">${days.map((d) => `<details class="acc"><summary>${wd(d)} ${fmtShort(d)}<span class="small" style="display:block;font-weight:400">${daySummaryChips(d)}</span></summary>${dayDetail(d)}</details>`).join('')}</div>`;
  }

  // Resumo
  const vals = (k) => dates.map((d) => nz((logs[d] || {})[k])).filter((v) => v != null);
  const avg = (a) => (a.length ? num1(a.reduce((x, y) => x + y, 0) / a.length) : '—');
  const trained = dates.filter((d) => S.checkins[d] && S.checkins[d].done).length;
  const heavy = dates.filter((d) => agendaFor(d).length && dayLoad(d).level === 'pesada').length;
  const migr = dates.filter((d) => ((logs[d] || {}).sym || []).includes('Enxaqueca')).length;
  const tiles = [[withLog.length, 'dias com registo'], [trained, 'treinos feitos'], [avg(vals('sleep')) + (vals('sleep').length ? ' h' : ''), 'sono médio'], [avg(vals('energy')), 'energia média'],
    [avg(vals('stress')), 'stress médio'], [heavy, 'dias pesados'], [migr, 'dias com enxaqueca'], [agendaAll().length ? dates.filter((d) => agendaFor(d).length).length : '—', 'dias com compromissos']];
  o += `<div class="tiles">${tiles.map(([v, l]) => `<div class="tile"><div class="big">${v}</div><div class="small">${l}</div></div>`).join('')}</div>`;

  const strip = dates.map((d) => { const p = phaseOf(d), l = logs[d] || {}; return `<i title="${fmtShort(d)}" style="flex:1;height:12px;background:${p ? PH_COLOR[p.ph] : 'var(--line)'};${l.flow ? 'outline:2px solid var(--terra-ink);outline-offset:-2px' : ''}"></i>`; }).join('');
  if (!pillOn() && cycleStats().ps.length) o += `<div class="card"><strong>Ciclo</strong><div style="display:flex;gap:1px;margin-top:8px;border-radius:6px;overflow:hidden">${strip}</div>
    <div class="row small mt">${Object.keys(PHASES).map((k) => `<span><span class="dot" style="background:${PH_COLOR[k]};margin-right:4px"></span>${PHASES[k].name}</span>`).join('')}</div></div>`;

  const byPlace = {};
  dates.forEach((d) => { const l = logs[d]; if (l && l.place) (byPlace[l.place] = byPlace[l.place] || []).push(l); });
  if (Object.keys(byPlace).length > 1) {
    const av = (ls, k) => { const v = ls.map((x) => nz(x[k])).filter((x) => x != null); return v.length ? num1(v.reduce((a, b) => a + b, 0) / v.length) : '—'; };
    o += `<div class="card"><strong>Por lugar</strong><div class="small">Médias dos dias em que registaste cada sítio.</div><div class="stack mt">${Object.entries(byPlace).map(([p, ls]) =>
      `<div class="between"><span>📍 ${esc(p)} <span class="small">(${ls.length} dia${ls.length > 1 ? 's' : ''})</span></span><span class="small">sono ${av(ls, 'sleep')} · energia ${av(ls, 'energy')} · dor ${av(ls, 'pain')} · stress ${av(ls, 'stress')}</span></div>`).join('')}</div></div>`;
  }

  const charts = HM.map(([k, lb, mx, col]) => hChart(dates, k, lb, mx, col)).join('');
  o += charts || `<div class="card"><div class="small">Sem registos de energia, humor, dor ou sono nestes ${n} dias. Faz o registo da manhã e da noite, ou traz o histórico em Saúde → Mais.</div></div>`;

  const ex = [...H().exams].sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 4);
  if (ex.length) o += `<div class="card"><strong>Últimos exames</strong><div class="stack mt">${ex.map((e) => `<div class="between"><span>${esc(e.title)}</span><span class="small">${fmtShort(e.date)}</span></div>`).join('')}</div><div class="mt"><button class="link small" data-a="goSub" data-v="mais">Ver tudo</button></div></div>`;
  return o;
};

Object.assign(A, {
  hsub: (d) => { ui.hsub = d.v; window.scrollTo(0, 0); render(); },
  hrange: (d) => { ui.hrange = +d.v; render(); }
});
