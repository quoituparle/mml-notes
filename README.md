# MML Study Notes (Part I)

Interactive study notes for Part I of *Mathematics for Machine Learning* (Deisenroth, Faisal, Ong).
Plain HTML + JavaScript, no build step. Formulas use KaTeX from a CDN (internet needed).

> Unofficial study aid. The book is free at https://mml-book.com. Do not commit the book's PDF to a public repo (its licence is personal use only).

## Run locally

Opening the files by double-click will not work (the browser blocks the scripts). Use any static server, for example:

    python -m http.server 8123 --bind 127.0.0.1 --directory .

then open http://127.0.0.1:8123

## Deploy on GitHub Pages

1. Create a new GitHub repository and put the **contents of this `site/` folder** in it (so `index.html` is at the repo root).
2. Repository **Settings → Pages → Build and deployment → Deploy from a branch**, branch `main`, folder `/ (root)`.
3. After a minute the site is live at `https://<your-username>.github.io/<repo-name>/`.

## Files

- `index.html`, `chapter1.html` … `chapter7.html`: the pages
- `assets/style.css`: theme (warm white)
- `assets/app.js`: shared 2D plane + slider widget engine (also Chapter 2 visuals)
- `assets/plot.js`: shared 1D plotting helpers (chapters 5–7)
- `assets/ch3.js` … `ch7.js`: the visuals for each chapter
