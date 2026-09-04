/* ==========================================================================
   navigation.js
   Site chrome: sticky header, mobile drawer, header search panel, and the
   contact details that every page pulls from CMS settings rather than
   repeating in hardcoded HTML.
   ========================================================================== */

window.STI = window.STI || {};

(function (STI) {
  'use strict';

  var UI = STI.ui;

  /* ------------------------------------------------------ sticky header -- */

  var header = document.querySelector('.site-header');

  if (header) {
    var ticking = false;
    var apply = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
      ticking = false;
    };
    apply();
    window.addEventListener(
      'scroll',
      function () {
        if (!ticking) {
          ticking = true;
          window.requestAnimationFrame(apply);
        }
      },
      { passive: true }
    );
  }

  /* ------------------------------------------------------ mobile drawer -- */

  var burger = document.getElementById('navToggle');
  var drawer = document.getElementById('navDrawer');
  var backdrop = document.getElementById('navBackdrop');
  var lastFocus = null;

  function openDrawer() {
    if (!drawer) return;
    lastFocus = document.activeElement;
    drawer.classList.add('is-open');
    drawer.removeAttribute('inert');
    if (backdrop) backdrop.classList.add('is-open');
    if (burger) burger.setAttribute('aria-expanded', 'true');
    document.body.classList.add('is-locked');
    var first = drawer.querySelector('a, button');
    if (first) first.focus();
  }

  function closeDrawer() {
    if (!drawer || !drawer.classList.contains('is-open')) return;
    drawer.classList.remove('is-open');
    if (backdrop) backdrop.classList.remove('is-open');
    if (burger) burger.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('is-locked');
    /* Wait for the slide-out before hiding it from assistive tech. */
    setTimeout(function () {
      if (!drawer.classList.contains('is-open')) drawer.setAttribute('inert', '');
    }, 350);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  if (drawer) drawer.setAttribute('inert', '');

  if (burger) {
    burger.addEventListener('click', function () {
      if (drawer && drawer.classList.contains('is-open')) closeDrawer();
      else openDrawer();
    });
  }

  if (backdrop) backdrop.addEventListener('click', closeDrawer);

  var drawerClose = document.getElementById('navDrawerClose');
  if (drawerClose) drawerClose.addEventListener('click', closeDrawer);

  if (drawer) {
    drawer.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeDrawer();
    });

    /* Keep tab focus inside the drawer while it is open. */
    drawer.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var focusables = drawer.querySelectorAll('a[href], button:not([disabled]), input, select, textarea');
      if (!focusables.length) return;
      var first = focusables[0];
      var last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }

  /* --------------------------------------------------- header search ----- */

  var searchToggle = document.getElementById('searchToggle');
  var searchPanel = document.getElementById('searchPanel');

  function closeSearch() {
    if (!searchPanel) return;
    searchPanel.classList.remove('is-open');
    if (searchToggle) searchToggle.setAttribute('aria-expanded', 'false');
  }

  if (searchToggle && searchPanel) {
    searchToggle.addEventListener('click', function () {
      var open = searchPanel.classList.toggle('is-open');
      searchToggle.setAttribute('aria-expanded', String(open));
      if (open) {
        var input = searchPanel.querySelector('input');
        if (input) input.focus();
      }
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closeDrawer();
      closeSearch();
    }
  });

  /* --------------------------------------------------- current page nav -- */

  (function markCurrent() {
    var path = window.location.pathname.replace(/\/index\.html$/, '/');
    var links = document.querySelectorAll('.nav-links a, .drawer-nav a');

    for (var i = 0; i < links.length; i++) {
      var href = links[i].getAttribute('href') || '';
      var isHome = href === '/' && (path === '/' || path === '');
      var isSection =
        href !== '/' &&
        (path === href ||
          /* /product/<slug> and /category/<slug> belong under Products */
          (href === '/products.html' && /^\/(product|category)\//.test(path)));

      if (isHome || isSection) links[i].setAttribute('aria-current', 'page');
    }
  })();

  /* ------------------------------------------- CMS-driven contact details -- */

  function paintContactDetails() {
    var phone = STI.setting('contact', 'phone', '');
    var phoneAlt = STI.setting('contact', 'phoneAlt', '');
    var email = STI.setting('contact', 'email', '');
    var hours = STI.setting('contact', 'businessHours', '');
    var addressLines = STI.addressLines();
    var whatsapp = STI.setting('contact', 'whatsapp', '');

    each('[data-contact="phone"]', function (el) {
      if (!phone) return;
      el.textContent = phone;
      if (el.tagName === 'A') el.href = 'tel:' + phone.replace(/[^\d+]/g, '');
    });

    each('[data-contact="phone-alt"]', function (el) {
      if (!phoneAlt) { hideBlock(el); return; }
      el.textContent = phoneAlt;
      if (el.tagName === 'A') el.href = 'tel:' + phoneAlt.replace(/[^\d+]/g, '');
    });

    each('[data-contact="email"]', function (el) {
      if (!email) return;
      el.textContent = email;
      if (el.tagName === 'A') el.href = 'mailto:' + email;
    });

    each('[data-contact="address"]', function (el) {
      if (!addressLines.length) return;
      el.innerHTML = addressLines.map(UI.esc).join('<br>');
    });

    each('[data-contact="address-inline"]', function (el) {
      if (addressLines.length) el.textContent = addressLines.join(', ');
    });

    each('[data-contact="hours"]', function (el) {
      if (!hours) { hideBlock(el); return; }
      el.innerHTML = String(hours).split('\n').map(UI.esc).join('<br>');
    });

    each('[data-contact="whatsapp"]', function (el) {
      var link = UI.whatsappLink(el.getAttribute('data-wa-message') || defaultWaMessage());
      if (!link) { hideBlock(el); return; }
      if (el.tagName === 'A') el.href = link;
      if (el.hasAttribute('data-contact-text')) el.textContent = whatsapp;
    });

    each('[data-company]', function (el) {
      var key = el.getAttribute('data-company');
      var value = STI.setting('general', key, '');
      if (value) el.textContent = value;
    });
  }

  function defaultWaMessage() {
    return 'Hello Shiv Trading India, I would like to enquire about your products.';
  }

  function each(selector, fn) {
    var nodes = document.querySelectorAll(selector);
    for (var i = 0; i < nodes.length; i++) fn(nodes[i]);
  }

  /** Hides the whole labelled block when a contact field is left blank in the CMS. */
  function hideBlock(el) {
    var block = el.closest('.contact-block') || el.closest('[data-optional]');
    if (block) block.hidden = true;
    else el.hidden = true;
  }

  /* ------------------------------------------- CMS-driven footer categories -- */

  function paintFooterCategories() {
    var list = document.getElementById('footerCategories');
    if (!list) return;

    var categories = STI.categories().slice(0, 6);
    if (!categories.length) {
      var col = list.closest('.footer-col');
      if (col) col.hidden = true;
      return;
    }

    list.innerHTML = categories
      .map(function (c) {
        return '<li><a href="' + UI.attr(UI.categoryUrl(c.slug)) + '">' + UI.esc(c.name) + '</a></li>';
      })
      .join('');
  }

  /* ---------------------------------------------------------- footer year -- */

  each('[data-year]', function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  /* ------------------------------------------------------------------ boot -- */

  STI.load().then(function () {
    paintContactDetails();
    paintFooterCategories();
  });
})(window.STI);
