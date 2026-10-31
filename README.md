# Heavy Rotation

Two small static pages that turn your Spotify listening into a shareable image of your top tracks, artists or albums. No build step, no server.

| Page | What it does | Setup |
|---|---|---|
| `index.html` | Upload your Spotify data export. Filter by month, and optionally by hours of the day (for example 8 am to 6 pm) and time zone. | None |
| `api.html` | Log in with Spotify and get your top tracks for the last 4 weeks, 6 months or 12 months. No month or hour filters, because Spotify's top-items endpoint has no timestamps. | Spotify developer app, about 5 minutes |

Both share `card.js` (the image maker) and `styles.css`.

## 1. Put it on GitHub Pages

1. Create a new GitHub repository and upload all the files in this folder to its root.
2. In the repo, go to **Settings → Pages**. Under "Build and deployment," choose **Deploy from a branch**, pick `main` and `/ (root)`, and save.
3. After a minute your site is live at `https://YOUR-USERNAME.github.io/heavy-rotation/`.

`index.html` already works at this point. Share the link with anyone. There is no user limit, because each person uploads their own file in their own browser.

## 2. Set up the Spotify login version (optional)

1. Go to <https://developer.spotify.com/dashboard> and create an app. Your Spotify account needs an active **Premium** subscription for Development Mode apps to work.
2. Under **Redirect URIs**, add the exact address of the page, for example `https://YOUR-USERNAME.github.io/heavy-rotation/api.html`. It must match exactly, including the `https://` and the `api.html`. (You can also open `api.html` and copy it from "Setup details for the app owner.") For local testing use `http://127.0.0.1:PORT/api.html`, not `localhost`.
3. Tick **Web API** as the API you plan to use, then save.
4. Copy the app's **Client ID** into `config.js`. The Client ID is public by design. You do **not** need the Client Secret, so never add it anywhere.
5. In the app's **User Management** tab, add the name and Spotify email of each friend who will use it. Development Mode allows up to **5** allowlisted users. People who aren't on the list can log in but Spotify answers their requests with a 403 error.
6. Commit and push `config.js`.

Spotify has tightened its rules in 2026. Check the current limits in the [quota modes page](https://developer.spotify.com/documentation/web-api/concepts/quota-modes) before relying on this for more than a few friends. Moving past the allowlist (extended quota mode) is only open to registered organizations with a launched service.

## Getting your Spotify export (for `index.html`)

1. Go to <https://www.spotify.com/account/privacy> and sign in.
2. Under **Download your data**, tick **Extended streaming history** (the plain "Account data" only covers about a year).
3. Request it and confirm in the email Spotify sends. Spotify says it can take up to 30 days. It often arrives in a few days.
4. Drop the zip you receive onto the page. It is read in the browser and never uploaded. Only track, artist, time and play length are used.

## Making it yours

The Customize panel on both pages controls the look of the image: three shapes (Square, Portrait, Story), a list or **#1 spotlight** arrangement, 12 color themes plus your own accent and flat color, eight textures, an optional frame, cover art shape, plain or badge rank numbers, three fonts, and an optional footer line for your handle. In Story shape, the spotlight puts your number one front and center, with a record peeking out behind it when the Record grooves texture is on.

## Cover art

Both pages draw a square next to each entry. Where a real cover isn't available, they draw a generated abstract tile, so the layout never has holes. Artists get round tiles.

- **Login version (`api.html`):** Spotify returns album covers and artist photos with the top items, and the page loads them straight from Spotify's image servers.
- **Upload version (`index.html`):** the export has track links but no images, so for the top 20 entries the page asks Spotify's public oEmbed lookup for each cover. The export has no artist links, so artists always get generated tiles. If your browser blocks that lookup, the page says so and keeps the generated art.
- Covers are loaded with cross-origin permission so the saved image stays exportable. If a host refuses, that entry just falls back to a generated tile.
- Untick **Show cover art** to hide the squares and get a cleaner list.

## Notes

- The image fonts load from Google Fonts. Without a connection, system fonts are used instead.
- Counts come from the export, so they include every play of at least the length you choose (30 seconds by default). Spotify's own counts can differ slightly.
- Hours are computed in the time zone you pick on the page, because Spotify stores timestamps in UTC.
