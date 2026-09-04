/* ==========================================================================
   catalog.js
   Drives category.html -- the "choose a brand" page a visitor lands on after
   picking a category from products.html. The category itself is always taken
   from the URL (/category/<slug>); this page only searches, sorts and filters
   by availability *within* that one category.

   Filter state is mirrored into the query string, which makes a filtered view
   linkable and survives a browser refresh.
   ========================================================================== */

window.STI = window.STI || {};

(function (STI) {
  'use strict';

  var UI = STI.ui;
  var PAGE_SIZE = 12;

  var grid = document.getElementById('productsGrid');
  if (!grid) return;

  var categorySlug = UI.readSlug('category');

  var state = {
    availability: [],
    query: '',
    sort: 'default',
    shown: PAGE_SIZE,
  };

  var els = {
    filters: document.getElementById('filters'),
    filterToggle: document.getElementById('filtersToggle'),
    availability: document.getElementById('filterAvailability'),
    sort: document.getElementById('sortSelect'),
    search: document.getElementById('catalogueSearch'),
    count: document.getElementById('resultCount'),
    chips: document.getElementById('activeFilters'),
    loadMore: document.getElementById('loadMore'),
    reset: document.getElementById('resetFilters'),
  };

  /* ------------------------------------------------------------- URL sync -- */

  function readUrl() {
    var params = new URLSearchParams(window.location.search);
    if (params.get('availability')) state.availability = params.get('availability').split(',').filter(Boolean);
    if (params.get('q')) state.query = params.get('q');
    if (params.get('sort')) state.sort = params.get('sort');
  }

  function writeUrl() {
    var params = new URLSearchParams();
    if (state.availability.length) params.set('availability', state.availability.join(','));
    if (state.query) params.set('q', state.query);
    if (state.sort !== 'default') params.set('sort', state.sort);

    var qs = params.toString();
    window.history.replaceState({}, '', window.location.pathname + (qs ? '?' + qs : ''));
  }

  /* ------------------------------------------------------------ filtering -- */

  function matches(product) {
    if (product.category !== categorySlug) return false;
    if (state.availability.length && state.availability.indexOf(product.availability) === -1) return false;

    if (state.query) {
      var haystack = (
        product.name + ' ' + (product.brand || '') + ' ' + product.shortDescription + ' ' + product.description + ' ' +
        product.specifications.map(function (s) { return s.key + ' ' + s.value; }).join(' ')
      ).toLowerCase();

      var terms = state.query.toLowerCase().split(/\s+/).filter(Boolean);
      for (var i = 0; i < terms.length; i++) {
        if (haystack.indexOf(terms[i]) === -1) return false;
      }
    }

    return true;
  }

  var SORTS = {
    default: function (a, b) {
      /* Featured first, then the display order employees set in the CMS. */
      return (b.featured ? 1 : 0) - (a.featured ? 1 : 0) ||
        a.displayOrder - b.displayOrder ||
        a.name.localeCompare(b.name);
    },
    'name-asc': function (a, b) { return a.name.localeCompare(b.name); },
    'name-desc': function (a, b) { return b.name.localeCompare(a.name); },
    availability: function (a, b) {
      var rank = { 'in-stock': 0, limited: 1, 'on-request': 2, 'out-of-stock': 3, discontinued: 4 };
      return (rank[a.availability] || 9) - (rank[b.availability] || 9) || a.name.localeCompare(b.name);
    },
  };

  function results() {
    return STI.products().filter(matches).sort(SORTS[state.sort] || SORTS.default);
  }

  /* ------------------------------------------------------------ rendering -- */

  function render() {
    var all = results();
    var visible = all.slice(0, state.shown);

    if (!all.length) {
      grid.innerHTML = UI.emptyState(
        'No brands match those filters',
        'Try clearing a filter, or tell us what you need and we will source it for you.',
        '<div class="center-actions" style="margin-top:0">' +
          '<button type="button" class="btn btn-secondary" id="emptyReset">Clear filters</button>' +
          '<a class="btn btn-primary" href="/rfq.html">Send a requirement</a>' +
        '</div>'
      );
      var emptyReset = document.getElementById('emptyReset');
      if (emptyReset) emptyReset.addEventListener('click', reset);
    } else {
      grid.innerHTML = visible.map(function (p) { return UI.productCard(p); }).join('');
      STI.reveal(grid);
    }

    if (els.count) {
      els.count.innerHTML = all.length
        ? 'Showing <strong>' + visible.length + '</strong> of <strong>' + all.length + '</strong> ' +
          (all.length === 1 ? 'brand' : 'brands')
        : 'No brands found';
    }

    if (els.loadMore) {
      els.loadMore.hidden = visible.length >= all.length;
    }

    renderChips();
  }

  function renderChips() {
    if (!els.chips) return;

    var chips = [];

    if (state.query) {
      chips.push(chip('Search: “' + state.query + '”', 'query'));
    }
    state.availability.forEach(function (a) {
      chips.push(chip(UI.availabilityLabel(a), 'availability', a));
    });

    els.chips.innerHTML = chips.join('');
    els.chips.hidden = !chips.length;
  }

  function chip(label, kind, value) {
    return (
      '<span class="chip">' + UI.esc(label) +
      '<button type="button" aria-label="Remove filter ' + UI.attr(label) + '" ' +
      'data-clear="' + kind + '"' + (value ? ' data-value="' + UI.attr(value) + '"' : '') + '>×</button></span>'
    );
  }

  /* -------------------------------------------------------------- filters -- */

  function buildAvailabilityFilter() {
    if (!els.availability) return;

    var order = ['in-stock', 'limited', 'on-request', 'out-of-stock'];
    var pool = STI.productsIn(categorySlug);

    els.availability.innerHTML = order
      .map(function (key) {
        var count = pool.filter(function (p) { return p.availability === key; }).length;
        if (!count) return '';
        return (
          '<label class="filter-option">' +
            '<input type="checkbox" name="availability" value="' + key + '"' +
              (state.availability.indexOf(key) > -1 ? ' checked' : '') + '>' +
            '<span>' + UI.esc(UI.availabilityLabel(key)) + '</span><span>' + count + '</span>' +
          '</label>'
        );
      })
      .join('');
  }

  function reset() {
    state.availability = [];
    state.query = '';
    state.sort = 'default';
    state.shown = PAGE_SIZE;

    if (els.search) els.search.value = '';
    if (els.sort) els.sort.value = 'default';
    buildAvailabilityFilter();
    writeUrl();
    render();
  }

  /* --------------------------------------------------------------- events -- */

  function bind() {
    if (els.availability) {
      els.availability.addEventListener('change', function (e) {
        if (e.target.name !== 'availability') return;
        var value = e.target.value;
        if (e.target.checked) {
          if (state.availability.indexOf(value) === -1) state.availability.push(value);
        } else {
          state.availability = state.availability.filter(function (v) { return v !== value; });
        }
        state.shown = PAGE_SIZE;
        writeUrl();
        render();
      });
    }

    if (els.sort) {
      els.sort.value = state.sort;
      els.sort.addEventListener('change', function () {
        state.sort = els.sort.value;
        writeUrl();
        render();
      });
    }

    if (els.search) {
      els.search.value = state.query;
      var timer;
      els.search.addEventListener('input', function () {
        clearTimeout(timer);
        timer = setTimeout(function () {
          state.query = els.search.value.trim();
          state.shown = PAGE_SIZE;
          writeUrl();
          render();
        }, 220);
      });
      /* Enter should not submit and reload the page. */
      els.search.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') e.preventDefault();
      });
    }

    if (els.loadMore) {
      els.loadMore.addEventListener('click', function () {
        state.shown += PAGE_SIZE;
        render();
        /* Move focus to the first newly revealed card for keyboard users. */
        var cards = grid.querySelectorAll('.product-card');
        var next = cards[state.shown - PAGE_SIZE];
        if (next) {
          var link = next.querySelector('.product-card__title a');
          if (link) link.focus({ preventScroll: true });
        }
      });
    }

    if (els.reset) els.reset.addEventListener('click', reset);

    if (els.chips) {
      els.chips.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-clear]');
        if (!btn) return;
        var kind = btn.getAttribute('data-clear');

        if (kind === 'query') {
          state.query = '';
          if (els.search) els.search.value = '';
        } else if (kind === 'availability') {
          var value = btn.getAttribute('data-value');
          state.availability = state.availability.filter(function (v) { return v !== value; });
          buildAvailabilityFilter();
        }

        state.shown = PAGE_SIZE;
        writeUrl();
        render();
      });
    }

    if (els.filterToggle && els.filters) {
      els.filterToggle.addEventListener('click', function () {
        var open = els.filters.classList.toggle('is-open');
        els.filterToggle.setAttribute('aria-expanded', String(open));
        els.filterToggle.textContent = open ? 'Hide filters' : 'Filters';
      });
    }
  }

  /* ------------------------------------------------------- category page -- */

  function setupCategoryPage() {
    var category = STI.categoryBySlug(categorySlug);

    if (!category) {
      var main = document.getElementById('categoryMain');
      if (main) {
        main.innerHTML =
          '<div class="wrap section">' +
            UI.emptyState(
              'That category is not available',
              'It may have been renamed or taken down. Browse all categories instead.',
              '<a class="btn btn-primary" href="/products.html">View all categories</a>'
            ) +
          '</div>';
      }
      document.title = 'Category not found - Shiv Trading India';
      var noindex = document.createElement('meta');
      noindex.name = 'robots';
      noindex.content = 'noindex';
      document.head.appendChild(noindex);
      return false;
    }

    document.title = category.seoTitle;
    UI.setMeta('meta[name="description"]', 'content', category.seoDescription);
    UI.setMeta('meta[property="og:title"]', 'content', category.seoTitle);
    UI.setMeta('meta[property="og:description"]', 'content', category.seoDescription);
    UI.setMeta('meta[property="og:image"]', 'content', UI.absoluteUrl(category.image));
    UI.setMeta('link[rel="canonical"]', 'href', UI.absoluteUrl(UI.categoryUrl(category.slug)));

    setText('categoryName', category.name);
    setText('categoryDescription', category.description);
    setText('categoryCrumb', category.name);

    var body = document.getElementById('categoryBody');
    if (body && category.body) {
      body.innerHTML = UI.markdown(category.body);
      body.hidden = false;
    }

    UI.jsonLd('ld-breadcrumb', {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: UI.absoluteUrl('/') },
        { '@type': 'ListItem', position: 2, name: 'Products', item: UI.absoluteUrl('/products.html') },
        { '@type': 'ListItem', position: 3, name: category.name, item: UI.absoluteUrl(UI.categoryUrl(category.slug)) },
      ],
    });

    /* Sibling categories, so a category page is not a dead end -- kept in the
       same order as products.html (Display Order), not alphabetical. */
    var siblings = document.getElementById('otherCategories');
    if (siblings) {
      var others = STI.categories().filter(function (c) { return c.slug !== category.slug; });
      if (others.length) {
        siblings.innerHTML = others.map(function (c) { return UI.categoryCard(c); }).join('');
        STI.reveal(siblings);
      } else {
        var section = siblings.closest('section');
        if (section) section.hidden = true;
      }
    }

    return true;
  }

  function setText(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  /* ------------------------------------------------------------------ boot -- */

  grid.innerHTML = UI.skeletons(6);

  STI.load().then(function () {
    if (!setupCategoryPage()) return;

    readUrl();
    buildAvailabilityFilter();
    bind();
    render();
  });
})(window.STI);
