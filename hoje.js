'use strict';

/* ============================================================
   Maré · ecrãs simples: Hoje, Eu
   Pensados para pouca energia e hipersensibilidade:
   uma coisa de cada vez, muito espaço, nada a piscar.
   ============================================================ */

const greet = () => { const h = new Date().getHours(); return h < 5 ? 'Boa noite' : h < 13 ? 'Bom dia' : h < 20 ? 'Boa tarde' : 'Boa noite'; };

VIEWS.hoje = function () {
  const idx = todayIdx(), today = todayStr(), hh = H(), calm = !!(S.prefs && S.prefs.calm);
  let o = `<div class="hello"><div class="big">${greet()}</div><div class="sub">${DAYS_LONG[idx]}, ${fmtShort(today)}</div></div>`;

  // 1) Como estás? (carinhas + lugar)
  o += quickCard();

  // 2) O que falta (no máximo 2; o resto fica numa gaveta)
  const pend = pendencias().filter((p) => p.level !== 'ok');
  if (pend.length) {
    o += `<div class="card"><h2>Para hoje</h2><div class="stack mt">${pend.slice(0, 2).map((p) => pendRow(p, true)).join('')}</div>`;
    if (pend.length > 2) o += `<details class="mt"><summary class="small">Ver mais ${pend.length - 2}</summary><div class="stack mt">${pend.slice(2).map((p) => pendRow(p, true)).join('')}</div></details>`;
    o += `</div>`;
  }

  // 3) Dia difícil
  const hb = typeof healthBanner === 'function' ? healthBanner() : '';
  if (hb) o += hb;

  // 4) Treino do dia (ou recuperação)
  if (recoveryOn()) o += recoveryCard();
  else {
    const p = S.weekplans[weekStart(0)], gid = p && p.set ? p.days[idx] : null, g = gid ? GROUPS[gid] : null, ci = S.checkins[today] || {};
    if (!g) o += `<div class="card"><h2>Esta semana</h2><div class="small">Ainda não escolheste a maré da semana. Leva 20 segundos.</div><div class="mt"><button class="btn ghost small" data-a="tab" data-v="semana">Escolher a maré</button></div></div>`;
    else {
      const w = g.workout ? WORKOUTS.find((x) => x.id === g.workout) : null;
      o += `<div class="card"><div class="label" style="color:${g.color}">Movimento de hoje</div><div class="big" style="color:${g.color}">${esc(g.label)}</div>`;
      if (gid === 'descanso') o += `<div class="small mt">Dia de descanso. Só alongar, se te apetecer.</div>`;
      if (gid === 'caminhada') o += `<div class="small mt">30 a 45 minutos a caminhar, de preferência junto à água ou na natureza.</div>`;
      if (w && typeof workoutHint === 'function') o += workoutHint(w);
      o += `<div class="row mt">${w ? `<button class="btn small" data-a="openTimer" data-id="${w.id}">Começar</button>` : ''}${gid !== 'descanso' ? `<button class="btn ${ci.done ? 'mint' : 'ghost'} small" data-a="toggleDone">${ci.done ? '✓ Feito' : 'Marcar como feito'}</button>` : ''}</div></div>`;
    }
  }

  // 5) Agenda
  o += agendaCard();

  // 6) Resumo da semana (domingo e segunda)
  o += reportCard();
  return o;
};

VIEWS.eu = function () {
  const item = (ic, t, d, a, v) => `<button class="hub" data-a="${a}" data-v="${v}"><span class="ic">${ic}</span><span><strong>${t}</strong><span class="small" style="display:block">${d}</span></span><span class="chev">›</span></button>`;
  const calm = !!(S.prefs && S.prefs.calm), on = !(S.prefs && S.prefs.popups === false);
  let o = `<div class="sub">Tudo o resto está aqui, quando precisares.</div><div class="stack">`;
  o += item('📈', 'Como tenho estado', 'Gráficos, dia a dia e peso', 'tab', 'progresso');
  o += item('📝', 'Registo completo', 'Sono, sintomas, notas', 'goReg', 'manha');
  o += item('🌙', 'Ciclo e pílula', 'Blister, menstruação, literacia', 'goSub', 'ciclo');
  o += item('💊', 'Medicação e consultas', 'Receitas, exames, ficha de emergência', 'goSub', 'mais');
  o += item('🦴', 'Fisioterapia', 'Perguntas, notas e exercícios', 'goSub', 'fisio');
  o += item('🌊', 'Treinos', 'Timers e movimento suave', 'tab', 'treinos');
  o += `</div>`;
  o += `<div class="card"><h2>Ajustes</h2><div class="stack mt">
    <div class="between"><div><strong>Modo calmo</strong><div class="small">Menos cor, sem sons nem animações.</div></div><button class="btn small ${calm ? 'mint' : 'ghost'}" data-a="calm">${calm ? 'Ligado' : 'Desligado'}</button></div>
    <div class="between"><div><strong>Janela "O que falta"</strong><div class="small">Ao abrir, de manhã e ao fim do dia.</div></div><button class="btn small ${on ? 'mint' : 'ghost'}" data-a="popToggle">${on ? 'Ligada' : 'Desligada'}</button></div>
    <div class="between"><div><strong>Guardar cópia</strong><div class="small">Tudo, para o Drive, email ou outro aparelho.</div></div><button class="btn small ghost" data-a="export">Guardar</button></div>
    <label class="btn ghost small" style="cursor:pointer;text-align:center">Restaurar cópia<input type="file" accept="application/json" data-c="import" hidden></label></div></div>`;
  return o;
};
