const MAX_BODY_BYTES = 12 * 1024;
const MAX_NAME_LENGTH = 120;
const MAX_MESSAGE_LENGTH = 5000;

function sendJson(res, statusCode, payload) {
    res.status(statusCode).setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify(payload));
}

function parseBody(req) {
    if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
        return req.body;
    }

    const rawBody = Buffer.isBuffer(req.body)
        ? req.body.toString("utf8")
        : typeof req.body === "string"
            ? req.body
            : "";

    if (rawBody.length > MAX_BODY_BYTES) {
        return null;
    }

    const contentType = String(req.headers["content-type"] || "").toLowerCase();

    if (contentType.includes("application/json")) {
        try {
            return JSON.parse(rawBody);
        } catch {
            return null;
        }
    }

    if (contentType.includes("application/x-www-form-urlencoded")) {
        return Object.fromEntries(new URLSearchParams(rawBody));
    }

    return null;
}

function cleanText(value, maxLength) {
    return String(value || "")
        .replace(/[\u0000-\u001f\u007f]/g, " ")
        .trim()
        .slice(0, maxLength);
}

function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
        return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            "\"": "&quot;",
            "'": "&#39;",
        }[character];
    });
}

function sendPage(res, statusCode, payload) {
    const heading = payload.ok ? "Message sent" : "Message not sent";
    const message = payload.ok
        ? "Thanks for reaching out. Your message has been sent."
        : (payload.error || "Please email Alessia directly.");
    const html = "<!doctype html><html lang=\"en\"><meta charset=\"utf-8\">" +
        "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">" +
        "<title>" + heading + "</title><body style=\"font:16px/1.6 system-ui,sans-serif;" +
        "max-width:42rem;margin:4rem auto;padding:0 1rem;color:#26231f\"><main><h1>" +
        heading + "</h1><p>" + escapeHtml(message) +
        "</p><p><a href=\"/html/contact.html\">Return to the contact page</a></p>" +
        "</main></body></html>";
    res.status(statusCode).setHeader("Content-Type", "text/html; charset=utf-8");
    return res.end(html);
}

function respond(req, res, statusCode, payload) {
    const acceptsJson = String(req.headers.accept || "").includes("application/json");

    if (acceptsJson) {
        return sendJson(res, statusCode, payload);
    }

    return sendPage(res, statusCode, payload);
}

module.exports = async function contact(req, res) {
    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        return sendJson(res, 405, { ok: false, error: "Method not allowed." });
    }

    const origin = req.headers.origin;
    if (origin) {
        try {
            const originHost = new URL(origin).host.toLowerCase();
            const requestHost = String(req.headers.host || "").toLowerCase();
            if (!requestHost || originHost !== requestHost) {
                return sendJson(res, 403, { ok: false, error: "Request not allowed." });
            }
        } catch {
            return sendJson(res, 403, { ok: false, error: "Request not allowed." });
        }
    }

    const contentLength = Number(req.headers["content-length"] || 0);
    if (contentLength > MAX_BODY_BYTES) {
        return respond(req, res, 413, { ok: false, error: "The message is too large." });
    }

    const body = parseBody(req);
    if (!body || typeof body !== "object") {
        return respond(req, res, 400, { ok: false, error: "Please check the form and try again." });
    }

    // Silently accept bot submissions to keep the honeypot from revealing itself.
    if (cleanText(body.website, 200)) {
        return respond(req, res, 200, { ok: true });
    }

    const name = cleanText(body.name, MAX_NAME_LENGTH);
    const email = cleanText(body.email, 254);
    const message = cleanText(body.message, MAX_MESSAGE_LENGTH);

    if (!isValidEmail(email) || message.length < 10) {
        return respond(req, res, 400, { ok: false, error: "Please enter a valid email and a message of at least 10 characters." });
    }

    if (!process.env.RESEND_API_KEY || !process.env.CONTACT_FROM || !process.env.CONTACT_TO) {
        console.error("Contact form is missing email configuration.");
        return respond(req, res, 503, { ok: false, error: "The form is temporarily unavailable. Please email Alessia directly." });
    }

    const senderName = name ? ` (${name})` : "";
    const emailText = [
        "New message from Alessia's portfolio contact form",
        "",
        `Name: ${name || "Not provided"}`,
        `Email: ${email}`,
        "",
        "Message:",
        message,
    ].join("\n");

    let resendResponse;
    try {
        resendResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from: process.env.CONTACT_FROM,
                to: [process.env.CONTACT_TO],
                reply_to: email,
                subject: `Portfolio contact${senderName}`,
                text: emailText,
            }),
            signal: AbortSignal.timeout(10000),
        });
    } catch {
        console.error("Resend request failed before a response was received.");
        return respond(req, res, 502, { ok: false, error: "The message could not be sent. Please try again or email Alessia directly." });
    }

    if (!resendResponse.ok) {
        console.error("Resend rejected a contact form request.", { status: resendResponse.status });
        return respond(req, res, 502, { ok: false, error: "The message could not be sent. Please try again or email Alessia directly." });
    }

    return respond(req, res, 200, { ok: true });
};
