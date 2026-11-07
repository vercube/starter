<div align="center">
  <img src="https://raw.githubusercontent.com/vercube/vercube/refs/heads/main/.github/assets/cover.png" width="100%" alt="Vercube - Unleash your server development." />
  <br>
  <br>

# Vercube + Vue

### Fullstack starter app

</div>

> [!TIP]
> Look at the [Vercube documentation](https://vercube.dev) to learn more.

- `apps/api`: the Vercube API on port 3000
- `apps/web`: a Vue app on Vite, port 5173, which proxies `/api` to the API
- `packages/`: code shared by both

The web app calls the API through `@vercube/client`, typed by the API's controllers. `vercube dev` keeps `apps/api/.vercube/routes.d.ts` up to date, so changing a handler breaks every call that no longer fits at compile time.

## Setup

```bash
# you can use any other package manager like npm, yarn, bun
$ pnpm i
```

## Dev servers

```bash
$ pnpm dev
```

Open http://localhost:5173.

## Production build

```bash
$ pnpm build
```

The API is built to `apps/api/dist`, the web app to `apps/web/dist`. In development Vite proxies `/api` to the API; in production serve both from one origin, for example behind a reverse proxy that sends `/api` to the API and everything else to `apps/web/dist`.

The web app type-checks the API's controllers through the route map, so keep runtime-specific globals such as `Bun` out of controllers, or add their types to `apps/web/tsconfig.json`.
