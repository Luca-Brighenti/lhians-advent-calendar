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

  // ============================================================================
  // MUSIC CONTROL
  // ============================================================================
  let isMuted = true;
  if (audio) { 
    audio.muted = true; 
    audio.volume = 0.3; // Set volume to 30% for background music
    (async () => { 
      try { await audio.play(); } catch(_){} 
    })(); 
  }
  
  if (muteBtn) {
    const muteIcon = muteBtn.querySelector('.mute-icon');
    if (muteIcon) muteIcon.textContent = '🔇';
    
    function updateAudio(){
      if(!audio) return;
      if(isMuted){ 
        audio.muted = true; 
        audio.pause(); 
        if (muteIcon) muteIcon.textContent = '🔇';
      } else { 
        audio.muted = false; 
        audio.play().catch(()=>{}); 
        if (muteIcon) muteIcon.textContent = '🔊';
      }
    }
    
    muteBtn.addEventListener('click', (e) => { 
      e.stopPropagation(); 
      isMuted = !isMuted; 
      updateAudio();
      
      // Add a little bounce animation to the button
      muteBtn.style.transform = 'scale(0.9)';
      setTimeout(() => {
        muteBtn.style.transform = '';
      }, 100);
    });
  }

  // ============================================================================
  // RESET FUNCTIONALITY
  // ============================================================================
  if (resetBtn) {
    resetBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!confirm('Reset all opened chests? This will close all your progress.')) return;

      // Clear stored state and UI classes
      localStorage.removeItem('lhian_opened_days');
      opened = []; // reuse the outer "opened" variable
      
      // Animate the reset
      const openedBoxes = document.querySelectorAll('.day-box.opened');
      openedBoxes.forEach((el, index) => {
        setTimeout(() => {
          el.classList.remove('opened');
          // Add a little shake animation
          el.style.animation = 'shake 0.3s ease-in-out';
          setTimeout(() => {
            el.style.animation = '';
          }, 300);
        }, index * 50); // Stagger the reset
      });

      // Close any open popup
      if (popup) closeModal();
      
      // Visual feedback
      showToast('All chests have been reset! 🎄');
    });
  }

  // ============================================================================
  // SOUND EFFECTS
  // ============================================================================
  const openSfx    = new Audio('assets/open.wav');
  const trumpetSfx = new Audio('assets/queen-royalty-trumpet.mp3');
  
  // Preload and set volumes
  openSfx.volume = 0.4;
  trumpetSfx.volume = 0.5;

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  // Restore opened days from localStorage
  let opened = JSON.parse(localStorage.getItem('lhian_opened_days') || '[]');
  for (const day of opened) {
    const el = document.querySelector(`.day-box[data-day="${day}"]`);
    if (el) el.classList.add('opened');
  }

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================
  
  function closeModal(){ 
    if (!popup) return;
    popup.style.animation = 'popupFadeOut 0.3s ease-out';
    setTimeout(() => {
      popup.classList.add('hidden'); 
      popup.style.animation = '';
    }, 250);
  }
  
  function bindCloseButton(){
    const closeBtn = document.getElementById('close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => { 
        e.stopPropagation(); 
        closeModal(); 
      });
    }
    
    if (popup) {
      popup.addEventListener('click', (e) => { 
        if (e.target === popup || e.target.classList.contains('popup-backdrop')) {
          closeModal(); 
        }
      }, { once: true });
    }
  }

  // Toast notification system
  function showToast(message, duration = 3000) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Remove after duration
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  // Confetti effect for special days
  function createConfetti() {
    const colors = ['#f6d36b', '#B81722', '#1C6B2A', '#fff'];
    const confettiCount = 50;
    
    for (let i = 0; i < confettiCount; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.left = Math.random() * 100 + 'vw';
      confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.animationDelay = Math.random() * 3 + 's';
      confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
      document.body.appendChild(confetti);
      
      setTimeout(() => confetti.remove(), 5000);
    }
  }

  // ============================================================================
  // POPUP RENDERERS
  // ============================================================================
  
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

    if (feedback){ 
      feedback.textContent = ''; 
      feedback.className = 'answer-feedback'; 
    }
    if (input){ 
      input.value = ''; 
      // Auto-focus with slight delay for animation
      setTimeout(() => input.focus(), 300);
    }

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
          <h2 id="popup-title">🎉 YAYYYY! You got it right!</h2>
          <p style="font-size: 1.2rem; margin: 16px 0;">Go open your gift! 🎁</p>
          <button id="close-btn" class="close-btn" aria-label="Close popup" type="button">Close</button>
        `;
        
        try { 
          trumpetSfx.currentTime = 0; 
          trumpetSfx.play(); 
        } catch (_) {}
        
        createConfetti();
        bindCloseButton();
      } else {
        const feedback = document.getElementById('answer-feedback');
        feedback.textContent = '❌ WRONG - Try again!';
        feedback.className = 'answer-feedback bad';
        
        // Shake the input
        input.style.animation = 'shake 0.3s ease-in-out';
        setTimeout(() => {
          input.style.animation = '';
          input.select();
        }, 300);
      }
    });

    bindCloseButton();
    popup.classList.remove('hidden');
  }

  function renderQuestPopup(){
    const cfg = (window.ADVENT_CONFIG && window.ADVENT_CONFIG.upload) || {};
    const endpoint = cfg.getformEndpoint || "";

    if (endpoint) {
      // True HTML POST to a form backend (works on GitHub Pages)
      popupContent.innerHTML = `
        <h2 id="popup-title">⚔️ Santa's Quest</h2>
        <p style="margin-bottom: 12px;">Santa has sent you on a quest! Choose one mission:</p>
        <p class="quest-list">
          1. Kill the Ender Dragon.<br>
          2. Kill the Wither.<br>
          3. Get a full set of netherite armour.
        </p>
        <form id="file-upload-form" action="${endpoint}" method="POST" enctype="multipart/form-data" target="_blank">
          <input type="hidden" name="_redirect" value="">
          <label for="upload-input" style="display: block; margin: 12px 0 8px; font-weight: 600;">Upload your proof:</label>
          <input type="file" id="upload-input" name="files[]" multiple required>
          <button type="submit" class="upload-btn">📤 Upload Proof</button>
        </form>
        <button id="close-btn" class="close-btn" aria-label="Close popup" type="button">Close</button>
      `;
    } else {
      // Not configured yet: show instructions
      popupContent.innerHTML = `
        <h2 id="popup-title">⚔️ Santa's Quest</h2>
        <p style="margin-bottom: 12px;">Santa has sent you on a quest! Choose one mission:</p>
        <p class="quest-list">
          1. Kill the Ender Dragon.<br>
          2. Kill the Wither.<br>
          3. Get a full set of netherite armour.
        </p>
        <div class="upload-placeholder">
          <p><strong>📋 Upload Setup Required</strong></p>
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
        <h2 id="popup-title">🗺️ Stage ${stage + 1} of ${STAGES.length}</h2>
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
  
      input && setTimeout(() => input.focus(), 300);
  
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const val = norm(input.value);
        const accepted = STAGES[stage].accepts.map(norm);
  
        if (accepted.includes(val)) {
          // Correct answer
          try { 
            trumpetSfx.currentTime = 0; 
            trumpetSfx.play(); 
          } catch(_) {}
  
          stage++;
          if (stage < STAGES.length) {
            showToast(`✅ Correct! Moving to stage ${stage + 1}...`);
            setTimeout(() => renderStage(), 500);
          } else {
            // Final success message
            popupContent.innerHTML = `
              <h2 id="popup-title">🎉 Congratulations!</h2>
              <p style="font-size: 1.2rem; margin: 16px 0;">You've completed all stages!</p>
              <p style="font-size: 1.1rem;">You may now open your gift! 🎁</p>
              <button id="close-btn" class="close-btn" type="button" aria-label="Close popup">Close</button>
            `;
            createConfetti();
            bindCloseButton();
          }
        } else {
          feedback.textContent = '❌ WRONG - Try again!';
          feedback.className = 'answer-feedback bad';
          
          // Shake animation
          input.style.animation = 'shake 0.3s ease-in-out';
          setTimeout(() => {
            input.style.animation = '';
            input.select();
          }, 300);
        }
      });
    }
  
    renderStage();
  }

  function renderDay13Popup(){
    popupContent.innerHTML = `
      <h2 id="popup-title">🎮 You Know What To Do</h2>

      <img src="assets/stacker.png" alt="Stacker game" class="popup-image">

      <p style="margin: 16px 0;"><a href="https://filiprei.itch.io/stacker-arcade-game" target="_blank" rel="noopener" style="color: var(--green); font-weight: 600; text-decoration: underline;">
        Play Stacker Arcade Game →
      </a></p>
      <p style="font-size: 0.95rem; color: #666;">Send me a photo for proof!</p>

      <button id="day13-done" class="submit-btn" type="button">✓ I Did It!</button>
      <button id="close-btn" class="close-btn" aria-label="Close popup" type="button">Close</button>
    `;

    popup.classList.remove('hidden');
    bindCloseButton();

    const doneBtn = document.getElementById('day13-done');

    doneBtn.addEventListener('click', (e) => {
      e.stopPropagation();

      // Play victory trumpet
      try {
        trumpetSfx.currentTime = 0;
        trumpetSfx.play();
      } catch (_) {}

      showToast('🎉 Great job completing the challenge!');
      createConfetti();

      // Auto-close the popup after a short delay
      setTimeout(() => {
        closeModal();
      }, 1500);
    });
  }

  function renderDay14DownloadPopup() {
    popupContent.innerHTML = `
      <h2 id="popup-title">🎄 Parkour Spiral Surprise!</h2>
      <p style="margin: 16px 0; font-size: 1.05rem;">
        You've unlocked a special Minecraft world!<br>
        Download the map and start your parkour adventure!
      </p>
      <button id="download-map-btn" class="download-btn" type="button">
        ⬇️ Download Parkour Spiral Map
      </button>
      <button id="close-btn" class="close-btn" type="button" aria-label="Close popup">
        Close
      </button>
    `;

    popup.classList.remove('hidden');
    bindCloseButton();

    const downloadBtn = document.getElementById('download-map-btn');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', (e) => {
        e.stopPropagation();

        const link = document.createElement('a');
        link.href = 'assets/Parkour-Spiral-Map-MCPE-1.20.mcworld';
        link.download = 'Parkour-Spiral-Map-MCPE-1.20.mcworld';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast('📥 Download started! Enjoy your parkour adventure!');
        
        // Visual feedback on button
        downloadBtn.textContent = '✓ Downloaded!';
        downloadBtn.style.background = 'linear-gradient(135deg, var(--ok), #1e7e34)';
        setTimeout(() => {
          downloadBtn.textContent = '⬇️ Download Parkour Spiral Map';
          downloadBtn.style.background = '';
        }, 2000);
      });
    }
  }

  // ============================================================================
  // DAY BOX CLICK HANDLERS
  // ============================================================================
  
  boxes.forEach(box => {
    box.addEventListener('click', () => {
      const dayNum = parseInt(box.getAttribute('data-day'), 10);
      
      // Don't open if already opened
      if (box.classList.contains('opened')) {
        showToast('This gift has already been opened! 🎁');
        return;
      }

      // Play open sound
      try { 
        openSfx.currentTime = 0; 
        openSfx.play(); 
      } catch(_){}

      // Mark as opened
      box.classList.add('opened');
      opened = JSON.parse(localStorage.getItem('lhian_opened_days') || '[]');
      if (!opened.includes(dayNum)) {
        opened.push(dayNum);
        localStorage.setItem('lhian_opened_days', JSON.stringify(opened));
      }

      // Route to appropriate popup
      switch(dayNum) {
        case 10:
          renderQuizPopup();
          break;
        case 11:
          renderQuestPopup();
          break;
        case 12:
          renderDay12ThreeStage();
          break;
        case 13:
          renderDay13Popup();
          break;
        case 14:
          renderDay14DownloadPopup();
          break;
        default:
          renderMessagePopup('🎅 Santa has not revealed this surprise yet! Check back soon!');
          break;
      }
    });
  });

  // ============================================================================
  // KEYBOARD SHORTCUTS
  // ============================================================================
  
  document.addEventListener('keydown', (e) => {
    // ESC to close popup
    if (e.key === 'Escape' && popup && !popup.classList.contains('hidden')) {
      closeModal();
    }
    
    // M to toggle music
    if (e.key === 'm' || e.key === 'M') {
      if (muteBtn) muteBtn.click();
    }
  });

  // ============================================================================
  // CONSOLE EASTER EGG
  // ============================================================================
  
  console.log('%c🎄 Merry Christmas, Lhian! 🎄', 'font-size: 24px; color: #B81722; font-weight: bold; text-shadow: 2px 2px 0px #1C6B2A;');
  console.log('%cMade with ❤️ for you', 'font-size: 14px; color: #1C6B2A;');
  console.log('%cKeyboard shortcuts:', 'font-size: 12px; font-weight: bold; margin-top: 10px;');
  console.log('%c  ESC - Close popup', 'font-size: 11px;');
  console.log('%c  M   - Toggle music', 'font-size: 11px;');

});
