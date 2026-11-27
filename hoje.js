'use strict';

/* ============================================================
   Maré · ecrãs simples: Hoje, Eu
   Pensados para pouca energia e hipersensibilidade:
   uma coisa de cada vez, muito espaço, nada a piscar.
   ============================================================ */

const greet = () => { const h = new Date().getHours(); return h < 5 ? 'Boa noite' : h < 13 ? 'Bom dia' : h < 20 ? 'Boa tarde' : 'Boa noite'; };

/* ---------- Escalas de 5 pontos, com palavras ---------- */
const SCALES = [
  { k: 'sleepQ', t: 'Como dormi', w: ['Mal', 'Fraco', 'Assim-assim', 'Bem', 'Muito bem'], v: [1, 3, 5, 7, 9], good: true },
  { k: 'energy', t: 'Energia', w: ['Nenhuma', 'Pouca', 'Média', 'Boa', 'Muita'], v: [1, 3, 5, 7, 9], good: true },
  { k: 'mood', t: 'Humor', w: ['Muito em baixo', 'Em baixo', 'Assim-assim', 'Bem', 'Ótimo'], v: [1, 3, 5, 7, 9], good: true },
  { k: 'pain', t: 'Dor', w: ['Nada', 'Pouca', 'Média', 'Muita', 'Imensa'], v: [0, 2, 5, 7, 9] },
  { k: 'mig', t: 'Enxaqueca', w: ['Nada', 'Leve', 'Média', 'Forte', 'Imensa'], v: [0, 1, 2, 3, 4] },
  { k: 'overload', t: 'Sobrecarga sensorial', w: ['Nada', 'Pouca', 'Média', 'Muita', 'Imensa'], v: [0, 2, 5, 7, 9] },
  { k: 'stress', t: 'Stress ou ansiedade', w: ['Nada', 'Pouco', 'Médio', 'Muito', 'Imenso'], v: [0, 2, 5, 7, 9] }
];
const scIdx = (l, q) => {
  if (q.k === 'mig') return (l.sym || []).includes('Enxaqueca') ? Math.min(4, Math.max(1, l.migInt == null ? 2 : l.migInt)) : (l.migNo ? 0 : -1);
  const x = nz(l[q.k]); if (x == null) return -1;
  return q.v.reduce((b, y, i) => (Math.abs(y - x) < Math.abs(q.v[b] - x) ? i : b), 0);
};
const wordOf = (k, val) => { const q = SCALES.find((s) => s.k === k); if (!q || val == null) return '—'; const i = scIdx({ [k]: val }, q); return i < 0 ? '—' : q.w[i]; };

A.sc = (d) => {
  const q = SCALES.find((x) => x.k === d.k); if (!q) return; const i = +d.i, l = ensureLog();
  if (q.k === 'mig') { l.sym = (l.sym || []).filter((s) => s !== 'Enxaqueca'); if (i > 0) { l.sym.push('Enxaqueca'); l.migInt = i; l.migNo = false; } else { l.migNo = true; l.migInt = 0; } }
  else l[q.k] = q.v[i];
  save(); render();
};
A.regOpen = () => { ui.regOpen = !ui.regOpen; render(); };

function regProgress() {
  const l = H().logs[logDate()] || {};
  const CORE = ['sleepQ', 'energy', 'mood', 'overload', 'stress'], act = trackActive();
  let n = SCALES.filter((q) => CORE.includes(q.k) && scIdx(l, q) >= 0).length + act.filter((it) => trkState(it, l) >= 0).length, tot = CORE.length + act.length;
  tot += 1; if (l.place) n++;
  if (pillOn() && !((packInfo(logDate()) || {}).pause && !(packInfo(logDate()) || {}).takes)) { tot += 1; if (l.pill) n++; }
  return [n, tot];
}

function regCard() {
  const h = H(), ld = logDate(), l = h.logs[ld] || {}, [n, tot] = regProgress(), done = n >= tot;
  const places = h.places && h.places.length ? h.places : ['Porto', 'Braga', 'Terceira'];
  const when = ld === todayStr() ? 'Hoje' : 'Ontem';
  if (done && !ui.regOpen) return `<div class="card good"><div class="between"><div><h2>✓ ${when} no corpo: registado</h2><div class="small">${n} de ${tot}. Obrigada por cuidares de ti.</div></div><button class="btn ghost small" data-a="regOpen">Rever</button></div></div>`;
  const CORE = ['sleepQ', 'energy', 'mood', 'overload', 'stress'];
  const row = (q) => {
    const s = scIdx(l, q);
    return `<div class="sc"><div class="between"><span>${q.t}</span><span class="small">${s >= 0 ? q.w[s] : 'por responder'}</span></div>
      <div class="dots">${q.w.map((w, i) => `<button class="d5${s === i ? ' on' : ''}" style="--f:${i + 1}" data-a="sc" data-k="${q.k}" data-i="${i}" aria-label="${q.t}: ${w}"></button>`).join('')}</div></div>`;
  };
  const meds = h.meds.filter((m) => !isDate(m.end) || daysUntil(m.end) >= 0);
  let o = `<div class="card" id="c-noite"><div class="between"><h2>${when} no corpo</h2><span class="small">${n} de ${tot}</span></div>
    <div class="prog"><i style="width:${Math.round(n / tot * 100)}%"></i></div>`;
  if (ld === todayStr()) o += `<div class="small mt"><button class="link" data-a="regDay" data-v="${addD(todayStr(), -1)}">Registar o dia de ontem</button></div>`;
  if (ld !== todayStr()) o += `<div class="small mt">Estás a registar o dia de ontem. <button class="link" data-a="regDay" data-v="${todayStr()}">Passar para hoje</button></div>`;
  o += `<div class="mt">${SCALES.filter((q) => CORE.includes(q.k)).map(row).join('')}</div>`;
  const act = trackActive();
  if (act.length) o += `<div class="label mt" style="color:var(--accent-ink)">A acompanhar</div><div class="mt">${act.map((it) => trkRow(it, l)).join('')}</div>`;
  o += `<div class="small"><button class="link" data-a="goTrack">Mudar o que acompanho</button></div>`;
  o += `<div class="sc"><div class="small">Onde estás?</div><div class="row mt">${places.map((pl) => `<button class="pill${l.place === pl ? ' on' : ''}" data-a="place" data-v="${esc(pl)}">${esc(pl)}</button>`).join('')}</div></div>`;
  if (pillOn()) o += `<div class="mt"><button class="btn ${l.pill ? 'mint' : 'ghost'} small" data-a="pillTaken">${l.pill ? '✓ Pílula tomada' : 'Tomei a pílula'}</button></div>`;
  o += `<details class="mt acc"><summary>Acrescentar (sono em horas, sintomas, medicação, nota)</summary>
    <div class="lbl"><span>Horas de sono</span></div>
    <input type="number" inputmode="decimal" step="0.5" min="0" max="16" placeholder="ex: 7" value="${l.sleep == null ? '' : l.sleep}" data-c="hlog" data-k="sleep">
    <div class="lbl"><span>Sinais</span></div><div class="row">${SYMPTOMS.map((s) => pill(s, (l.sym || []).includes(s), 'sym', `data-v="${esc(s)}"`)).join('')}</div>
    <div class="lbl"><span>O que pesou</span></div><div class="row">${LOADS.map((s) => pill(s, (l.load || []).includes(s), 'load', `data-v="${esc(s)}"`)).join('')}</div>
    ${meds.length ? `<div class="lbl"><span>Medicação de hoje</span></div><div class="row">${meds.map((m) => `<button class="pill${(l.meds || {})[m.id] ? ' on' : ''}" data-a="medTaken" data-id="${m.id}">${esc(m.name.split(' (')[0])}</button>`).join('')}</div>` : ''}
    <div class="lbl"><span>Inalador (vezes)</span></div><div class="row"><button class="btn ghost small" data-a="inhaler" data-v="-1">−</button><b>${l.inhaler || 0}</b><button class="btn ghost small" data-a="inhaler" data-v="1">+</button></div>
    <div class="lbl"><span>Nota</span></div><textarea rows="2" data-c="hnote" placeholder="o que piorou ou melhorou">${esc(l.notes || '')}</textarea></details>`;
  return o + `</div>`;
}

/* Mosaicos: hoje contra a média dos últimos 7 dias */
function tilesCard() {
  const logs = H().logs, ld = logDate(), t7 = Array.from({ length: 7 }, (_, i) => addD(ld, -(i + 1)));
  const items = [['sleep', 'Sono', 'sleep'], ['energy', 'Energia', 'energy'], ['pain', 'Dor', 'pain'], ['mood', 'Humor', 'mood']];
  const tile = ([k, lb]) => {
    const l = logs[ld] || {}, v = nz(l[k]);
    const base = t7.map((d) => nz((logs[d] || {})[k])).filter((x) => x != null), avg = base.length ? base.reduce((a, b) => a + b, 0) / base.length : null;
    const main = v == null ? '—' : (k === 'sleep' ? num1(v) + ' h' : wordOf(k, v));
    let sub = avg == null ? 'sem média ainda' : 'média 7 dias ' + (k === 'sleep' ? num1(avg) + ' h' : wordOf(k, Math.round(avg)));
    const arrow = v != null && avg != null && Math.abs(v - avg) >= 1.2 ? (v > avg ? '▲' : '▼') : '';
    return `<button class="tile2" data-a="goHist"><div class="small">${lb}</div><div class="big2">${main} <span class="ar">${arrow}</span></div><div class="small">${sub}</div></button>`;
  };
  return `<div class="tiles2">${items.map(tile).join('')}</div>`;
}

VIEWS.hoje = function () {
  const idx = todayIdx(), today = todayStr(), mi = typeof reportInsight === 'function' ? reportInsight() : '';
  let o = `<div class="hello"><div class="big">${greet()}</div><div class="sub">${DAYS_LONG[idx]}, ${fmtShort(today)}</div></div>`;
  o += regCard();
  o += tilesCard();
  if (mi) o += `<div class="card note"><div class="label" style="color:var(--accent-ink)">O que reparei</div><div class="mt">${esc(mi)}</div></div>`;

  const hb = typeof healthBanner === 'function' ? healthBanner() : ''; if (hb) o += hb;

  const pend = pendencias().filter((p) => p.level !== 'ok' && !['am', 'pm', 'pill'].includes(p.id));
  if (pend.length) {
    o += `<div class="card"><h2>Para fazer</h2><div class="stack mt">${pend.slice(0, 2).map((p) => pendRow(p, true)).join('')}</div>`;
    if (pend.length > 2) o += `<details class="mt"><summary class="small">Ver mais ${pend.length - 2}</summary><div class="stack mt">${pend.slice(2).map((p) => pendRow(p, true)).join('')}</div></details>`;
    o += `</div>`;
  }

  if (pillOn() && packInfo(today)) { const pk = packInfo(today); o += `<div class="card"><div class="between"><div><div class="label" style="color:var(--accent-ink)">Blister</div><strong>Dia ${pk.n} de ${pk.tot}</strong></div><span class="small">${pk.pause ? 'pausa, é normal vir a menstruação' : 'comprimidos ativos'}</span></div></div>`; }

  if (recoveryOn()) o += recoveryCard();
  else {
    const p = S.weekplans[weekStart(0)], gid = p && p.set ? p.days[idx] : null, g = gid ? GROUPS[gid] : null, ci = S.checkins[today] || {};
    if (!g) o += `<div class="card"><h2>Esta semana</h2><div class="small">Ainda não escolheste a maré da semana. Leva 20 segundos.</div><div class="mt"><button class="btn ghost small" data-a="tab" data-v="semana">Escolher a maré</button></div></div>`;
    else {
      const w = g.workout ? WORKOUTS.find((x) => x.id === g.workout) : null;
      o += `<div class="card"><div class="label" style="color:${g.color}">Movimento de hoje</div><div class="big" style="color:${g.color}">${esc(g.label)}</div>`;
      if (gid === 'descanso') o += `<div class="small mt">Dia de descanso. Só alongar, se te apetecer.</div>`;
      if (gid === 'caminhada') o += `<div class="small mt">30 a 45 minutos a caminhar, de preferência na natureza.</div>`;
      if (w && typeof workoutHint === 'function') o += workoutHint(w);
      o += `<div class="row mt">${w ? `<button class="btn small" data-a="openTimer" data-id="${w.id}">Começar</button>` : ''}${gid !== 'descanso' ? `<button class="btn ${ci.done ? 'mint' : 'ghost'} small" data-a="toggleDone">${ci.done ? '✓ Feito' : 'Marcar como feito'}</button>` : ''}</div></div>`;
    }
  }
  o += agendaCard();
  o += reportCard();
  return o;
};

VIEWS.eu = function () {
  const item = (ic, t, d, a, v) => `<button class="hub" data-a="${a}" data-v="${v}"><span class="ic">${ic}</span><span><strong>${t}</strong><span class="small" style="display:block">${d}</span></span><span class="chev">›</span></button>`;
  const calm = !!(S.prefs && S.prefs.calm), on = !(S.prefs && S.prefs.popups === false);
  let o = `<div class="sub">Tudo o resto está aqui, quando precisares.</div><div class="stack">`;
  o += item('📈', 'Como tenho estado', 'Gráficos, dia a dia e peso', 'tab', 'progresso');
  o += item('🌙', 'Ciclo e pílula', 'Blister, menstruação, literacia', 'goSub', 'ciclo');
  o += item('🎯', 'O que estou a acompanhar', 'Dor, enxaqueca e o que mais precisares', 'goTrack', '');
  o += item('💊', 'Medicação e consultas', 'Receitas, exames, ficha de emergência', 'goSub', 'mais');
  o += item('🦴', 'Fisioterapia', 'Perguntas, notas e exercícios', 'goSub', 'fisio');
  o += item('🌊', 'Treinos', 'Timers e movimento suave', 'tab', 'treinos');
  o += `</div>`;
  o += `<div class="card"><h2>Ajustes</h2><div class="stack mt">
    <div class="between"><div><strong>Modo calmo</strong><div class="small">Menos cor, sem sons nem animações.</div></div><button class="btn small ${calm ? 'mint' : 'ghost'}" data-a="calm">${calm ? 'Ligado' : 'Desligado'}</button></div>
    <div class="between"><div><strong>Modo recuperação</strong><div class="small">Só caminhada e mobilidade suave nos treinos.</div></div><button class="btn small ${recoveryOn() ? 'mint' : 'ghost'}" data-a="recovery" data-v="${recoveryOn() ? 0 : 1}">${recoveryOn() ? 'Ligado' : 'Desligado'}</button></div>
    <div class="between"><div><strong>Janela "O que falta"</strong><div class="small">Ao abrir, de manhã e ao fim do dia.</div></div><button class="btn small ${on ? 'mint' : 'ghost'}" data-a="popToggle">${on ? 'Ligada' : 'Desligada'}</button></div>
    <div class="between"><div><strong>Guardar cópia</strong><div class="small">Tudo, para o Drive, email ou outro aparelho.</div></div><button class="btn small ghost" data-a="export">Guardar</button></div>
    <label class="btn ghost small" style="cursor:pointer;text-align:center">Restaurar cópia<input type="file" accept="application/json" data-c="import" hidden></label></div></div>`;
  return o;
};

A.goHist = () => { ui.tab = 'progresso'; ui.hsub = 'resumo'; ui.hrange = 30; window.scrollTo(0, 0); render(); };
