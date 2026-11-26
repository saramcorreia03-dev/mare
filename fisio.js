'use strict';

/* ============================================================
   Maré · Fisioterapia
   Perguntas para a sessão, notas e os exercícios que o fisioterapeuta
   te passar, com visto diário e lembrete no calendário.
   Sem dados pessoais no código.
   ============================================================ */

const PHYSIO_QS = [
  'Que exercícios posso fazer em casa, e quais devo evitar por agora?',
  'Posso manter a caminhada? Quanto tempo e a que ritmo?',
  'Quando posso voltar a treinos de força, saltos, prancha e braços? Como progrido?',
  'Que sinais durante o exercício querem dizer que devo parar (dor, formigueiro, dormência)?',
  'Posso voltar às atividades desportivas que fazia? Que movimentos adaptar?',
  'Que postura e pausas devo fazer ao trabalhar no computador?',
  'Há alongamentos que devo evitar?',
  'Quantas sessões vou precisar, com que frequência, e como vamos medir se estou a melhorar?',
  'Preciso de algum exame ou de ver outro especialista?',
  'Como encaixo os exercícios na rotina, a que horas e durante quanto tempo?'
];
const BYDAY = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];

function PH() {
  const h = H();
  h.physio = Object.assign({ ex: [], notes: [], asked: {}, custom: [] }, h.physio || {});
  return h.physio;
}
const physioToday = () => {
  const i = todayIdx();
  return PH().ex.filter((e) => !e.days || !e.days.length || e.days.includes(i));
};

function physioBanner() {
  const list = physioToday(); if (!list.length) return '';
  const l = H().logs[todayStr()] || {}, done = l.physio || {};
  const left = list.filter((e) => !done[e.id]).length;
  return `<div class="card ${left ? 'note' : 'good'}"><div class="between"><strong>Fisioterapia de hoje</strong><span class="small">${left ? `faltam ${left}` : 'feito ✓'}</span></div>
    <div class="stack mt">${list.map((e) => `<div class="between"><div><div>${esc(e.name)}</div><div class="small">${esc(e.detail || '')}${e.time ? ` · ${esc(e.time)}` : ''}</div></div>
    <button class="chk${done[e.id] ? ' on' : ''}" data-a="physioDone" data-id="${e.id}" aria-label="Feito">✓</button></div>`).join('')}</div></div>`;
}

function fisioView() {
  const p = PH(), l = H().logs[todayStr()] || {}, done = l.physio || {};
  let o = `<div class="sub">O que o fisioterapeuta te pedir fica aqui, com lembrete. A app não substitui as indicações dele.</div>`;

  const qs = [...PHYSIO_QS, ...p.custom];
  o += `<div class="card"><h2>Perguntas para a sessão</h2><div class="small">Toca para marcar as que já fizeste.</div><div class="stack mt">${qs.map((q, i) =>
    `<button class="meal${p.asked[i] ? ' on' : ''}" data-a="asked" data-i="${i}"><span class="nm">${esc(q)}</span><span class="mt2">${p.asked[i] ? '✓' : ''}</span></button>`).join('')}</div>
    <div class="row nowrap mt"><input type="text" id="pq-new" placeholder="A tua pergunta"><button class="btn small" data-a="addQ">Juntar</button></div>
    <div class="small mt">Leva também a lista de medicação, os relatórios de exames e o resumo da consulta (em Mais).</div></div>`;

  o += `<div class="card"><h2>Notas da sessão</h2><textarea rows="4" id="pn-text" placeholder="o que ele disse, o que viu, o que combinaram"></textarea>
    <div class="mt"><button class="btn small" data-a="addNote">Guardar nota de hoje</button></div>`;
  [...p.notes].reverse().forEach((n, i) => {
    o += `<div class="med"><div><strong>${fmtShort(n.date)}</strong><div class="small" style="white-space:pre-wrap">${esc(n.text)}</div></div><button class="x" data-a="delNote" data-i="${p.notes.length - 1 - i}" aria-label="Apagar">×</button></div>`;
  });
  o += `</div>`;

  o += `<div class="card"><h2>Exercícios do fisioterapeuta</h2>`;
  if (!p.ex.length) o += `<div class="small">Ainda sem exercícios. Junta o que ele te pedir, com séries, hora e dias.</div>`;
  p.ex.forEach((e) => {
    const days = e.days && e.days.length && e.days.length < 7 ? e.days.map((d) => DAYS[d]).join(', ') : 'todos os dias';
    o += `<div class="med"><div><strong>${esc(e.name)}</strong><div class="small">${esc(e.detail || '')}${e.time ? ` · ${esc(e.time)}` : ''} · ${days}</div></div>
      <div class="row nowrap"><button class="chk${done[e.id] ? ' on' : ''}" data-a="physioDone" data-id="${e.id}" aria-label="Feito hoje">✓</button>
      <button class="btn ghost small" data-a="physioIcs" data-id="${e.id}">Calendário</button><button class="x" data-a="delEx" data-id="${e.id}" aria-label="Apagar">×</button></div></div>`;
  });
  o += `<div class="stack mt"><input type="text" id="px-name" placeholder="Exercício"><input type="text" id="px-detail" placeholder="Séries e repetições (ex: 3 x 10, devagar)">
    <label class="small">Hora do lembrete</label><input type="time" id="px-time" value="11:00">
    <label class="small">Dias</label><div class="row">${DAYS.map((d, i) => `<button class="pill on" data-a="pxDay" data-i="${i}" id="pxd-${i}">${d}</button>`).join('')}</div>
    <button class="btn small" data-a="addEx">Adicionar exercício</button></div></div>`;
  return o;
}

Object.assign(A, {
  asked: (d) => { const p = PH(); p.asked[d.i] = !p.asked[d.i]; save(); render(); },
  addQ: () => { const v = $('#pq-new').value.trim(); if (!v) return; PH().custom.push(v); save(); render(); },
  addNote: () => {
    const v = $('#pn-text').value.trim(); if (!v) { toast('Escreve a nota'); return; }
    PH().notes.push({ date: todayStr(), text: v }); save(); render(); toast('Nota guardada');
  },
  delNote: (d) => { PH().notes.splice(+d.i, 1); save(); render(); },
  pxDay: (d, el) => { el.classList.toggle('on'); },
  addEx: () => {
    const name = $('#px-name').value.trim(); if (!name) { toast('Escreve o nome do exercício'); return; }
    const days = DAYS.map((_, i) => i).filter((i) => $('#pxd-' + i).classList.contains('on'));
    PH().ex.push({ id: newId(), name, detail: $('#px-detail').value.trim(), time: $('#px-time').value || '', days: days.length === 7 ? [] : days });
    save(); render(); toast('Exercício guardado');
  },
  delEx: (d) => { const p = PH(); p.ex = p.ex.filter((e) => e.id !== d.id); save(); render(); },
  physioDone: (d) => { const l = ensureLog(); l.physio = l.physio || {}; l.physio[d.id] = !l.physio[d.id]; save(); render(); },
  physioIcs: (d) => {
    const e = PH().ex.find((x) => x.id === d.id); if (!e) return;
    const t = (e.time || '11:00').replace(':', '') + '00', day = todayStr().replace(/-/g, '');
    const end = (() => { const [hh, mm] = (e.time || '11:00').split(':').map(Number); const m = hh * 60 + mm + 15; return pad(Math.floor(m / 60) % 24) + pad(m % 60) + '00'; })();
    const by = e.days && e.days.length ? `;BYDAY=${e.days.map((i) => BYDAY[i]).join(',')}` : '';
    downloadFile('fisioterapia.ics', ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Mare//PT', 'BEGIN:VEVENT', `UID:${e.id}@mare`, `DTSTAMP:${day}T000000Z`,
      `DTSTART:${day}T${t}`, `DTEND:${day}T${end}`, `RRULE:FREQ=${by ? 'WEEKLY' : 'DAILY'}${by}`, `SUMMARY:Fisioterapia: ${e.name.replace(/[,;\r\n]/g, ' ')}`,
      `DESCRIPTION:${(e.detail || '').replace(/[,;\r\n]/g, ' ')}`, 'BEGIN:VALARM', 'TRIGGER:PT0M', 'ACTION:DISPLAY', 'DESCRIPTION:Fisioterapia', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n'), 'text/calendar');
  }
});
