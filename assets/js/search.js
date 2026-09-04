/* ==========================================================================
   search.js
   The search page, plus the header search form that lives on every page.
   Results are computed in the browser from data.json -- with a catalogue of
   this size that is instant, and it keeps the site fully static.
   ========================================================================== */

window.STI = window.STI || {};

(function (STI) {
  'use strict';

  var UI = STI.ui;

  /* ------------------------------------------------- header search form --- */

  var headerForms = document.querySelectorAll('[data-search-form]');
  for (var i = 0; i < headerForms.length; i++) {
    headerForms[i].addEventListener('submit', function (e) {
      var input = this.querySelector('input[type="search"], input[name="q"]');
      var value = input ? input.value.trim() : '';
      if (!value) {
        e.preventDefault();
        if (input) input.focus();
      }
      /* Otherwise the plain GET to /search.html?q=... does the work. */
    });
  }

  /* ------------------------------------------------------- search page ---- */

  var results = document.getElementById('searchResults');
  if (!results) return;

  var input = document.getElementById('searchInput');
  var form = document.getElementById('searchPageForm');
  var heading = document.getElementById('searchHeading');
  var summary = document.getElementById('searchSummary');
  var suggestions = document.getElementById('searchSuggestions');

  function currentQuery() {
    return new URLSearchParams(window.location.search).get('q') || '';
  }

  function run(query, pushUrl) {
    var q = String(query || '').trim();

    if (pushUrl) {
      var url = '/search.html' + (q ? '?q=' + encodeURIComponent(q) : '');
      window.history.replaceState({}, '', url);
    }

    if (!q) {
      if (heading) heading.textContent = 'Search the catalogue';
      if (summary) summary.textContent = 'Search by product name, material, thickness or thermal class.';
      results.innerHTML = '';
      return;
    }

    var products = STI.searchProducts(q);
    var categories = STI.searchCategories(q);
    var total = products.length + categories.length;

    if (heading) heading.textContent = 'Results for “' + q + '”';
    if (summary) {
      summary.textContent = total
        ? UI.plural(total, 'result', 'results') + ' found.'
        : 'No results found.';
    }

    document.title = 'Search: ' + q + ' - Shiv Trading India';

    var html = '';

    if (categories.length) {
      html +=
        '<section class="search-group">' +
          '<h2>' + UI.plural(categories.length, 'category', 'categories') + '</h2>' +
          '<div class="card-grid card-grid-3">' +
            categories.map(function (c) { return UI.categoryCard(c); }).join('') +
          '</div>' +
        '</section>';
    }

    if (products.length) {
      html +=
        '<section class="search-group">' +
          '<h2>' + UI.plural(products.length, 'product', 'products') + '</h2>' +
          '<div class="card-grid">' +
            products.map(function (p) { return UI.productCard(p); }).join('') +
          '</div>' +
        '</section>';
    }

    if (!total) {
      html =
        '<div class="section">' +
          UI.emptyState(
            'Nothing matched “' + q + '”',
            'We stock a wider range than is listed here. Send us the specification and we will tell you whether we can supply it.',
            '<div class="center-actions" style="margin-top:0">' +
              '<a class="btn btn-primary" href="/rfq.html">Send a requirement</a>' +
              '<a class="btn btn-secondary" href="/products.html">Browse everything</a>' +
            '</div>'
          ) +
        '</div>';
    }

    results.innerHTML = html;
    STI.reveal(results);
  }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      run(input ? input.value : '', true);
    });
  }

  if (input) {
    var timer;
    input.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(function () { run(input.value, true); }, 200);
    });
  }

  if (suggestions) {
    suggestions.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-term]');
      if (!btn) return;
      var term = btn.getAttribute('data-term');
      if (input) input.value = term;
      run(term, true);
      if (input) input.focus();
    });
  }

  STI.load().then(function () {
    var q = currentQuery();
    if (input) input.value = q;

    /* Offer real category names as starting points rather than invented terms. */
    if (suggestions) {
      var terms = STI.categories().slice(0, 5).map(function (c) { return c.name; });
      if (terms.length) {
        suggestions.innerHTML =
          '<span>Try:</span>' +
          terms.map(function (t) {
            return '<button type="button" data-term="' + UI.attr(t) + '">' + UI.esc(t) + '</button>';
          }).join('');
      }
    }

    run(q, false);
    if (input && !q) input.focus();
  });
})(window.STI);
