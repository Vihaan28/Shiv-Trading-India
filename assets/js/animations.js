/* ==========================================================================
   animations.js
   Scroll reveals via IntersectionObserver, plus a light hero parallax.
   Both are disabled outright when the visitor prefers reduced motion.
   ========================================================================== */

window.STI = window.STI || {};

(function (STI) {
  'use strict';

  document.documentElement.classList.remove('no-js');

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* -------------------------------------------------------- scroll reveal -- */

  var observer = null;

  function ensureObserver() {
    if (observer || !('IntersectionObserver' in window)) return observer;

    observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -8% 0px' }
    );

    return observer;
  }

  /**
   * Reveals everything marked [data-reveal] inside `root`. Called again by the
   * renderers whenever new cards are injected into the DOM.
   */
  STI.reveal = function (root) {
    var scope = root || document;
    var targets = scope.querySelectorAll('[data-reveal]:not(.is-revealed)');
    if (!targets.length) return;

    if (reduced.matches || !ensureObserver()) {
      for (var i = 0; i < targets.length; i++) targets[i].classList.add('is-revealed');
      return;
    }

    /* Stagger siblings slightly so a grid cascades instead of popping. */
    var groups = new Map();
    for (var j = 0; j < targets.length; j++) {
      var el = targets[j];
      var parent = el.parentNode;
      var index = groups.get(parent) || 0;
      if (index < 6) el.style.setProperty('--reveal-delay', index * 55 + 'ms');
      groups.set(parent, index + 1);
      observer.observe(el);
    }
  };

  /* Anything above the fold on first paint should not wait for a scroll. */
  function revealInitial() {
    STI.reveal(document);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', revealInitial);
  } else {
    revealInitial();
  }

  /* ------------------------------------------------------- hero parallax -- */

  var heroImage = document.querySelector('.hero__media img');

  if (heroImage && !reduced.matches) {
    var pending = false;

    var move = function () {
      var y = window.scrollY;
      /* Stop once the hero has scrolled away -- no work off-screen. */
      if (y < window.innerHeight) {
        heroImage.style.transform = 'translate3d(0,' + (y * 0.16).toFixed(2) + 'px,0) scale(1.06)';
      }
      pending = false;
    };

    heroImage.style.transform = 'scale(1.06)';
    window.addEventListener(
      'scroll',
      function () {
        if (!pending) {
          pending = true;
          window.requestAnimationFrame(move);
        }
      },
      { passive: true }
    );
  }

  /* If the visitor turns reduced motion on mid-session, settle everything. */
  reduced.addEventListener('change', function (e) {
    if (!e.matches) return;
    if (heroImage) heroImage.style.transform = '';
    var pendingReveals = document.querySelectorAll('[data-reveal]:not(.is-revealed)');
    for (var i = 0; i < pendingReveals.length; i++) pendingReveals[i].classList.add('is-revealed');
  });
})(window.STI);
