# bullseye-privacy

The website for **Bullseye Ballistics**, served by GitHub Pages at
**https://bullseyeballisticscalculator.com**. The repo keeps its old name because it started as
the privacy policy alone, and renaming it would break the old `github.io` links rather than
redirect them.

| Page | URL |
|---|---|
| Home | https://bullseyeballisticscalculator.com/ |
| Features | https://bullseyeballisticscalculator.com/features/ |
| Privacy policy | https://bullseyeballisticscalculator.com/privacy/ |
| Account deletion | https://bullseyeballisticscalculator.com/delete-account/ |

The privacy policy and account-deletion URLs are both entered in the Play Console listing (the
deletion URL under Data safety). Play requires the deletion page for any app that allows account
creation. If either path ever changes, change it in the Play Console the same day.

## Editing

Every `.html` page is **generated**. Never edit `index.html` or any other output directly: CI
fails the PR, and the next render throws the edit away. Edit the source, then:

```bash
python3 render.py
```

and commit the source and the output together. CI runs `render.py --check` and fails if they
have drifted.

| To change | Edit |
|---|---|
| Header, footer, `<head>` on every page | `_layout.html` |
| Home page | `_pages/home.html` |
| Feature tour | `_pages/features.html` |
| Account deletion | `_pages/delete-account.html` |
| Not-found page | `_pages/404.html` |
| Privacy policy | `PRIVACY_POLICY.md` |
| Look | `assets/site.css` |
| Carousels, the home showcase, the full-size viewer | `assets/site.js` |

`PRIVACY_POLICY.md` is a copy of `docs/PRIVACY_POLICY.md` in the app repo, which is the source of
truth. Copy it over, re-render, commit.

The page generator exists because hand-editing the HTML is how the published policy once still
described an app with no accounts, months after accounts shipped. One layout for every page
keeps the header and footer from drifting apart the same way.

## Content rules

- **Every claim about the app must be true of the shipped app.** Check the code, not the store
  listing: the listing once named a sensor with no support and a match feature that did not
  exist.
- **Screenshots come from the app,** either a capture on a phone or emulator, or one of its
  committed Paparazzi goldens. A golden built from a hand-typed fixture can show numbers no rifle
  would produce; check the ballistics before using one. The hero and the readout strip under it
  come from the same capture (a 6GT at 1,024 yd with both Calypso sensors live, 2026-10-01), so
  the strip quotes the card. Three goldens stand in where no capture existed: `shot-string`,
  `log-analysis` and `match`.
- **Phone captures are cropped and re-encoded,** never published raw. The Android status bar
  (clock, signal) and the navigation bar come off (120 px and 126 px at 1080×2400; the
  full-screen solution card has no status bar, so only the bottom), then the image is resized to
  720 px wide and saved as WebP at quality 82. A capture must not show another person's name or
  email; the cloud-backup screen was left out for that reason.
- **Nothing that is not shipped goes on the site, and nothing upcoming is previewed.** There is
  no roadmap or "coming soon" feature list: it hands ideas to competitors (owner's decision,
  2026-10-02). The AI assistant is not named anywhere until it ships; the home page's one line
  "it's only getting smarter from here" is the whole hint.
- **The voice is the owner's.** Feature copy follows the owner's website notes (the Word doc
  the screenshots came from): their phrasing, with typos fixed and anything not shipped taken
  out. Keep it plain and short, no internals, and **US spelling** (center, dialed, color).
  `render.py` fails on the British forms, using the same list as the app's `CopySpellingTest`.
- **The company is always "Core Bridge, LLC."**, and every page ends with
  "© 2026 Core Bridge, LLC. All rights reserved." in the shared footer. `render.py` fails a page
  that is missing the line or names the company any other way, so a new page cannot slip.

## Assets

- Fonts (Rajdhani, IBM Plex Mono, IBM Plex Sans) are served from `assets/fonts/` so a visit
  makes no third-party request. They are under the SIL Open Font License; see
  `assets/fonts/OFL-*.txt`.
- `assets/img/logo.svg` and `favicon.svg` are the app's launcher icon
  (`app/src/main/res/drawable/ic_launcher_foreground.xml` on `#1A2332`).

## Domain

`CNAME` holds the custom domain. DNS is at Cloudflare, pointed at GitHub Pages, **DNS only**
(not proxied), so GitHub can issue the HTTPS certificate. The domain is verified in the account's
GitHub Pages settings, so no other repo can claim it.
