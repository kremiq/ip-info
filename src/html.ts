import type { IpInfo } from "./index";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function row(label: string, value: string | number | null): string {
  const display = value === null ? "—" : escapeHtml(String(value));
  return `<tr><th>${escapeHtml(label)}</th><td>${display}</td></tr>`;
}

export function renderHtml(info: IpInfo): string {
  const location = [info.city, info.region, info.country].filter(Boolean).join(", ") || null;
  const coords =
    info.latitude && info.longitude ? `${info.latitude}, ${info.longitude}` : null;
  const network = info.asn ? `AS${info.asn}${info.asOrganization ? ` ${info.asOrganization}` : ""}` : info.asOrganization;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>IP Info</title>
<style>
  :root { --bg: #f7f7f8; --fg: #1a1a1f; --muted: #6b6b76; --card: #fff; --line: #e4e4e8; --accent: #2457d6; }
  @media (prefers-color-scheme: dark) {
    :root { --bg: #111114; --fg: #ececf1; --muted: #9a9aa6; --card: #1b1b20; --line: #2c2c33; --accent: #7aa2ff; }
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--fg); font: 16px/1.5 system-ui, sans-serif; }
  main { max-width: 640px; margin: 0 auto; padding: 48px 16px; }
  .label { color: var(--muted); font-size: 14px; margin: 0; }
  h1 { margin: 4px 0 24px; font: 600 clamp(28px, 7vw, 44px)/1.15 ui-monospace, monospace; overflow-wrap: anywhere; }
  table { width: 100%; border-collapse: collapse; background: var(--card); border: 1px solid var(--line); border-radius: 12px; overflow: hidden; }
  th, td { text-align: left; padding: 10px 14px; border-top: 1px solid var(--line); vertical-align: top; }
  tr:first-child th, tr:first-child td { border-top: 0; }
  th { color: var(--muted); font-weight: 500; width: 38%; }
  td { overflow-wrap: anywhere; }
  footer { margin-top: 24px; color: var(--muted); font-size: 14px; }
  code { color: var(--accent); }
</style>
</head>
<body>
<main>
  <p class="label">Your public IP address</p>
  <h1>${escapeHtml(info.ip ?? "unknown")}</h1>
  <table>
    ${row("Location", location)}
    ${row("Postal code", info.postalCode)}
    ${row("Coordinates", coords)}
    ${row("Timezone", info.timezone)}
    ${row("Continent", info.continent)}
    ${row("Network", network)}
    ${row("Cloudflare colo", info.colo)}
    ${row("Protocol", [info.httpProtocol, info.tlsVersion].filter(Boolean).join(" / ") || null)}
    ${row("User agent", info.userAgent)}
  </table>
  <footer>API: <code>/json</code> · <code>/ip</code> · <code>curl</code> this URL for plain text</footer>
</main>
</body>
</html>
`;
}
