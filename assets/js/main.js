/* ==========================================================================
   main.js
   Page controllers for the homepage, about page and contact page, plus the
   Organization structured data that every page carries.

   Loaded last, after data-loader / ui / navigation / animations / rfq.
   ========================================================================== */

window.STI = window.STI || {};

(function (STI) {
  'use strict';

  var UI = STI.ui;
  var page = document.body.getAttribute('data-page') || '';

  function setText(id, value) {
    var el = document.getElementById(id);
    if (el && value) el.textContent = value;
  }

  function setHtml(id, html) {
    var el = document.getElementById(id);
    if (el && html) el.innerHTML = html;
  }

  function setImage(id, src, alt) {
    var el = document.getElementById(id);
    if (!el || !src) return;
    el.src = src;
    if (alt) el.alt = alt;
  }

  function setLink(id, text, href) {
    var el = document.getElementById(id);
    if (!el) return;
    if (text) el.textContent = text;
    if (href) el.href = href;
  }

  /* ====================================================== Organization === */

  function organizationJsonLd() {
    var contact = STI.settingGroup('contact');
    var phone = contact.phone || '';

    var payload = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: STI.setting('general', 'companyName', 'Shiv Trading India Private Limited'),
      url: UI.absoluteUrl('/'),
      logo: UI.absoluteUrl('/assets/images/logo-mark.png'),
      description: STI.setting(
        'general',
        'siteDescription',
        'Supplier of electrical winding wires and insulation materials.'
      ),
    };

    var address = {
      '@type': 'PostalAddress',
      addressCountry: 'IN',
    };
    if (contact.addressLine1 || contact.addressLine2) {
      address.streetAddress = [contact.addressLine1, contact.addressLine2].filter(Boolean).join(', ');
    }
    if (contact.city) address.addressLocality = contact.city;
    if (contact.state) address.addressRegion = contact.state;
    if (contact.postalCode) address.postalCode = contact.postalCode;
    payload.address = address;

    if (phone) {
      payload.contactPoint = [{
        '@type': 'ContactPoint',
        telephone: phone,
        contactType: 'sales',
        areaServed: 'IN',
        availableLanguage: ['en', 'hi'],
      }];
    }
    if (contact.email) payload.email = contact.email;

    UI.jsonLd('ld-organization', payload);
  }

  /* ========================================================== Homepage === */

  function renderHomepage() {
    var home = STI.settingGroup('homepage');

    /* --- hero ------------------------------------------------------------ */
    setText('heroEyebrow', home.heroEyebrow);
    setText('heroTitle', home.heroTitle);
    setText('heroLead', home.heroDescription);
    setImage('heroImage', home.heroImage, '');
    setLink('heroPrimary', home.heroPrimaryCtaText, home.heroPrimaryCtaLink);
    setLink('heroSecondary', home.heroSecondaryCtaText, home.heroSecondaryCtaLink);

    /* --- trust strip ------------------------------------------------------ */
    var trust = document.getElementById('heroTrust');
    if (trust && Array.isArray(home.trustItems) && home.trustItems.length) {
      trust.innerHTML = home.trustItems
        .slice(0, 4)
        .map(function (t) {
          return (
            '<div class="trust-item">' +
              '<p class="trust-item__value">' + UI.esc(t.value) + '</p>' +
              '<p class="trust-item__label">' + UI.esc(t.label) + '</p>' +
            '</div>'
          );
        })
        .join('');
    }

    /* --- categories ------------------------------------------------------- */
    setText('homeCategoriesHeading', home.categoriesHeading);
    setText('homeCategoriesSub', home.categoriesSubheading);

    var categoriesGrid = document.getElementById('homeCategories');
    if (categoriesGrid) {
      var categories = STI.featuredCategories().slice(0, 6);
      if (categories.length) {
        categoriesGrid.innerHTML = categories.map(function (c) { return UI.categoryCard(c); }).join('');
        STI.reveal(categoriesGrid);
      } else {
        hideSection(categoriesGrid);
      }
    }

    /* --- featured products ------------------------------------------------ */
    setText('homeProductsHeading', home.productsHeading);
    setText('homeProductsSub', home.productsSubheading);

    var productsGrid = document.getElementById('homeProducts');
    if (productsGrid) {
      var products = STI.homepageProducts().slice(0, 8);
      if (products.length) {
        UI.renderProducts(productsGrid, products);
      } else {
        hideSection(productsGrid);
      }
    }

    /* --- about split ------------------------------------------------------ */
    setText('homeAboutHeading', home.aboutHeading);
    setHtml('homeAboutText', UI.paragraphs(home.aboutText));
    setImage('homeAboutImage', home.aboutImage, 'Winding and insulation materials');

    /* --- industries -------------------------------------------------------- */
    setText('industriesHeading', home.industriesHeading);
    setText('industriesSub', home.industriesSubheading);

    var industries = document.getElementById('industriesGrid');
    if (industries && Array.isArray(home.industries) && home.industries.length) {
      industries.innerHTML = home.industries
        .map(function (item, i) {
          return (
            '<article class="industry" data-reveal>' +
              '<span class="industry__num">' + String(i + 1).padStart(2, '0') + '</span>' +
              '<h3>' + UI.esc(item.title) + '</h3>' +
              '<p>' + UI.esc(item.description) + '</p>' +
            '</article>'
          );
        })
        .join('');
      STI.reveal(industries);
    } else if (industries) {
      hideSection(industries);
    }

    /* --- why us ------------------------------------------------------------ */
    setText('whyHeading', home.whyHeading);

    var why = document.getElementById('whyGrid');
    if (why && Array.isArray(home.whyItems) && home.whyItems.length) {
      why.innerHTML = home.whyItems
        .map(function (item) {
          return (
            '<article class="why-item" data-reveal>' +
              '<h3>' + UI.esc(item.title) + '</h3>' +
              '<p>' + UI.esc(item.description) + '</p>' +
            '</article>'
          );
        })
        .join('');
      STI.reveal(why);
    } else if (why) {
      hideSection(why);
    }

    /* --- closing CTA -------------------------------------------------------- */
    setText('ctaHeading', home.ctaHeading);
    setText('ctaText', home.ctaText);
  }

  function hideSection(el) {
    var section = el.closest('section');
    if (section) section.hidden = true;
  }

  /* ============================================================= About === */

  function renderAbout() {
    var about = STI.settingGroup('about');

    setText('aboutEyebrow', about.heroEyebrow);
    setText('aboutTitle', about.heroTitle);
    setText('aboutLead', about.heroDescription);

    setText('aboutIntroHeading', about.introHeading);
    setHtml('aboutIntroText', UI.paragraphs(about.introText));
    setImage('aboutIntroImage', about.introImage, 'Shiv Trading India');

    setText('aboutSupplyHeading', about.supplyHeading);
    setHtml('aboutSupplyText', UI.paragraphs(about.supplyText));

    /* The "what we supply" list is the live category list, so it can never
       drift out of step with the catalogue. */
    var supply = document.getElementById('aboutSupplyList');
    if (supply) {
      var categories = STI.categories();
      if (categories.length) {
        supply.innerHTML = categories
          .map(function (c) {
            return (
              '<a href="' + UI.categoryUrl(c.slug) + '">' +
                '<strong>' + UI.esc(c.name) + '</strong>' +
                '<span>' + UI.esc(c.description) + '</span>' +
              '</a>'
            );
          })
          .join('');
      } else {
        hideSection(supply);
      }
    }

    setText('aboutApproachHeading', about.approachHeading);

    var approach = document.getElementById('aboutApproachList');
    if (approach && Array.isArray(about.approachItems) && about.approachItems.length) {
      approach.innerHTML = about.approachItems
        .map(function (item) {
          return (
            '<article class="approach-item" data-reveal>' +
              '<div>' +
                '<h3>' + UI.esc(item.title) + '</h3>' +
                '<p>' + UI.esc(item.description) + '</p>' +
              '</div>' +
            '</article>'
          );
        })
        .join('');
      STI.reveal(approach);
    } else if (approach) {
      hideSection(approach);
    }

    setText('aboutExperienceHeading', about.experienceHeading);
    setHtml('aboutExperienceText', UI.paragraphs(about.experienceText));

    /* Stats built only from facts we actually hold. */
    var stats = document.getElementById('aboutStats');
    if (stats) {
      stats.innerHTML = [
        { value: STI.setting('general', 'yearsOfExperience', '25') + '+', label: 'Years supplying the trade' },
        { value: String(STI.categories().length), label: 'Product categories stocked' },
        { value: String(STI.products().length), label: 'Products listed online' },
        { value: 'Delhi', label: 'Bhagirath Palace, Chandni Chowk' },
      ]
        .map(function (s) {
          return (
            '<div class="about-stat" data-reveal>' +
              '<p class="about-stat__value">' + UI.esc(s.value) + '</p>' +
              '<p class="about-stat__label">' + UI.esc(s.label) + '</p>' +
            '</div>'
          );
        })
        .join('');
      STI.reveal(stats);
    }
  }

  /* =========================================================== Products === */

  /**
   * The products index (products.html) shows every category as a card, in the
   * exact order set by each category's Display Order field -- not
   * alphabetically, and not grouped by anything else. Clicking a card goes to
   * category.html, which lists the brands stocked within it.
   */
  function renderProductsIndex() {
    var grid = document.getElementById('categoriesIndexGrid');
    if (!grid) return;

    var categories = STI.categories(); // already sorted by displayOrder at build time

    if (!categories.length) {
      grid.innerHTML = UI.emptyState(
        'No categories published yet',
        'Categories will appear here as soon as they are added in the CMS.'
      );
      return;
    }

    grid.innerHTML = categories.map(function (c) { return UI.categoryCard(c); }).join('');
    STI.reveal(grid);
  }

  /* =========================================================== Contact === */

  function bindContactForm() {
    var form = document.getElementById('contactForm');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!STI.validateForm(form)) return;

      STI.submitNetlifyForm(form, function () {
        window.location.href = '/thank-you.html';
      });
    });
  }

  function renderContactMap() {
    var wrapper = document.getElementById('mapEmbed');
    if (!wrapper) return;

    var url = STI.setting('contact', 'mapEmbedUrl', '');
    if (!url) {
      wrapper.hidden = true;
      return;
    }

    var iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.loading = 'lazy';
    iframe.referrerPolicy = 'no-referrer-when-downgrade';
    iframe.title = 'Map showing the location of Shiv Trading India';
    iframe.setAttribute('allowfullscreen', '');
    wrapper.appendChild(iframe);
    wrapper.hidden = false;
  }

  /* ============================================================== boot === */

  STI.load().then(function () {
    organizationJsonLd();

    if (page === 'home') renderHomepage();
    if (page === 'products') renderProductsIndex();
    if (page === 'about') renderAbout();
    if (page === 'contact') {
      bindContactForm();
      renderContactMap();
    }
  });
})(window.STI);
