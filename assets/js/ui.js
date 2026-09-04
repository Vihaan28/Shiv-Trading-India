/* ==========================================================================
   ui.js
   Shared rendering helpers. Every product card, price, badge and toast on the
   site comes from here, so the catalogue, homepage, search results and related
   products cannot drift apart.
   ========================================================================== */

window.STI = window.STI || {};

(function (STI) {
  'use strict';

  var UI = {};
  STI.ui = UI;

  /* ---------------------------------------------------------------- text -- */

  var ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

  /** Escape anything that comes from CMS content before it enters innerHTML. */
  UI.esc = function (value) {
    return String(value === undefined || value === null ? '' : value)
      .replace(/[&<>"']/g, function (ch) { return ESCAPES[ch]; });
  };

  UI.attr = function (value) {
    return UI.esc(value);
  };

  /* --------------------------------------------------------------- links -- */

  /* Clean URLs. netlify.toml rewrites these onto product.html / category.html,
     and those pages read the slug from the path or the ?slug= fallback. */
  UI.productUrl = function (slug) {
    return '/product/' + encodeURIComponent(slug);
  };

  UI.categoryUrl = function (slug) {
    return '/category/' + encodeURIComponent(slug);
  };

  /** Reads a slug from a clean path first, then falls back to ?slug=. */
  UI.readSlug = function (prefix) {
    var path = window.location.pathname;
    var m = path.match(new RegExp('^/' + prefix + '/([^/]+)/?$'));
    if (m) {
      try { return decodeURIComponent(m[1]); } catch (e) { return m[1]; }
    }
    return new URLSearchParams(window.location.search).get('slug') || '';
  };

  /* -------------------------------------------------------------- prices -- */

  var PRICE_PREFIX = { 'starting-from': 'Starting from' };

  /** Renders a price according to the product's price type. */
  UI.priceHtml = function (product) {
    if (product.priceType === 'hidden') return '';

    if (product.priceType === 'price-on-request') {
      return '<p class="price-request">Price on request</p>';
    }

    var amount = String(product.price || '').trim();
    // A bare number gets the rupee symbol; anything else is shown as entered.
    var display = /^[\d][\d,.]*$/.test(amount) ? '₹' + amount : amount;
    var unit = product.priceUnit ? ' <small>' + UI.esc(product.priceUnit) + '</small>' : '';
    var prefix = PRICE_PREFIX[product.priceType]
      ? '<span class="price-prefix">' + PRICE_PREFIX[product.priceType] + '</span>'
      : '';

    return '<p class="price">' + prefix + UI.esc(display) + unit + '</p>';
  };

  /* -------------------------------------------------------- availability -- */

  var AVAILABILITY = {
    'in-stock': 'In stock',
    limited: 'Limited availability',
    'on-request': 'Available on request',
    'out-of-stock': 'Out of stock',
    discontinued: 'Discontinued',
  };

  /* Cards are tight, so they use the short form; the product page uses the full
     wording where there is room to be explicit. */
  var AVAILABILITY_SHORT = {
    'in-stock': 'In stock',
    limited: 'Limited',
    'on-request': 'On request',
    'out-of-stock': 'Out of stock',
    discontinued: 'Discontinued',
  };

  UI.availabilityLabel = function (key, short) {
    var map = short ? AVAILABILITY_SHORT : AVAILABILITY;
    return map[key] || map['on-request'];
  };

  UI.availabilityBadge = function (key, short) {
    var safe = AVAILABILITY[key] ? key : 'on-request';
    return '<span class="badge badge-' + safe + '">' + UI.esc(UI.availabilityLabel(safe, short)) + '</span>';
  };

  /** Can this product still be quoted for? */
  UI.isQuotable = function (product) {
    return product.availability !== 'discontinued';
  };

  /* ------------------------------------------------------- default units -- */

  var UNIT_FROM_PRICE = [
    [/\bkg|kilo/i, 'kg'],
    [/\bsheet/i, 'sheets'],
    [/\broll/i, 'rolls'],
    [/\bmet(re|er)/i, 'metres'],
    [/\bpiece|\bpcs|\bnos/i, 'pieces'],
    [/\bton/i, 'tonnes'],
    [/\blit(re|er)/i, 'litres'],
  ];

  UI.UNITS = ['kg', 'tonnes', 'litres', 'sheets', 'rolls', 'metres', 'pieces', 'coils'];

  /** Best-guess ordering unit for a product, from its configured price unit. */
  UI.defaultUnit = function (product) {
    var src = String(product.priceUnit || '');
    for (var i = 0; i < UNIT_FROM_PRICE.length; i++) {
      if (UNIT_FROM_PRICE[i][0].test(src)) return UNIT_FROM_PRICE[i][1];
    }
    return 'kg';
  };

  /* ---------------------------------------------------------------- cards -- */

  UI.productCard = function (product, options) {
    var opts = options || {};
    var catName = STI.categoryName(product.category);
    var price = UI.priceHtml(product);
    var quotable = UI.isQuotable(product);

    var flags = '';
    if (opts.showFeatured !== false && product.featured) {
      flags = '<div class="product-card__flags"><span class="badge badge-featured">Featured</span></div>';
    }

    var catLine = catName
      ? '<a class="product-card__cat" href="' + UI.categoryUrl(product.category) + '">' + UI.esc(catName) + '</a>'
      : '<span class="product-card__cat">Uncategorised</span>';

    return (
      '<article class="product-card" data-reveal>' +
        '<a class="product-card__media" href="' + UI.productUrl(product.slug) + '" tabindex="-1" aria-hidden="true">' +
          '<img src="' + UI.attr(product.primaryImage) + '" alt="" loading="lazy" decoding="async" width="800" height="600">' +
          flags +
        '</a>' +
        '<div class="product-card__body">' +
          catLine +
          '<h3 class="product-card__title"><a href="' + UI.productUrl(product.slug) + '">' + UI.esc(product.name) + '</a></h3>' +
          '<p class="product-card__desc">' + UI.esc(product.shortDescription) + '</p>' +
          '<div class="product-card__meta">' +
            '<div>' + price + '</div>' +
            UI.availabilityBadge(product.availability, true) +
          '</div>' +
        '</div>' +
        '<div class="product-card__actions">' +
          (quotable
            ? '<button type="button" class="btn btn-primary btn-sm" data-add-to-rfq="' + UI.attr(product.slug) + '">Add to quote</button>'
            : '<span class="btn btn-secondary btn-sm" aria-disabled="true">Discontinued</span>') +
          '<a class="btn btn-secondary btn-sm" href="' + UI.productUrl(product.slug) + '">Details</a>' +
        '</div>' +
      '</article>'
    );
  };

  UI.categoryCard = function (category) {
    var count = STI.countIn(category.slug);
    return (
      '<article class="category-card" data-reveal>' +
        '<img src="' + UI.attr(category.image) + '" alt="" loading="lazy" decoding="async" width="800" height="600">' +
        '<p class="category-card__count">' + count + (count === 1 ? ' product' : ' products') + '</p>' +
        '<h3><a href="' + UI.categoryUrl(category.slug) + '">' + UI.esc(category.name) + '</a></h3>' +
        '<p>' + UI.esc(category.description) + '</p>' +
        '<span class="link-arrow">Browse</span>' +
      '</article>'
    );
  };

  /** Renders a list of products into a container, with an empty state. */
  UI.renderProducts = function (container, products, emptyHtml) {
    if (!container) return;
    if (!products.length) {
      container.innerHTML = emptyHtml || UI.emptyState('Nothing to show here', 'Try a different filter, or send us your requirement and we will source it.');
      return;
    }
    container.innerHTML = products.map(function (p) { return UI.productCard(p); }).join('');
    if (STI.reveal) STI.reveal(container);
  };

  UI.emptyState = function (title, body, actionHtml) {
    return (
      '<div class="empty-state">' +
        '<h3>' + UI.esc(title) + '</h3>' +
        '<p>' + UI.esc(body) + '</p>' +
        (actionHtml || '<a class="btn btn-secondary" href="/rfq.html">Send us a requirement</a>') +
      '</div>'
    );
  };

  UI.skeletons = function (n) {
    var out = '';
    for (var i = 0; i < n; i++) out += '<div class="skeleton-card" aria-hidden="true"></div>';
    return out;
  };

  /* ------------------------------------------------------------ WhatsApp -- */

  /** Strips everything but digits; WhatsApp wants a bare international number. */
  UI.whatsappNumber = function () {
    return String(STI.setting('contact', 'whatsapp', '')).replace(/\D/g, '');
  };

  UI.whatsappLink = function (message) {
    var num = UI.whatsappNumber();
    if (!num) return '';
    return 'https://wa.me/' + num + (message ? '?text=' + encodeURIComponent(message) : '');
  };

  /* --------------------------------------------------------------- toast -- */

  var region = null;

  function ensureRegion() {
    if (region) return region;
    region = document.createElement('div');
    region.className = 'toast-region';
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', 'polite');
    document.body.appendChild(region);
    return region;
  }

  var CHECK =
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
    '<path d="M2.5 8.5 6 12l7.5-8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  /**
   * Shows a transient message. `action` is an optional {href, label}.
   * Replaces the alert() calls the first draft used.
   */
  UI.toast = function (message, action) {
    var node = document.createElement('div');
    node.className = 'toast';
    node.innerHTML =
      CHECK +
      '<span>' + UI.esc(message) + '</span>' +
      (action ? '<a href="' + UI.attr(action.href) + '">' + UI.esc(action.label) + '</a>' : '');

    ensureRegion().appendChild(node);

    var timer = setTimeout(dismiss, 4200);
    node.addEventListener('mouseenter', function () { clearTimeout(timer); });
    node.addEventListener('mouseleave', function () { timer = setTimeout(dismiss, 1800); });

    function dismiss() {
      node.classList.add('is-leaving');
      node.addEventListener('animationend', function () { node.remove(); }, { once: true });
      setTimeout(function () { if (node.parentNode) node.remove(); }, 600);
    }
  };

  /* ------------------------------------------------------------- helpers -- */

  UI.plural = function (n, one, many) {
    return n + ' ' + (n === 1 ? one : many);
  };

  /** Wraps query matches in <mark>, on already-escaped text. */
  UI.highlight = function (text, query) {
    var escaped = UI.esc(text);
    var q = String(query || '').trim();
    if (!q) return escaped;
    var terms = q.split(/\s+/)
      .filter(function (t) { return t.length > 1; })
      .map(function (t) { return t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); });
    if (!terms.length) return escaped;
    return escaped.replace(new RegExp('(' + terms.join('|') + ')', 'gi'), '<mark>$1</mark>');
  };

  /**
   * A deliberately small Markdown renderer for the body text employees write in
   * the CMS. It covers headings, lists, bold/italic, links and paragraphs --
   * which is the whole vocabulary the Decap markdown widget realistically
   * produces here. Input is escaped first, so nothing authored in the CMS can
   * inject markup.
   */
  UI.markdown = function (source) {
    var text = UI.esc(String(source || '').replace(/\r\n/g, '\n')).trim();
    if (!text) return '';

    var blocks = text.split(/\n{2,}/);
    var out = [];

    blocks.forEach(function (block) {
      block = block.trim();
      if (!block) return;

      var heading = block.match(/^(#{2,4})\s+(.*)$/);
      if (heading && block.indexOf('\n') === -1) {
        var level = Math.min(heading[1].length + 1, 5); // '##' -> h3
        out.push('<h' + level + '>' + inline(heading[2]) + '</h' + level + '>');
        return;
      }

      var lines = block.split('\n');

      if (lines.every(function (l) { return /^\s*[-*]\s+/.test(l); })) {
        out.push('<ul>' + lines.map(function (l) {
          return '<li>' + inline(l.replace(/^\s*[-*]\s+/, '')) + '</li>';
        }).join('') + '</ul>');
        return;
      }

      if (lines.every(function (l) { return /^\s*\d+[.)]\s+/.test(l); })) {
        out.push('<ol>' + lines.map(function (l) {
          return '<li>' + inline(l.replace(/^\s*\d+[.)]\s+/, '')) + '</li>';
        }).join('') + '</ol>');
        return;
      }

      out.push('<p>' + inline(lines.join(' ')) + '</p>');
    });

    return out.join('');
  };

  function inline(text) {
    return text
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]*)\)/g, '<a href="$2">$1</a>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[\s(])\*([^*\n]+)\*/g, '$1<em>$2</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');
  }

  /** Renders CMS long-text (which may contain paragraph breaks) as paragraphs. */
  UI.paragraphs = function (source) {
    return String(source || '')
      .replace(/\r\n/g, '\n')
      .split(/\n{2,}/)
      .map(function (p) { return p.trim(); })
      .filter(Boolean)
      .map(function (p) { return '<p>' + UI.esc(p).replace(/\n/g, '<br>') + '</p>'; })
      .join('');
  };

  UI.setMeta = function (selector, attribute, value) {
    var node = document.querySelector(selector);
    if (node && value) node.setAttribute(attribute, value);
  };

  /** Injects (or replaces) a JSON-LD block. */
  UI.jsonLd = function (id, payload) {
    var existing = document.getElementById(id);
    if (existing) existing.remove();
    var script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = id;
    script.textContent = JSON.stringify(payload);
    document.head.appendChild(script);
  };

  UI.absoluteUrl = function (pathname) {
    return 'https://www.shivtradingindia.com' + pathname;
  };
})(window.STI);
