## FDE AI Agent

An Express and React workspace with two modes:

- **General chat** at `/api/chat`, with calculator, weather, and currency tools.
- **Website agent** at `/api/websites`, which creates vanilla HTML, CSS, and JavaScript projects under `generated-sites/` and returns a live preview URL.

### Setup

Create a `.env` file with `GEMINI_API_KEY`. Optional values are `PORT`, `GEMINI_MODEL`, and `WEATHER_API_KEY`.

The Gemini API key belongs to a Google AI Studio or Google Cloud project. Website generation can make several model requests while it creates and checks files, so free-tier projects may exhaust their daily request quota. When that happens, the API returns `429` and the website agent reports that the quota must reset or that a project with available billing quota is required. This is separate from an invalid model or API key; configure `GEMINI_MODEL` to a model available to the project associated with the key.

Install dependencies:

```bash
npm install
```

Run the backend API and frontend separately during development:

```bash
npm run dev
npm run frontend:dev
```

Open `http://localhost:5173`. Vite proxies `/api` requests to the Express server on port `5000`.

Build and serve the complete application from Express:

```bash
npm run build
npm start
```

Open `http://localhost:5000`. Generated previews are served only through `/api/websites/preview/:projectId/...`, with paths constrained to `generated-sites`.
