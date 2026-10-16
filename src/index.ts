import { renderHtml } from "./html";

export interface IpInfo {
  ip: string | null;
  city: string | null;
  region: string | null;
  regionCode: string | null;
  country: string | null;
  continent: string | null;
  postalCode: string | null;
  latitude: string | null;
  longitude: string | null;
  timezone: string | null;
  asn: number | null;
  asOrganization: string | null;
  colo: string | null;
  httpProtocol: string | null;
  tlsVersion: string | null;
  userAgent: string | null;
}

type Cf = IncomingRequestCfProperties | undefined;

export function getIpInfo(request: Request): IpInfo {
  const cf = request.cf as Cf;
  const str = (v: unknown): string | null =>
    v === undefined || v === null || v === "" ? null : String(v);

  return {
    ip: request.headers.get("CF-Connecting-IP"),
    city: str(cf?.city),
    region: str(cf?.region),
    regionCode: str(cf?.regionCode),
    country: str(cf?.country),
    continent: str(cf?.continent),
    postalCode: str(cf?.postalCode),
    latitude: str(cf?.latitude),
    longitude: str(cf?.longitude),
    timezone: str(cf?.timezone),
    asn: typeof cf?.asn === "number" ? cf.asn : null,
    asOrganization: str(cf?.asOrganization),
    colo: str(cf?.colo),
    httpProtocol: str(cf?.httpProtocol),
    tlsVersion: str(cf?.tlsVersion),
    userAgent: request.headers.get("User-Agent"),
  };
}

const CLI_AGENTS = /^(curl|wget|httpie|xh|powershell)\//i;

function prefersText(request: Request): boolean {
  return CLI_AGENTS.test(request.headers.get("User-Agent") ?? "");
}

function prefersJson(request: Request): boolean {
  const accept = request.headers.get("Accept") ?? "";
  return accept.includes("application/json") && !accept.includes("text/html");
}

const baseHeaders = {
  "Cache-Control": "no-store",
  "Access-Control-Allow-Origin": "*",
  Vary: "Accept, User-Agent",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2) + "\n", {
    status,
    headers: { ...baseHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}

function text(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: { ...baseHeaders, "Content-Type": "text/plain; charset=utf-8" },
  });
}

export function handleRequest(request: Request): Response {
  const { pathname } = new URL(request.url);

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        ...baseHeaders,
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
        "Access-Control-Allow-Headers": "*",
      },
    });
  }
  if (request.method !== "GET" && request.method !== "HEAD") {
    return text("Method Not Allowed\n", 405);
  }

  const info = getIpInfo(request);

  switch (pathname) {
    case "/":
      if (prefersJson(request)) return json(info);
      if (prefersText(request)) return text(`${info.ip ?? "unknown"}\n`);
      return new Response(renderHtml(info), {
        headers: { ...baseHeaders, "Content-Type": "text/html; charset=utf-8" },
      });
    case "/json":
      return json(info);
    case "/ip":
      return text(`${info.ip ?? "unknown"}\n`);
    case "/health":
      return json({ status: "ok" });
    default:
      return json({ error: "Not Found" }, 404);
  }
}

export default {
  fetch(request: Request): Response {
    return handleRequest(request);
  },
} satisfies ExportedHandler;
