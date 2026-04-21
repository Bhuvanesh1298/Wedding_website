/* ============================================
   Wedding Website — JavaScript
   ============================================ */

(function () {
  'use strict';

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

    const COLORS = ['#ff6b8a','#ff8fa3','#ffb3c6','#ff4d6d','#c9184a','#ff85a1','#ffa3b5','#ffccd5'];
    const petals = [];

    function Petal(burst, ox, oy) {
      this.x    = burst ? ox : Math.random() * petalCanvas.width;
      this.y    = burst ? oy : -20;
      this.size = Math.random() * 10 + 7;
      this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
      this.rot   = Math.random() * Math.PI * 2;
      this.rotV  = (Math.random() - 0.5) * 0.14;
      this.life  = 1;
      this.burst = burst;

      if (burst) {
        const angle = Math.random() * Math.PI * 2;
        const spd   = Math.random() * 14 + 5;
        this.vx = Math.cos(angle) * spd;
        this.vy = Math.sin(angle) * spd - 8;
        this.grav  = 0.35;
        this.decay = 0.007;
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
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo( s * 0.5, -s * 0.5,  s,      -s * 0.15,  s * 0.4,  s * 0.5);
      ctx.bezierCurveTo( s * 0.1,  s * 0.85, -s * 0.1, s * 0.85, -s * 0.4,  s * 0.5);
      ctx.bezierCurveTo(-s,       -s * 0.15, -s * 0.5, -s * 0.5,  0,        0);
      ctx.fillStyle = this.color;
      ctx.fill();
      ctx.restore();
    };

    // Burst
    for (let i = 0; i < 90; i++) petals.push(new Petal(true, originX, originY));

    // Start gentle rain after burst settles
    let rainTimer = setTimeout(() => {
      rainTimer = setInterval(() => petals.push(new Petal(false)), 130);
    }, 900);

    let t = 0;
    let raf;
    function animate() {
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
    scratchCanvas.addEventListener('touchstart', (e) => { e.preventDefault(); painting = true; scratchAt(...getXY(e)); }, { passive: false });
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

  // --- Our Story — horizontal swipe cards ---
  const storySection  = document.getElementById('story');
  const storyPhotoArea = document.getElementById('storyPhotoArea');
  const storySubtitle = document.querySelector('.story__subtitle');
  const storyDesc     = document.querySelector('.story__desc');
  const storyHint     = document.getElementById('storySwipeHint');

  const storyBeats = [
    {
      subtitle: 'How it Started',
      desc: 'A chance encounter neither of us saw coming — one quiet evening that quietly changed everything. This is where our story began.',
      hint: 'swipe to continue →'
    },
    {
      subtitle: 'Where We Are Now',
      desc: 'Through every laugh, every adventure, and every quiet moment together — we found in each other a home. And now, forever awaits.',
      hint: '← swipe · swipe →'
    },
    {
      subtitle: 'What Awaits',
      desc: 'A lifetime of mornings together, of adventures yet to come, and a love that only grows deeper with every passing day.',
      hint: '← swipe back'
    }
  ];

  let storyBeat = 0;
  let swipeTouchStartX = 0;
  let swipeTouchStartY = 0;

  function setStoryBeat(beat) {
    if (beat === storyBeat) return;
    storyBeat = beat;

    // Crossfade text
    storySubtitle.style.opacity = '0';
    storyDesc.style.opacity = '0';
    setTimeout(() => {
      storySubtitle.textContent = storyBeats[beat].subtitle;
      storyDesc.textContent     = storyBeats[beat].desc;
      if (storyHint) storyHint.textContent = storyBeats[beat].hint;
      storySubtitle.style.opacity = '1';
      storyDesc.style.opacity = '1';
    }, 350);

    // Remove all beat classes, apply current
    storySection.classList.remove('story--beat-1', 'story--beat-2');
    if (beat > 0) storySection.classList.add('story--beat-' + beat);
  }

  if (storyPhotoArea) {
    storyPhotoArea.addEventListener('touchstart', (e) => {
      swipeTouchStartX = e.touches[0].clientX;
      swipeTouchStartY = e.touches[0].clientY;
    }, { passive: true });

    // Intercept clearly-horizontal moves so the browser doesn't steal the
    // gesture for page scrolling (which would fire touchcancel instead of touchend)
    storyPhotoArea.addEventListener('touchmove', (e) => {
      const dx = Math.abs(swipeTouchStartX - e.touches[0].clientX);
      const dy = Math.abs(swipeTouchStartY - e.touches[0].clientY);
      if (dx > dy && dx > 8) e.preventDefault();
    }, { passive: false });

    storyPhotoArea.addEventListener('touchend', (e) => {
      const dx = swipeTouchStartX - e.changedTouches[0].clientX;
      const dy = swipeTouchStartY - e.changedTouches[0].clientY;
      // Only fire if clearly horizontal (more X than Y, and at least 40px)
      if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
      if (dx > 0 && storyBeat < storyBeats.length - 1) setStoryBeat(storyBeat + 1); // swipe left → next
      if (dx < 0 && storyBeat > 0) setStoryBeat(storyBeat - 1);                    // swipe right → back
    }, { passive: true });

    // Mouse drag support (desktop)
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
  const rsvpForm = document.getElementById('rsvpForm');
  const rsvpSuccess = document.getElementById('rsvpSuccess');

  if (rsvpForm) {
    rsvpForm.addEventListener('submit', function (e) {
      e.preventDefault();

      // Simulate submission
      const submitBtn = rsvpForm.querySelector('.btn--primary');
      submitBtn.textContent = 'Sending...';
      submitBtn.disabled = true;

      setTimeout(() => {
        rsvpForm.style.display = 'none';
        rsvpSuccess.classList.add('show');
      }, 1000);
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
