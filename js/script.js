
// Advent Calendar logic (days 10-25) with persistent opened state and music control
document.addEventListener('DOMContentLoaded', () => {
  const boxes   = document.querySelectorAll('.day-box');
  const popup   = document.getElementById('popup');
  const body    = document.getElementById('popup-body');
  const closeBtn= document.getElementById('close-btn');
  const audio   = document.getElementById('bg-music');
  const muteBtn = document.getElementById('mute-btn');
  const yearEl  = document.getElementById('year');

  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // --- Robust mute/unmute state ---
  let isMuted = true;           // start muted to satisfy autoplay policies
  audio.muted = true;
  muteBtn.textContent = '🔇';
  muteBtn.setAttribute('aria-pressed', 'true');
  muteBtn.setAttribute('title', 'Unmute music');

  // Prime the audio by attempting a muted play (ignored if blocked)
  (async () => { try { await audio.play(); } catch (_) {} })();

  function updateAudio() {
    if (isMuted) {
      audio.muted = true;
      audio.pause();           // ensure silence
      muteBtn.textContent = '🔇';
      muteBtn.setAttribute('aria-pressed', 'true');
      muteBtn.setAttribute('title', 'Unmute music');
    } else {
      audio.muted = false;
      audio.play().catch(() => {});
      muteBtn.textContent = '🔊';
      muteBtn.setAttribute('aria-pressed', 'false');
      muteBtn.setAttribute('title', 'Mute music');
    }
  }

  muteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    isMuted = !isMuted;
    updateAudio();
  });

  // --- Calendar state ---
  let opened = JSON.parse(localStorage.getItem('lhian_opened_days') || '[]');
  for (const day of opened) {
    const el = document.querySelector(`.day-box[data-day="${day}"]`);
    if (el) el.classList.add('opened');
  }

  boxes.forEach(box => {
    box.addEventListener('click', () => {
      if (box.classList.contains('opened')) return;
      body.textContent = 'Content will be added soon';
      popup.classList.remove('hidden');
      box.classList.add('opened');
      const dayNum = parseInt(box.getAttribute('data-day'), 10);
      if (!opened.includes(dayNum)) {
        opened.push(dayNum);
        localStorage.setItem('lhian_opened_days', JSON.stringify(opened));
      }
    });
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
