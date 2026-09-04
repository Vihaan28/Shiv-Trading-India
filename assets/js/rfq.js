/* ==========================================================================
   rfq.js
   The RFQ ("request for quotation") cart, plus the rfq.html page and its
   Netlify Forms submission.

   The cart lives in localStorage so it survives navigation between pages, and
   stores only the slug + quantity + unit -- names, images and prices are looked
   up fresh from data.json each render, so nothing goes stale when a product is
   edited in the CMS.
   ========================================================================== */

window.STI = window.STI || {};

(function (STI) {
  'use strict';

  var KEY = 'sti.rfq.v1';
  var UI = STI.ui;

  /* ============================================================== store == */

  var Cart = {};
  STI.cart = Cart;

  function read() {
    try {
      var raw = JSON.parse(localStorage.getItem(KEY) || '[]');
      if (!Array.isArray(raw)) return [];
      return raw
        .filter(function (i) { return i && typeof i.slug === 'string'; })
        .map(function (i) {
          return {
            slug: i.slug,
            quantity: Number(i.quantity) > 0 ? Number(i.quantity) : 1,
            unit: typeof i.unit === 'string' ? i.unit : 'kg',
          };
        });
    } catch (e) {
      // Private browsing, disabled storage, or corrupt data: start clean.
      return [];
    }
  }

  function write(items) {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch (e) {
      /* Storage unavailable: the cart still works for this page view. */
    }
    Cart._items = items;
    document.dispatchEvent(new CustomEvent('sti:cart-changed', { detail: { count: items.length } }));
  }

  Cart._items = null;

  Cart.items = function () {
    if (Cart._items === null) Cart._items = read();
    return Cart._items;
  };

  Cart.count = function () {
    return Cart.items().length;
  };

  Cart.has = function (slug) {
    return Cart.items().some(function (i) { return i.slug === slug; });
  };

  Cart.add = function (slug, quantity, unit) {
    var items = Cart.items().slice();
    var existing = items.filter(function (i) { return i.slug === slug; })[0];

    if (existing) {
      if (quantity) existing.quantity = Number(quantity);
      if (unit) existing.unit = unit;
    } else {
      var product = STI.productBySlug(slug);
      items.push({
        slug: slug,
        quantity: Number(quantity) > 0 ? Number(quantity) : 1,
        unit: unit || (product ? UI.defaultUnit(product) : 'kg'),
      });
    }

    write(items);
    return !existing;
  };

  Cart.update = function (slug, patch) {
    var items = Cart.items().map(function (i) {
      if (i.slug !== slug) return i;
      return {
        slug: i.slug,
        quantity: patch.quantity !== undefined && Number(patch.quantity) > 0 ? Number(patch.quantity) : i.quantity,
        unit: patch.unit !== undefined ? patch.unit : i.unit,
      };
    });
    write(items);
  };

  Cart.remove = function (slug) {
    write(Cart.items().filter(function (i) { return i.slug !== slug; }));
  };

  Cart.clear = function () {
    write([]);
  };

  /** Cart entries joined to live product data; unknown slugs are dropped. */
  Cart.resolved = function () {
    return Cart.items()
      .map(function (item) {
        var product = STI.productBySlug(item.slug);
        return product ? { item: item, product: product } : null;
      })
      .filter(Boolean);
  };

  /** Removes cart entries whose product no longer exists or was unpublished. */
  Cart.prune = function () {
    var items = Cart.items();
    var kept = items.filter(function (i) { return !!STI.productBySlug(i.slug); });
    if (kept.length !== items.length) write(kept);
    return items.length - kept.length;
  };

  /* ======================================================= badge + adds == */

  function paintBadges() {
    var count = Cart.count();
    var badges = document.querySelectorAll('[data-cart-count]');
    for (var i = 0; i < badges.length; i++) {
      var b = badges[i];
      b.textContent = count;
      b.classList.toggle('is-visible', count > 0);
    }
    var labels = document.querySelectorAll('[data-cart-label]');
    for (var j = 0; j < labels.length; j++) {
      labels[j].textContent = count === 0
        ? 'Request a quote'
        : 'Request a quote (' + count + ')';
    }
  }

  function bump() {
    var badges = document.querySelectorAll('[data-cart-count]');
    for (var i = 0; i < badges.length; i++) {
      var b = badges[i];
      b.classList.remove('is-bumped');
      void b.offsetWidth; /* restart the animation */
      b.classList.add('is-bumped');
    }
  }

  document.addEventListener('sti:cart-changed', function () {
    paintBadges();
    /* Keep the field Netlify actually receives in step with the cart on every
       change. Only the hidden field is touched -- re-rendering the whole list
       here would steal focus from a quantity box mid-edit. */
    syncHiddenField();
  });

  /* Another tab changed the cart. */
  window.addEventListener('storage', function (e) {
    if (e.key === KEY) {
      Cart._items = null;
      paintBadges();
      if (document.getElementById('rfqList')) renderRfqPage();
    }
  });

  /* One delegated handler covers every "Add to quote" button on the site. */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-add-to-rfq]');
    if (!btn) return;
    e.preventDefault();

    var slug = btn.getAttribute('data-add-to-rfq');
    var product = STI.productBySlug(slug);
    if (!product) return;

    var qtyInput = document.getElementById('detailQty');
    var unitInput = document.getElementById('detailUnit');
    var quantity = qtyInput ? qtyInput.value : null;
    var unit = unitInput ? unitInput.value : null;

    var added = Cart.add(slug, quantity, unit);
    bump();

    UI.toast(
      added ? product.name + ' added to your quote request' : product.name + ' updated in your quote request',
      { href: '/rfq.html', label: 'View request' }
    );
  });

  /* ========================================================== rfq page === */

  function itemMarkup(entry) {
    var p = entry.product;
    var item = entry.item;
    var catName = STI.categoryName(p.category);

    var options = UI.UNITS.map(function (u) {
      return '<option value="' + UI.attr(u) + '"' + (u === item.unit ? ' selected' : '') + '>' + UI.esc(u) + '</option>';
    }).join('');

    return (
      '<li class="rfq-item" data-slug="' + UI.attr(p.slug) + '">' +
        '<a class="rfq-item__media" href="' + UI.productUrl(p.slug) + '">' +
          '<img src="' + UI.attr(p.primaryImage) + '" alt="" loading="lazy" width="84" height="84">' +
        '</a>' +
        '<div class="rfq-item__body">' +
          '<a class="rfq-item__name" href="' + UI.productUrl(p.slug) + '">' + UI.esc(p.name) + '</a>' +
          (catName ? '<p class="rfq-item__cat">' + UI.esc(catName) + '</p>' : '') +
          '<div class="rfq-item__qty">' +
            '<label class="sr-only" for="qty-' + UI.attr(p.slug) + '">Quantity of ' + UI.esc(p.name) + '</label>' +
            '<input type="number" min="1" step="1" id="qty-' + UI.attr(p.slug) + '" value="' + item.quantity + '" data-qty>' +
            '<label class="sr-only" for="unit-' + UI.attr(p.slug) + '">Unit for ' + UI.esc(p.name) + '</label>' +
            '<select id="unit-' + UI.attr(p.slug) + '" data-unit>' + options + '</select>' +
          '</div>' +
        '</div>' +
        '<button type="button" class="rfq-item__remove" data-remove aria-label="Remove ' + UI.attr(p.name) + ' from your request">Remove</button>' +
      '</li>'
    );
  }

  function renderRfqPage() {
    var list = document.getElementById('rfqList');
    if (!list) return;

    var empty = document.getElementById('rfqEmpty');
    var summary = document.getElementById('rfqSummary');
    var form = document.getElementById('rfqForm');
    var entries = Cart.resolved();

    if (!entries.length) {
      list.innerHTML = '';
      list.hidden = true;
      if (empty) empty.hidden = false;
      if (summary) summary.textContent = 'No products selected yet.';
      if (form) form.setAttribute('data-cart-empty', 'true');
    } else {
      list.hidden = false;
      list.innerHTML = entries.map(itemMarkup).join('');
      if (empty) empty.hidden = true;
      if (summary) {
        summary.textContent = UI.plural(entries.length, 'product', 'products') + ' in this request.';
      }
      if (form) form.removeAttribute('data-cart-empty');
    }

    syncHiddenField();
  }

  /** Writes the cart into the hidden field Netlify actually receives. */
  function syncHiddenField() {
    var field = document.getElementById('rfqProducts');
    if (!field) return;
    var entries = Cart.resolved();
    field.value = entries.length
      ? entries
          .map(function (e, i) {
            return (i + 1) + '. ' + e.product.name +
              ' — ' + e.item.quantity + ' ' + e.item.unit +
              ' (' + UI.productUrl(e.product.slug) + ')';
          })
          .join('\n')
      : '(none selected)';
  }

  function bindRfqPage() {
    var list = document.getElementById('rfqList');
    if (!list) return;

    list.addEventListener('change', function (e) {
      var row = e.target.closest('.rfq-item');
      if (!row) return;
      var slug = row.getAttribute('data-slug');

      if (e.target.matches('[data-qty]')) {
        var q = parseInt(e.target.value, 10);
        if (!(q > 0)) { q = 1; e.target.value = 1; }
        Cart.update(slug, { quantity: q });
      } else if (e.target.matches('[data-unit]')) {
        Cart.update(slug, { unit: e.target.value });
      }
      syncHiddenField();
    });

    list.addEventListener('click', function (e) {
      if (!e.target.matches('[data-remove]')) return;
      var row = e.target.closest('.rfq-item');
      var slug = row.getAttribute('data-slug');
      var product = STI.productBySlug(slug);
      Cart.remove(slug);
      renderRfqPage();
      UI.toast((product ? product.name : 'Item') + ' removed');
    });

    var clearBtn = document.getElementById('rfqClear');
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        if (!Cart.count()) return;
        Cart.clear();
        renderRfqPage();
        UI.toast('Quote request cleared');
      });
    }
  }

  /* ==================================================== form submission == */

  /**
   * Netlify Forms submission over fetch, so the page can validate first and
   * keep the cart until the send actually succeeds. The matching static form
   * markup in rfq.html is what registers the form with Netlify at deploy time.
   */
  STI.submitNetlifyForm = function (form, onSuccess, onError) {
    var status = form.querySelector('[data-form-status]');
    var submit = form.querySelector('[type="submit"]');
    var original = submit ? submit.textContent : '';

    if (status) { status.textContent = ''; status.className = 'form-status'; }
    if (submit) { submit.disabled = true; submit.textContent = 'Sending…'; }

    var data = new FormData(form);
    var body = new URLSearchParams();
    data.forEach(function (value, key) { body.append(key, value); });

    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        if (onSuccess) onSuccess();
      })
      .catch(function (err) {
        console.error('Form submission failed', err);
        if (status) {
          status.className = 'form-status is-error';
          status.textContent =
            'Sorry — we could not send that. Please try again, or email us directly at ' +
            STI.setting('contact', 'email', 'info@shivtradingindia.com') + '.';
        }
        if (onError) onError(err);
      })
      .then(function () {
        if (submit) { submit.disabled = false; submit.textContent = original; }
      });
  };

  /**
   * Validates required fields, plus the *format* of email/tel fields whenever
   * they're filled in -- even if optional. Email is not required on either
   * form (phone is the mandatory contact method), but a customer who does
   * type one still deserves to be told if it's malformed.
   */
  function validate(form) {
    var ok = true;
    var fields = form.querySelectorAll('[required], input[type="email"], input[type="tel"]');

    for (var i = 0; i < fields.length; i++) {
      var f = fields[i];
      var wrap = f.closest('.field');
      var msg = wrap ? wrap.querySelector('.error-text') : null;
      var problem = '';
      var empty = !f.value.trim();

      if (empty) {
        if (f.hasAttribute('required')) problem = 'This field is required.';
      } else if (f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.value.trim())) {
        problem = 'Enter a valid email address.';
      } else if (f.type === 'tel' && f.value.replace(/\D/g, '').length < 8) {
        problem = 'Enter a valid phone number.';
      }

      f.setAttribute('aria-invalid', problem ? 'true' : 'false');
      if (msg) msg.textContent = problem;
      if (problem && ok) { ok = false; f.focus(); }
    }

    return ok;
  }

  STI.validateForm = validate;

  function bindRfqForm() {
    var form = document.getElementById('rfqForm');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var status = form.querySelector('[data-form-status]');

      if (!Cart.count()) {
        if (status) {
          status.className = 'form-status is-error';
          status.textContent = 'Add at least one product to your request before sending it.';
        }
        return;
      }

      if (!validate(form)) return;

      syncHiddenField();

      STI.submitNetlifyForm(form, function () {
        Cart.clear();
        window.location.href = '/thank-you.html';
      });
    });
  }

  /* ================================================================ boot == */

  STI.load().then(function () {
    var dropped = Cart.prune();
    paintBadges();

    if (document.getElementById('rfqList')) {
      renderRfqPage();
      bindRfqPage();
      bindRfqForm();
      if (dropped) {
        UI.toast(UI.plural(dropped, 'product is', 'products are') + ' no longer available and were removed');
      }
    }
  });

  /* Paint the badge from storage immediately, before data.json arrives. */
  paintBadges();
})(window.STI);
