#!/usr/bin/env python3
"""
Generátor statického HTML pro katapodis.cz.

Zdrojem pravdy jsou datové soubory (media-data.js, gallery-data.js,
gallery-auta-data.js). Tenhle skript z nich předgeneruje do index.html:

  - karty v sekci „Články a příspěvky" (#media-grid) + filtr (#media-filter)
  - dlaždice obou fotogalerií (#photogrid, #photogrid-auta)
  - JSON-LD ItemList publikací
  - dateModified ve strukturovaných datech + lastmod v sitemap.xml

Důvod: AI crawlery (GPTBot, ClaudeBot, PerplexityBot, CCBot) nespouštějí
JavaScript. Bez předgenerování pro ně sekce média i galerie neexistují.
main.js předgenerovaný obsah rozpozná a znovu ho nevykresluje - jen na něj
navěsí filtrování a lightbox.

Spuštění: python3 build.py   (idempotentní, pouští se před commitem)
"""

import datetime
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).parent

TYPE_LABELS = {
    'clanek': 'Článek', 'rozhovor': 'Rozhovor', 'podcast': 'Podcast',
    'video': 'Video', 'prednaska': 'Přednáška', 'prezentace': 'Prezentace',
}
TYPE_PLURAL = {
    'clanek': 'Články', 'rozhovor': 'Rozhovory', 'podcast': 'Podcasty',
    'video': 'Videa', 'prednaska': 'Přednášky', 'prezentace': 'Prezentace',
}
TYPE_ORDER = ['clanek', 'rozhovor', 'podcast', 'video', 'prednaska', 'prezentace']

# schema.org typ podle druhu výstupu
SCHEMA_TYPE = {
    'clanek': 'Article', 'rozhovor': 'Article', 'podcast': 'PodcastEpisode',
    'video': 'VideoObject', 'prednaska': 'CreativeWork', 'prezentace': 'CreativeWork',
}

PREVIEW_TILES = 12  # musí odpovídat PREVIEW v main.js


def esc(s):
    return (str(s).replace('&', '&amp;').replace('<', '&lt;')
            .replace('>', '&gt;').replace('"', '&quot;'))


def load_js_array(path, var):
    """Vytáhne JSON pole z `window.<var> = [...]` souboru."""
    src = (ROOT / path).read_text(encoding='utf-8')
    start = src.index('[')
    end = src.rindex(']') + 1
    body = src[start:end]
    body = re.sub(r',(\s*[\]}])', r'\1', body)  # JS toleruje koncovou čárku, JSON ne
    return json.loads(body)


def load_media():
    items = load_js_array('media-data.js', 'MEDIA_ITEMS')
    items.sort(key=lambda i: i['publishedAt'], reverse=True)
    # deduplikace distribučních kopií stejného obsahu (dle cílové URL)
    seen, out = set(), []
    for it in items:
        if it['url'] in seen:
            continue
        seen.add(it['url'])
        out.append(it)
    return out


def replace_inner(html, open_tag_re, inner, indent):
    """Nahradí obsah <div>, jehož otevírací tag matchuje open_tag_re.

    Konec hledá počítáním zanoření - generovaný obsah sám obsahuje <div>,
    takže naivní hledání prvního </div> by useklo uprostřed první karty.
    """
    m = re.search(open_tag_re, html)
    if not m:
        raise SystemExit('nenalezen element: ' + open_tag_re)
    start = m.end()
    depth, pos = 1, start
    for tag in re.finditer(r'<(/?)div\b', html[start:]):
        depth += -1 if tag.group(1) else 1
        if depth == 0:
            pos = start + tag.start()
            break
    else:
        raise SystemExit('nenalezen konec elementu: ' + open_tag_re)
    return html[:start] + '\n' + inner + '\n' + indent + html[pos:]


# --------------------------------------------------------------------------
# Média: karty + filtr
# --------------------------------------------------------------------------

def media_cards(items):
    pad = ' ' * 10
    out = []
    for i, it in enumerate(items):
        date = it['publishedAt'][:4] if it.get('datePrecision') == 'year' else it['dateLabel']
        loading = 'eager' if i < 6 else 'lazy'
        out.append(
            f'{pad}<a class="mcard" data-type="{esc(it["type"])}" href="{esc(it["url"])}"'
            f' target="_blank" rel="noopener noreferrer">\n'
            f'{pad}  <div class="mcard__media">\n'
            f'{pad}    <img src="{esc(it["image"])}" alt="{esc(it["title"])}" width="800" height="450"'
            f' loading="{loading}" decoding="async" />\n'
            f'{pad}  </div>\n'
            f'{pad}  <div class="mcard__body">\n'
            f'{pad}    <div class="mcard__meta">\n'
            f'{pad}      <span class="mcard__type mcard__type--{esc(it["type"])}">'
            f'{esc(TYPE_LABELS.get(it["type"], it["type"]))}</span>\n'
            f'{pad}      <time class="mcard__date" datetime="{esc(it["publishedAt"])}">{esc(date)}</time>\n'
            f'{pad}    </div>\n'
            f'{pad}    <h3 class="mcard__title">{esc(it["title"])}</h3>\n'
            f'{pad}    <span class="mcard__medium">{esc(it["medium"])}</span>\n'
            f'{pad}  </div>\n'
            f'{pad}</a>'
        )
    return '\n'.join(out)


def media_filter(items):
    pad = ' ' * 10
    present = {it['type'] for it in items}
    types = ['all'] + [t for t in TYPE_ORDER if t in present]
    rows = [f'{pad}<span class="media-filter__label">Zobrazit</span>']
    for t in types:
        active = ' is-active' if t == 'all' else ''
        label = 'Vše' if t == 'all' else TYPE_PLURAL[t]
        rows.append(f'{pad}<button type="button" class="media-filter__btn{active}"'
                    f' data-filter="{t}">{label}</button>')
    return '\n'.join(rows)


# --------------------------------------------------------------------------
# Fotogalerie
# --------------------------------------------------------------------------

def gallery_tiles(photos, alt_prefix):
    pad = ' ' * 10
    show_all = len(photos) <= PREVIEW_TILES
    count = len(photos) if show_all else PREVIEW_TILES
    out = []
    for idx in range(count):
        is_more = (not show_all) and idx == PREVIEW_TILES - 1
        cls = 'photogrid__item photogrid__item--more' if is_more else 'photogrid__item'
        label = 'Zobrazit celou galerii' if is_more else f'Zvětšit fotku {idx + 1}'
        rows = [f'{pad}<button type="button" class="{cls}" aria-label="{label}">',
                f'{pad}  <img src="{esc(photos[idx]["t"])}" alt="{esc(alt_prefix)} {idx + 1}"'
                f' loading="lazy" decoding="async" />']
        if is_more:
            rows.append(f'{pad}  <span class="photogrid__more-label">'
                        f'+{len(photos) - (PREVIEW_TILES - 1)}</span>')
        rows.append(f'{pad}</button>')
        out.append('\n'.join(rows))
    return '\n'.join(out)


# --------------------------------------------------------------------------
# JSON-LD ItemList
# --------------------------------------------------------------------------

def item_list(items):
    def j(v):
        return json.dumps(v, ensure_ascii=False)

    blocks = []
    for i, it in enumerate(items, 1):
        date = it['publishedAt'][:4] if it.get('datePrecision') == 'year' else it['publishedAt']
        extra = ''
        if it['type'] == 'video' and 'youtube.com/watch?v=' in it['url']:
            vid = it['url'].split('v=')[1].split('&')[0]
            extra = (f'\n            "thumbnailUrl": "https://i.ytimg.com/vi/{vid}/maxresdefault.jpg",'
                     f'\n            "uploadDate": "{date}",'
                     f'\n            "embedUrl": "https://www.youtube.com/embed/{vid}",'
                     f'\n            "description": {j(it["title"] + " - " + it["medium"])},')
        blocks.append(f'''        {{
          "@type": "ListItem",
          "position": {i},
          "item": {{
            "@type": "{SCHEMA_TYPE[it['type']]}",
            "name": {j(it['title'])},
            "url": {j(it['url'])},
            "image": {j('https://katapodis.cz' + it['image'])},
            "datePublished": "{date}",{extra}
            "inLanguage": "cs",
            "author": {{
              "@id": "https://katapodis.cz/#michalis"
            }},
            "creator": {{
              "@id": "https://katapodis.cz/#michalis"
            }},
            "genre": "{TYPE_LABELS[it['type']]}",
            "publisher": {{
              "@type": "Organization",
              "name": {j(it['medium'])}
            }}
          }}
        }}''')
    return ',\n'.join(blocks)


# --------------------------------------------------------------------------

def main():
    today = datetime.date.today().isoformat()
    items = load_media()
    hory = load_js_array('gallery-data.js', 'GALLERY')
    auta = load_js_array('gallery-auta-data.js', 'GALLERY_AUTA')

    html = (ROOT / 'index.html').read_text(encoding='utf-8')

    html = replace_inner(html, r'<div class="media-grid" id="media-grid">',
                         media_cards(items), ' ' * 8)
    html = replace_inner(html, r'<div class="media-filter" id="media-filter"[^>]*>',
                         media_filter(items), ' ' * 8)
    html = replace_inner(html, r'<div class="photogrid" id="photogrid">',
                         gallery_tiles(hory, 'Michalis Katapodis - cestování a hory, fotka'), ' ' * 8)
    html = replace_inner(html, r'<div class="photogrid photogrid--auta" id="photogrid-auta">',
                         gallery_tiles(auta, 'Michalis Katapodis - auta a Porsche, fotka'), ' ' * 8)

    # JSON-LD ItemList
    marker = '      "itemListElement": [\n'
    start = html.index(marker) + len(marker)
    end = html.index('\n      ]\n    }\n  ]\n}', start)
    html = html[:start] + item_list(items) + html[end:]
    html = re.sub(r'"numberOfItems": \d+,', f'"numberOfItems": {len(items)},', html, count=1)

    # čerstvost obsahu pro vyhledávače i jazykové modely
    html = re.sub(r'"dateModified": "[\d-]+"', f'"dateModified": "{today}"', html)

    (ROOT / 'index.html').write_text(html, encoding='utf-8')

    sm = (ROOT / 'sitemap.xml').read_text(encoding='utf-8')
    sm = re.sub(r'<lastmod>[\d-]+</lastmod>', f'<lastmod>{today}</lastmod>', sm)
    (ROOT / 'sitemap.xml').write_text(sm, encoding='utf-8')

    print(f'media: {len(items)} karet | galerie: {len(hory)} hory, {len(auta)} auta '
          f'| dateModified/lastmod: {today}')


if __name__ == '__main__':
    main()
