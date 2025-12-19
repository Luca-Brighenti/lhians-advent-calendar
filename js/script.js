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

  function renderDay15Popup() {
    popupContent.innerHTML = `
      <h2 id="popup-title">🎯 Challenge Time!</h2>
      <p style="font-size: 1.2rem; margin: 20px 0;">Have Fun Beating Me</p>
      <p style="margin: 16px 0;">
        <a href="https://humanbenchmark.com/" target="_blank" rel="noopener" 
           style="color: var(--green); font-weight: 600; font-size: 1.1rem; text-decoration: underline;">
          🧠 Human Benchmark →
        </a>
      </p>
      <button id="close-btn" class="close-btn" aria-label="Close popup" type="button">Close</button>
    `;

    popup.classList.remove('hidden');
    bindCloseButton();
  }

  function renderDay16QuizPopup() {
    // Quiz questions with images and answers
    const QUIZ_QUESTIONS = [
      {
        question: "What is C?",
        options: [
          "A web browser",
          "A programming language",
          "An operating system",
          "A text editor"
        ],
        correct: 1 // Index of correct answer (b)
      },
      {
        question: "Which of the following is a valid C comment?",
        options: [
          "# This is a comment",
          "// This is a comment",
          "-- This is a comment",
          "** This is a comment"
        ],
        correct: 1 // (b)
      },
      {
        question: "Which line correctly includes the standard input/output header in C?",
        options: [
          "#include <stdio.h>",
          '#include "stdio.h"',
          "include <stdio.h>",
          "import <stdio.h>"
        ],
        correct: 0 // (a)
      },
      {
        question: "Which function is the entry point of every C program?",
        options: [
          "start()",
          "main()",
          "begin()",
          "run()"
        ],
        correct: 1 // (b)
      },
      {
        question: 'Which line correctly prints "Hello, world!" followed by a new line?',
        options: [
          'printf("Hello, world!");',
          'print("Hello, world!\\n");',
          'printf("Hello, world!\\n");',
          'cout << "Hello, world!" << endl;'
        ],
        correct: 2 // (c)
      },
      {
        question: "Which of these is a correct declaration of an integer variable in C?",
        options: [
          "int x;",
          "integer x;",
          "num x;",
          "x int;"
        ],
        correct: 0 // (a)
      },
      {
        question: "What is the output of this code?\n\nint x = 10;\nprintf(\"%d\", x);",
        options: [
          "Nothing (no output)",
          "x",
          "10",
          "%d"
        ],
        correct: 2 // (c) 10
      }
    ];

    let currentQuestion = 0;

    function renderQuestion() {
      const q = QUIZ_QUESTIONS[currentQuestion];
      const optionLabels = ['a)', 'b)', 'c)', 'd)'];
      
      popupContent.innerHTML = `
        <h2 id="popup-title">📚 C Programming Quiz</h2>
        <p style="font-size: 0.9rem; color: #666; margin-bottom: 16px;">
          Question ${currentQuestion + 1} of ${QUIZ_QUESTIONS.length}
        </p>
        <div style="margin: 20px 0; text-align: left; max-width: 500px; margin-left: auto; margin-right: auto;">
          <p style="font-weight: 600; font-size: 1.1rem; margin-bottom: 16px; white-space: pre-wrap;">${q.question}</p>
          <form id="quiz-form">
            ${q.options.map((option, index) => `
              <label style="display: block; padding: 10px; margin: 8px 0; background: ${index === q.correct ? 'rgba(28, 107, 42, 0.05)' : 'rgba(0,0,0,0.02)'}; border-radius: 8px; cursor: pointer; border: 2px solid transparent; transition: all 0.2s;" 
                     class="quiz-option" data-index="${index}">
                <input type="radio" name="answer" value="${index}" style="margin-right: 8px;">
                <strong>${optionLabels[index]}</strong> ${option}
              </label>
            `).join('')}
            <button type="submit" class="submit-btn" style="margin-top: 16px;">Submit Answer</button>
          </form>
          <div id="quiz-feedback" class="answer-feedback" style="margin-top: 12px;"></div>
        </div>
        <button id="close-btn" class="close-btn" aria-label="Close popup" type="button">Close</button>
      `;

      popup.classList.remove('hidden');
      bindCloseButton();

      const form = document.getElementById('quiz-form');
      const feedback = document.getElementById('quiz-feedback');
      
      // Add hover effect to options
      document.querySelectorAll('.quiz-option').forEach(label => {
        label.addEventListener('mouseenter', () => {
          label.style.borderColor = 'var(--green)';
          label.style.background = 'rgba(28, 107, 42, 0.08)';
        });
        label.addEventListener('mouseleave', () => {
          if (!label.querySelector('input').checked) {
            label.style.borderColor = 'transparent';
            const index = parseInt(label.dataset.index);
            label.style.background = index === q.correct ? 'rgba(28, 107, 42, 0.05)' : 'rgba(0,0,0,0.02)';
          }
        });
      });

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const selected = form.querySelector('input[name="answer"]:checked');
        
        if (!selected) {
          feedback.textContent = '⚠️ Please select an answer!';
          feedback.className = 'answer-feedback bad';
          return;
        }

        const answer = parseInt(selected.value);
        
        if (answer === q.correct) {
          feedback.textContent = '✅ Correct!';
          feedback.className = 'answer-feedback ok';
          
          try { 
            trumpetSfx.currentTime = 0; 
            trumpetSfx.play(); 
          } catch (_) {}

          currentQuestion++;
          
          if (currentQuestion < QUIZ_QUESTIONS.length) {
            showToast(`✅ Correct! Question ${currentQuestion + 1} coming up...`);
            setTimeout(() => renderQuestion(), 1500);
          } else {
            // Quiz completed
            setTimeout(() => {
              popupContent.innerHTML = `
                <h2 id="popup-title">🎉 Quiz Complete!</h2>
                <p style="font-size: 1.3rem; margin: 20px 0;">Perfect Score!</p>
                <p style="font-size: 1.1rem; margin: 16px 0;">
                  You got all ${QUIZ_QUESTIONS.length} questions correct! 🎯
                </p>
                <p style="font-size: 1rem; color: #666;">You may now open your gift! 🎁</p>
                <button id="close-btn" class="close-btn" type="button" aria-label="Close popup">Close</button>
              `;
              createConfetti();
              bindCloseButton();
            }, 1500);
          }
        } else {
          feedback.textContent = '❌ Wrong! Try again.';
          feedback.className = 'answer-feedback bad';
          
          // Shake the form
          form.style.animation = 'shake 0.3s ease-in-out';
          setTimeout(() => {
            form.style.animation = '';
          }, 300);
        }
      });
    }

    renderQuestion();
  }

  function renderDay17MathQuiz() {
    // Math quiz questions based on uploaded images
    const MATH_QUESTIONS = [
      {
        question: "The probability distribution table for a discrete random variable X is shown.\n\nWhat is the value of P(X = 3)?",
        note: "Given: P(X=1) = 0.4, P(X=2) = 0.2",
        options: ["0.2", "0.4", "1.2", "2.0"],
        correct: 1 // 0.4
      },
      {
        question: "Which graph could represent y = 4ˣ?",
        options: [
          "A. Exponential growth curve starting from origin",
          "B. Exponential decay curve",
          "C. Linear decreasing line",
          "D. V-shaped graph"
        ],
        correct: 0 // A - exponential growth
      },
      {
        question: "What is the domain of the function y = √(6 - x²)?",
        options: [
          "(0, √6)",
          "[0, √6]",
          "(-√6, √6)",
          "[-√6, √6]"
        ],
        correct: 3 // D. [-√6, √6]
      },
      {
        question: "Which of the following best represents the graph of y = -5x(x - 2)(3 - x)?",
        note: "Consider the zeros at x = 0, 2, and 3",
        options: [
          "A. Cubic with positive leading coefficient",
          "B. Cubic with negative leading coefficient, zeros at 0, 2, 3",
          "C. Cubic with two turning points, starting positive",
          "D. Cubic with two turning points, starting negative"
        ],
        correct: 1 // B
      },
      {
        question: "What is ∫(1/√(x+5))dx?",
        options: [
          "(1/2)√(x+5) + C",
          "2√(x+5) + C",
          "-(1/2)√(x+5) + C",
          "-2√(x+5) + C"
        ],
        correct: 1 // B. 2√(x+5) + C
      },
      {
        question: "The graph of y = f(x) is shown. Which of the following is the graph of y = -f(-x)?",
        note: "This transformation reflects across both axes",
        options: [
          "A. Reflection across y-axis only",
          "B. Reflection across x-axis only",
          "C. Reflection across both axes (180° rotation)",
          "D. No reflection"
        ],
        correct: 2 // C
      },
      {
        question: "A ten-sided die has faces numbered 1 to 10. The probability of rolling a 1 is greater than the probability of rolling any other number. Numbers 2-10 are equally likely.\n\nWhen rolled 153 times, a 1 is obtained 72 times.\n\nBy using relative frequency, what is the best estimate for the probability of rolling a 10?",
        options: ["1/17", "1/11", "1/10", "1/9"],
        correct: 3 // D. 1/9
      },
      {
        question: "The minimum daily temperature, in degrees, of a town each year follows a normal distribution with its mean equal to its standard deviation. The minimum daily temperature was recorded over one year.\n\nWhat percentage of the recorded minimum daily temperatures was above zero degrees?",
        options: ["16%", "50%", "68%", "84%"],
        correct: 3 // D. 84%
      },
      {
        question: "Given f(1) = 6 and the graph of y = f'(x), which interval includes the best estimate for f(1.1)?",
        note: "Looking at the derivative graph to estimate the change",
        options: [
          "[6.2, 6.4)",
          "[6.0, 6.2)",
          "[5.8, 6.0)",
          "[5.6, 5.8)"
        ],
        correct: 1 // B. [6.0, 6.2)
      },
      {
        question: "The graph of y = f(x), with all its stationary points, is shown.\n\nHow many stationary points does the graph of y = f(eˣ) have?",
        options: ["0", "1", "2", "3"],
        correct: 3 // D. 3
      }
    ];

    let currentQuestion = 0;

    function renderMathQuestion() {
      const q = MATH_QUESTIONS[currentQuestion];
      const optionLabels = ['A.', 'B.', 'C.', 'D.'];
      
      popupContent.innerHTML = `
        <h2 id="popup-title">📐 Mathematics Quiz</h2>
        <p style="font-size: 0.9rem; color: #666; margin-bottom: 16px;">
          Question ${currentQuestion + 1} of ${MATH_QUESTIONS.length}
        </p>
        <div style="margin: 20px 0; text-align: left; max-width: 540px; margin-left: auto; margin-right: auto;">
          <p style="font-weight: 600; font-size: 1.05rem; margin-bottom: 12px; white-space: pre-wrap; line-height: 1.6;">${q.question}</p>
          ${q.note ? `<p style="font-size: 0.9rem; color: #666; font-style: italic; margin-bottom: 12px;">${q.note}</p>` : ''}
          <form id="math-quiz-form">
            ${q.options.map((option, index) => `
              <label style="display: block; padding: 12px; margin: 10px 0; background: rgba(0,0,0,0.02); border-radius: 8px; cursor: pointer; border: 2px solid transparent; transition: all 0.2s;" 
                     class="math-quiz-option" data-index="${index}">
                <input type="radio" name="answer" value="${index}" style="margin-right: 8px;">
                <strong>${optionLabels[index]}</strong> ${option}
              </label>
            `).join('')}
            <button type="submit" class="submit-btn" style="margin-top: 16px;">Submit Answer</button>
          </form>
          <div id="math-quiz-feedback" class="answer-feedback" style="margin-top: 12px;"></div>
        </div>
        <button id="close-btn" class="close-btn" aria-label="Close popup" type="button">Close</button>
      `;

      popup.classList.remove('hidden');
      bindCloseButton();

      const form = document.getElementById('math-quiz-form');
      const feedback = document.getElementById('math-quiz-feedback');
      
      // Add hover effect to options
      document.querySelectorAll('.math-quiz-option').forEach(label => {
        label.addEventListener('mouseenter', () => {
          label.style.borderColor = 'var(--green)';
          label.style.background = 'rgba(28, 107, 42, 0.08)';
        });
        label.addEventListener('mouseleave', () => {
          if (!label.querySelector('input').checked) {
            label.style.borderColor = 'transparent';
            label.style.background = 'rgba(0,0,0,0.02)';
          }
        });
      });

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const selected = form.querySelector('input[name="answer"]:checked');
        
        if (!selected) {
          feedback.textContent = '⚠️ Please select an answer!';
          feedback.className = 'answer-feedback bad';
          return;
        }

        const answer = parseInt(selected.value);
        
        if (answer === q.correct) {
          feedback.textContent = '✅ Correct!';
          feedback.className = 'answer-feedback ok';
          
          try { 
            trumpetSfx.currentTime = 0; 
            trumpetSfx.play(); 
          } catch (_) {}

          currentQuestion++;
          
          if (currentQuestion < MATH_QUESTIONS.length) {
            showToast(`✅ Correct! Question ${currentQuestion + 1} coming up...`);
            setTimeout(() => renderMathQuestion(), 1500);
          } else {
            // Quiz completed
            setTimeout(() => {
              popupContent.innerHTML = `
                <h2 id="popup-title">🎉 Outstanding Work!</h2>
                <p style="font-size: 1.3rem; margin: 20px 0;">Perfect Score! 💯</p>
                <p style="font-size: 1.1rem; margin: 16px 0;">
                  You conquered all ${MATH_QUESTIONS.length} challenging math questions! 🎯
                </p>
                <p style="font-size: 1rem; color: #666;">Your mathematical prowess is impressive!</p>
                <p style="font-size: 1rem; margin-top: 12px;">You may now open your gift! 🎁</p>
                <button id="close-btn" class="close-btn" type="button" aria-label="Close popup">Close</button>
              `;
              createConfetti();
              bindCloseButton();
            }, 1500);
          }
        } else {
          feedback.textContent = '❌ Not quite! Try again.';
          feedback.className = 'answer-feedback bad';
          
          // Shake the form
          form.style.animation = 'shake 0.3s ease-in-out';
          setTimeout(() => {
            form.style.animation = '';
          }, 300);
        }
      });
    }

    renderMathQuestion();
  }

  function renderDay18Popup() {
    popupContent.innerHTML = `
      <h2 id="popup-title">🎓 Congratulations!</h2>
      <p style="font-size: 1.4rem; margin: 20px 0; font-weight: 600; color: var(--green);">
        Congratulations on Your Scholarship!
      </p>
      <p style="font-size: 1.2rem; margin: 16px 0;">
        🌟 Your hard work has paid off! 🌟
      </p>
      <p style="font-size: 1.1rem; margin: 16px 0; color: #555;">
        Go open your gift to celebrate this amazing achievement!
      </p>
      <div style="font-size: 3rem; margin: 20px 0;">🎁🎉</div>
      <button id="close-btn" class="close-btn" aria-label="Close popup" type="button">Close</button>
    `;

    popup.classList.remove('hidden');
    bindCloseButton();
    
    // Play celebration sound and confetti
    try { 
      trumpetSfx.currentTime = 0; 
      trumpetSfx.play(); 
    } catch (_) {}
    
    createConfetti();
  }

  function renderDay19Popup() {
    popupContent.innerHTML = `
      <h2 id="popup-title">🎵 Audio Mystery</h2>
      <p style="font-size: 1.1rem; margin: 16px 0;">
        Download and listen to this audio file carefully...
      </p>
      
      <button id="download-audio-btn" class="download-btn" type="button" style="margin: 20px auto;">
        ⬇️ Download Coagula.wav
      </button>
      
      <div style="margin: 24px 0; padding: 20px; background: rgba(0,0,0,0.03); border-radius: 12px; border: 2px dashed var(--green);">
        <p style="font-size: 1rem; font-weight: 600; margin-bottom: 12px;">
          What do you hear? Enter the code:
        </p>
        <form id="audio-code-form" style="display: flex; flex-direction: column; align-items: center; gap: 12px;">
          <input 
            id="audio-code-input" 
            type="text" 
            class="answer-input" 
            placeholder="Enter code here" 
            autocomplete="off"
            style="text-align: center; font-size: 1.1rem; text-transform: uppercase; letter-spacing: 2px; max-width: 200px;"
          />
          <button type="submit" class="submit-btn">Submit Code</button>
        </form>
        <div id="audio-code-feedback" class="answer-feedback" style="margin-top: 12px;"></div>
      </div>
      
      <button id="close-btn" class="close-btn" aria-label="Close popup" type="button">Close</button>
    `;

    popup.classList.remove('hidden');
    bindCloseButton();

    const downloadBtn = document.getElementById('download-audio-btn');
    const form = document.getElementById('audio-code-form');
    const input = document.getElementById('audio-code-input');
    const feedback = document.getElementById('audio-code-feedback');

    // Download button handler
    if (downloadBtn) {
      downloadBtn.addEventListener('click', (e) => {
        e.stopPropagation();

        const link = document.createElement('a');
        link.href = 'assets/Coagula.wav';
        link.download = 'Coagula.wav';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast('📥 Coagula.wav downloaded! Listen carefully...');
        
        // Visual feedback on button
        downloadBtn.textContent = '✓ Downloaded!';
        downloadBtn.style.background = 'linear-gradient(135deg, var(--ok), #1e7e34)';
        setTimeout(() => {
          downloadBtn.textContent = '⬇️ Download Coagula.wav';
          downloadBtn.style.background = '';
        }, 2000);
      });
    }

    // Auto-focus input after animation
    setTimeout(() => input && input.focus(), 300);

    // Form submission handler
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const answer = input.value.trim().toUpperCase();
      
      if (!answer) {
        feedback.textContent = '⚠️ Please enter a code!';
        feedback.className = 'answer-feedback bad';
        return;
      }

      if (answer === 'B4Z') {
        // Correct answer
        feedback.textContent = '✅ Correct!';
        feedback.className = 'answer-feedback ok';
        
        try { 
          trumpetSfx.currentTime = 0; 
          trumpetSfx.play(); 
        } catch (_) {}

        setTimeout(() => {
          popupContent.innerHTML = `
            <h2 id="popup-title">🎉 Code Cracked!</h2>
            <p style="font-size: 1.3rem; margin: 20px 0;">You deciphered the audio message!</p>
            <p style="font-size: 1.1rem; margin: 16px 0; color: #555;">
              The code <strong style="color: var(--green); letter-spacing: 2px;">B4Z</strong> was hidden in the sound waves.
            </p>
            <p style="font-size: 1rem; margin-top: 20px;">You may now open your gift! 🎁</p>
            <button id="close-btn" class="close-btn" type="button" aria-label="Close popup">Close</button>
          `;
          createConfetti();
          bindCloseButton();
        }, 1500);
      } else {
        // Wrong answer
        feedback.textContent = `❌ "${answer}" is incorrect. Listen more carefully...`;
        feedback.className = 'answer-feedback bad';
        
        // Shake the input
        input.style.animation = 'shake 0.3s ease-in-out';
        setTimeout(() => {
          input.style.animation = '';
          input.select();
        }, 300);
      }
    });
  }

  function renderDay20Popup() {
    popupContent.innerHTML = `
      <h2 id="popup-title">💻 Coding Challenge</h2>
      
      <div style="margin: 20px 0; padding: 20px; background: rgba(0,0,0,0.04); border-radius: 12px; border-left: 4px solid var(--green); text-align: left;">
        <p style="font-size: 1.05rem; font-weight: 600; margin-bottom: 16px; color: var(--red);">
          📝 Your Mission:
        </p>
        <p style="font-size: 1rem; line-height: 1.7; margin-bottom: 12px;">
          Code me a program that takes a number from the user and:
        </p>
        <ul style="font-size: 0.95rem; line-height: 1.8; margin-left: 20px; list-style-type: disc;">
          <li>If it's equal to <strong>19</strong>, print out <code style="background: rgba(0,0,0,0.08); padding: 2px 6px; border-radius: 4px;">'Happy Anniversary'</code></li>
          <li>Otherwise, if it's less than <strong>18</strong>, print out <code style="background: rgba(0,0,0,0.08); padding: 2px 6px; border-radius: 4px;">'Epsteins Island'</code></li>
          <li>For all other input, print out <code style="background: rgba(0,0,0,0.08); padding: 2px 6px; border-radius: 4px;">'I love you'</code></li>
        </ul>
      </div>
      
      <p style="font-size: 1rem; margin: 20px 0; font-weight: 600;">
        📚 Study Materials:
      </p>
      
      <div style="display: flex; flex-direction: column; gap: 10px; margin: 16px 0;">
        <button id="download-lecture1" class="download-btn lecture-btn" type="button">
          📄 Download Lecture 1
        </button>
        <button id="download-lecture2" class="download-btn lecture-btn" type="button">
          📄 Download Lecture 2
        </button>
        <button id="download-lecture3" class="download-btn lecture-btn" type="button">
          📄 Download Lecture 3
        </button>
      </div>
      
      <p style="font-size: 0.9rem; color: #666; margin: 16px 0; font-style: italic;">
        💡 Use these lectures to help you learn the basics and complete the challenge!
      </p>
      
      <button id="close-btn" class="close-btn" aria-label="Close popup" type="button">Close</button>
    `;

    popup.classList.remove('hidden');
    bindCloseButton();

    // Download handlers for each lecture
    const lectures = [
      { id: 'download-lecture1', file: 'lecture1.pdf', name: 'Lecture 1' },
      { id: 'download-lecture2', file: 'lecture2.pdf', name: 'Lecture 2' },
      { id: 'download-lecture3', file: 'lecture 3.pdf', name: 'Lecture 3' }
    ];

    lectures.forEach(lecture => {
      const btn = document.getElementById(lecture.id);
      if (btn) {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();

          const link = document.createElement('a');
          link.href = `assets/${lecture.file}`;
          link.download = lecture.file;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          showToast(`📥 ${lecture.name} downloaded!`);
          
          // Visual feedback on button
          const originalText = btn.innerHTML;
          btn.innerHTML = `✓ ${lecture.name} Downloaded!`;
          btn.style.background = 'linear-gradient(135deg, var(--ok), #1e7e34)';
          setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.background = '';
          }, 2000);
        });
      }
    });
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
        case 15:
          renderDay15Popup();
          break;
        case 16:
          renderDay16QuizPopup();
          break;
        case 17:
          renderDay17MathQuiz();
          break;
        case 18:
          renderDay18Popup();
          break;
        case 19:
          renderDay19Popup();
          break;
        case 20:
          renderDay20Popup();
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
