import { describe, expect, it } from "vitest";
import { handleRequest } from "../src/index";

function makeRequest(
  path: string,
  init: { headers?: Record<string, string>; method?: string; cf?: Record<string, unknown> } = {},
): Request {
  const request = new Request(`https://ip.example.com${path}`, {
    method: init.method ?? "GET",
    headers: { "CF-Connecting-IP": "203.0.113.7", ...init.headers },
  });
  Object.defineProperty(request, "cf", {
    value: init.cf ?? {
      city: "Bratislava",
      region: "Bratislava Region",
      country: "SK",
      continent: "EU",
      latitude: "48.14816",
      longitude: "17.10674",
      timezone: "Europe/Bratislava",
      asn: 64500,
      asOrganization: "Example Net",
      colo: "VIE",
    },
  });
  return request;
}

describe("ip-info worker", () => {
  it("returns JSON details on /json", async () => {
    const res = handleRequest(makeRequest("/json"));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("application/json");
    const body = await res.json<Record<string, unknown>>();
    expect(body).toMatchObject({
      ip: "203.0.113.7",
      city: "Bratislava",
      country: "SK",
      asn: 64500,
      asOrganization: "Example Net",
      postalCode: null,
    });
  });

  it("returns the bare IP on /ip", async () => {
    const res = handleRequest(makeRequest("/ip"));
    expect(await res.text()).toBe("203.0.113.7\n");
  });

  it("returns plain text on / for curl", async () => {
    const res = handleRequest(makeRequest("/", { headers: { "User-Agent": "curl/8.9.1" } }));
    expect(res.headers.get("Content-Type")).toContain("text/plain");
    expect(await res.text()).toBe("203.0.113.7\n");
  });

  it("returns JSON on / when Accept is application/json", async () => {
    const res = handleRequest(makeRequest("/", { headers: { Accept: "application/json" } }));
    expect(res.headers.get("Content-Type")).toContain("application/json");
  });

  it("returns HTML on / for browsers and escapes values", async () => {
    const res = handleRequest(
      makeRequest("/", {
        headers: { Accept: "text/html", "User-Agent": "<script>alert(1)</script>" },
      }),
    );
    const html = await res.text();
    expect(res.headers.get("Content-Type")).toContain("text/html");
    expect(html).toContain("203.0.113.7");
    expect(html).toContain("Bratislava, Bratislava Region, SK");
    expect(html).toContain("AS64500 Example Net");
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("handles missing cf data", async () => {
    const res = handleRequest(makeRequest("/json", { cf: {} }));
    const body = await res.json<Record<string, unknown>>();
    expect(body.city).toBeNull();
    expect(body.asn).toBeNull();
  });

  it("disables caching", () => {
    const res = handleRequest(makeRequest("/json"));
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });

  it("returns 404 for unknown paths", () => {
    expect(handleRequest(makeRequest("/nope")).status).toBe(404);
  });

  it("rejects non-GET methods", () => {
    expect(handleRequest(makeRequest("/json", { method: "POST" })).status).toBe(405);
  });

  it("answers health checks", async () => {
    const res = handleRequest(makeRequest("/health"));
    expect(await res.json()).toEqual({ status: "ok" });
  });
});
