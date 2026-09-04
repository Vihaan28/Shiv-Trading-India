/* ==========================================================================
   product.js
   The single dynamic product template. One HTML file serves every product --
   the slug comes from /product/<slug> (rewritten by Netlify onto product.html)
   or from ?slug= as a fallback.
   ========================================================================== */

window.STI = window.STI || {};

(function (STI) {
  'use strict';

  var UI = STI.ui;

  var root = document.getElementById('productRoot');
  if (!root) return;

  var slug = UI.readSlug('product');

  /* ---------------------------------------------------------- not found -- */

  function renderMissing() {
    document.title = 'Product not found - Shiv Trading India';

    var robots = document.createElement('meta');
    robots.name = 'robots';
    robots.content = 'noindex';
    document.head.appendChild(robots);

    var crumbs = document.getElementById('productCrumbs');
    if (crumbs) crumbs.hidden = true;

    root.innerHTML =
      '<div class="wrap section">' +
        UI.emptyState(
          'We could not find that product',
          'It may have been renamed or withdrawn from the catalogue. Browse everything we stock, or send us the specification and we will source it.',
          '<div class="center-actions" style="margin-top:0">' +
            '<a class="btn btn-primary" href="/products.html">View all products</a>' +
            '<a class="btn btn-secondary" href="/rfq.html">Send a requirement</a>' +
          '</div>'
        ) +
      '</div>';

    var related = document.getElementById('relatedSection');
    if (related) related.hidden = true;
  }

  /* ------------------------------------------------------------- gallery -- */

  function galleryMarkup(product) {
    var thumbs = '';

    if (product.images.length > 1) {
      thumbs =
        '<div class="gallery__thumbs" role="tablist" aria-label="Product images">' +
        product.images
          .map(function (src, i) {
            return (
              '<button type="button" class="gallery__thumb" role="tab" ' +
                'aria-selected="' + (i === 0) + '" ' +
                'aria-label="View image ' + (i + 1) + ' of ' + product.images.length + '" ' +
                'data-src="' + UI.attr(src) + '">' +
                '<img src="' + UI.attr(src) + '" alt="" loading="lazy" width="74" height="74">' +
              '</button>'
            );
          })
          .join('') +
        '</div>';
    }

    return (
      '<div class="gallery">' +
        '<div class="gallery__main">' +
          '<img id="galleryMain" src="' + UI.attr(product.primaryImage) + '" ' +
            'alt="' + UI.attr(product.name) + '" width="800" height="600" fetchpriority="high">' +
        '</div>' +
        thumbs +
      '</div>'
    );
  }

  /* --------------------------------------------------------- the buy box -- */

  function buyBoxMarkup(product) {
    var quotable = UI.isQuotable(product);
    var price = UI.priceHtml(product);
    var unit = UI.defaultUnit(product);

    var unitOptions = UI.UNITS.map(function (u) {
      return '<option value="' + UI.attr(u) + '"' + (u === unit ? ' selected' : '') + '>' + UI.esc(u) + '</option>';
    }).join('');

    var wa = UI.whatsappLink(
      'Hello Shiv Trading India, I am interested in ' + product.name + '. ' +
      UI.absoluteUrl(UI.productUrl(product.slug))
    );

    return (
      '<div class="buy-box">' +
        '<div class="buy-box__top">' +
          '<div>' + (price || '<p class="price-request">Contact us for details</p>') + '</div>' +
          UI.availabilityBadge(product.availability) +
        '</div>' +

        (quotable
          ? '<div class="qty-row">' +
              '<div class="field">' +
                '<label for="detailQty">Quantity</label>' +
                '<input type="number" id="detailQty" min="1" step="1" value="1" inputmode="numeric">' +
              '</div>' +
              '<div class="field">' +
                '<label for="detailUnit">Unit</label>' +
                '<select id="detailUnit">' + unitOptions + '</select>' +
              '</div>' +
            '</div>' +
            '<div class="buy-box__actions">' +
              '<button type="button" class="btn btn-copper btn-lg btn-block" data-add-to-rfq="' + UI.attr(product.slug) + '">' +
                'Add to quote request' +
              '</button>' +
              (wa
                ? '<a class="btn btn-secondary btn-block" href="' + UI.attr(wa) + '" target="_blank" rel="noopener">Ask on WhatsApp</a>'
                : '<a class="btn btn-secondary btn-block" href="/contact.html">Contact us</a>') +
            '</div>' +
            '<p class="buy-box__note">Add as many products as you need, then send one combined request. ' +
              'Quotations for metal products are issued against the rate on the day of enquiry.</p>'
          : '<p class="buy-box__note">This product has been discontinued. ' +
              '<a class="inline-link" href="/contact.html">Contact us</a> and we will suggest a current alternative.</p>') +
      '</div>'
    );
  }

  /* -------------------------------------------------------------- render -- */

  function renderProduct(product) {
    var category = STI.categoryBySlug(product.category);

    /* --- head ------------------------------------------------------------ */
    document.title = product.seoTitle;
    UI.setMeta('meta[name="description"]', 'content', product.seoDescription);
    UI.setMeta('meta[property="og:title"]', 'content', product.seoTitle);
    UI.setMeta('meta[property="og:description"]', 'content', product.seoDescription);
    UI.setMeta('meta[property="og:image"]', 'content', UI.absoluteUrl(product.primaryImage));
    UI.setMeta('meta[property="og:url"]', 'content', UI.absoluteUrl(UI.productUrl(product.slug)));
    UI.setMeta('link[rel="canonical"]', 'href', UI.absoluteUrl(UI.productUrl(product.slug)));

    /* --- breadcrumbs ----------------------------------------------------- */
    var crumbs = document.getElementById('productCrumbs');
    if (crumbs) {
      crumbs.innerHTML =
        '<li><a href="/">Home</a></li>' +
        '<li><a href="/products.html">Products</a></li>' +
        (category ? '<li><a href="' + UI.categoryUrl(category.slug) + '">' + UI.esc(category.name) + '</a></li>' : '') +
        '<li><span aria-current="page">' + UI.esc(product.name) + '</span></li>';
    }

    /* --- main ------------------------------------------------------------ */
    var specs = product.specifications.length
      ? '<table class="specs">' +
          '<caption>Technical specifications</caption>' +
          '<tbody>' +
            product.specifications
              .map(function (s) {
                return '<tr><th scope="row">' + UI.esc(s.key) + '</th><td>' + UI.esc(s.value) + '</td></tr>';
              })
              .join('') +
          '</tbody>' +
        '</table>'
      : '';

    var catLink = category
      ? '<a class="product-detail__cat" href="' + UI.categoryUrl(category.slug) + '">' + UI.esc(category.name) + '</a>'
      : '';

    var brandLine = product.brand
      ? '<p class="product-detail__brand">Brand: <strong>' + UI.esc(product.brand) + '</strong></p>'
      : '';

    root.innerHTML =
      '<div class="wrap">' +
        '<div class="product-detail">' +
          galleryMarkup(product) +
          '<div>' +
            catLink +
            '<h1>' + UI.esc(product.name) + '</h1>' +
            brandLine +
            '<p class="product-detail__lead">' + UI.esc(product.shortDescription) + '</p>' +
            buyBoxMarkup(product) +
          '</div>' +
        '</div>' +

        '<div class="product-tabs">' +
          '<div class="prose">' +
            '<h2>About this product</h2>' +
            UI.paragraphs(product.description) +
            (product.body ? UI.markdown(product.body) : '') +
          '</div>' +
          '<div>' + specs + '</div>' +
        '</div>' +
      '</div>';

    bindGallery();
    renderRelated(product);
    renderJsonLd(product, category);
  }

  function bindGallery() {
    var main = document.getElementById('galleryMain');
    var thumbs = root.querySelectorAll('.gallery__thumb');
    if (!main || !thumbs.length) return;

    root.addEventListener('click', function (e) {
      var thumb = e.target.closest('.gallery__thumb');
      if (!thumb) return;

      main.src = thumb.getAttribute('data-src');
      for (var i = 0; i < thumbs.length; i++) {
        thumbs[i].setAttribute('aria-selected', String(thumbs[i] === thumb));
      }
    });
  }

  function renderRelated(product) {
    var section = document.getElementById('relatedSection');
    var grid = document.getElementById('relatedGrid');
    if (!section || !grid) return;

    var related = STI.productsIn(product.category).filter(function (p) {
      return p.slug !== product.slug;
    });

    /* Fall back to anything else published, so the section is never a stub. */
    if (related.length < 3) {
      var others = STI.products().filter(function (p) {
        return p.slug !== product.slug && p.category !== product.category;
      });
      related = related.concat(others);
    }

    related = related.slice(0, 4);

    if (!related.length) {
      section.hidden = true;
      return;
    }

    grid.innerHTML = related.map(function (p) { return UI.productCard(p); }).join('');
    STI.reveal(grid);
  }

  /**
   * Product structured data. Deliberately omits reviews, ratings and any
   * offer price we have not actually been given -- inventing those is both
   * dishonest and a Google penalty risk.
   */
  function renderJsonLd(product, category) {
    var payload = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.seoDescription || product.shortDescription,
      image: [UI.absoluteUrl(product.primaryImage)],
      url: UI.absoluteUrl(UI.productUrl(product.slug)),
      category: category ? category.name : undefined,
    };

    if (product.specifications.length) {
      payload.additionalProperty = product.specifications.map(function (s) {
        return { '@type': 'PropertyValue', name: s.key, value: s.value };
      });
    }

    var AVAILABILITY_SCHEMA = {
      'in-stock': 'https://schema.org/InStock',
      limited: 'https://schema.org/LimitedAvailability',
      'on-request': 'https://schema.org/PreOrder',
      'out-of-stock': 'https://schema.org/OutOfStock',
      discontinued: 'https://schema.org/Discontinued',
    };

    var offer = {
      '@type': 'Offer',
      url: UI.absoluteUrl(UI.productUrl(product.slug)),
      availability: AVAILABILITY_SCHEMA[product.availability] || 'https://schema.org/PreOrder',
      priceCurrency: 'INR',
      seller: { '@type': 'Organization', name: 'Shiv Trading India Private Limited' },
    };

    /* Only publish a price when a real number has been configured. */
    if (product.priceType === 'fixed' && /^[\d.]+$/.test(String(product.price).replace(/,/g, ''))) {
      offer.price = String(product.price).replace(/,/g, '');
    } else if (product.priceType === 'starting-from' && /^[\d.]+$/.test(String(product.price).replace(/,/g, ''))) {
      offer.priceSpecification = {
        '@type': 'PriceSpecification',
        minPrice: String(product.price).replace(/,/g, ''),
        priceCurrency: 'INR',
      };
    }

    if (product.priceType !== 'hidden') payload.offers = offer;

    UI.jsonLd('ld-product', payload);

    UI.jsonLd('ld-breadcrumb', {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: UI.absoluteUrl('/') },
        { '@type': 'ListItem', position: 2, name: 'Products', item: UI.absoluteUrl('/products.html') },
      ]
        .concat(
          category
            ? [{ '@type': 'ListItem', position: 3, name: category.name, item: UI.absoluteUrl(UI.categoryUrl(category.slug)) }]
            : []
        )
        .concat([
          {
            '@type': 'ListItem',
            position: category ? 4 : 3,
            name: product.name,
            item: UI.absoluteUrl(UI.productUrl(product.slug)),
          },
        ]),
    });
  }

  /* ---------------------------------------------------------------- boot -- */

  STI.load().then(function () {
    var product = slug ? STI.productBySlug(slug) : null;
    if (!product) renderMissing();
    else renderProduct(product);
  });
})(window.STI);
