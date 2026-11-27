'use strict';

/* ============================================================
   Maré · O que estou a acompanhar
   Lista tua, que muda com a vida: acrescentas, mudas, dás por "já passou".
   Nada se perde: os dados ficam no arquivo e nos gráficos.
   ============================================================ */

const ZONES = ['Geral', 'Cabeça', 'Pescoço', 'Ombro', 'Braço esquerdo', 'Braço direito', 'Mãos e dedos', 'Peito', 'Costas', 'Lombar', 'Barriga', 'Pélvis', 'Pernas', 'Pés'];
const GEN_WORDS = ['Nada', 'Pouca', 'Média', 'Muita', 'Imensa'];
const TYPES = [['scale', 'Escala de 5'], ['yn', 'Sim ou não'], ['event', 'Quando acontece']];

function trackList() {
  const h = H();
  if (!Array.isArray(h.track)) {
    const first = Object.keys(h.logs).sort()[0] || todayStr();
    h.track = [
      { id: 'pain', name: 'Dor', zone: 'Geral', type: 'scale', legacy: 'pain', start: first, end: null },
      { id: 'mig', name: 'Enxaqueca', zone: 'Cabeça', type: 'scale', legacy: 'mig', start: first, end: null }
    ];
  }
  return h.track;
}
const trackActive = () => trackList().filter((t) => !t.end);
const trackTitle = (t) => t.name + (t.zone && t.zone !== 'Geral' && !t.name.toLowerCase().includes(t.zone.toLowerCase()) ? ` · ${t.zone.toLowerCase()}` : '');

/* estado de um item no registo de um dia: índice 0-4, 0/1, ou -1 */
function trkState(it, l) {
  if (it.legacy) { const q = SCALES.find((s) => s.k === it.legacy); return q ? scIdx(l, q) : -1; }
  const v = (l.t || {})[it.id]; return v == null ? -1 : v;
}
function trkRow(it, l) {
  const s = trkState(it, l), tt = trackTitle(it);
  if (it.type === 'event') return `<div class="between sc"><span>${esc(tt)}</span><button class="pill${s === 1 ? ' on' : ''}" data-a="trk" data-id="${it.id}" data-i="${s === 1 ? 0 : 1}">${s === 1 ? '✓ Aconteceu' : 'Aconteceu hoje'}</button></div>`;
  if (it.type === 'yn') return `<div class="between sc"><span>${esc(tt)}</span><span class="opts"><button class="pill${s === 1 ? ' on' : ''}" data-a="trk" data-id="${it.id}" data-i="1">Sim</button> <button class="pill${s === 0 ? ' on' : ''}" data-a="trk" data-id="${it.id}" data-i="0">Não</button></span></div>`;
  const words = it.legacy === 'mig' ? ['Nada', 'Leve', 'Média', 'Forte', 'Imensa'] : GEN_WORDS;
  return `<div class="sc"><div class="between"><span>${esc(tt)}</span><span class="small">${s >= 0 ? words[s] : 'por responder'}</span></div>
    <div class="dots">${words.map((w, i) => `<button class="d5${s === i ? ' on' : ''}" style="--f:${i + 1}" data-a="trk" data-id="${it.id}" data-i="${i}" aria-label="${esc(tt)}: ${w}"></button>`).join('')}</div></div>`;
}
A.trk = (d) => {
  const it = trackList().find((x) => x.id === d.id); if (!it) return; const l = ensureLog(), i = +d.i;
  if (it.legacy) return A.sc({ k: it.legacy, i });
  l.t = l.t || {}; if (it.type === 'event' && i === 0) delete l.t[it.id]; else l.t[it.id] = i;
  save(); render();
};

/* ---------- Ecrã de gestão ---------- */
const acHeader = (t) => `<div class="sub">${t}</div>`;
VIEWS.acomp = function () {
  const all = trackList(), act = all.filter((t) => !t.end), arch = all.filter((t) => t.end), t0 = todayStr();
  let o = acHeader('Aqui decides o que a app te pergunta, para além do básico (sono, energia, humor, stress, sobrecarga). Muda quando a tua vida mudar.');
  o += `<div class="stack">`;
  act.forEach((it) => {
    const due = dDiff(it.start, t0) >= 30 && (!it.rev || dDiff(it.rev, t0) >= 30);
    o += `<div class="card"><div class="between"><strong>${esc(trackTitle(it))}</strong><span class="small">desde ${fmtShort(it.start)}</span></div>
      ${due ? `<div class="small mt" style="color:var(--accent-ink)">Já passou um mês. Ainda estás a acompanhar isto?</div>` : ''}
      <div class="stack mt"><input type="text" id="tn-${it.id}" value="${esc(it.name)}" aria-label="Nome">
      <select id="tz-${it.id}" aria-label="Zona do corpo">${ZONES.map((z) => `<option${it.zone === z ? ' selected' : ''}>${z}</option>`).join('')}</select>
      ${it.legacy ? '' : `<select id="tt-${it.id}" aria-label="Tipo de resposta">${TYPES.map(([v, lb]) => `<option value="${v}"${it.type === v ? ' selected' : ''}>${lb}</option>`).join('')}</select>`}
      <div class="row"><button class="btn small" data-a="trkSave" data-id="${it.id}">Guardar</button>${due ? `<button class="btn ghost small" data-a="trkKeep" data-id="${it.id}">Continua</button>` : ''}<button class="btn ghost small" data-a="trkEnd" data-id="${it.id}">Já passou</button></div></div></div>`;
  });
  if (!act.length) o += `<div class="card"><div class="small">Nada a acompanhar neste momento.</div></div>`;
  o += `</div><div class="card"><h2>Acrescentar</h2><div class="stack mt"><input type="text" id="tn-new" placeholder="O que queres acompanhar? (ex: Dor, Formigueiro, Tonturas)">
    <select id="tz-new">${ZONES.map((z) => `<option>${z}</option>`).join('')}</select>
    <select id="tt-new">${TYPES.map(([v, lb]) => `<option value="${v}">${lb}</option>`).join('')}</select>
    <button class="btn small" data-a="trkAdd">Acrescentar</button></div></div>`;
  if (arch.length) o += `<div class="card"><h2>Arquivo</h2><div class="small">Já passou. Os dados continuam guardados.</div><div class="stack mt">${arch.map((it) => `<div class="between"><div><strong>${esc(trackTitle(it))}</strong><div class="small">${fmtShort(it.start)} a ${fmtShort(it.end)}</div></div><button class="btn ghost small" data-a="trkBack" data-id="${it.id}">Reativar</button></div>`).join('')}</div></div>`;
  return o;
};
const trkGet = (id) => trackList().find((x) => x.id === id);
Object.assign(A, {
  goTrack: () => { ui.tab = 'acomp'; window.scrollTo(0, 0); render(); },
  trkSave: (d) => { const it = trkGet(d.id); if (!it) return; const n = ($('#tn-' + d.id).value || '').trim(); if (n) it.name = n; it.zone = $('#tz-' + d.id).value; const t = $('#tt-' + d.id); if (t) it.type = t.value; save(); render(); toast('Guardado'); },
  trkKeep: (d) => { const it = trkGet(d.id); if (it) { it.rev = todayStr(); save(); render(); } },
  trkEnd: (d) => { const it = trkGet(d.id); if (it) { it.end = todayStr(); save(); render(); toast('Foi para o arquivo'); } },
  trkBack: (d) => { const it = trkGet(d.id); if (it) { it.end = null; it.rev = todayStr(); save(); render(); } },
  trkAdd: () => { const n = ($('#tn-new').value || '').trim(); if (!n) { toast('Escreve o nome'); return; } trackList().push({ id: newId(), name: n, zone: $('#tz-new').value, type: $('#tt-new').value, start: todayStr(), end: null }); save(); render(); toast('Acrescentado'); }
});
TABS.push({ id: 'acomp', label: 'A acompanhar', title: 'O que estou a acompanhar', hidden: true });
