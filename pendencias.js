'use strict';

/* ============================================================
   Maré · Pendências
   Lembra-te do que falta preencher e até quando, para não te perderes.
   Só aparece quando abres a app. Sem dados pessoais no código.
   ============================================================ */

const CATCHUP_DAYS = 3; // quantos dias para trás ainda dá para preencher
const logFilled = (d) => {
  const l = H().logs[d];
  return !!(l && (['pain', 'painAM', 'energy', 'mood', 'stress', 'overload', 'sleep', 'sleepQ'].some((k) => l[k] != null && l[k] !== '') || (l.sym || []).length));
};
const effToday = () => (new Date().getHours() < 5 ? addD(todayStr(), -1) : todayStr());
const dName = (d) => `${DAYS_LONG[(parse(d).getDay() + 6) % 7].toLowerCase()} ${fmtShort(d)}`;

function pendencias() {
  const h = H(), hr = new Date().getHours(), t = effToday(), out = [], l = h.logs[t] || {};
  const add = (id, title, due, level, a, v) => out.push({ id, title, due, level, a, v });
  const wdIdx = (parse(t).getDay() + 6) % 7; // 0 = segunda

  // Hoje
  const amDone = l.energy != null || l.sleep != null || l.painAM != null || l.sleepQ != null;
  const pmDone = l.mood != null || l.pain != null || l.stress != null;
  if (hr >= 9 && hr < 24 && t === todayStr() && !amDone) add('am', 'Registo da manhã', hr < 15 ? 'para hoje' : 'ficou por fazer hoje', hr < 15 ? 'soon' : 'late', 'fillDay', t + '|c-manha');
  if ((hr >= 19 || hr < 5) && !pmDone) add('pm', 'Registo da noite', 'para hoje', 'soon', 'fillDay', t + '|c-noite');
  const left = typeof physioToday === 'function' ? physioToday().filter((e) => !((l.physio || {})[e.id])).length : 0;
  if (left && hr >= 9) add('physio', `Fisioterapia: ${left} exercício(s)`, 'para hoje', hr >= 18 ? 'late' : 'soon', 'goSub', 'fisio');

  // Dias anteriores por preencher (ainda dá para recuperar)
  for (let i = 1; i <= CATCHUP_DAYS; i++) {
    const d = addD(t, -i);
    if (logFilled(d)) continue;
    if (!Object.keys(h.logs).length && !S.checkins[d]) continue; // ainda sem histórico: não assustar
    const rest = CATCHUP_DAYS - i + 1;
    add('miss' + d, `Registo de ${dName(d)}`, rest === 1 ? 'último dia para preencher' : `ainda dá nos próximos ${rest} dias`, rest === 1 ? 'late' : 'soon', 'fillDay', d + '|c-noite');
  }

  // Semana
  const lastW = [...S.weights].sort((a, b) => String(b.date).localeCompare(String(a.date)))[0];
  const daysSinceW = lastW ? dDiff(lastW.date, t) : null;
  if (daysSinceW === null || daysSinceW >= 7) {
    const toSun = 6 - wdIdx;
    add('weight', 'Peso da semana', daysSinceW !== null && daysSinceW >= 9 ? 'já passou uma semana' : toSun === 0 ? 'para hoje (domingo)' : `até domingo (faltam ${toSun} dia(s))`, daysSinceW !== null && daysSinceW >= 9 ? 'late' : toSun === 0 ? 'soon' : 'ok', 'goWeight', '');
  }
  const nextPlanned = S.weekplans[weekStart(1)] && S.weekplans[weekStart(1)].set;
  const thisPlanned = S.weekplans[weekStart(0)] && S.weekplans[weekStart(0)].set;
  if (!thisPlanned && wdIdx <= 2) add('plan0', 'Plano desta semana', wdIdx === 0 ? 'para hoje' : 'ainda por fazer', wdIdx === 0 ? 'soon' : 'late', 'tab', 'semana');
  if (!nextPlanned && wdIdx >= 5) add('plan1', 'Plano da próxima semana', wdIdx === 6 ? 'para hoje (domingo)' : 'até domingo', wdIdx === 6 ? 'soon' : 'ok', 'goNext', '');

  // Saúde
  h.meds.forEach((m) => {
    if (!isDate(m.end)) return;
    const d = daysUntil(m.end);
    if (d < 0) add('med' + m.id, `Renovar receita: ${m.name}`, `terminou há ${-d} dia(s)`, 'late', 'goSub', 'mais');
    else if (d <= 14) add('med' + m.id, `Renovar receita: ${m.name}`, `faltam ${d} dia(s)`, 'soon', 'goSub', 'mais');
  });
  const st = cycleStats(), nx = nextPeriod(st);
  if (nx && daysUntil(nx.hi) < -2 && daysUntil(nx.hi) > -40) add('cycle', 'Confirmar o ciclo', 'a previsão já passou, marca se a menstruação veio', 'ok', 'goSub', 'ciclo');
  const lastP = st.ps[st.ps.length - 1];
  if (lastP && !isDate(lastP.end) && dDiff(lastP.start, t) >= 7 && dDiff(lastP.start, t) <= 14) add('pend', 'Marcar o fim da menstruação', 'se já terminou', 'ok', 'goSub', 'ciclo');
  if (agendaAll().length) {
    const at = S.prefs && S.prefs.agendaAt;
    if (!at || dDiff(at, t) > 14) add('agenda', 'Atualizar a agenda', at ? `última vez há ${dDiff(at, t)} dias` : 'importa de novo quando mudar', 'ok', 'goSub', 'mais');
  }
  const rank = { late: 0, soon: 1, ok: 2 };
  return out.sort((a, b) => rank[a.level] - rank[b.level]);
}

const LV_COLOR = { late: 'var(--terra-ink)', soon: 'var(--accent-ink)', ok: 'var(--muted)' };
const pendRow = (p, btn) => `<div class="between"><div><strong>${esc(p.title)}</strong><div class="small" style="color:${LV_COLOR[p.level]}">${esc(p.due)}</div></div><button class="btn small${btn ? '' : ' ghost'}" data-a="${p.a}" data-v="${esc(p.v)}">Preencher</button></div>`;

function pendCard() {
  const list = pendencias(); if (!list.length) return '';
  return `<details class="card acc" ${list.some((p) => p.level === 'late') ? 'open' : ''}><summary>A preencher · ${list.length}</summary><div class="stack mt">${list.map((p) => pendRow(p, p.level !== 'ok')).join('')}</div></details>`;
}
function navBadge(id) {
  if (id !== 'hoje') return '';
  const n = pendencias().filter((p) => p.level !== 'ok').length;
  return n ? `<span class="bdg">${n}</span>` : '';
}

/* Janela "O que falta", no máximo 2 vezes por dia (manhã e fim do dia) */
function maybePop() {
  const p = S.prefs || {};
  if (p.popups === false) return;
  const list = pendencias().filter((x) => x.level !== 'ok' || !p.calm);
  const urgent = list.filter((x) => x.level !== 'ok');
  if (!urgent.length) return;
  const key = `${todayStr()}:${new Date().getHours() >= 17 ? 'pm' : 'am'}`;
  if (p.popAt === key) return;
  S.prefs = Object.assign({}, S.prefs, { popAt: key }); save();
  const el = $('#pop'); if (!el) return;
  el.innerHTML = `<div class="sheet"><h2>O que falta</h2><div class="small">Sem pressa. Por ordem do que é mais urgente.</div>
    <div class="stack mt">${list.slice(0, 5).map((x) => pendRow(x, x.level !== 'ok')).join('')}</div>
    <div class="row mt"><button class="btn ghost small" data-a="popClose">Mais tarde</button></div></div>`;
  el.hidden = false;
}

function popSettingCard() {
  const on = !(S.prefs && S.prefs.popups === false);
  return `<div class="card"><div class="between"><div><h2>Lembretes ao abrir</h2><div class="small">Uma janela com o que falta preencher, de manhã e ao fim do dia.</div></div>
    <button class="btn small ${on ? 'mint' : ''}" data-a="popToggle">${on ? 'Ligado' : 'Desligado'}</button></div></div>`;
}

Object.assign(A, {
  fillDay: (d) => { const [date, focus] = String(d.v).split('|'); ui.tab = 'saude'; ui.sub = 'registo'; ui.regDate = date === todayStr() ? null : date; ui.focus = focus; render(); },
  goWeight: () => { ui.tab = 'progresso'; ui.hsub = 'fotos'; ui.focus = 'kg'; render(); },
  popClose: () => { const el = $('#pop'); if (el) el.hidden = true; },
  popToggle: () => { S.prefs = Object.assign({}, S.prefs, { popups: (S.prefs && S.prefs.popups === false) ? true : false }); save(); render(); }
});
document.addEventListener('click', (e) => {
  if (e.target.closest('#pop [data-a]')) setTimeout(() => { const el = $('#pop'); if (el) el.hidden = true; }, 0);
});
