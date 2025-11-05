
// Advent Calendar with SFX and quiz popup
document.addEventListener('DOMContentLoaded', () => {
  const boxes    = document.querySelectorAll('.day-box');
  const popup    = document.getElementById('popup');
  const popupContent = document.querySelector('.popup-content');

  const audio    = document.getElementById('bg-music');
  const muteBtn  = document.getElementById('mute-btn');
  const yearEl   = document.getElementById('year');

  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Store the base (quiz) template HTML so we can restore it when needed
  const baseTemplateHTML = popupContent.innerHTML;

  // Background music toggle (robust)
  let isMuted = true;
  audio.muted = true;
  muteBtn.textContent = '🔇';
  (async () => { try { await audio.play(); } catch(_){} })();
  function updateAudio(){
    if(isMuted){ audio.muted = true; audio.pause(); muteBtn.textContent='🔇'; }
    else { audio.muted = false; audio.play().catch(()=>{}); muteBtn.textContent='🔊'; }
  }
  muteBtn.addEventListener('click', (e)=>{ e.stopPropagation(); isMuted=!isMuted; updateAudio(); });

  // Sound effects
  const openSfx   = new Audio('assets/open.wav');
  const trumpetSfx= new Audio('assets/queen-royalty-trumpet.mp3');

  // Local storage for opened days (we only open 10 now)
  let opened = JSON.parse(localStorage.getItem('lhian_opened_days') || '[]');
  for (const day of opened) {
    const el = document.querySelector(`.day-box[data-day="${day}"]`);
    if (el) el.classList.add('opened');
  }

  function closeModal(){
    popup.classList.add('hidden');
  }

  function bindCloseButton(){
    const closeBtn = document.getElementById('close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => { e.stopPropagation(); closeModal(); });
    }
    // Click outside content closes modal
    popup.addEventListener('click', (e) => {
      if (e.target === popup) closeModal();
    }, { once: true });
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
    // restore original template
    popupContent.innerHTML = baseTemplateHTML;

    const form     = document.getElementById('answer-form');
    const input    = document.getElementById('answer-input');
    const feedback = document.getElementById('answer-feedback');

    // reset UI
    if (feedback){ feedback.textContent = ''; feedback.className = 'answer-feedback'; }
    if (input){ input.value = ''; }

    // Accept 3/2 or numeric equivalents like 1.5
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
        // Replace the entire popup with the celebration message (no "Correct" text)
        popupContent.innerHTML = `
          <h2 id="popup-title">YAYYYY! You got it right, Go Open the gift.</h2>
          <button id="close-btn" class="close-btn" aria-label="Close popup" type="button">Close</button>
        `;
        try { trumpetSfx.currentTime = 0; trumpetSfx.play(); } catch (_) {}
        bindCloseButton();
      } else {
        // Only show a WRONG message; do not ever display "Correct"
        feedback.textContent = 'WRONG';
        feedback.className = 'answer-feedback bad';
      }
    });

    bindCloseButton();
    popup.classList.remove('hidden');
    input && input.focus();
  }

  // Click handler for day boxes
  boxes.forEach(box => {
    box.addEventListener('click', () => {
      const dayNum = parseInt(box.getAttribute('data-day'), 10);
      if (box.classList.contains('opened')) return;

      if (dayNum === 10) {
        // Only box 10 opens and shows the math popup
        try { openSfx.currentTime = 0; openSfx.play(); } catch(_){}
        // mark opened and persist
        box.classList.add('opened');
        if (!opened.includes(dayNum)) {
          opened.push(dayNum);
          localStorage.setItem('lhian_opened_days', JSON.stringify(opened));
        }
        renderQuizPopup();
      } else {
        // All other boxes show the "not revealed" message and DO NOT mark as opened
        renderMessagePopup('Santa has not revealed this problem yet');
      }
    });
  });
});
