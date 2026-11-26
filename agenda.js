'use strict';

/* ============================================================
   Maré · Agenda
   Compromissos (aulas, fisioterapia, consultas, prazos) que importas
   de um ficheiro. Ficam só no aparelho. Sem dados pessoais no código.
   ============================================================ */

const KIND_ICON = { fisio: '🩺', consulta: '🩺', aula: '🎓', trabalho: '💼', prazo: '⏰', pessoal: '✨', viagem: '✈️', deslocacao: '🚗', outro: '•' };
const KIND_LABEL = { aula: 'Aulas', trabalho: 'Trabalho', prazo: 'Prazos e entregas', consulta: 'Consultas', fisio: 'Fisioterapia', viagem: 'Viagens', deslocacao: 'Deslocações', pessoal: 'Pessoal', outro: 'Outros' };
const DEFAULT_W = { aula: 3, trabalho: 3, prazo: 3, consulta: 1, fisio: 1, viagem: 2, deslocacao: 1, pessoal: 0, outro: 1 };
const W_LABEL = ['Sem peso', 'Leve', 'Médio', 'Pesado'];
const LEVELS = { leve: ['Leve', 'var(--sage-ink)'], media: ['Média', 'var(--accent-ink)'], pesada: ['Pesada', 'var(--terra-ink)'] };
const evKey = (e) => `${e.date}|${e.start || ''}|${e.title}`;
function weightOf(e) {
  const p = S.prefs || {}, o = p.evW && p.evW[evKey(e)];
  if (o != null) return o;
  const k = p.kindW && p.kindW[e.kind]; return k != null ? k : (DEFAULT_W[e.kind] != null ? DEFAULT_W[e.kind] : 1);
}
function dayLoad(date) {
  const evs = agendaFor(date); let score = 0;
  const timed = evs.filter((e) => e.start && e.end).map((e) => [toMin(e.start), toMin(e.end), weightOf(e)]).sort((a, b) => a[0] - b[0]);
  evs.forEach((e) => { const dur = e.start && e.end ? Math.min(3, Math.max(0.5, (toMin(e.end) - toMin(e.start)) / 60)) : 1; score += weightOf(e) * dur; });
  for (let i = 1; i < timed.length; i++) if (timed[i][2] >= 1 && timed[i - 1][2] >= 1 && timed[i][0] - timed[i - 1][1] < 30) score += 1;
  if (timed.some((t) => t[2] >= 2 && t[1] > 20 * 60)) score += 1;
  return { score: Math.round(score * 10) / 10, level: score >= 7 ? 'pesada' : score >= 3 ? 'media' : 'leve' };
}
const lvBadge = (lv) => `<span class="badge" style="background:${LEVELS[lv][1]};color:#fff;margin-left:0">${LEVELS[lv][0]}</span>`;
const dots = (w) => '●'.repeat(w) + '○'.repeat(3 - w);
const agendaAll = () => (Array.isArray(S.agenda) ? S.agenda : []);
const agendaFor = (date) => agendaAll().filter((e) => e.date === date).sort((a, b) => String(a.start || '').localeCompare(String(b.start || '')));
const toMin = (t) => { const [h, m] = String(t).split(':').map(Number); return h * 60 + (m || 0); };
const fmtMin = (m) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;

/* Primeira janela livre do dia, com 30 min de folga à volta dos compromissos */
function freeSlot(date, need) {
  const busy = agendaFor(date).filter((e) => e.start && e.end).map((e) => [toMin(e.start) - 30, toMin(e.end) + 30]).sort((a, b) => a[0] - b[0]);
  let t = 9 * 60 + 30;
  if (date === todayStr()) { const n = new Date(); t = Math.max(t, Math.ceil((n.getHours() * 60 + n.getMinutes() + 15) / 15) * 15); }
  for (const [s, e] of busy) { if (t + need <= s) break; if (e > t) t = e; }
  t = Math.ceil(t / 15) * 15;
  return t + need <= 21 * 60 ? [t, t + need] : null;
}

function evLine(e) {
  const when = e.start ? `${e.start}${e.end ? '–' + e.end : ''}` : 'dia todo';
  return `<div class="between"><div><span>${KIND_ICON[e.kind] || '•'} ${esc(e.title)}</span>${e.place ? `<div class="small">${esc(e.place)}</div>` : ''}</div>
    <div class="row nowrap"><span class="small" style="white-space:nowrap">${when}</span><button class="link" style="letter-spacing:1px;text-decoration:none;color:var(--terra-ink)" data-a="evW" data-k="${esc(evKey(e))}" aria-label="Peso do compromisso">${dots(weightOf(e))}</button></div></div>`;
}

function agendaCard() {
  if (!agendaAll().length) return '';
  const t = todayStr(), evs = agendaFor(t), nx = agendaFor(addD(t, 1));
  const lv = dayLoad(t).level;
  let o = `<div class="card"><div class="between"><h2>Agenda de hoje</h2>${evs.length ? lvBadge(lv) : ''}</div>`;
  o += evs.length ? `<div class="stack">${evs.map(evLine).join('')}</div>` : `<div class="small">Sem compromissos. Dia livre.</div>`;
  if (evs.length) o += `<div class="small mt">Os pontos mostram o peso de cada compromisso. Toca para mudar.</div>`;
  if (nx.length) o += `<div class="small mt">Amanhã: ${esc(nx[0].start || '')} ${esc(nx[0].title)}${nx.length > 1 ? ` e mais ${nx.length - 1}` : ''}.</div>`;
  return o + `</div>`;
}

function workoutHint(w) {
  if (!agendaAll().length || !w) return '';
  const mins = Math.round(buildSeq(w).reduce((a, s) => a + s.d, 0) / 60), s = freeSlot(todayStr(), mins + 15);
  return s ? `<div class="small mt">Boa hora para treinar hoje: <b>${fmtMin(s[0])}</b> às ${fmtMin(s[1])}.</div>` : `<div class="small mt">Hoje não há janela boa para este treino. Uma caminhada curta também conta.</div>`;
}

function agendaTag(i) {
  const n = agendaFor(addD(weekStart(ui.weekOffset), i)).length;
  return n ? `<em class="small" style="font-style:normal;white-space:nowrap">${n} comp.</em>` : '';
}

function weekLoad(off) {
  const k = weekStart(off), days = [];
  for (let i = 0; i < 7; i++) days.push(dayLoad(addD(k, i)));
  const total = days.reduce((a, d) => a + d.score, 0), heavy = days.filter((d) => d.level === 'pesada').length;
  const level = heavy >= 2 || total >= 20 ? 'pesada' : heavy === 1 || total >= 10 ? 'media' : 'leve';
  return { days, total, heavy, level };
}

function loadCard() {
  if (!agendaAll().length) return '';
  const w = weekLoad(ui.weekOffset);
  const txt = w.level === 'pesada' ? `Semana pesada: ${w.heavy} dia(s) pesado(s). Vale a pena aliviar a maré e proteger as pausas.`
    : w.level === 'media' ? 'Semana com carga média. Mantém espaço para descansar.' : 'Semana leve. Boa altura para treinar com vontade.';
  return `<div class="card ${w.level === 'pesada' ? 'warn' : ''}"><div class="between"><h2>Carga da semana</h2>${lvBadge(w.level)}</div>
    <div class="row nowrap mt">${w.days.map((d, i) => `<div style="flex:1;text-align:center"><div class="small">${DAYS[i]}</div><div style="height:6px;border-radius:4px;margin-top:4px;background:${LEVELS[d.level][1]};opacity:${d.level === 'leve' ? .35 : d.level === 'media' ? .7 : 1}"></div></div>`).join('')}</div>
    <div class="small mt">${txt}</div>
    ${w.level !== 'leve' ? `<div class="mt"><button class="btn small" data-a="mode" data-v="${w.level === 'pesada' ? 'baixa' : 'media'}">Sugerir maré ${w.level === 'pesada' ? 'baixa' : 'média'}</button></div>` : ''}</div>`;
}

/* Como te sentes nos dias mais pesados */
function loadInsights() {
  const rows = [];
  Object.entries(H().logs).forEach(([date, l]) => {
    if (!agendaFor(date).length) return;
    const lv = dayLoad(date).level, nxt = H().logs[addD(date, 1)];
    rows.push({ heavy: lv === 'pesada', l, nxt });
  });
  const hv = rows.filter((r) => r.heavy), ot = rows.filter((r) => !r.heavy);
  const out = { n: rows.length, hv: hv.length, items: [] };
  if (hv.length < 3 || ot.length < 3) return out;
  const avg = (arr, f) => { const v = arr.map(f).filter((x) => x != null && x !== '' && !isNaN(x)).map(Number); return v.length >= 3 ? v.reduce((a, b) => a + b, 0) / v.length : null; };
  [['Stress', (r) => r.l.stress, 1], ['Sobrecarga', (r) => r.l.overload, 1], ['Humor', (r) => r.l.mood, -1], ['Energia', (r) => r.l.energy, -1],
    ['Sono na noite seguinte', (r) => r.nxt && r.nxt.sleepQ, -1], ['Dor', (r) => r.l.pain, 1]].forEach(([label, f, dir]) => {
    const a = avg(hv, f), b = avg(ot, f); if (a == null || b == null) return;
    if ((a - b) * dir >= 1) out.items.push(`${label} ${dir > 0 ? 'mais alto' : 'mais baixo'} nos dias pesados (${a.toFixed(1).replace('.', ',')} contra ${b.toFixed(1).replace('.', ',')}).`);
  });
  return out;
}

function loadInsightsCard() {
  const r = loadInsights();
  let o = `<div class="card"><h2>Carga da agenda e como te sentes</h2>`;
  if (r.hv < 3) o += `<div class="small">Precisa de uns dias pesados com registo para perceber o teu padrão. Por agora há ${r.n} dia(s) com agenda e registo.</div>`;
  else if (r.items.length) o += `<div class="stack">${r.items.map((t) => `<div>• ${esc(t)}</div>`).join('')}</div><div class="small mt">Padrões nos teus registos, não certezas.</div>`;
  else o += `<div class="small">Ainda não se vê diferença clara entre dias pesados e leves.</div>`;
  return o + `</div>`;
}

function weightsCard() {
  const kinds = Object.keys(KIND_LABEL), kw = (S.prefs && S.prefs.kindW) || {};
  return `<div class="card"><h2>Peso dos compromissos</h2><div class="small">Quanto cada tipo te pesa. Conta para a carga do dia e da semana.</div><div class="stack mt">${kinds.map((k) =>
    `<label class="dayrow"><span style="width:130px">${KIND_ICON[k]} ${KIND_LABEL[k]}</span><select data-c="kindW" data-k="${k}">${W_LABEL.map((lb, i) => `<option value="${i}"${(kw[k] != null ? kw[k] : DEFAULT_W[k]) === i ? ' selected' : ''}>${lb}</option>`).join('')}</select></label>`).join('')}</div></div>`;
}

function weekAgenda() {
  const k = weekStart(ui.weekOffset); let o = '', any = false;
  for (let i = 0; i < 7; i++) {
    const evs = agendaFor(addD(k, i)); if (!evs.length) continue; any = true;
    o += `<div class="mt"><div class="label">${DAYS[i]} ${fmtShort(addD(k, i))}</div><div class="stack mt">${evs.map(evLine).join('')}</div></div>`;
  }
  return any ? `<div class="card"><h2>Agenda da semana</h2>${o}</div>` : '';
}

Object.assign(A, {
  evW: (d) => { const p = (S.prefs = S.prefs || {}); p.evW = p.evW || {}; const ev = agendaAll().find((e) => evKey(e) === d.k); if (!ev) return; p.evW[d.k] = (weightOf(ev) + 1) % 4; save(); render(); },
  repeatWeek: () => {
    const prev = weekStart(ui.weekOffset - 1), k = weekStart(ui.weekOffset);
    if (!S.weekplans[prev] && !S.mealplans[prev]) { toast('Não há semana anterior para repetir'); return; }
    if (S.weekplans[prev]) S.weekplans[k] = Object.assign(JSON.parse(JSON.stringify(S.weekplans[prev])), { set: true });
    if (S.mealplans[prev]) S.mealplans[k] = JSON.parse(JSON.stringify(S.mealplans[prev]));
    save(); render(); toast('Semana anterior repetida');
  }
});

Object.assign(C, {
  kindW: (el) => { const p = (S.prefs = S.prefs || {}); p.kindW = p.kindW || {}; p.kindW[el.dataset.k] = +el.value; save(); render(); },
  impAgenda: (el) => {
    const f = el.files && el.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const data = JSON.parse(r.result), list = Array.isArray(data) ? data : data.agenda;
        if (!Array.isArray(list)) throw new Error('inválido');
        const cur = agendaAll(); let n = 0;
        list.forEach((e) => {
          if (!e || !isDate(e.date) || !e.title) return;
          if (cur.some((x) => x.date === e.date && x.start === e.start && x.title === e.title)) return;
          cur.push({ date: e.date, start: e.start || '', end: e.end || '', title: String(e.title), place: e.place || '', kind: KIND_ICON[e.kind] ? e.kind : 'outro' }); n++;
        });
        S.agenda = cur; save(); render(); toast(`Agenda: ${n} compromisso(s) novo(s)`);
      } catch (err) { toast('Ficheiro inválido'); }
    };
    r.readAsText(f);
  }
});
