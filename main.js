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
    });
    links.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        links.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
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

  /* ---------- Fotogalerie (hory & cesty) + lightbox ---------- */
  var photogrid = document.getElementById('photogrid');
  if (photogrid && window.GALLERY && window.GALLERY.length) {
    var G = window.GALLERY;
    var lb = document.getElementById('lightbox');
    var lbImg = document.getElementById('lightboxImg');
    var lbCounter = document.getElementById('lightboxCounter');
    var current = 0;

    G.forEach(function (item, idx) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'photogrid__item';
      btn.setAttribute('aria-label', 'Zvětšit fotku ' + (idx + 1));
      var img = new Image();
      img.src = item.t;
      img.alt = 'Michalis Katapodis - hory a cesty ' + (idx + 1);
      img.loading = 'lazy';
      img.decoding = 'async';
      btn.appendChild(img);
      btn.addEventListener('click', function () { openLightbox(idx); });
      photogrid.appendChild(btn);
    });

    function show(idx) {
      current = (idx + G.length) % G.length;
      lbImg.src = G[current].f;
      if (lbCounter) lbCounter.textContent = (current + 1) + ' / ' + G.length;
    }
    function openLightbox(idx) {
      show(idx);
      lb.classList.add('is-open');
      lb.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
    function closeLightbox() {
      lb.classList.remove('is-open');
      lb.setAttribute('aria-hidden', 'true');
      lbImg.removeAttribute('src');
      document.body.style.overflow = '';
    }

    if (lb) {
      lb.querySelector('.lightbox__close').addEventListener('click', closeLightbox);
      lb.querySelector('.lightbox__nav--prev').addEventListener('click', function () { show(current - 1); });
      lb.querySelector('.lightbox__nav--next').addEventListener('click', function () { show(current + 1); });
      lb.addEventListener('click', function (e) { if (e.target === lb) closeLightbox(); });
      document.addEventListener('keydown', function (e) {
        if (!lb.classList.contains('is-open')) return;
        if (e.key === 'Escape') closeLightbox();
        else if (e.key === 'ArrowLeft') show(current - 1);
        else if (e.key === 'ArrowRight') show(current + 1);
      });
    }
  }
})();
