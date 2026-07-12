/* ============================================================
   Michalis Katapodis - web logika (vanilla JS, bez závislostí)
   ============================================================ */
(function () {
  'use strict';

  /* ---------- Rok v patičce ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Mobilní menu ---------- */
  var toggle = document.querySelector('.nav__toggle');
  var links = document.querySelector('.nav__links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
      document.documentElement.classList.toggle('no-scroll', open);
    });
    links.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        links.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        document.documentElement.classList.remove('no-scroll');
      }
    });
  }

  /* ---------- E-mail (jednoduchá ochrana proti scraperům) ---------- */
  var mail = 'michalis.katapodis' + '@' + '3it.cz';
  document.querySelectorAll('[data-email]').forEach(function (el) {
    el.setAttribute('href', 'mailto:' + mail);
  });

  /* ---------- Média & Tvorba: grid karet (data z media-data.js) ---------- */
  var mediaGrid = document.getElementById('media-grid');
  if (mediaGrid && window.MEDIA_ITEMS) {
    var TYPE_LABELS = {
      clanek: 'Článek', rozhovor: 'Rozhovor', podcast: 'Podcast',
      video: 'Video', prednaska: 'Přednáška', prezentace: 'Prezentace'
    };
    function esc(s) {
      return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // řazení vždy dle publishedAt (od nejnovějšího)
    var items = window.MEDIA_ITEMS.slice().sort(function (a, b) {
      return a.publishedAt < b.publishedAt ? 1 : (a.publishedAt > b.publishedAt ? -1 : 0);
    });
    // deduplikace distribučních kopií stejného obsahu (dle cílové URL)
    var seen = {};
    items = items.filter(function (it) {
      if (seen[it.url]) return false;
      seen[it.url] = 1; return true;
    });

    items.forEach(function (it, i) {
      var date = it.datePrecision === 'year' ? it.publishedAt.slice(0, 4) : it.dateLabel;
      var eager = i < 6; // první 6 karet bez lazy
      var card = document.createElement('a');
      card.className = 'mcard';
      card.setAttribute('data-type', it.type);
      card.href = it.url;
      card.target = '_blank';
      card.rel = 'noopener noreferrer';
      card.innerHTML =
        '<div class="mcard__media">' +
          '<img src="' + esc(it.image) + '" alt="' + esc(it.title) + '" width="800" height="450" ' +
            'loading="' + (eager ? 'eager' : 'lazy') + '" decoding="async" />' +
        '</div>' +
        '<div class="mcard__body">' +
          '<div class="mcard__meta">' +
            '<span class="mcard__type mcard__type--' + it.type + '">' + (TYPE_LABELS[it.type] || it.type) + '</span>' +
            '<span class="mcard__date">' + esc(date) + '</span>' +
          '</div>' +
          '<h3 class="mcard__title">' + esc(it.title) + '</h3>' +
          '<span class="mcard__medium">' + esc(it.medium) + '</span>' +
        '</div>';
      mediaGrid.appendChild(card);
    });

    /* ---------- Filtr „Zobrazit" podle typu ---------- */
    var filterBar = document.getElementById('media-filter');
    if (filterBar) {
      var ORDER = ['clanek', 'rozhovor', 'podcast', 'video', 'prednaska', 'prezentace'];
      var PLURAL = {
        clanek: 'Články', rozhovor: 'Rozhovory', podcast: 'Podcasty',
        video: 'Videa', prednaska: 'Přednášky', prezentace: 'Prezentace'
      };
      var present = {};
      items.forEach(function (it) { present[it.type] = 1; });
      var filters = ['all'].concat(ORDER.filter(function (t) { return present[t]; }));
      filterBar.innerHTML =
        '<span class="media-filter__label">Zobrazit</span>' +
        filters.map(function (t) {
          return '<button type="button" class="media-filter__btn' + (t === 'all' ? ' is-active' : '') +
            '" data-filter="' + t + '">' + (t === 'all' ? 'Vše' : PLURAL[t]) + '</button>';
        }).join('');
      filterBar.addEventListener('click', function (e) {
        var btn = e.target.closest('.media-filter__btn');
        if (!btn) return;
        var f = btn.getAttribute('data-filter');
        filterBar.querySelectorAll('.media-filter__btn').forEach(function (b) {
          b.classList.toggle('is-active', b === btn);
        });
        mediaGrid.querySelectorAll('.mcard').forEach(function (card) {
          var show = f === 'all' || card.getAttribute('data-type') === f;
          card.classList.toggle('mcard--hidden', !show);
        });
      });
    }

    /* ---------- Mobil: dávkování karet („Zobrazit další") ---------- */
    if (window.matchMedia('(max-width: 600px)').matches) {
      var CAP = 10;
      var expanded = false;
      var moreBtn = document.createElement('button');
      moreBtn.type = 'button';
      moreBtn.className = 'btn btn--ghost media-more';
      mediaGrid.parentNode.insertBefore(moreBtn, mediaGrid.nextSibling);

      function applyCap() {
        if (expanded) return;
        var visible = 0, capped = 0;
        mediaGrid.querySelectorAll('.mcard').forEach(function (card) {
          if (card.classList.contains('mcard--hidden')) { card.classList.remove('mcard--capped'); return; }
          visible++;
          var over = visible > CAP;
          card.classList.toggle('mcard--capped', over);
          if (over) capped++;
        });
        moreBtn.style.display = capped ? '' : 'none';
        moreBtn.textContent = capped === 1 ? 'Zobrazit 1 další'
          : capped < 5 ? 'Zobrazit další ' + capped
          : 'Zobrazit dalších ' + capped;
      }
      moreBtn.addEventListener('click', function () {
        expanded = true;
        mediaGrid.querySelectorAll('.mcard--capped').forEach(function (c) { c.classList.remove('mcard--capped'); });
        moreBtn.remove();
      });
      if (filterBar) filterBar.addEventListener('click', function (e) {
        if (e.target.closest('.media-filter__btn')) applyCap();
      });
      applyCap();
    }
  }

  /* ---------- Lazy YouTube embed ---------- */
  document.querySelectorAll('.video').forEach(function (box) {
    var id = box.getAttribute('data-yt');
    var poster = box.getAttribute('data-poster');
    if (poster) {
      var probe = new Image();
      probe.onload = function () { box.style.backgroundImage = "url('" + poster + "')"; };
      probe.src = poster;
    }
    var btn = box.querySelector('.video__play');
    if (!btn || !id) return;
    btn.addEventListener('click', function () {
      var iframe = document.createElement('iframe');
      iframe.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0';
      iframe.title = box.querySelector('.video__title').textContent;
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true;
      box.innerHTML = '';
      box.appendChild(iframe);
    });
  });

  /* ---------- Fotogalerie (cesty + auta) se sdíleným lightboxem ---------- */
  (function () {
    var lb = document.getElementById('lightbox');
    if (!lb) return;
    var lbImg = document.getElementById('lightboxImg');
    var lbCounter = document.getElementById('lightboxCounter');
    var active = [];
    var current = 0;

    function show(idx) {
      if (!active.length) return;
      current = (idx + active.length) % active.length;
      lbImg.src = active[current].f;
      if (lbCounter) lbCounter.textContent = (current + 1) + ' / ' + active.length;
    }
    function open(arr, idx) {
      active = arr;
      show(idx);
      lb.classList.add('is-open');
      lb.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
    function close() {
      lb.classList.remove('is-open');
      lb.setAttribute('aria-hidden', 'true');
      lbImg.removeAttribute('src');
      document.body.style.overflow = '';
    }

    var PREVIEW = 12; // počet dlaždic v náhledu
    function build(gridId, arr) {
      var grid = document.getElementById(gridId);
      if (!grid || !arr || !arr.length) return;
      var showAll = arr.length <= PREVIEW;
      var tiles = showAll ? arr.length : PREVIEW;
      for (var idx = 0; idx < tiles; idx++) {
        var isMore = !showAll && idx === PREVIEW - 1;
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'photogrid__item' + (isMore ? ' photogrid__item--more' : '');
        btn.setAttribute('aria-label', isMore ? 'Zobrazit celou galerii' : 'Zvětšit fotku ' + (idx + 1));
        var img = new Image();
        img.src = arr[idx].t;
        img.alt = 'Michalis Katapodis - fotka ' + (idx + 1);
        img.loading = 'lazy';
        img.decoding = 'async';
        btn.appendChild(img);
        if (isMore) {
          var label = document.createElement('span');
          label.className = 'photogrid__more-label';
          label.textContent = '+' + (arr.length - (PREVIEW - 1));
          btn.appendChild(label);
        }
        (function (i) {
          btn.addEventListener('click', function () { open(arr, i); });
        })(idx);
        grid.appendChild(btn);
      }
    }

    build('photogrid', window.GALLERY);
    build('photogrid-auta', window.GALLERY_AUTA);

    lb.querySelector('.lightbox__close').addEventListener('click', close);
    lb.querySelector('.lightbox__nav--prev').addEventListener('click', function () { show(current - 1); });
    lb.querySelector('.lightbox__nav--next').addEventListener('click', function () { show(current + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') show(current - 1);
      else if (e.key === 'ArrowRight') show(current + 1);
    });

    /* Swipe gesta: vlevo/vpravo = další/předchozí, tah dolů = zavřít */
    var tX = 0, tY = 0, tOn = false;
    lb.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) { tOn = false; return; }
      tOn = true; tX = e.touches[0].clientX; tY = e.touches[0].clientY;
    }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (!tOn) return;
      tOn = false;
      var dx = e.changedTouches[0].clientX - tX;
      var dy = e.changedTouches[0].clientY - tY;
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.4) show(dx < 0 ? current + 1 : current - 1);
      else if (dy > 72 && dy > Math.abs(dx) * 1.4) close();
    }, { passive: true });
  })();

  /* ---------- Mobil: odhalení bloků při scrollu + tlačítko nahoru ---------- */
  (function () {
    if (!window.matchMedia('(max-width: 600px)').matches) return;

    if ('IntersectionObserver' in window) {
      var SEL = '.section-head, .scard, .solve__photo, .solve__main, .sol, ' +
        '.about-me__photo, .about-me__body, .mcard, .media-more, .feature__text, ' +
        '.travel-stats, .photogrid, .story__text, .cta__inner';
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting || en.boundingClientRect.top < 0) {
            en.target.classList.add('is-in');
            io.unobserve(en.target);
          }
        });
      }, { rootMargin: '0px 0px -7% 0px', threshold: 0.05 });
      document.querySelectorAll(SEL).forEach(function (el) {
        el.classList.add('rvl');
        io.observe(el);
      });
    }

    var toTop = document.getElementById('toTop');
    if (toTop) {
      var shown = false;
      window.addEventListener('scroll', function () {
        var want = window.scrollY > window.innerHeight * 2;
        if (want !== shown) { shown = want; toTop.classList.toggle('is-visible', want); }
      }, { passive: true });
      toTop.addEventListener('click', function () {
        var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
      });
    }
  })();
})();
