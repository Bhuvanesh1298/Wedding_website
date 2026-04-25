/* ============================================
   Wedding Website — JavaScript
   ============================================ */

(function () {
  'use strict';

  // --- Page loader: hide once hero image is ready ---
  const heroImg = document.querySelector('.hero__image');
  const loader  = document.getElementById('pageLoader');
  function dismissLoader() {
    loader.classList.add('fade-out');
    setTimeout(() => loader.remove(), 650);
  }
  if (heroImg && loader) {
    if (heroImg.complete) {
      dismissLoader();
    } else {
      heroImg.addEventListener('load',  dismissLoader, { once: true });
      heroImg.addEventListener('error', dismissLoader, { once: true });
    }
  }

  // --- Scroll-based reveal animations ---
  const scrollObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          scrollObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  document.querySelectorAll('.animate-on-scroll').forEach((el) => {
    scrollObserver.observe(el);
  });

  // --- Gyroscope (shared) ---
  // gyroTarget: raw normalised gamma (-1…+1); gyroX: smoothed value used by petals
  let gyroTarget = 0;
  let gyroX      = 0;
  let _gyroReady = false;

  function _onOrientation(e) {
    // gamma = left/right tilt, ±90°. Map ±45° → ±1 for a responsive feel.
    if (e.gamma != null) gyroTarget = Math.max(-1, Math.min(1, e.gamma / 45));
  }

  function _attachGyroListener() {
    if (_gyroReady) return;
    _gyroReady = true;
    // Chrome on Android exposes 'deviceorientationabsolute' (compass-stabilised).
    // Every other browser uses the standard 'deviceorientation'.
    const evtName = (typeof window.ondeviceorientationabsolute !== 'undefined')
      ? 'deviceorientationabsolute'
      : 'deviceorientation';
    window.addEventListener(evtName, _onOrientation, { passive: true });
  }

  // Android / desktop: no permission gate — attach immediately.
  if (typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission !== 'function') {
    _attachGyroListener();
  }

  // --- Rose petal confetti ---
  function launchPetalConfetti(originX, originY) {
    const petalCanvas = document.createElement('canvas');
    petalCanvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;';
    document.body.appendChild(petalCanvas);
    const pc = petalCanvas.getContext('2d');

    function resize() {
      petalCanvas.width  = window.innerWidth;
      petalCanvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });

    const PETAL_COLORS    = ['#ff6b8a','#ff8fa3','#ffb3c6','#ff4d6d','#c9184a','#ff85a1','#ffa3b5','#ffccd5'];
    const CONFETTI_COLORS = ['#ffd700','#ffe066','#fff0a0','#f4a261','#e8c46a','#ffc94d','#ffffff','#ffb3c6'];
    const SHAPES = ['rect', 'dot', 'ribbon'];
    const petals = [];

    function Petal(burst, ox, oy, shape) {
      // shape: undefined/'petal' = rose petal; 'rect'/'dot'/'ribbon' = confetti
      this.shape = shape || 'petal';
      this.x    = burst ? ox : Math.random() * petalCanvas.width;
      this.y    = burst ? oy : -20;
      this.size = Math.random() * 10 + 7;
      this.color = (this.shape === 'petal')
        ? PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)]
        : CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
      this.rot   = Math.random() * Math.PI * 2;
      this.rotV  = (Math.random() - 0.5) * 0.14;
      this.life  = 1;
      this.burst = burst;

      if (burst) {
        const angle = Math.random() * Math.PI * 2;
        const spd   = Math.random() * 6 + 2;   // softer: was 14+5
        this.vx = Math.cos(angle) * spd;
        this.vy = Math.sin(angle) * spd - 4;   // gentler upward kick: was -8
        this.grav  = 0.18;                      // slower fall: was 0.35
        this.decay = 0.005;                     // lingers longer: was 0.007
      } else {
        this.vx    = (Math.random() - 0.5) * 1.2;
        this.vy    = Math.random() * 1.4 + 0.8;
        this.grav  = 0;
        this.sway  = Math.random() * 0.025 + 0.008;
        this.swayO = Math.random() * Math.PI * 2;
        this.decay = 0.0018;
      }
    }

    Petal.prototype.update = function(t) {
      if (this.burst) {
        this.vy += this.grav;
      } else {
        this.vx += Math.sin(t * this.sway + this.swayO) * 0.04;
        this.vx += gyroX * 0.18;
        this.vx  = Math.max(-6, Math.min(6, this.vx));
      }
      this.x   += this.vx;
      this.y   += this.vy;
      this.rot += this.rotV;
      this.life -= this.decay;
    };

    Petal.prototype.draw = function(ctx) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, this.life);
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rot);
      const s = this.size;
      ctx.fillStyle = this.color;

      if (this.shape === 'petal') {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo( s * 0.5, -s * 0.5,  s,       -s * 0.15,  s * 0.4,  s * 0.5);
        ctx.bezierCurveTo( s * 0.1,  s * 0.85, -s * 0.1,  s * 0.85, -s * 0.4,  s * 0.5);
        ctx.bezierCurveTo(-s,       -s * 0.15, -s * 0.5, -s * 0.5,   0,        0);
        ctx.fill();
      } else if (this.shape === 'rect') {
        // small square confetti
        ctx.fillRect(-s * 0.4, -s * 0.25, s * 0.8, s * 0.5);
      } else if (this.shape === 'dot') {
        // small circle confetti
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.35, 0, Math.PI * 2);
        ctx.fill();
      } else if (this.shape === 'ribbon') {
        // thin elongated strip
        ctx.fillRect(-s * 0.15, -s * 0.6, s * 0.3, s * 1.2);
      }

      ctx.restore();
    };

    // Burst: 55 petals + 45 confetti shapes mixed together
    for (let i = 0; i < 55; i++) petals.push(new Petal(true, originX, originY, 'petal'));
    for (let i = 0; i < 45; i++) petals.push(new Petal(true, originX, originY, SHAPES[i % SHAPES.length]));

    // Start gentle rain after burst settles
    let rainTimer = setTimeout(() => {
      rainTimer = setInterval(() => petals.push(new Petal(false)), 130);
    }, 900);

    let t = 0;
    let raf;
    function animate() {
      gyroX += (gyroTarget - gyroX) * 0.08; // smooth raw sensor → used by Petal.update
      pc.clearRect(0, 0, petalCanvas.width, petalCanvas.height);
      t += 0.016;
      for (let i = petals.length - 1; i >= 0; i--) {
        petals[i].update(t);
        if (petals[i].life > 0) {
          petals[i].draw(pc);
        } else {
          petals.splice(i, 1);
        }
      }
      raf = requestAnimationFrame(animate);
    }
    animate();
  }

  // --- Scratch card ---
  const scratchCanvas = document.getElementById('scratchCanvas');
  if (scratchCanvas) {
    const ctx = scratchCanvas.getContext('2d');
    const card = scratchCanvas.closest('.scratch-card');
    let revealed = false;

    function initScratch() {
      scratchCanvas.width = card.offsetWidth;
      scratchCanvas.height = card.offsetHeight;
      const grad = ctx.createLinearGradient(0, 0, scratchCanvas.width, scratchCanvas.height);
      grad.addColorStop(0, '#b5882a');
      grad.addColorStop(0.5, '#d4a843');
      grad.addColorStop(1, '#b5882a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, scratchCanvas.width, scratchCanvas.height);
      ctx.fillStyle = 'rgba(245,237,218,0.55)';
      ctx.font = 'italic 14px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('✦  Scratch to reveal  ✦', scratchCanvas.width / 2, scratchCanvas.height / 2);
    }
    initScratch();

    let painting = false;

    function getXY(e) {
      const r = scratchCanvas.getBoundingClientRect();
      const src = e.touches ? e.touches[0] : e;
      return [src.clientX - r.left, src.clientY - r.top];
    }

    function scratchAt(x, y) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, 28, 0, Math.PI * 2);
      ctx.fill();
      checkReveal();
    }

    function checkReveal() {
      if (revealed) return;
      const data = ctx.getImageData(0, 0, scratchCanvas.width, scratchCanvas.height).data;
      let cleared = 0;
      for (let i = 3; i < data.length; i += 4) { if (data[i] < 128) cleared++; }
      if (cleared / (data.length / 4) > 0.5) {
        revealed = true;
        scratchCanvas.style.transition = 'opacity 0.6s ease';
        scratchCanvas.style.opacity = '0';
        scratchCanvas.style.pointerEvents = 'none';
        const rect = card.getBoundingClientRect();
        launchPetalConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2);
      }
    }

    scratchCanvas.addEventListener('mousedown', (e) => { painting = true; scratchAt(...getXY(e)); });
    scratchCanvas.addEventListener('mousemove', (e) => { if (painting) scratchAt(...getXY(e)); });
    window.addEventListener('mouseup', () => { painting = false; });
    scratchCanvas.addEventListener('touchstart', (e) => {
      // iOS 13+: touchstart IS a valid user-activation context for the permission API.
      // Request here so gyro is live before the card is fully revealed.
      if (!_gyroReady &&
          typeof DeviceOrientationEvent !== 'undefined' &&
          typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
          .then(state => { if (state === 'granted') _attachGyroListener(); })
          .catch(() => {});
      }
      e.preventDefault();
      painting = true;
      scratchAt(...getXY(e));
    }, { passive: false });
    scratchCanvas.addEventListener('touchmove', (e) => { e.preventDefault(); if (painting) scratchAt(...getXY(e)); }, { passive: false });
    window.addEventListener('touchend', () => { painting = false; });
  }

  // --- Countdown timer ---
  // Update WEDDING_DATE to the actual date when known
  const WEDDING_DATE = new Date('2026-07-02T09:00:00');

  function updateCountdown() {
    const now = new Date();
    const diff = WEDDING_DATE - now;
    if (diff <= 0) {
      ['cd-days','cd-hours','cd-minutes','cd-seconds'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = '00';
      });
      return;
    }
    const days    = Math.floor(diff / 86400000);
    const hours   = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    const fmt = n => String(n).padStart(2, '0');
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = fmt(val); };
    set('cd-days', days);
    set('cd-hours', hours);
    set('cd-minutes', minutes);
    set('cd-seconds', seconds);
  }
  updateCountdown();
  setInterval(updateCountdown, 1000);

  // --- Our Story — horizontal swipe carousel ---
  const storySection   = document.getElementById('story');
  const storyPhotoArea = document.getElementById('storyPhotoArea');
  const storySubtitle  = document.querySelector('.story__subtitle');
  const storyDesc      = document.querySelector('.story__desc');
  const storyHint      = document.getElementById('storySwipeHint');

  const storyBeats = [
    {
      subtitle: 'Once upon a Batchmate',
      desc: 'Not soulmates, or so we thought. No shared classes, no reasons to meet \u2013 just a club, a bunch of friends and zero idea what was coming.',
      hint: 'swipe to continue \u2192'
    },
    {
      subtitle: 'The Perfect Sunrise',
      desc: 'A beach, a dawn and something neither of us planned. Old friends brought us back together. The ocean did the rest.',
      hint: '\u2190 swipe \u00b7 swipe \u2192'
    },
    {
      subtitle: 'Garba and 4AM confession',
      desc: 'The Garba night that refused to end and the streets that stretched till sunrise, a little caf\u00e9 at dawn heard everything our hearts whispered.',
      hint: '\u2190 swipe \u00b7 swipe \u2192'
    },
    {
      subtitle: 'Sealed by the mountains',
      desc: 'He had the feeling. She had a plan. The Munnar hills had the front row. She asked the question with a crocheted bouquet. He said Yes before the hills could echo it back.',
      hint: '\u2190 swipe back'
    }
  ];

  const BEAT_CLASSES = ['story--beat-1', 'story--beat-2', 'story--beat-3'];
  let storyBeat = 0;
  let swipeTouchStartX = 0;
  let swipeTouchStartY = 0;

  function setStoryBeat(beat) {
    if (beat === storyBeat) return;
    storyBeat = beat;

    storySubtitle.style.opacity = '0';
    storyDesc.style.opacity = '0';
    setTimeout(() => {
      storySubtitle.textContent = storyBeats[beat].subtitle;
      storyDesc.textContent     = storyBeats[beat].desc;
      if (storyHint) storyHint.textContent = storyBeats[beat].hint;
      storySubtitle.style.opacity = '1';
      storyDesc.style.opacity = '1';
    }, 350);

    storySection.classList.remove(...BEAT_CLASSES);
    if (beat > 0) storySection.classList.add('story--beat-' + beat);
  }

  if (storyPhotoArea) {
    storyPhotoArea.addEventListener('touchstart', (e) => {
      swipeTouchStartX = e.touches[0].clientX;
      swipeTouchStartY = e.touches[0].clientY;
    }, { passive: true });

    storyPhotoArea.addEventListener('touchmove', (e) => {
      const dx = Math.abs(swipeTouchStartX - e.touches[0].clientX);
      const dy = Math.abs(swipeTouchStartY - e.touches[0].clientY);
      if (dx > dy && dx > 8) e.preventDefault();
    }, { passive: false });

    storyPhotoArea.addEventListener('touchend', (e) => {
      const dx = swipeTouchStartX - e.changedTouches[0].clientX;
      const dy = swipeTouchStartY - e.changedTouches[0].clientY;
      if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
      if (dx > 0 && storyBeat < storyBeats.length - 1) setStoryBeat(storyBeat + 1);
      if (dx < 0 && storyBeat > 0) setStoryBeat(storyBeat - 1);
    }, { passive: true });

    let mouseStartX = 0;
    let mouseDown = false;
    storyPhotoArea.addEventListener('mousedown', (e) => { mouseDown = true; mouseStartX = e.clientX; });
    storyPhotoArea.addEventListener('mouseup', (e) => {
      if (!mouseDown) return;
      mouseDown = false;
      const dx = mouseStartX - e.clientX;
      if (Math.abs(dx) < 40) return;
      if (dx > 0 && storyBeat < storyBeats.length - 1) setStoryBeat(storyBeat + 1);
      if (dx < 0 && storyBeat > 0) setStoryBeat(storyBeat - 1);
    });
  }

  // --- Hero scroll parallax ---
  const heroImage = document.querySelector('.hero__image');
  const heroWrapper = document.querySelector('.hero__image-wrapper');

  function handleHeroParallax() {
    if (!heroImage || !heroWrapper) return;
    const scrollY = window.pageYOffset;
    const heroBottom = heroWrapper.getBoundingClientRect().bottom + scrollY;
    if (scrollY < heroBottom) {
      heroImage.style.transform = 'translateY(' + scrollY * 0.3 + 'px)';
    }
  }

  window.addEventListener('scroll', handleHeroParallax, { passive: true });

  // --- Navbar scroll behavior ---
  const navbar = document.getElementById('navbar');
  let lastScroll = 0;

  function handleNavbarScroll() {
    const currentScroll = window.pageYOffset;
    if (currentScroll > 10) {
      navbar.classList.add('scrolled');
    } else if (currentScroll === 0) {
      navbar.classList.remove('scrolled');
    }
    lastScroll = currentScroll;
  }

  window.addEventListener('scroll', handleNavbarScroll, { passive: true });
  handleNavbarScroll();

  // --- Mobile navigation toggle ---
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');

  // Create overlay element
  const navOverlay = document.createElement('div');
  navOverlay.classList.add('nav-overlay');
  document.body.appendChild(navOverlay);

  function toggleNav() {
    navToggle.classList.toggle('active');
    navLinks.classList.toggle('open');
    navOverlay.classList.toggle('active');
    document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
  }

  function closeNav() {
    navToggle.classList.remove('active');
    navLinks.classList.remove('open');
    navOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  navToggle.addEventListener('click', toggleNav);
  navOverlay.addEventListener('click', closeNav);

  // Close nav when clicking a link
  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeNav);
  });

  // --- Smooth scroll for anchor links ---
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        const navHeight = navbar.offsetHeight;
        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight;
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth',
        });
      }
    });
  });

  // --- Hide scroll indicator on scroll ---
  const scrollIndicator = document.querySelector('.hero__scroll-indicator');
  function handleScrollIndicator() {
    if (window.pageYOffset > 100) {
      scrollIndicator.style.opacity = '0';
      scrollIndicator.style.pointerEvents = 'none';
    } else {
      scrollIndicator.style.opacity = '1';
      scrollIndicator.style.pointerEvents = 'auto';
    }
  }
  window.addEventListener('scroll', handleScrollIndicator, { passive: true });

  // --- RSVP Form handling ---
  // Replace the placeholder below with your deployed Apps Script URL
  const SHEET_URL = 'https://script.google.com/macros/s/AKfycbxOQdCx-psjaWCPJr_1NJMWthMDbbpHx4nZWlpZtECV8nETTrjrE085XpwTxVdLiGqZcw/exec';

  const rsvpForm = document.getElementById('rsvpForm');
  const rsvpSuccess = document.getElementById('rsvpSuccess');

  if (rsvpForm) {
    const rsvpSadMsg      = document.getElementById('rsvpSadMsg');
    const rsvpEventsGroup = document.getElementById('rsvpEventsGroup');
    const rsvpGuestsGroup = document.getElementById('rsvpGuestsGroup');
    const rsvpSuccessNo   = document.getElementById('rsvpSuccessNo');

    const errorAttending = document.getElementById('errorAttending');
    const errorName      = document.getElementById('errorName');

    rsvpForm.querySelectorAll('input[name="attending"]').forEach(radio => {
      radio.addEventListener('change', () => {
        const val = rsvpForm.querySelector('input[name="attending"]:checked')?.value;
        rsvpSadMsg.classList.toggle('show', val === 'no');
        rsvpEventsGroup.classList.toggle('show', val === 'yes');
        rsvpGuestsGroup.style.display = val === 'no' ? 'none' : '';
        errorAttending.classList.remove('show');
      });
    });

    rsvpForm.querySelector('#name').addEventListener('input', () => {
      errorName.classList.remove('show');
    });

    rsvpForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const attending  = rsvpForm.querySelector('input[name="attending"]:checked');
      const nameVal    = rsvpForm.querySelector('#name').value.trim();
      let valid = true;

      if (!attending) { errorAttending.classList.add('show'); valid = false; }
      if (!nameVal)   { errorName.classList.add('show');      valid = false; }
      if (!valid) return;

      const submitBtn = rsvpForm.querySelector('.btn--primary');
      submitBtn.textContent = 'Sending…';
      submitBtn.disabled = true;
      const isNo       = attending?.value === 'no';
      const joiningFor = [...rsvpForm.querySelectorAll('input[name="events"]:checked')]
        .map(cb => cb.value).join(', ');
      const payload = {
        joining:    attending ? attending.value : '',
        name:       nameVal,
        guests:     isNo ? '' : rsvpForm.querySelector('#guests').value,
        joiningFor: joiningFor,
        note:       rsvpForm.querySelector('#note').value.trim()
      };

      fetch(SHEET_URL, {
        method: 'POST',
        mode:   'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body:   JSON.stringify(payload)
      })
        .then(() => {
          rsvpForm.style.display = 'none';
          if (isNo) {
            rsvpSuccessNo.classList.add('show');
          } else {
            rsvpSuccess.classList.add('show');
          }
        })
        .catch(() => {
          submitBtn.textContent = 'Try again';
          submitBtn.disabled = false;
        });
    });
  }

  // --- Active nav link highlighting on scroll ---
  const sections = document.querySelectorAll('section[id]');

  function highlightNavLink() {
    const scrollY = window.pageYOffset + 100;

    sections.forEach((section) => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      const sectionId = section.getAttribute('id');
      const navLink = document.querySelector(`.navbar__links a[href="#${sectionId}"]`);

      if (navLink) {
        if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
          navLink.classList.add('active');
        } else {
          navLink.classList.remove('active');
        }
      }
    });
  }

  window.addEventListener('scroll', highlightNavLink, { passive: true });
})();
