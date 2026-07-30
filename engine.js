// ============================================================
// APOLO Pipeline Trainer — Engine
// Custom pointer-events drag & drop (works for mouse + touch)
// ============================================================

const state = {
  order: [],          // shuffled question order (we keep original order for narrative flow, but could shuffle)
  idx: 0,
  answered: false,
  score: 0,            // sum of fractional correctness (0..1) per question
  perfect: 0,           // count of fully-correct questions
  categoryStats: {},    // {category: {correct, total}}
  qState: null          // working state for current question (per-question data structures)
};

const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

function shuffle(arr){
  const a = arr.slice();
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]] = [a[j],a[i]];
  }
  return a;
}

// ---------------- START / NAV ----------------
$('#start-btn').addEventListener('click', () => {
  $('#start-screen').classList.add('hidden');
  $('#game-screen').classList.remove('hidden');
  buildRail();
  state.idx = 0;
  loadQuestion(0);
});

$('#restart-btn').addEventListener('click', () => {
  state.idx = 0; state.score = 0; state.perfect = 0; state.categoryStats = {};
  $('#end-screen').classList.add('hidden');
  $('#game-screen').classList.remove('hidden');
  buildRail();
  loadQuestion(0);
});

$('#reset-q-btn').addEventListener('click', () => {
  loadQuestion(state.idx, true);
});

$('#check-btn').addEventListener('click', checkAnswer);
$('#next-btn').addEventListener('click', () => {
  if(state.idx < QUESTIONS.length - 1){
    state.idx++;
    loadQuestion(state.idx);
  } else {
    showEnd();
  }
});

function buildRail(){
  const rail = $('#rail');
  rail.innerHTML = '';
  QUESTIONS.forEach((q,i)=>{
    const n = document.createElement('span');
    n.className = 'node';
    n.textContent = 'Q' + (i+1);
    n.dataset.i = i;
    rail.appendChild(n);
  });
}

function updateRail(){
  $$('#rail .node').forEach((n,i)=>{
    n.classList.toggle('active', i === state.idx);
    n.classList.toggle('done', i < state.idx);
  });
}

function updateProgress(){
  const pct = ((state.idx) / QUESTIONS.length) * 100;
  $('#progress-fill').style.width = pct + '%';
  $('#progress-label').textContent = (state.idx+1) + ' / ' + QUESTIONS.length;
  $('#score-badge').textContent = '✓ ' + state.perfect;
}

// ---------------- LOAD QUESTION ----------------
function loadQuestion(i, isReset){
  const q = QUESTIONS[i];
  state.answered = false;
  updateRail();
  updateProgress();

  $('#q-type-badge').textContent = q.type;
  $('#q-type-badge').className = 'q-type ' + q.type;
  $('#q-cat').textContent = q.category;
  $('#q-title').textContent = q.title;
  $('#q-prompt').innerHTML = q.prompt;

  $('#feedback').classList.remove('show','perfect','partial','zero');
  $('#check-btn').classList.remove('hidden');
  $('#check-btn').disabled = false;
  $('#next-btn').classList.add('hidden');

  const body = $('#q-body');
  body.innerHTML = '';

  if(q.type === 'order') renderOrder(q, body);
  else if(q.type === 'match') renderMatch(q, body);
  else if(q.type === 'sort') renderSort(q, body);
  else if(q.type === 'fillblank') renderFillblank(q, body);
}

// ============================================================
// DRAG ENGINE CORE
// ============================================================
let dragCtx = null;

function startDrag(e, chipEl, onDrop){
  if(state.answered) return;
  e.preventDefault();
  const rect = chipEl.getBoundingClientRect();
  const ghost = chipEl.cloneNode(true);
  ghost.classList.add('ghost');
  ghost.style.width = rect.width + 'px';
  ghost.style.left = (e.clientX) + 'px';
  ghost.style.top = (e.clientY) + 'px';
  document.body.appendChild(ghost);
  chipEl.classList.add('dragging');

  dragCtx = { chipEl, ghost, onDrop, lastHover:null };

  const move = (ev) => {
    const x = ev.clientX ?? (ev.touches && ev.touches[0].clientX);
    const y = ev.clientY ?? (ev.touches && ev.touches[0].clientY);
    ghost.style.left = x + 'px';
    ghost.style.top = y + 'px';
    ghost.style.display = 'none';
    const under = document.elementFromPoint(x,y);
    ghost.style.display = '';
    const zone = under ? under.closest('.dropzone') : null;
    if(dragCtx.lastHover && dragCtx.lastHover !== zone) dragCtx.lastHover.classList.remove('hover');
    if(zone) zone.classList.add('hover');
    dragCtx.lastHover = zone;
    dragCtx.lastX = x; dragCtx.lastY = y;
  };
  const up = (ev) => {
    document.removeEventListener('pointermove', move);
    document.removeEventListener('pointerup', up);
    ghost.remove();
    chipEl.classList.remove('dragging');
    if(dragCtx.lastHover) dragCtx.lastHover.classList.remove('hover');
    const x = dragCtx.lastX, y = dragCtx.lastY;
    let target = null;
    if(x !== undefined){
      const els = document.elementsFromPoint(x,y);
      target = els.find(el => el.classList && el.classList.contains('dropzone')) || null;
    }
    onDrop(target, x, y);
    dragCtx = null;
  };
  document.addEventListener('pointermove', move);
  document.addEventListener('pointerup', up);
}

function makeChip(text, id){
  const c = document.createElement('div');
  c.className = 'chip';
  c.dataset.id = id;
  c.innerHTML = '<span class="grip">⠿</span><span class="label"></span>';
  c.querySelector('.label').textContent = text;
  return c;
}

// ============================================================
// TYPE: ORDER (reorderable single list)
// ============================================================
function renderOrder(q, body){
  const shuffled = shuffle(q.items);
  const list = document.createElement('div');
  list.className = 'order-list dropzone';
  list.dataset.zone = 'order';
  body.appendChild(list);

  state.qState = { itemOrder: shuffled.map(it=>it.id), q };

  function render(){
    list.innerHTML = '';
    state.qState.itemOrder.forEach((id, i) => {
      const item = q.items.find(it=>it.id===id);
      const row = document.createElement('div');
      row.className = 'order-item';
      row.dataset.id = id;
      row.innerHTML = '<span class="idx">'+(i+1)+'</span><span class="grip">⠿</span><span class="txt"></span>';
      row.querySelector('.txt').textContent = item.text;
      row.addEventListener('pointerdown', (e) => {
        if(e.target.closest('.grip') || true){
          startOrderDrag(e, row, id);
        }
      });
      list.appendChild(row);
    });
  }

  function startOrderDrag(e, rowEl, id){
    if(state.answered) return;
    e.preventDefault();
    const rect = rowEl.getBoundingClientRect();
    const ghost = rowEl.cloneNode(true);
    ghost.classList.add('ghost');
    ghost.style.width = rect.width + 'px';
    ghost.style.left = e.clientX + 'px';
    ghost.style.top = e.clientY + 'px';
    document.body.appendChild(ghost);
    rowEl.classList.add('dragging');

    const move = (ev) => {
      const y = ev.clientY;
      ghost.style.left = ev.clientX + 'px';
      ghost.style.top = y + 'px';
      const rows = Array.from(list.querySelectorAll('.order-item')).filter(r=>r!==rowEl);
      let insertBeforeId = null;
      for(const r of rows){
        const rc = r.getBoundingClientRect();
        if(y < rc.top + rc.height/2){ insertBeforeId = r.dataset.id; break; }
      }
      const arr = state.qState.itemOrder.filter(x=>x!==id);
      const insertIdx = insertBeforeId ? arr.indexOf(insertBeforeId) : arr.length;
      arr.splice(insertIdx, 0, id);
      state.qState.itemOrder = arr;
      render();
      const nowEl = list.querySelector('[data-id="'+id+'"]');
      if(nowEl) nowEl.classList.add('dragging');
    };
    const up = () => {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
      ghost.remove();
      const nowEl = list.querySelector('[data-id="'+id+'"]');
      if(nowEl) nowEl.classList.remove('dragging');
    };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
  }

  render();

  state.qState.check = () => {
    const correct = q.correctOrder;
    const current = state.qState.itemOrder;
    let numCorrect = 0;
    current.forEach((id,i)=>{
      const row = list.querySelector('[data-id="'+id+'"]');
      const ok = correct[i] === id;
      if(ok) numCorrect++;
      row.classList.add(ok ? 'correct' : 'incorrect');
    });
    return { fraction: numCorrect / correct.length, isPerfect: numCorrect === correct.length };
  };
}

// ============================================================
// TYPE: MATCH (drag right-side chips onto left-side slots)
// ============================================================
function renderMatch(q, body){
  const grid = document.createElement('div');
  grid.className = 'match-grid';
  body.appendChild(grid);

  q.left.forEach(l => {
    const row = document.createElement('div');
    row.className = 'match-row';
    row.innerHTML = '<div class="match-left"></div><div class="slot dropzone" data-slot="'+l.id+'"></div>';
    row.querySelector('.match-left').textContent = l.text;
    grid.appendChild(row);
  });

  const bank = document.createElement('div');
  bank.className = 'bank dropzone';
  bank.dataset.zone = 'bank';
  bank.innerHTML = '<span class="bank-label">Drag these onto the matching row →</span>';
  body.appendChild(bank);

  const shuffledRight = shuffle(q.right);
  const chips = {};
  shuffledRight.forEach(r => {
    const chip = makeChip(r.text, r.id);
    chips[r.id] = chip;
    chip.addEventListener('pointerdown', (e) => onChipDown(e, chip, r.id));
    bank.appendChild(chip);
  });

  state.qState = { placements: {}, q };

  function onChipDown(e, chipEl, chipId){
    startDrag(e, chipEl, (target) => {
      if(state.answered) return;
      if(target && target.classList.contains('slot')){
        const slotId = target.dataset.slot;
        // if slot already occupied, bounce that chip back to bank
        const existing = target.querySelector('.chip');
        if(existing){
          bank.appendChild(existing);
          for(const k in state.qState.placements){
            if(state.qState.placements[k] === existing.dataset.id) delete state.qState.placements[k];
          }
        }
        target.innerHTML = '';
        target.appendChild(chipEl);
        target.classList.add('filled');
        state.qState.placements[slotId] = chipId;
      } else if(target && target.dataset.zone === 'bank'){
        bank.appendChild(chipEl);
        for(const k in state.qState.placements){
          if(state.qState.placements[k] === chipId) { delete state.qState.placements[k]; }
        }
        $$('.slot').forEach(s=>{ if(!s.querySelector('.chip')) s.classList.remove('filled'); });
      } else {
        // dropped nowhere valid -> snap back to wherever it was (no-op, DOM unchanged)
      }
    });
  }

  state.qState.check = () => {
    let numCorrect = 0;
    q.left.forEach(l => {
      const slot = grid.querySelector('.slot[data-slot="'+l.id+'"]');
      const placedId = state.qState.placements[l.id];
      const correctRight = q.right.find(r => r.matches === l.id);
      const ok = placedId === correctRight.id;
      if(ok) numCorrect++;
      slot.classList.add(ok ? 'correct' : 'incorrect');
      if(!ok){
        // reveal correct answer text under slot for learning
        const hint = document.createElement('div');
        hint.style.fontSize='11px'; hint.style.color='var(--muted)'; hint.style.marginTop='4px'; hint.style.fontFamily='var(--mono)';
        hint.textContent = '✓ ' + correctRight.text;
        slot.parentElement.appendChild(hint);
      }
    });
    return { fraction: numCorrect / q.left.length, isPerfect: numCorrect === q.left.length };
  };
}

// ============================================================
// TYPE: SORT (drag chips into 2-3 bins)
// ============================================================
function renderSort(q, body){
  const bins = document.createElement('div');
  bins.className = 'bins';
  bins.style.gridTemplateColumns = 'repeat(' + q.bins.length + ', 1fr)';
  if(q.bins.length > 2){ bins.style.gridTemplateColumns = '1fr'; }
  body.appendChild(bins);

  const binEls = {};
  q.bins.forEach(b => {
    const el = document.createElement('div');
    el.className = 'bin dropzone';
    el.dataset.bin = b.id;
    el.innerHTML = '<div class="bin-title"></div><div class="bin-items"></div>';
    el.querySelector('.bin-title').textContent = b.title;
    bins.appendChild(el);
    binEls[b.id] = el;
  });

  const bank = document.createElement('div');
  bank.className = 'bank dropzone';
  bank.dataset.zone = 'bank';
  bank.innerHTML = '<span class="bank-label">Drag each item into the bin it belongs to</span>';
  body.appendChild(bank);

  const shuffledItems = shuffle(q.items);
  const placement = {};
  shuffledItems.forEach(it => {
    const chip = makeChip(it.text, it.id);
    chip.addEventListener('pointerdown', (e) => onDown(e, chip, it.id));
    bank.appendChild(chip);
    placement[it.id] = null;
  });

  state.qState = { placement, q };

  function onDown(e, chipEl, itemId){
    startDrag(e, chipEl, (target) => {
      if(state.answered) return;
      if(target && target.classList.contains('bin')){
        target.querySelector('.bin-items').appendChild(chipEl);
        placement[itemId] = target.dataset.bin;
      } else if(target && target.dataset.zone === 'bank'){
        bank.appendChild(chipEl);
        placement[itemId] = null;
      }
    });
  }

  state.qState.check = () => {
    let numCorrect = 0;
    q.items.forEach(it => {
      const chip = bins.querySelector('[data-id="'+it.id+'"]') || bank.querySelector('[data-id="'+it.id+'"]');
      const ok = placement[it.id] === it.bin;
      if(chip){
        chip.classList.add(ok ? 'correct' : 'incorrect');
      }
      if(ok) numCorrect++;
    });
    return { fraction: numCorrect / q.items.length, isPerfect: numCorrect === q.items.length };
  };
}

// ============================================================
// TYPE: FILLBLANK (drag word-bank tokens into inline blanks)
// ============================================================
function renderFillblank(q, body){
  const textEl = document.createElement('div');
  textEl.className = 'fb-text';
  body.appendChild(textEl);

  const blankEls = {};
  q.segments.forEach(seg => {
    if(seg.text !== undefined){
      textEl.appendChild(document.createTextNode(seg.text));
    } else if(seg.blank){
      const b = document.createElement('span');
      b.className = 'fb-blank dropzone';
      b.dataset.blank = seg.blank;
      textEl.appendChild(b);
      blankEls[seg.blank] = b;
    }
  });

  const bank = document.createElement('div');
  bank.className = 'bank dropzone';
  bank.dataset.zone = 'bank';
  bank.innerHTML = '<span class="bank-label">Word bank — drag into the blanks above</span>';
  body.appendChild(bank);

  const placement = {};
  shuffle(q.bank).forEach((word, i) => {
    const chip = makeChip(word, 'tok'+i);
    chip.dataset.word = word;
    chip.addEventListener('pointerdown', (e) => onDown(e, chip));
    bank.appendChild(chip);
  });

  state.qState = { placement, q };

  function onDown(e, chipEl){
    startDrag(e, chipEl, (target) => {
      if(state.answered) return;
      if(target && target.classList.contains('fb-blank')){
        const blankId = target.dataset.blank;
        const existing = target.querySelector('.chip');
        if(existing){ bank.appendChild(existing); }
        target.innerHTML = '';
        target.appendChild(chipEl);
        placement[blankId] = chipEl.dataset.word;
      } else if(target && target.dataset.zone === 'bank'){
        // remove from any blank it was in
        for(const bId in blankEls){
          if(blankEls[bId].contains(chipEl)) placement[bId] = undefined;
        }
        bank.appendChild(chipEl);
      }
    });
  }

  state.qState.check = () => {
    const blankIds = Object.keys(q.correct);
    let numCorrect = 0;
    blankIds.forEach(bId => {
      const ok = placement[bId] === q.correct[bId];
      blankEls[bId].classList.add(ok ? 'correct' : 'incorrect');
      if(!ok){
        blankEls[bId].insertAdjacentHTML('beforeend', '');
      }
      if(ok) numCorrect++;
    });
    return { fraction: numCorrect / blankIds.length, isPerfect: numCorrect === blankIds.length };
  };
}

// ============================================================
// CHECK / FEEDBACK
// ============================================================
function checkAnswer(){
  if(state.answered) return;
  const result = state.qState.check();
  state.answered = true;

  const q = QUESTIONS[state.idx];
  state.score += result.fraction;
  if(result.isPerfect) state.perfect++;

  if(!state.categoryStats[q.category]) state.categoryStats[q.category] = {correct:0, total:0};
  state.categoryStats[q.category].total++;
  state.categoryStats[q.category].correct += result.fraction;

  const fb = $('#feedback');
  fb.classList.remove('perfect','partial','zero');
  let cls, icon, headText;
  if(result.fraction === 1){ cls='perfect'; icon='✅'; headText='Perfect — nailed it'; }
  else if(result.fraction > 0){ cls='partial'; icon='🟡'; headText='Partly right (' + Math.round(result.fraction*100) + '%)'; }
  else { cls='zero'; icon='❌'; headText='Not quite'; }
  fb.classList.add('show', cls);
  $('#fb-head').innerHTML = '<span class="ico">'+icon+'</span> ' + headText;
  $('#fb-body').innerHTML = q.explanation;

  $('#check-btn').disabled = true;
  $('#next-btn').classList.remove('hidden');
  $('#score-badge').textContent = '✓ ' + state.perfect;

  fb.scrollIntoView({behavior:'smooth', block:'nearest'});
}

// ============================================================
// END SCREEN
// ============================================================
function showEnd(){
  $('#game-screen').classList.add('hidden');
  $('#end-screen').classList.remove('hidden');

  const pct = Math.round((state.score / QUESTIONS.length) * 100);
  $('#stat-score').textContent = pct + '%';
  $('#stat-correct').textContent = state.perfect + '/' + QUESTIONS.length;

  let grade, title, desc;
  if(pct >= 95){ grade='S'; title='APOLO Pipeline Master'; desc="You could onboard the next trainee yourself. You clearly understand not just what each table is called, but why the pipeline is shaped the way it is."; }
  else if(pct >= 85){ grade='A'; title='Senior ETL Developer'; desc="Strong command of the APOLO schema, the SSIS package pattern, and how the numbers actually flow. A few details to tighten, but you're operating at a real production level."; }
  else if(pct >= 70){ grade='B'; title='ETL Analyst'; desc="You've got the core pipeline shape down. Go back over the questions you missed — they're usually the ones with a small 'gotcha' detail (a missing column, a sign flip, a database boundary)."; }
  else if(pct >= 50){ grade='C'; title='Junior ETL Developer'; desc="You understand the big picture — Extract, Transform, Load — but the specific table and column details still need review. Re-read intruksi.sql and the mapping workbook side by side with your wrong answers."; }
  else { grade='D'; title='ETL Trainee'; desc="This is exactly what training is for. Play through again — the explanations are the real lesson here, not the score. Pay close attention to the Pipeline Sequencing and Schema Literacy questions first."; }

  $('#end-grade').textContent = grade;
  $('#end-title').textContent = title;
  $('#end-desc').textContent = desc;

  const cats = Object.keys(state.categoryStats);
  let best = null, bestPct = -1;
  cats.forEach(c => {
    const s = state.categoryStats[c];
    const p = s.correct / s.total;
    if(p > bestPct){ bestPct = p; best = c; }
  });
  $('#stat-best').textContent = best || '-';

  const cb = $('#category-breakdown');
  cb.innerHTML = '';
  cats.forEach(c => {
    const s = state.categoryStats[c];
    const p = Math.round((s.correct / s.total) * 100);
    const row = document.createElement('div');
    row.className = 'cb-row';
    row.innerHTML = '<div class="cb-label"></div><div class="cb-track"><div class="cb-fill" style="width:'+p+'%"></div></div><div class="cb-pct">'+p+'%</div>';
    row.querySelector('.cb-label').textContent = c;
    cb.appendChild(row);
  });
}
