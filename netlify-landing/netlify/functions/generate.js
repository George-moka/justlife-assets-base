// Proxies the AI Screen Generator to Anthropic. The API key is read from the
// ANTHROPIC_API_KEY environment variable set in Netlify (never in the page).
exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { error: { message: "POST only" } });
  }
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return json(400, { error: { message: "ANTHROPIC_API_KEY is not set in Netlify environment variables." } });
  }
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: event.body,
    });
    const text = await r.text();
    return { statusCode: r.status, headers: { "content-type": "application/json" }, body: text };
  } catch (e) {
    return json(502, { error: { message: String((e && e.message) || e) } });
  }
};

function json(statusCode, obj) {
  return { statusCode, headers: { "content-type": "application/json" }, body: JSON.stringify(obj) };
}
