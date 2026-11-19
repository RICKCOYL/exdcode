const MAX_BODY_BYTES = 12 * 1024;

function reply(res, status, payload) {
  const heading = payload.ok ? "Message sent" : "Message not sent";
  const message = payload.ok
    ? "Thanks for reaching out. Your message has been sent."
    : (payload.error || "Please email Alessia directly.");
  res.status(status).setHeader("Content-Type", "text/html; charset=utf-8");
  res.end("<!doctype html><html lang=\"en\"><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"><title>" + heading + "</title><body style=\"font:16px/1.6 system-ui,sans-serif;max-width:42rem;margin:4rem auto;padding:0 1rem;color:#26231f\"><main><h1>" + heading + "</h1><p>" + message + "</p><p><a href=\"/html/contact.html\">Return to the contact page</a></p></main></body></html>");
}

function bodyOf(req) {
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) return req.body;
  const raw = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : String(req.body || "");
  if (Buffer.byteLength(raw) > MAX_BODY_BYTES) return null;
  const type = String(req.headers["content-type"] || "").toLowerCase();
  if (type.includes("application/json")) {
    try { return JSON.parse(raw); } catch { return null; }
  }
  if (type.includes("application/x-www-form-urlencoded")) return Object.fromEntries(new URLSearchParams(raw));
  return null;
}

function clean(value, limit) {
  return String(value || "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, limit);
}

module.exports = async function contact(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return reply(res, 405, { ok: false, error: "Method not allowed." });
  }
  const origin = req.headers.origin;
  if (origin) {
    try {
      if (new URL(origin).host.toLowerCase() !== String(req.headers.host || "").toLowerCase()) return reply(res, 403, { ok: false, error: "Request not allowed." });
    } catch { return reply(res, 403, { ok: false, error: "Request not allowed." }); }
  }
  if (Number(req.headers["content-length"] || 0) > MAX_BODY_BYTES) return reply(res, 413, { ok: false, error: "The message is too large." });
  const body = bodyOf(req);
  if (!body || typeof body !== "object") return reply(res, 400, { ok: false, error: "Please check the form and try again." });
  if (clean(body.website, 200)) return reply(res, 200, { ok: true });

  const name = clean(body.name, 120);
  const email = clean(body.email, 254);
  const message = clean(body.message, 5000);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || message.length < 10) return reply(res, 400, { ok: false, error: "Enter a valid email and a message of at least 10 characters." });
  if (!process.env.RESEND_API_KEY || !process.env.CONTACT_FROM || !process.env.CONTACT_TO) {
    console.error("Contact form email configuration is incomplete.");
    return reply(res, 503, { ok: false, error: "The form is temporarily unavailable. Please email Alessia directly." });
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: "Bearer " + process.env.RESEND_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM,
        to: [process.env.CONTACT_TO],
        reply_to: email,
        subject: "Portfolio contact" + (name ? " (" + name + ")" : ""),
        text: ["New message from Alessia's portfolio contact form", "", "Name: " + (name || "Not provided"), "Email: " + email, "", "Message:", message].join("\n")
      }),
      signal: AbortSignal.timeout(10000)
    });
    if (!response.ok) {
      console.error("Resend rejected a contact form request.", { status: response.status });
      return reply(res, 502, { ok: false, error: "The message could not be sent. Please try again or email Alessia directly." });
    }
    return reply(res, 200, { ok: true });
  } catch {
    console.error("Resend request failed before a response was received.");
    return reply(res, 502, { ok: false, error: "The message could not be sent. Please try again or email Alessia directly." });
  }
};
