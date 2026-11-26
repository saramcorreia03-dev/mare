'use strict';

/* ============================================================
   Maré · Saúde
   Este ficheiro NÃO tem dados pessoais. Tudo o que registares
   (sintomas, medicação, consultas, ficha) fica só no teu aparelho,
   dentro de localStorage, e sai apenas se exportares a cópia de segurança.
   Não é diagnóstico: serve para veres padrões e levares à tua médica.
   ============================================================ */

const SYMPTOMS = ['Enxaqueca', 'Tosse ou pieira', 'Cólicas', 'Dormência ou formigueiro', 'Dor de barriga',
  'Cansaço fora do normal', 'Tontura', 'Sensibilidade a sons ou luz'];
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
  ['alerg', 'Alergias e reações', 3], ['notas', 'Outras notas', 2]
];

/* ---------- Estado ---------- */
function H() {
  const base = { logs: {}, meds: [], appts: [], recovery: false, inhalerReminder: false, emerg: {}, alarms: DEFAULT_ALARMS };
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
function ensureLog() {
  const h = H(), t = todayStr();
  if (!h.logs[t]) h.logs[t] = { sym: [], meds: {} };
  const l = h.logs[t]; if (!l.sym) l.sym = []; if (!l.meds) l.meds = {};
  return l;
}
function hardDay(l) {
  if (!l) return false;
  return (l.pain != null && l.pain >= 6) || (l.energy != null && l.energy <= 3) || (l.sleep != null && l.sleep !== '' && l.sleep < 5) ||
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

/* ---------- Cartões na página Hoje ---------- */
function healthBanner() {
  const h = H(), l = h.logs[todayStr()];
  let o = '';
  const filled = l && (l.pain != null || l.energy != null || l.mood != null);
  if (!filled) {
    o += `<div class="card"><div class="between"><div><strong>Como estás hoje?</strong><div class="small">Registo de 10 segundos.</div></div><button class="btn small" data-a="tab" data-v="saude">Registar</button></div></div>`;
  } else if (hardDay(l) && !h.recovery) {
    o += `<div class="card warn"><strong>Hoje o corpo pede maré baixa.</strong><div class="small">Caminhada leve e mobilidade chegam. Queres só os treinos suaves?</div><div class="mt"><button class="btn small" data-a="recovery" data-v="1">Ligar modo recuperação</button></div></div>`;
  }
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
    `Inalador usado ${nums('inhaler').reduce((a, b) => a + b, 0)} vez(es) no total.`];
  SYMPTOMS.forEach((s) => { const n = cnt(s); if (n) lines.push(`${s}: ${n} dia(s).`); });
  return lines.join('\n');
}

/* ---------- Ecrã Saúde ---------- */
VIEWS.saude = function () {
  const h = H(), l = h.logs[todayStr()] || { sym: [], meds: {} };
  const val = (k) => (l[k] == null || l[k] === '' ? '—' : l[k]);
  const sl = (k, label) => `<div class="lbl"><span>${label}</span><b id="v-${k}">${val(k)}</b></div>
    <input class="range" type="range" min="0" max="10" step="1" value="${l[k] == null ? 5 : l[k]}" data-c="hlog" data-k="${k}" data-live="v-${k}" aria-label="${label}">`;

  let o = `<div class="sub">Fica só neste aparelho. Não é diagnóstico: serve para veres padrões e levares à tua médica.</div>`;

  o += `<div class="card"><h2>Como estás hoje</h2>
    ${sl('pain', 'Dor')}${sl('energy', 'Energia')}${sl('mood', 'Humor')}
    <div class="lbl"><span>Horas de sono</span></div>
    <input type="number" inputmode="decimal" step="0.5" min="0" max="16" placeholder="ex: 7" value="${l.sleep == null ? '' : l.sleep}" data-c="hlog" data-k="sleep">
    <div class="lbl"><span>Sinais de hoje</span></div>
    <div class="row">${SYMPTOMS.map((s) => pill(s, (l.sym || []).includes(s), 'sym', `data-v="${esc(s)}"`)).join('')}</div>
    <div class="lbl"><span>Inalador (vezes hoje)</span></div>
    <div class="row"><button class="btn ghost small" data-a="inhaler" data-v="-1">−</button><b>${l.inhaler || 0}</b><button class="btn ghost small" data-a="inhaler" data-v="1">+</button></div>
    <div class="lbl"><span>Nota</span></div>
    <textarea rows="2" data-c="hnote" placeholder="o que piorou ou melhorou">${esc(l.notes || '')}</textarea></div>`;

  o += `<div class="card ${h.recovery ? 'good' : ''}"><div class="between"><div><h2>Modo recuperação</h2><div class="small">Só caminhada e mobilidade suave. Os outros treinos ficam escondidos.</div></div>
    <button class="btn small ${h.recovery ? 'mint' : ''}" data-a="recovery" data-v="${h.recovery ? 0 : 1}">${h.recovery ? 'Ligado' : 'Ligar'}</button></div>
    <div class="row mt"><button class="pill${h.inhalerReminder ? ' on' : ''}" data-a="inhRem">Lembrar o inalador nos dias de treino</button></div></div>`;

  o += `<div class="card"><h2>Medicação</h2>`;
  if (!h.meds.length) o += `<div class="small">Ainda sem medicação. Junta abaixo, com o fim da receita para te avisar a tempo.</div>`;
  h.meds.forEach((m) => {
    let badge = '';
    if (isDate(m.end)) { const d = daysUntil(m.end); badge = d < 0 ? '<span class="badge">terminou</span>' : d <= 14 ? `<span class="badge soon">${d} d</span>` : ''; }
    o += `<div class="med"><div><strong>${esc(m.name)}</strong>${badge}<div class="small">${esc(m.dose || '')}${isDate(m.end) ? ` · até ${fmtShort(m.end)}` : ''}</div></div>
      <div class="row nowrap"><button class="chk${l.meds && l.meds[m.id] ? ' on' : ''}" data-a="medTaken" data-id="${m.id}" aria-label="Tomada hoje">✓</button><button class="x" data-a="delMed" data-id="${m.id}" aria-label="Apagar">×</button></div></div>`;
  });
  o += `<div class="stack mt"><input type="text" id="hm-name" placeholder="Medicamento"><input type="text" id="hm-dose" placeholder="Dose e horas (ex: 1 comprimido às 8h)">
    <label class="small">Fim da receita (opcional)</label><input type="date" id="hm-end"><button class="btn small" data-a="addMed">Adicionar</button></div></div>`;

  const appts = [...h.appts].sort((a, b) => String(a.date).localeCompare(String(b.date)));
  o += `<div class="card"><h2>Consultas e vigilâncias</h2>`;
  if (!appts.length) o += `<div class="small">Exames, consultas, análises a repetir. Cada um pode ir para o teu calendário.</div>`;
  appts.forEach((a) => {
    const past = isDate(a.date) && daysUntil(a.date) < 0;
    o += `<div class="med" style="${past ? 'opacity:.5' : ''}"><div><strong>${esc(a.title)}</strong><div class="small">${isDate(a.date) ? fmtShort(a.date) : 'sem data'}</div></div>
      <div class="row nowrap">${isDate(a.date) ? `<button class="btn ghost small" data-a="ics" data-id="${a.id}">Calendário</button>` : ''}<button class="x" data-a="delAppt" data-id="${a.id}" aria-label="Apagar">×</button></div></div>`;
  });
  o += `<div class="stack mt"><input type="text" id="ha-title" placeholder="Ex: ecocardiograma"><input type="date" id="ha-date"><button class="btn small" data-a="addAppt">Adicionar</button></div></div>`;

  o += `<div class="card note"><h2>Sinais de alarme</h2><textarea rows="4" data-c="alarms">${esc(h.alarms)}</textarea><div class="small mt">Podes editar com o que a tua médica te disse.</div></div>`;

  o += `<div class="card"><h2>Resumo para a consulta</h2><textarea rows="7" readonly id="summary">${esc(summaryText())}</textarea>
    <div class="row mt"><button class="btn ghost small" data-a="copySummary">Copiar</button></div></div>`;

  o += `<div class="card"><h2>Ficha de emergência</h2><div class="small">Para imprimires ou guardares em PDF.</div>
    <div class="stack mt">${EMERG_FIELDS.map(([k, label, rows]) => `<label class="small">${label}</label>${rows === 1
      ? `<input type="text" data-c="emerg" data-k="${k}" value="${esc(h.emerg[k] || '')}">`
      : `<textarea rows="${rows}" data-c="emerg" data-k="${k}">${esc(h.emerg[k] || '')}</textarea>`}`).join('')}
    <button class="btn small" data-a="printSheet">Imprimir ou guardar PDF</button></div></div>`;

  o += `<div class="card"><h2>Trazer do dashboard de saúde</h2><div class="small">Escolhe o ficheiro de cópia de segurança do dashboard. Registos, ficha e vigilâncias com data passam para aqui, só neste aparelho.</div>
    <div class="row mt"><label class="btn ghost small" style="cursor:pointer;display:inline-block">Escolher ficheiro<input type="file" accept="application/json" data-c="impDash" hidden></label></div>
    <div class="small mt">Dica: em Progresso, exporta os dados de vez em quando e guarda o ficheiro no teu Drive.</div></div>`;
  return o;
};

/* ---------- Ações ---------- */
Object.assign(A, {
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
          if (e.arm != null || e.neck != null) l.pain = Math.max(+e.arm || 0, +e.neck || 0);
          if (e.sleep != null && e.sleep !== '') l.sleep = +e.sleep;
          if (+e.migInt > 0 && !l.sym.includes('Enxaqueca')) l.sym.push('Enxaqueca');
          if (+e.cramp > 0 && !l.sym.includes('Cólicas')) l.sym.push('Cólicas');
          if (e.notes && !l.notes) l.notes = String(e.notes);
          h.logs[date] = l; nDays++;
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
render();
