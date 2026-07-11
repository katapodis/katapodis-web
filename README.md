# Michalis Katapodis — osobní web

Statická jednostránka. **Žádný framework, žádný build** — jen HTML, CSS a kousek vanilla JS. Otevřeš `index.html` a funguje.

## Struktura

```
index.html      – celá stránka (obsah)
styles.css      – vzhled
main.js         – menu, časová osa článků, galerie, lazy videa
images/
  hero.jpg              – hero fotka
  yt-*.jpg              – náhledy videí
  travel/               – fotky z cest (1.jpg, 2.jpg, …) – viz níže
CNAME           – doména pro GitHub Pages (katapodis.cz)
```

> Složky `saved/` a `screenshots/` (záloha původního webu z Lovable) jsou lokální a do gitu se nenahrávají.

## Jak přidat fotky z cest

Galerie „Cestování & Hory" se **naplní sama**. Stačí nahrát fotky do `images/travel/` a pojmenovat je čísly:

```
images/travel/1.jpg
images/travel/2.jpg
images/travel/3.jpg
…
```

Web postupně zkusí `1.jpg` až `30.jpg` a zobrazí ty, které existují. Nic dalšího se nemusí nastavovat.

## Jak upravit články

Seznam v sekci „Média & Tvorba" je pole `articles` na začátku `main.js`. Každá položka:

```js
{ d: '2025-03-11', t: 'Název článku', s: '3IT.cz', u: 'https://…' }
```

`d` = datum (`RRRR-MM-DD`) nebo `null` když datum neznáme. Články se řadí automaticky od nejnovějšího a seskupují po letech.

## Náhled lokálně

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

## Publikace (GitHub Pages)

1. Vytvoř repo na GitHubu a nahraj obsah této složky.
2. **Settings → Pages → Build and deployment → Source: „Deploy from a branch"**, branch `main`, složka `/ (root)`.
3. Soubor `CNAME` už obsahuje `katapodis.cz` — Pages doménu převezme.
4. V DNS domény `katapodis.cz` (WEDOS) nasměruj:
   - `A` záznamy apexu na GitHub Pages: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - `CNAME` pro `www` → `<uživatel>.github.io`
5. V **Settings → Pages** zaškrtni **Enforce HTTPS** (po propsání DNS).
