
// GitHub Pages friendly script: no server. Day 11 uploads via a form backend (Getform).
document.addEventListener('DOMContentLoaded', () => {
  const boxes    = document.querySelectorAll('.day-box');
  const popup    = document.getElementById('popup');
  const popupContent = document.querySelector('.popup-content');

  const audio    = document.getElementById('bg-music');
  const muteBtn  = document.getElementById('mute-btn');
  const yearEl   = document.getElementById('year');
  const resetBtn = document.getElementById('reset-btn');

  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const baseTemplateHTML = popupContent ? popupContent.innerHTML : '';

  // Music
  let isMuted = true;
  if (audio) { audio.muted = true; (async () => { try { await audio.play(); } catch(_){} })(); }
  if (muteBtn) {
    muteBtn.textContent = '🔇';
    function updateAudio(){
      if(!audio) return;
      if(isMuted){ audio.muted = true; audio.pause(); muteBtn.textContent='🔇'; }
      else { audio.muted = false; audio.play().catch(()=>{}); muteBtn.textContent='🔊'; }
    }
    muteBtn.addEventListener('click', (e)=>{ e.stopPropagation(); isMuted=!isMuted; updateAudio(); });
  }
  if (resetBtn) {
  resetBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!confirm('Reset all opened chests?')) return;

    // Clear stored state and UI classes
    localStorage.removeItem('lhian_opened_days');
    opened = []; // reuse the outer "opened" variable
    document.querySelectorAll('.day-box.opened').forEach(el => el.classList.remove('opened'));

    // Close any open popup and give quick feedback
    if (popup) popup.classList.add('hidden');
    alert('All chests have been reset.');
    });
  }

  const openSfx    = new Audio('assets/open.wav');
  const trumpetSfx = new Audio('assets/queen-royalty-trumpet.mp3');

  // Restore opened
  let opened = JSON.parse(localStorage.getItem('lhian_opened_days') || '[]');
  for (const day of opened) {
    const el = document.querySelector(`.day-box[data-day="${day}"]`);
    if (el) el.classList.add('opened');
  }

  function closeModal(){ popup && popup.classList.add('hidden'); }
  function bindCloseButton(){
    const closeBtn = document.getElementById('close-btn');
    if (closeBtn) closeBtn.addEventListener('click', (e) => { e.stopPropagation(); closeModal(); });
    if (popup) popup.addEventListener('click', (e) => { if (e.target === popup) closeModal(); }, { once: true });
  }

  function renderMessagePopup(text){
    popupContent.innerHTML = `
      <h2 id="popup-title">${text}</h2>
      <button id="close-btn" class="close-btn" aria-label="Close popup" type="button">Close</button>
    `;
    popup.classList.remove('hidden');
    bindCloseButton();
  }

  function renderQuizPopup(){
    popupContent.innerHTML = baseTemplateHTML;

    const form     = document.getElementById('answer-form');
    const input    = document.getElementById('answer-input');
    const feedback = document.getElementById('answer-feedback');

    if (feedback){ feedback.textContent = ''; feedback.className = 'answer-feedback'; }
    if (input){ input.value = ''; }

    function valueIsCorrect(s) {
      if (!s) return false;
      const v = s.trim();
      if (v === '3/2') return true;
      const normalized = v.replace(',', '.').replace(/\s+/g, '');
      if (normalized.includes('/')) {
        const [a,b] = normalized.split('/');
        const num = parseFloat(a);
        const den = parseFloat(b);
        if (!isNaN(num) && !isNaN(den) && den !== 0) {
          return Math.abs(num/den - 1.5) < 1e-9;
        }
      }
      const x = parseFloat(normalized);
      if (!isNaN(x)) return Math.abs(x - 1.5) < 1e-9;
      return false;
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = input.value;
      if (valueIsCorrect(val)) {
        popupContent.innerHTML = `
          <h2 id="popup-title">YAYYYY! You got it right, Go Open the gift.</h2>
          <button id="close-btn" class="close-btn" aria-label="Close popup" type="button">Close</button>
        `;
        try { trumpetSfx.currentTime = 0; trumpetSfx.play(); } catch (_) {}
        bindCloseButton();
      } else {
        const feedback = document.getElementById('answer-feedback');
        feedback.textContent = 'WRONG';
        feedback.className = 'answer-feedback bad';
      }
    });

    bindCloseButton();
    popup.classList.remove('hidden');
    input && input.focus();
  }

  function renderQuestPopup(){
    const cfg = (window.ADVENT_CONFIG && window.ADVENT_CONFIG.upload) || {};
    const endpoint = cfg.getformEndpoint || "";

    if (endpoint) {
      // True HTML POST to a form backend (works on GitHub Pages)
      popupContent.innerHTML = `
        <h2 id="popup-title">Santa has sent you on a quest, you must pick one of the following missions to accept:</h2>
        <p class="quest-list">
          1. Kill the Ender Dragon.<br>
          2. Kill the Wither.<br>
          3. Get a full set of netherite armour.
        </p>
        <form id="file-upload-form" action="${endpoint}" method="POST" enctype="multipart/form-data" target="_blank">
          <input type="hidden" name="_redirect" value="">
          <input type="file" id="upload-input" name="files[]" multiple required>
          <button type="submit" class="upload-btn">Upload</button>
        </form>
        <button id="close-btn" class="close-btn" aria-label="Close popup" type="button">Close</button>
      `;
    } else {
      // Not configured yet: show instructions
      popupContent.innerHTML = `
        <h2 id="popup-title">Santa has sent you on a quest, you must pick one of the following missions to accept:</h2>
        <p class="quest-list">
          1. Kill the Ender Dragon.<br>
          2. Kill the Wither.<br>
          3. Get a full set of netherite armour.
        </p>
        <div class="upload-placeholder">
          <p><strong>Uploads are not configured yet.</strong></p>
          <ol>
            <li>Create a free form endpoint at <a href="https://getform.io/" target="_blank" rel="noopener">Getform</a>.</li>
            <li>Copy your endpoint URL.</li>
            <li>Edit <code>config.js</code> and set <code>getformEndpoint</code> to your endpoint.</li>
            <li>Commit and push to GitHub Pages—uploads will now work.</li>
          </ol>
        </div>
        <button id="close-btn" class="close-btn" aria-label="Close popup" type="button">Close</button>
      `;
    }
    popup.classList.remove('hidden');
    bindCloseButton();
  }

  function renderDay12ThreeStage() {
    // Define the three stages: image + accepted answers (case/space insensitive)
    const STAGES = [
      {
        img: 'assets/day12-stage1.png',
        accepts: [
          'watkins ave',
          'watkins avenue'
        ]
      },
      {
        img: 'assets/day12-stage2.png',
        accepts: [
          'wyangan ave',
          'wyangan avenue'
        ]
      },
      {
        img: 'assets/day12-stage3.png',
        accepts: [
          'scenic dr',
          'scenic drive'
        ]
      }
    ];
  
    // Simple normaliser: lowercase, collapse spaces, remove trailing punctuation
    const norm = s => (s || '')
      .toLowerCase()
      .replace(/\./g, '')
      .replace(/\s+/g, ' ')
      .trim();
  
    let stage = 0;
  
    function renderStage() {
      const { img } = STAGES[stage];
      popupContent.innerHTML = `
        <h2 id="popup-title">Stage ${stage + 1} of ${STAGES.length}</h2>
        <img src="${img}" alt="Puzzle image ${stage + 1}" class="stage-img" />
        <form id="stage-form" class="stage-form">
          <label for="stage-input" class="answer-label">Type your answer:</label>
          <input id="stage-input" class="answer-input" type="text" placeholder="Enter here" autocomplete="off"/>
          <button class="submit-btn" type="submit">Submit</button>
        </form>
        <div id="stage-feedback" class="answer-feedback" aria-live="polite"></div>
        <button id="close-btn" class="close-btn" type="button" aria-label="Close popup">Close</button>
      `;
  
      popup.classList.remove('hidden');
      bindCloseButton();
  
      const form     = document.getElementById('stage-form');
      const input    = document.getElementById('stage-input');
      const feedback = document.getElementById('stage-feedback');
  
      input && input.focus();
  
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const val = norm(input.value);
        const accepted = STAGES[stage].accepts.map(norm);
  
        if (accepted.includes(val)) {
          // correct -> trumpet + next stage or final message
          try { trumpetSfx.currentTime = 0; trumpetSfx.play(); } catch(_) {}
  
          stage++;
          if (stage < STAGES.length) {
            renderStage(); // advance to next popup stage
          } else {
            // Final success message
            popupContent.innerHTML = `
              <h2 id="popup-title">You may now open your gift!</h2>
              <button id="close-btn" class="close-btn" type="button" aria-label="Close popup">Close</button>
            `;
            bindCloseButton();
          }
        } else {
          feedback.textContent = 'WRONG';
          feedback.className = 'answer-feedback bad';
        }
      });
    }
  
    renderStage();
  }

  boxes.forEach(box => {
    box.addEventListener('click', () => {
      const dayNum = parseInt(box.getAttribute('data-day'), 10);
      if (box.classList.contains('opened')) return;

      if (dayNum === 10) {
        try { openSfx.currentTime = 0; openSfx.play(); } catch(_){}
        box.classList.add('opened');
        opened = JSON.parse(localStorage.getItem('lhian_opened_days') || '[]');
        if (!opened.includes(dayNum)) {
          opened.push(dayNum);
          localStorage.setItem('lhian_opened_days', JSON.stringify(opened));
        }
        renderQuizPopup();
      } else if (dayNum === 11) {
        try { openSfx.currentTime = 0; openSfx.play(); } catch(_){}
        box.classList.add('opened');
        opened = JSON.parse(localStorage.getItem('lhian_opened_days') || '[]');
        if (!opened.includes(dayNum)) {
          opened.push(dayNum);
          localStorage.setItem('lhian_opened_days', JSON.stringify(opened));
        }
        renderQuestPopup();
      } else if (dayNum === 12) {
        try { openSfx.currentTime = 0; openSfx.play(); } catch(_){}
        box.classList.add('opened');
        opened = JSON.parse(localStorage.getItem('lhian_opened_days') || '[]');
        if (!opened.includes(dayNum)) {
          opened.push(dayNum);
          localStorage.setItem('lhian_opened_days', JSON.stringify(opened));
        }
        renderDay12ThreeStage();
      } else {
        renderMessagePopup('Santa has not revealed this problem yet');
      }
    });
  });
});
