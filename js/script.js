
// Advent Calendar with SFX and quiz popup
document.addEventListener('DOMContentLoaded', () => {
  const boxes   = document.querySelectorAll('.day-box');
  const popup   = document.getElementById('popup');
  const closeBtn= document.getElementById('close-btn');
  const form    = document.getElementById('answer-form');
  const input   = document.getElementById('answer-input');
  const feedback= document.getElementById('answer-feedback');

  const audio   = document.getElementById('bg-music');
  const muteBtn = document.getElementById('mute-btn');
  const yearEl  = document.getElementById('year');

  if (yearEl) yearEl.textContent = new Date().getFullYear();

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

  // Chest open SFX
  const openSfx = new Audio('assets/open.wav');

  // Persistence
  let opened = JSON.parse(localStorage.getItem('lhian_opened_days') || '[]');
  for (const day of opened) {
    const el = document.querySelector(`.day-box[data-day="${day}"]`);
    if (el) el.classList.add('opened');
  }

  // Show popup with quiz when clicking a closed box
  boxes.forEach(box => {
    box.addEventListener('click', () => {
      if (box.classList.contains('opened')) return;

      // Play open sound (user gesture, so allowed)
      try { openSfx.currentTime = 0; openSfx.play(); } catch(_){}

      // Mark opened & persist
      box.classList.add('opened');
      const dayNum = parseInt(box.getAttribute('data-day'), 10);
      if (!opened.includes(dayNum)) {
        opened.push(dayNum);
        localStorage.setItem('lhian_opened_days', JSON.stringify(opened));
      }

      // Reset quiz UI
      input.value = '';
      feedback.textContent = '';
      feedback.className = 'answer-feedback';

      // Show popup
      popup.classList.remove('hidden');
      input.focus();
    });
  });

  // Validate: accept 3/2 or numeric equivalents like 1.5
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
      feedback.textContent = 'CORRECT';
      feedback.className = 'answer-feedback ok';
    } else {
      feedback.textContent = 'WRONG';
      feedback.className = 'answer-feedback bad';
    }
  });

  // Close popup
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    popup.classList.add('hidden');
  });
  popup.addEventListener('click', (e) => {
    if (e.target === popup) popup.classList.add('hidden');
  });
});
