# Hostinger deployment

This app is configured with Next.js `output: "standalone"` and needs a Hostinger Node.js application. It cannot be deployed as plain static HTML because `/api/reverse-geocode` uses the server-side `GOOGLE_MAPS_API_KEY`.

## Build locally

```bash
npm install
npm run build
```

The production server is generated in `.next/standalone/`.

## Upload files

Upload these items from the project to the Hostinger application root:

- `.next/standalone/` contents, including `server.js`, `.next/`, `node_modules/`, and `package.json`
- `.next/static/` to `.next/standalone/.next/static/`
- `public/` to `.next/standalone/public/`

Do not upload `.env` or expose the Google key in client-side variables.

## Hostinger Node.js settings

In hPanel, create a Node.js application and set:

- Node version: 20 or newer
- Application mode: `Production`
- Application root: the folder containing `server.js`
- Startup file: `server.js`
- Port: use the port supplied by Hostinger, or leave the panel's automatic setting

Add these environment variables in the Hostinger panel:

```text
NEXT_PUBLIC_API_URL=https://your-api.example.com
GOOGLE_MAPS_API_KEY=your-google-maps-server-key
NODE_ENV=production
```

Restart the application after uploading the build. The app must be opened through the Hostinger Node.js application URL or the domain mapped to it.

## Important

If the current Hostinger plan does not show a Node.js application option, it cannot run this Next.js server build. Use a Hostinger plan with Node.js support or deploy the app on a Node-compatible host; a static-only upload would disable the reverse-geocode API route.