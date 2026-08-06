/* ==========================================================================
   Siva Bharath Car Care - site behaviour
   Vanilla JavaScript only. Each feature is an isolated module so one failure
   can never take down the rest of the page.

   01  Helpers
   02  Sticky navbar + active link
   03  Smooth scrolling
   04  Scroll reveal
   05  Counter animation
   06  Gallery lightbox
   07  Testimonials slider
   08  FAQ accordion
   09  Back to top
   10  Footer year
   ========================================================================== */
(function () {
  'use strict';

  /* == 01  Helpers ======================================================== */
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function $(selector, scope) { return (scope || document).querySelector(selector); }
  function $$(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  }

  /** Runs a module and reports failures without stopping the others. */
  function boot(name, fn) {
    try { fn(); } catch (err) { console.error('[' + name + '] ' + err.message); }
  }

  /* == 02  Sticky navbar + active link =================================== */
  boot('navbar', function () {
    var nav = $('#siteNav');
    var menu = $('#navMenu');
    var toggler = $('.sb-toggler');
    if (!nav) { return; }

    // Solid background once the hero starts scrolling away.
    var stuck = false;
    function onScroll() {
      var shouldStick = window.scrollY > 40;
      if (shouldStick !== stuck) {
        stuck = shouldStick;
        nav.classList.toggle('is-stuck', stuck);
      }
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    // Keep the bar opaque while the mobile menu is open, and keep the toggle's
    // label describing what pressing it will do next.
    if (menu) {
      menu.addEventListener('show.bs.collapse', function () {
        nav.classList.add('is-open');
        if (toggler) { toggler.setAttribute('aria-label', 'Close the navigation menu'); }
      });
      menu.addEventListener('hidden.bs.collapse', function () {
        nav.classList.remove('is-open');
        if (toggler) { toggler.setAttribute('aria-label', 'Open the navigation menu'); }
      });
    }

    // Fallback toggle for the rare case where Bootstrap's JS did not load.
    if (toggler && menu && typeof window.bootstrap === 'undefined') {
      toggler.addEventListener('click', function () {
        var open = menu.classList.toggle('show');
        toggler.setAttribute('aria-expanded', String(open));
        nav.classList.toggle('is-open', open);
      });
    }

    // Highlight the section currently in view.
    var links = $$('.sb-nav__link');
    var sections = links
      .map(function (link) { return document.getElementById(link.getAttribute('href').slice(1)); })
      .filter(Boolean);

    if (!('IntersectionObserver' in window) || !sections.length) { return; }

    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) { return; }
        links.forEach(function (link) {
          var isCurrent = link.getAttribute('href') === '#' + entry.target.id;
          link.classList.toggle('is-active', isCurrent);
          if (isCurrent) { link.setAttribute('aria-current', 'true'); }
          else { link.removeAttribute('aria-current'); }
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    sections.forEach(function (section) { spy.observe(section); });
  });

  /* == 03  Smooth scrolling ============================================== */
  boot('smooth-scroll', function () {
    var nav = $('#siteNav');
    var menu = $('#navMenu');

    function scrollToTarget(target) {
      var navHeight = nav ? nav.offsetHeight : 0;
      var top = target.getBoundingClientRect().top + window.scrollY - navHeight - 12;
      window.scrollTo({
        top: Math.max(top, 0),
        behavior: prefersReducedMotion ? 'auto' : 'smooth'
      });
      // Move focus for keyboard and screen reader users without a second jump.
      if (!target.hasAttribute('tabindex')) { target.setAttribute('tabindex', '-1'); }
      target.focus({ preventScroll: true });
    }

    document.addEventListener('click', function (event) {
      var link = event.target.closest('a[href^="#"]');
      if (!link) { return; }

      var id = link.getAttribute('href');
      if (id === '#' || id.length < 2) { return; }

      var target = document.getElementById(id.slice(1));
      if (!target) { return; }

      event.preventDefault();

      // Close the mobile menu first, then scroll once the layout has settled.
      var isMenuOpen = menu && menu.classList.contains('show');
      if (isMenuOpen) {
        var instance = window.bootstrap && window.bootstrap.Collapse
          ? window.bootstrap.Collapse.getInstance(menu)
          : null;
        if (instance) {
          menu.addEventListener('hidden.bs.collapse', function once() {
            menu.removeEventListener('hidden.bs.collapse', once);
            scrollToTarget(target);
          });
          instance.hide();
        } else {
          menu.classList.remove('show');
          scrollToTarget(target);
        }
      } else {
        scrollToTarget(target);
      }

      if (history.replaceState) { history.replaceState(null, '', id); }
    });
  });

  /* == 04  Scroll reveal ================================================= */
  boot('reveal', function () {
    var items = $$('.sb-reveal');
    if (!items.length) { return; }

    if (!('IntersectionObserver' in window)) {
      items.forEach(function (item) { item.classList.add('is-in'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) { return; }
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    items.forEach(function (item, index) {
      // A short stagger inside each row, capped so nothing lags behind.
      item.style.transitionDelay = (index % 3) * 90 + 'ms';
      observer.observe(item);
    });
  });

  /* == 05  Counter animation ============================================= */
  boot('counters', function () {
    var counters = $$('[data-count]');
    if (!counters.length) { return; }

    function run(el) {
      var target = parseInt(el.getAttribute('data-count'), 10);
      if (isNaN(target)) { return; }

      if (prefersReducedMotion) {
        el.textContent = target.toLocaleString('en-IN');
        return;
      }

      var duration = 1500;
      var start = null;

      function frame(now) {
        if (start === null) { start = now; }
        var progress = Math.min((now - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);           // easeOutCubic
        el.textContent = Math.round(target * eased).toLocaleString('en-IN');
        if (progress < 1) { requestAnimationFrame(frame); }
      }
      requestAnimationFrame(frame);
    }

    if (!('IntersectionObserver' in window)) {
      counters.forEach(run);
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) { return; }
        run(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.6 });

    counters.forEach(function (el) { observer.observe(el); });
  });

  /* == 06  Gallery lightbox ============================================== */
  boot('lightbox', function () {
    var box = $('#lightbox');
    var image = $('#lightboxImg');
    var caption = $('#lightboxCaption');
    var counter = $('#lightboxCount');
    var tiles = $$('.sb-tile');
    if (!box || !image || !tiles.length) { return; }

    var current = 0;
    var lastFocused = null;

    function show(index) {
      current = (index + tiles.length) % tiles.length;
      var tile = tiles[current];
      var img = $('img', tile);

      image.src = img.getAttribute('src');
      image.alt = img.getAttribute('alt');
      caption.textContent = tile.getAttribute('data-caption') || '';
      counter.textContent = (current + 1) + ' / ' + tiles.length;
    }

    function open(index) {
      lastFocused = document.activeElement;
      show(index);
      box.hidden = false;
      document.body.style.overflow = 'hidden';
      $('.sb-lightbox__btn--close', box).focus();
      document.addEventListener('keydown', onKeydown);
    }

    function close() {
      box.hidden = true;
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKeydown);
      if (lastFocused) { lastFocused.focus(); }
    }

    function onKeydown(event) {
      if (event.key === 'Escape') { close(); return; }
      if (event.key === 'ArrowRight') { show(current + 1); return; }
      if (event.key === 'ArrowLeft') { show(current - 1); return; }

      // Keep focus inside the dialog while it is open.
      if (event.key === 'Tab') {
        var focusable = $$('button', box);
        if (!focusable.length) { return; }
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    tiles.forEach(function (tile, index) {
      tile.addEventListener('click', function () { open(index); });
    });

    box.addEventListener('click', function (event) {
      var action = event.target.closest('[data-lightbox]');
      if (!action) { return; }
      var name = action.getAttribute('data-lightbox');
      if (name === 'close') { close(); }
      if (name === 'prev') { show(current - 1); }
      if (name === 'next') { show(current + 1); }
    });
  });

  /* == 07  Testimonials slider =========================================== */
  boot('slider', function () {
    var root = $('#testimonialSlider');
    if (!root) { return; }

    var track = $('.sb-slider__track', root);
    var slides = $$('.sb-slider__slide', root);
    var dotsWrap = $('#sliderDots');
    if (!track || slides.length < 2) { return; }

    var index = 0;
    var timer = null;
    var DELAY = 6500;

    // Dots are built here so the markup never lists more than exists.
    var dots = slides.map(function (slide, i) {
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'sb-slider__dot';
      dot.setAttribute('aria-label', 'Review ' + (i + 1) + ' of ' + slides.length);
      dot.addEventListener('click', function () { goTo(i); restart(); });
      if (dotsWrap) { dotsWrap.appendChild(dot); }
      return dot;
    });

    function render() {
      track.style.transform = 'translate3d(' + (-index * 100) + '%, 0, 0)';
      slides.forEach(function (slide, i) {
        var isCurrent = i === index;
        slide.setAttribute('aria-hidden', String(!isCurrent));
        // Off-screen slides must not be reachable by keyboard.
        $$('a, button', slide).forEach(function (el) {
          if (isCurrent) { el.removeAttribute('tabindex'); }
          else { el.setAttribute('tabindex', '-1'); }
        });
      });
      dots.forEach(function (dot, i) {
        if (i === index) { dot.setAttribute('aria-current', 'true'); }
        else { dot.removeAttribute('aria-current'); }
      });
    }

    function goTo(next) {
      index = (next + slides.length) % slides.length;
      render();
    }

    function start() {
      if (prefersReducedMotion || timer) { return; }
      timer = window.setInterval(function () { goTo(index + 1); }, DELAY);
    }
    function stop() {
      if (timer) { window.clearInterval(timer); timer = null; }
    }
    function restart() { stop(); start(); }

    $$('[data-slider]', root).forEach(function (button) {
      button.addEventListener('click', function () {
        goTo(index + (button.getAttribute('data-slider') === 'next' ? 1 : -1));
        restart();
      });
    });

    // Pause while the visitor is reading or the tab is hidden.
    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);
    root.addEventListener('focusin', stop);
    root.addEventListener('focusout', start);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { stop(); } else { start(); }
    });

    // Keyboard support when the carousel has focus.
    root.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowRight') { goTo(index + 1); restart(); }
      if (event.key === 'ArrowLeft') { goTo(index - 1); restart(); }
    });

    // Swipe on touch and pen.
    var startX = 0;
    var dragging = false;
    var viewport = $('.sb-slider__viewport', root);

    viewport.addEventListener('pointerdown', function (event) {
      if (event.pointerType === 'mouse') { return; }
      dragging = true;
      startX = event.clientX;
      stop();
    });
    viewport.addEventListener('pointerup', function (event) {
      if (!dragging) { return; }
      dragging = false;
      var delta = event.clientX - startX;
      if (Math.abs(delta) > 45) { goTo(index + (delta < 0 ? 1 : -1)); }
      start();
    });
    viewport.addEventListener('pointercancel', function () { dragging = false; start(); });

    render();
    start();
  });

  /* == 08  FAQ accordion ================================================= */
  boot('faq', function () {
    var list = $('#faqList');
    if (!list) { return; }

    var buttons = $$('.sb-faq__btn', list);
    if (!buttons.length) { return; }

    function setOpen(button, open) {
      var panel = document.getElementById(button.getAttribute('aria-controls'));
      button.setAttribute('aria-expanded', String(open));
      if (panel) { panel.setAttribute('data-open', String(open)); }
    }

    // Collapse everything except the first answer, which stays open as a hint.
    buttons.forEach(function (button, i) { setOpen(button, i === 0); });

    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        var willOpen = button.getAttribute('aria-expanded') !== 'true';
        buttons.forEach(function (other) { setOpen(other, false); });
        setOpen(button, willOpen);
      });
    });
  });

  /* == 09  Back to top =================================================== */
  boot('back-to-top', function () {
    var button = $('#backToTop');
    if (!button) { return; }

    var visible = false;
    function onScroll() {
      var shouldShow = window.scrollY > 700;
      if (shouldShow !== visible) {
        visible = shouldShow;
        button.hidden = !visible;
      }
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    button.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      var brand = $('.sb-brand');
      if (brand) { brand.focus({ preventScroll: true }); }
    });
  });

  /* == 10  Footer year =================================================== */
  boot('year', function () {
    var year = $('#year');
    if (year) { year.textContent = String(new Date().getFullYear()); }
  });

})();
