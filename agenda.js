'use strict';

/* ============================================================
   Maré · Agenda
   Compromissos (aulas, fisioterapia, consultas, prazos) que importas
   de um ficheiro. Ficam só no aparelho. Sem dados pessoais no código.
   ============================================================ */

const KIND_ICON = { fisio: '🩺', consulta: '🩺', aula: '🎓', prazo: '⏰', pessoal: '✨', viagem: '✈️', outro: '•' };
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
  return `<div class="between"><div><span>${KIND_ICON[e.kind] || '•'} ${esc(e.title)}</span>${e.place ? `<div class="small">${esc(e.place)}</div>` : ''}</div><span class="small" style="white-space:nowrap">${when}</span></div>`;
}

function agendaCard() {
  if (!agendaAll().length) return '';
  const t = todayStr(), evs = agendaFor(t), nx = agendaFor(addD(t, 1));
  let o = `<div class="card"><h2>Agenda de hoje</h2>`;
  o += evs.length ? `<div class="stack">${evs.map(evLine).join('')}</div>` : `<div class="small">Sem compromissos. Dia livre.</div>`;
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

function weekAgenda() {
  const k = weekStart(ui.weekOffset); let o = '', any = false;
  for (let i = 0; i < 7; i++) {
    const evs = agendaFor(addD(k, i)); if (!evs.length) continue; any = true;
    o += `<div class="mt"><div class="label">${DAYS[i]} ${fmtShort(addD(k, i))}</div><div class="stack mt">${evs.map(evLine).join('')}</div></div>`;
  }
  return any ? `<div class="card"><h2>Agenda da semana</h2>${o}</div>` : '';
}

Object.assign(A, {
  repeatWeek: () => {
    const prev = weekStart(ui.weekOffset - 1), k = weekStart(ui.weekOffset);
    if (!S.weekplans[prev] && !S.mealplans[prev]) { toast('Não há semana anterior para repetir'); return; }
    if (S.weekplans[prev]) S.weekplans[k] = Object.assign(JSON.parse(JSON.stringify(S.weekplans[prev])), { set: true });
    if (S.mealplans[prev]) S.mealplans[k] = JSON.parse(JSON.stringify(S.mealplans[prev]));
    save(); render(); toast('Semana anterior repetida');
  }
});

Object.assign(C, {
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
