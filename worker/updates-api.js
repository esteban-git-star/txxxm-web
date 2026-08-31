/**
 * In den bestehenden Cloudflare Worker einbinden (tivim-chatbot).
 *
 * Secrets in Cloudflare Dashboard setzen:
 *   ADMIN_SECRET          – dein Admin-Passwort (lang, zufällig)
 *
 * KV Namespace binden:
 *   UPDATES               – speichert { items: [...] }
 *
 * Optional (Download-Links aus dem Frontend-Code raus):
 *   DOWNLOAD_XC_APK
 *   DOWNLOAD_PRO_APK
 *   DOWNLOAD_PC_APP
 *   PRIVADO_PARTNER_URL
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" }
  });
}

async function readStore(env) {
  return (await env.UPDATES.get("broadcast", "json")) || { items: [] };
}

async function writeStore(env, data) {
  await env.UPDATES.put("broadcast", JSON.stringify(data));
}

function newId() {
  return "u_" + Date.now().toString(36);
}

export async function handleUpdatesRoutes(request, env) {
  const url = new URL(request.url);

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: CORS });
  }

  if (url.pathname === "/updates" && request.method === "GET") {
    return json(await readStore(env));
  }

  if (url.pathname === "/admin/updates" && request.method === "POST") {
    const auth = request.headers.get("Authorization") || "";
    if (auth !== "Bearer " + env.ADMIN_SECRET) {
      return json({ error: "unauthorized" }, 401);
    }

    const body = await request.json();
    const store = await readStore(env);

    if (body.action === "ping") {
      return json({ ok: true });
    }

    if (body.action === "create") {
      const item = {
        id: newId(),
        title: String(body.title || "").slice(0, 120),
        body: String(body.body || "").slice(0, 1200),
        active: body.active !== false,
        created: new Date().toISOString()
      };
      store.items = [item, ...(store.items || [])].slice(0, 20);
      await writeStore(env, store);
      return json({ ok: true, item });
    }

    if (body.action === "toggle" && body.id) {
      store.items = (store.items || []).map(function (item) {
        if (item.id !== body.id) return item;
        return { ...item, active: !item.active, updated: new Date().toISOString() };
      });
      await writeStore(env, store);
      return json({ ok: true });
    }

    return json({ error: "bad request" }, 400);
  }

  if (url.pathname.startsWith("/dl/") && request.method === "GET") {
    const map = {
      "/dl/xc-apk": env.DOWNLOAD_XC_APK,
      "/dl/pro-apk": env.DOWNLOAD_PRO_APK,
      "/dl/pc-app": env.DOWNLOAD_PC_APP
    };
    const target = map[url.pathname];
    if (!target) return new Response("Not found", { status: 404, headers: CORS });
    return Response.redirect(target, 302);
  }

  return null;
}
