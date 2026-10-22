# Dee

Dee is a status face for a home-health documentation pipeline. It is a tiny static site — HTML, CSS, and JavaScript, with no framework and no build step — served from GitHub Pages at <https://pokercise.github.io/dee-face/>.

The screen shows one traffic light, a short capsule id such as `c-7F3K2Q`, and a state word.

## Face-only rule

Dee shows a color, one of four state words, and a capsule id. That is the whole display.

Patient data never belongs on this face. Dee does not collect it, upload it, store it, or display it. There are no forms, file inputs, uploads, microphone, analytics, or third-party scripts or fonts.

Scrubbing happens on the phone or the Duo, before a status reaches this face.

Yes and No stay on the device in v1. They write `{ capsule_id, answer }` to the browser console and to local storage, then flip the light. A later version may send `{ capsule_id, answer }` only.

If a writer starts publishing `status.json`, that file is public on this site. It may contain only `state`, `capsule_id`, and `updated`.

## States

| Face | Color | On the glass |
| --- | --- | --- |
| Idle | Grey | Nothing waiting |
| Waiting on you | Amber | Yes and No |
| Failed | Red | Failure signal |
| Done | Green | Finished |

Yes records `answer: "yes"` and turns the face Done. No records `answer: "no"` and turns the face Idle.

## Try a state

v1 does not follow a live pipeline. The small **demo** control in the corner cycles Idle → Waiting on you → Failed → Done.

A URL parameter opens a state directly:

- <https://pokercise.github.io/dee-face/?state=idle>
- <https://pokercise.github.io/dee-face/?state=waiting>
- <https://pokercise.github.io/dee-face/?state=failed>
- <https://pokercise.github.io/dee-face/?state=done>

## status.json

`app.js` has a stub fetch of `./status.json`. It is off (`STATUS_POLL_ENABLED = false`). The file shape is:

```json
{
  "state": "waiting",
  "capsule_id": "c-7F3K2Q",
  "updated": "2026-01-01T00:00:00Z"
}
```

`state` is `idle`, `waiting`, `failed`, or `done`. A later Duo writer can set the flag to drive the face. The page still shows only the light, the capsule id, and the state word. `updated` is not shown.

CI enforces this. `.github/workflows/status-schema.yml` checks `status.json` against `.github/status.schema.json` on every push: only `state`, `capsule_id` (`c-` plus six letters or digits) and `updated` (UTC ISO time), nothing else. A case key, token or any extra field fails the build.

## Install on Android

1. Open <https://pokercise.github.io/dee-face/> in Chrome.
2. Tap the Chrome menu (⋮).
3. Tap **Add to Home screen** or **Install app**.
4. Confirm. The icon is named **Dee** and opens in its own window.
5. The first visit needs a network so Dee can cache its shell. After that it opens offline.

## Publish

The site is the repository root on `main`. GitHub Pages needs one setting:

- Source: **Deploy from a branch**
- Branch: **main**
- Folder: **/ (root)**

`.github/workflows/pages.yml` publishes that same root when Source is **GitHub Actions** instead. With branch publishing, the workflow leaves the deploy to Pages.

## Local preview

From the repository root:

```bash
python3 -m http.server 8080
```

Open <http://127.0.0.1:8080/>. The manifest `start_url` and `scope` are `/dee-face/`, which matches GitHub Pages. To test that path, serve a parent directory that contains this repo as `dee-face/`.
