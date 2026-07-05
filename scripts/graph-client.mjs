export const GRAPH_VERSION = "v21.0";
export const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

export function createGraphClient(accessToken) {
  async function graphGet(pathSegment, params = {}) {
    const url = new URL(`${GRAPH_BASE}/${pathSegment}`);
    url.searchParams.set("access_token", accessToken);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
    const res = await fetch(url);
    const body = await res.json();
    if (!res.ok) {
      throw new Error(`Graph API error on ${pathSegment}: ${JSON.stringify(body)}`);
    }
    return body;
  }

  async function graphPost(pathSegment, params = {}) {
    const url = new URL(`${GRAPH_BASE}/${pathSegment}`);
    url.searchParams.set("access_token", accessToken);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
    const res = await fetch(url, { method: "POST" });
    const body = await res.json();
    if (!res.ok) {
      throw new Error(`Graph API error on ${pathSegment}: ${JSON.stringify(body)}`);
    }
    return body;
  }

  return { graphGet, graphPost };
}
