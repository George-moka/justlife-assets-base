// Streaming proxy to Anthropic. Streams the response through so long generations
// (multi-screen flows) don't hit Netlify's ~10s synchronous function timeout.
// API key comes from the ANTHROPIC_API_KEY env var set in Netlify (never in the page).
export default async (req) => {
  // Health check: open /api/generate in a browser — {"ok":true,"version":"stream-v1"} means the NEW streaming function is live.
  if (req.method === "GET") {
    return jsonRes(200, { ok: true, version: "stream-v1", streaming: true });
  }
  if (req.method !== "POST") {
    return jsonRes(405, { error: { message: "POST only" } });
  }
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return jsonRes(400, { error: { message: "ANTHROPIC_API_KEY is not set in Netlify environment variables." } });
  }
  let body;
  try { body = await req.json(); } catch (e) { return jsonRes(400, { error: { message: "Invalid JSON body" } }); }
  body.stream = true; // force streaming upstream

  let upstream;
  try {
    upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    return jsonRes(502, { error: { message: String((e && e.message) || e) } });
  }
  if (!upstream.ok) {
    const text = await upstream.text();
    return new Response(text, { status: upstream.status, headers: { "content-type": "application/json" } });
  }
  // Pipe the SSE stream straight through — bytes flow immediately, keeping the connection alive
  return new Response(upstream.body, {
    status: 200,
    headers: { "content-type": "text/event-stream", "cache-control": "no-cache" },
  });
};

function jsonRes(status, obj) {
  return new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json" } });
}
