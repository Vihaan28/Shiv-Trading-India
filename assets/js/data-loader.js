/* ==========================================================================
   data-loader.js
   Fetches /data.json (generated from /content by scripts/build-content.js) and
   exposes read helpers on the global STI namespace.

   Everything downstream is synchronous once STI.load() has resolved, so page
   modules all start with:  STI.load().then(function () { ... });
   ========================================================================== */

window.STI = window.STI || {};

(function (STI) {
  'use strict';

  var EMPTY = { products: [], categories: [], settings: {} };
  var request = null;

  STI.data = EMPTY;

  /** Load data.json once per page. Never rejects -- resolves to empty data. */
  STI.load = function () {
    if (request) return request;

    request = fetch('/data.json', { cache: 'no-cache' })
      .then(function (res) {
        if (!res.ok) throw new Error('data.json returned HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        STI.data = {
          products: Array.isArray(data.products) ? data.products : [],
          categories: Array.isArray(data.categories) ? data.categories : [],
          settings: data.settings && typeof data.settings === 'object' ? data.settings : {},
        };
        return STI.data;
      })
      .catch(function (err) {
        console.error(
          '[Shiv Trading India] Could not load /data.json. ' +
            'Run "npm run build" to generate it, and serve the site over http:// rather than file://.',
          err
        );
        STI.data = EMPTY;
        document.documentElement.classList.add('data-failed');
        return STI.data;
      });

    return request;
  };

  /* ---------------------------------------------------------- collections -- */

  STI.products = function () {
    return STI.data.products;
  };

  STI.categories = function () {
    return STI.data.categories;
  };

  STI.productBySlug = function (slug) {
    return STI.data.products.filter(function (p) { return p.slug === slug; })[0] || null;
  };

  STI.categoryBySlug = function (slug) {
    return STI.data.categories.filter(function (c) { return c.slug === slug; })[0] || null;
  };

  STI.categoryName = function (slug) {
    var c = STI.categoryBySlug(slug);
    return c ? c.name : '';
  };

  STI.productsIn = function (categorySlug) {
    return STI.data.products.filter(function (p) { return p.category === categorySlug; });
  };

  STI.countIn = function (categorySlug) {
    return STI.productsIn(categorySlug).length;
  };

  STI.featuredCategories = function () {
    var f = STI.data.categories.filter(function (c) { return c.featured; });
    return f.length ? f : STI.data.categories.slice(0, 6);
  };

  STI.homepageProducts = function () {
    var f = STI.data.products.filter(function (p) { return p.showOnHomepage; });
    return f.length ? f : STI.data.products.slice(0, 8);
  };

  /* ------------------------------------------------------------- settings -- */

  /**
   * Read a CMS setting with a fallback.
   *   STI.setting('contact', 'email', 'info@example.com')
   */
  STI.setting = function (group, key, fallback) {
    var g = STI.data.settings[group];
    if (!g) return fallback === undefined ? '' : fallback;
    var v = g[key];
    if (v === undefined || v === null || v === '') {
      return fallback === undefined ? '' : fallback;
    }
    return v;
  };

  STI.settingGroup = function (group) {
    return STI.data.settings[group] || {};
  };

  /** Full postal address as an array of lines, skipping blanks. */
  STI.addressLines = function () {
    var c = STI.settingGroup('contact');
    var city = [c.city, c.state, c.postalCode].filter(Boolean).join(' ');
    return [c.addressLine1, c.addressLine2, city, c.country].filter(Boolean);
  };

  /* --------------------------------------------------------------- search -- */

  /**
   * Scores products against a query. Name matches outrank description matches
   * so the most obviously relevant result lands at the top.
   */
  STI.searchProducts = function (query) {
    var q = String(query || '').trim().toLowerCase();
    if (!q) return [];
    var terms = q.split(/\s+/);

    return STI.data.products
      .map(function (p) {
        var name = p.name.toLowerCase();
        var cat = STI.categoryName(p.category).toLowerCase();
        var text = (p.shortDescription + ' ' + p.description + ' ' +
          p.specifications.map(function (s) { return s.key + ' ' + s.value; }).join(' ')).toLowerCase();

        var score = 0;
        for (var i = 0; i < terms.length; i++) {
          var t = terms[i];
          if (name === q) score += 100;
          if (name.indexOf(t) === 0) score += 40;
          else if (name.indexOf(t) > -1) score += 25;
          if (cat.indexOf(t) > -1) score += 10;
          if (text.indexOf(t) > -1) score += 4;
        }
        return { product: p, score: score };
      })
      .filter(function (r) { return r.score > 0; })
      .sort(function (a, b) { return b.score - a.score || a.product.name.localeCompare(b.product.name); })
      .map(function (r) { return r.product; });
  };

  STI.searchCategories = function (query) {
    var q = String(query || '').trim().toLowerCase();
    if (!q) return [];
    return STI.data.categories.filter(function (c) {
      return (c.name + ' ' + c.description).toLowerCase().indexOf(q) > -1;
    });
  };
})(window.STI);
