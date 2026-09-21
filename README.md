# bullseye-privacy

The published privacy policy for **Bullseye Ballistics**, served by GitHub Pages.

| Page | URL |
|---|---|
| Privacy policy | https://pstover99.github.io/bullseye-privacy/ |
| Account deletion | https://pstover99.github.io/bullseye-privacy/delete-account/ |

Both are linked from the Play Console listing. The deletion URL is required by Play for any
app that allows account creation.

## Editing the policy

`index.html` is **generated**. Edit `PRIVACY_POLICY.md`, then:

```bash
python3 render.py
```

and commit both. CI runs `render.py --check` and fails if they have drifted.

This exists because hand-editing the HTML is how the published page ended up describing an
app with no accounts, months after accounts shipped — the markdown had moved on and the
page had not.

`PRIVACY_POLICY.md` is a copy of `docs/PRIVACY_POLICY.md` in the app repo, which is the
source of truth. Copy it over, re-render, commit.

`delete-account/index.html` is hand-written and has no markdown source: it is short, it is
specific to this site, and it has no upstream file to drift from.
