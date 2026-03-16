exports.handler = async function (event) {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method not allowed" })
      };
    }

    const ADMIN_DELETE_TOKEN = process.env.ADMIN_DELETE_TOKEN;
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!ADMIN_DELETE_TOKEN || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Missing server env vars" })
      };
    }

    const authHeader = event.headers.authorization || "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();

    if (token !== ADMIN_DELETE_TOKEN) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Unauthorized" })
      };
    }

    const body = JSON.parse(event.body || "{}");
    const { id, updates } = body;

    if (!id || !updates || typeof updates !== "object") {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing id or updates" })
      };
    }

    const resp = await fetch(
      SUPABASE_URL + "/rest/v1/announcements?id=eq." + encodeURIComponent(id),
      {
        method: "PATCH",
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: "Bearer " + SUPABASE_SERVICE_ROLE_KEY,
          "Content-Type": "application/json",
          Prefer: "return=representation"
        },
        body: JSON.stringify(updates)
      }
    );

    const text = await resp.text();

    if (!resp.ok) {
      return {
        statusCode: resp.status,
        body: JSON.stringify({ error: text || "Edit failed" })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, data: text ? JSON.parse(text) : [] })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || "Server error" })
    };
  }
};
