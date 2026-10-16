# ip-info

A Cloudflare Worker that shows the visitor's public IP address together with
geo and network details. All data comes from Cloudflare's `request.cf`
metadata, so it needs no external API or GeoIP database.

## Endpoints

| Path      | Response                                                                 |
|-----------|--------------------------------------------------------------------------|
| `/`       | HTML page in browsers, plain IP for `curl`/`wget`, JSON with `Accept: application/json` |
| `/json`   | Full details as JSON                                                     |
| `/ip`     | The IP address as plain text                                             |
| `/health` | `{"status":"ok"}`                                                        |

```sh
curl https://<your-worker>.workers.dev          # 203.0.113.7
curl https://<your-worker>.workers.dev/json     # full JSON
```

Example `/json` response:

```json
{
  "ip": "203.0.113.7",
  "city": "Bratislava",
  "region": "Bratislava Region",
  "country": "SK",
  "continent": "EU",
  "timezone": "Europe/Bratislava",
  "asn": 64500,
  "asOrganization": "Example Net",
  "colo": "VIE",
  ...
}
```

## Development

```sh
npm install
npm run dev        # local dev server (wrangler)
npm test           # unit tests (vitest)
npm run typecheck  # TypeScript checks
npm run deploy     # deploy to Cloudflare (needs `wrangler login`)
```

Note that `request.cf` geo fields are mostly empty in local dev; deploy to see
real values.
