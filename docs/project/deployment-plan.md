# DARTS deployment plan

**Goal:** every push to the `prod` branch that passes the tests deploys DARTS automatically through GitHub Actions,
to one always-on server at our own `.com` domain. Day-to-day work stays on `main`; a release is a merge from `main`
into `prod`.

**Assumption:** Matterport adds our domain to the SDK key's allow list, so the self-hosted Bundle works there as it does
on `localhost`. Until then, everything except the tour itself can be deployed and checked.

**Domain:** `<domain>` below stands for the chosen name. The recommendation is `dartssound.com` (no DNS records on
Nov 15; confirm at a registrar before relying on it).

## 1. The setup at a glance

```
work on main ──► PR main → prod ──► merge
                                      │
push to prod ──► GitHub Actions ──► typecheck + tests ──► flyctl deploy ──► Fly.io machine ──► https://<domain>
                                                         (builds the Docker image:           Express serves:
                                                          npm ci, fetch-bundle, vite build)    /         page (app/dist)
                                                                                               /api      API
                                                                                               /bundle   Matterport Bundle
                                                                                           Volume /data: mesh cache, index.json
```

- **Host: Fly.io.** It is driven entirely from a CLI, so GitHub Actions does the whole deploy. It is always on (no cold
  start during judging), has persistent volumes, free HTTPS certificates for custom domains, and costs a few dollars a
  month.
- **One service, one origin.** The Bundle and the SDK key are tied to the page's domain, so the page, the API and the
  Bundle are served together by the existing Express server. No CORS, no second host.
- **Not in git, made at build time:** the 28 MB Bundle (`npm run fetch-bundle` in the Dockerfile) and the built page.
- **Not in git, kept on the volume:** the mesh cache (downloads itself again with the token if lost) and `index.json`
  (uploaded once, see section 5).

**Alternative host:** Render, with a Docker service and its deploy hook called from Actions. Same Dockerfile; the build
then runs on Render, not in Actions. Choose it only if nobody wants to use Fly.

## 2. Branches

| Branch | Role | Rules |
|---|---|---|
| `main` | Day-to-day work; feature branches merge here | CI runs on every pull request |
| `prod` | What is live. Every push to it deploys | Changes only through a pull request from `main`; CI must pass; no force pushes |

- **Release:** open a pull request from `main` into `prod`, wait for CI, merge. The deploy workflow starts on the merge.
- **Hotfix:** fix on `main` first, then release as above, so `prod` never has commits `main` lacks.
- **Protect `prod`** in Settings → Branches → Add branch protection rule (or Rules → Rulesets): require a pull
  request and the `CI / test` status check, block force pushes and deletion. (Free private repos do not enforce
  this; there it is a team rule instead.)
- **Create it once** from the commit that holds the deploy setup:
  `git checkout main && git pull && git checkout -b prod && git push -u origin prod`.

## 3. What the code does (done on the `deploy-setup` branch)

| Change | Where |
|---|---|
| `HOST` sets the listening address; loopback stays the default, the image sets `0.0.0.0` | `server/src/address.ts` (`parseHost`) |
| Settings are the `.env` file with non-empty environment variables on top, so Fly secrets work without a file | `server/src/env.ts` (`serverEnv`) |
| `CACHE_DIR` moves the cache (mesh, search index, maps) onto the volume | `server/src/index.ts` |
| When `app/dist/index.html` exists, the server serves the page: hashed `/assets` cached for a year, `index.html` never cached, unknown page paths fall back to `index.html`; `/api` and `/bundle` are untouched. Without a build it answers as before (development) | `server/src/app.ts` (`pageDir`) |
| `SITE_PASSWORD` turns on HTTP Basic auth for the whole site (any user name). `/api/health` stays open for the host's health check | `server/src/guard.ts` (`sitePassword`) |
| `RATE_LIMIT_PER_MIN` limits each visitor on each paid route (`/api/agent`, `/api/jev`, `/api/quick-summary`, `/api/surroundings`, `/api/map.jpg`) and answers the contract's `busy` (HTTP 429) past it. Off when unset, so development and tests are unaffected | `server/src/guard.ts` (`rateLimit`), `LIMITED_PATHS` in `app.ts` |
| `TRUST_PROXY` makes `req.ip` the visitor, not Fly's proxy, so the rate limit is per visitor | `server/src/app.ts` |
| Scripts: root `npm run build` (builds the page) and `npm start`; server `npm start` runs without watch mode | `package.json`, `server/package.json` |

Tests: `server/test/deploy.test.ts`, plus `parseHost` and `serverEnv` cases. A local production run
(`npm run build`, then `HOST=127.0.0.1 PORT=8799 npm start`) served the page, its assets, the Bundle and the mesh from
one port.

**Settings the server reads**

| Name | Where it is set | Meaning |
|---|---|---|
| `HOST`, `PORT` | Dockerfile, `fly.toml` | Listening address and port |
| `CACHE_DIR` | `fly.toml` | `/data/cache` on the volume |
| `TRUST_PROXY` | `fly.toml` | `1`: one proxy hop in front |
| `RATE_LIMIT_PER_MIN` | `fly.toml` | `30` per visitor, per paid route |
| `SITE_PASSWORD` | Fly secret (optional) | Password for the whole site |
| The app's API keys | Fly secrets | Section 5 |

## 4. The deploy files

| File | What it does |
|---|---|
| `Dockerfile` | Node 24; `npm ci`; downloads the Bundle (`npm run fetch-bundle`) and builds the page; starts the server with `node --import tsx` so stop signals reach it. Dev dependencies stay installed because `tsx` runs the TypeScript directly |
| `.dockerignore` | Keeps `.env`, `costar-kit/data`, the cache, the local Bundle, `node_modules`, `docs` and `.git` out of the image. The two CoStar CSVs stay in: the server reads them for the model allow list |
| `fly.toml` | App `darts` in `ewr`; the settings above; volume `darts_data` at `/data`; HTTPS forced; always on, one machine; health check on `/api/health` |
| `.github/workflows/ci.yml` | Every pull request into `main` or `prod`: `npm ci`, typecheck, tests, production build |
| `.github/workflows/deploy.yml` | Every push to `prod` (or by hand): tests, then `flyctl deploy --remote-only`, then a smoke test of the live site: health shows the Bundle and both Matterport keys, and the page and `/bundle/showcase.html` load. Only one deploy runs at a time, and a manual run on another branch never deploys |

**GitHub settings the deploy workflow reads**

| Name | Kind | Value |
|---|---|---|
| `FLY_API_TOKEN` | Secret on the `production` environment | Output of `fly tokens create deploy` |
| `SITE_PASSWORD` | Secret on the `production` environment (only if the site has one) | Same as the Fly secret, so the smoke test can get in |
| `SITE_URL` | Variable on the `production` environment | `https://<domain>`; until it is set, the workflow uses `https://dartssound.fly.dev` |

All three live in Settings → Environments → `production`, with deployment branches limited to `prod`, so the deploy
token cannot be used from any other branch. (Environments need a public repo or a paid plan. On a free private repo,
put the same names in Settings → Secrets and variables → Actions and remove the `environment:` block from the deploy
job.) `--remote-only` builds the image on Fly's builders, so Actions needs no Docker setup.

## 5. Secrets: where each one lives

| Secret | Stored in | Set by |
|---|---|---|
| `FLY_API_TOKEN` | GitHub secret on the `production` environment (only `prod` can read it) | `fly tokens create deploy`, pasted once into Settings → Environments → `production` |
| `MATTERPORT_SDK_KEY`, `MATTERPORT_API_KEY`, `MATTERPORT_API_TOKEN`, `VEXCEL_API_KEY`, `CLAUDE_API`, `SITE_PASSWORD` | Fly secrets | `fly secrets set NAME=value` once, from a teammate's terminal |
| `SITE_PASSWORD` (copy, only if the site has one) | GitHub secret on the `production` environment | So the smoke test can open the page |

The app's keys never pass through GitHub: Actions only holds the token that allows a deploy (and the site password,
if any, for the smoke test). Changing a Fly secret
restarts the machine with the new value; no redeploy needed. Removing `CLAUDE_API` or `VEXCEL_API_KEY` switches that
feature off. Never commit `.env`; only the SDK key reaches the browser, as today.

## 6. Data

- **Mesh:** nothing to do. The server downloads it with the token on the first request and caches it on the volume.
- **Model allow list:** read from the two CoStar CSVs, which are in git and so in the image.
- **Property search (`index.json`):** built from the licensed CoStar data, which is not in git and cannot be built in
  Actions. Build it locally with `npm run build-index`, then upload it once:
  `fly ssh sftp shell`, then `put server/cache/index.json /data/cache/index.json`. The volume keeps it across deploys.
  The CoStar data is licensed for the hackathon only: serve search only behind `SITE_PASSWORD`, and confirm with
  CoStar first. Without the file, the site still works for the demo house.

## 7. One-time setup (about 1 hour, one person)

1. Register `<domain>` at a registrar (Cloudflare or Namecheap).
2. Install `flyctl`, `fly auth signup` (or login), then `fly apps create dartssound`. The app is reachable at
   `dartssound.fly.dev` (`darts` was taken on Fly).
3. `fly volumes create darts_data --size 1 --region ewr --app dartssound`.
4. `fly secrets set ...` for every app secret in section 5.
5. `fly certs add <domain>`, then add the A and AAAA records it prints at the registrar. Add `www` too if wanted.
6. In GitHub, Settings → Environments: create `production`, limit its deployment branches to `prod`, save
   `fly tokens create deploy` there as the secret `FLY_API_TOKEN` (and `SITE_PASSWORD` if used), and set the
   variable `SITE_URL` to `https://<domain>`.
7. **Send the Matterport access request** with the exact host names: `<domain>` (plus `www.<domain>` if used) and
   `dartssound.fly.dev`, HTTPS only, port 443, the SDK key's label (never the key itself), and the model `Ki9YdfpNKum`.
8. Merge the `deploy-setup` pull request into `main`, then create `prod` from it and protect it (section 2).
   The push that creates `prod` runs the first deploy, and the smoke test checks the live site. Steps 3, 4 and 6
   must be done first: Fly refuses to start without the volume, and the smoke test fails without the keys.

## 8. Checking the live site

The smoke test in the workflow covers health, the page and the Bundle. By hand, once Matterport has added the domain:

- [ ] The tour loads and plays (this is the allow-list test).
- [ ] The mesh loads and the Blueprint view (B) lines up with the tour's walls.
- [ ] Audio starts after a click, the reverb changes between rooms, nothing stutters while moving.
- [ ] Voice input works (the microphone needs HTTPS, which `localhost` gave for free).
- [ ] The agent answers, and repeated calls hit the rate limit.
- [ ] It works on a second machine, another network and a phone.

## 9. Rollback

- **Fast:** `fly releases` lists past versions; `fly deploy --image <previous image>` goes back in about a minute.
- **Normal:** revert the merge on `main`, then release it to `prod`; the workflow deploys the reverted code.
- A deploy that fails its health check never replaces the running version.

## 10. Risks and fallbacks

| Risk | Fallback |
|---|---|
| Matterport has not added the domain by judging | Demo from a laptop on `localhost`; the video is the submission. The live site serves everything except the tour |
| Access is granted for a different host name | Add it with `fly certs add`; no redeploy |
| Access never comes for the Bundle | Switch the viewer to the Embed SDK from `my.matterport.com`. The app uses no scene-graph features, so this is about an hour's change in `app/src/viewer.ts` |
| Claude or Vexcel costs spike | The rate limit; or `fly secrets unset CLAUDE_API` switches the feature off at once |
| The repo goes public | Check first that `.env`, `costar-kit/data/`, `server/bundle/` and `server/cache/` are still git-ignored, and clear the tracked CoStar CSVs with CoStar |

## 11. Order of work

| Step | What | Who |
|---|---|---|
| 1 | Choose and register the domain, create the Fly app, send the Matterport request (section 7, steps 1–3 and 7) | 1 person, now |
| 2 | Review and merge the `deploy-setup` pull request into `main` (sections 3 and 4; code done) | 1 person, in parallel |
| 3 | Secrets, volume, certificate, `production` environment and deploy token (section 7, steps 4–6) | Person from step 1 |
| 4 | Create and protect `prod`: first automatic deploy; upload `index.json` if search is wanted | Either |
| 5 | When Matterport confirms: the section 8 checklist, then the URL on Devpost and in the README | Everyone, 15 minutes |
