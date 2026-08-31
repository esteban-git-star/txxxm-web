/**
 * tivim-chatbot – Cloudflare Worker (vollständig)
 *
 * Cloudflare Dashboard einrichten:
 * 1. Bindings → KV → Variable name: UPDATES
 * 2. Bindings → R2 → Variable name: UPDATE_IMAGES (Bucket z.B. tivim-update-images)
 * 3. Settings → Secrets:
 *    ADMIN_SECRET, DOWNLOAD_PRO_APK, DOWNLOAD_XC_APK, DOWNLOAD_PC_APP
 *    (bestehend: XTREAM_URL, XTREAM_USER, XTREAM_PASS, OPENAI_API_KEY)
 *
 * Deploy: Code einfügen → Save and Deploy
 */

export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    const MAX_IMAGE_BYTES = 800000;
    const ALLOWED_IMAGE_TYPES = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;
    const lang = url.searchParams.get("lang")?.toUpperCase() || "DE";

    // ==========================================
    // ADMIN: Bild-Upload (POST multipart)
    // ==========================================
    if (path === "/admin/upload-image" && request.method === "POST") {
      const auth = request.headers.get("Authorization") || "";
      if (!env.ADMIN_SECRET || auth !== "Bearer " + env.ADMIN_SECRET) {
        return json({ error: "unauthorized" }, 401, corsHeaders);
      }
      if (!env.UPDATE_IMAGES) {
        return json({ error: "R2 binding UPDATE_IMAGES fehlt" }, 503, corsHeaders);
      }

      try {
        const form = await request.formData();
        const file = form.get("image");
        if (!file || typeof file.arrayBuffer !== "function") {
          return json({ error: "no image" }, 400, corsHeaders);
        }
        const mime = file.type || "image/jpeg";
        const ext = ALLOWED_IMAGE_TYPES[mime];
        if (!ext) {
          return json({ error: "invalid type" }, 400, corsHeaders);
        }
        const buf = await file.arrayBuffer();
        if (buf.byteLength > MAX_IMAGE_BYTES) {
          return json({ error: "too large" }, 413, corsHeaders);
        }

        const id = "img_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
        const key = id + "." + ext;
        await env.UPDATE_IMAGES.put(key, buf, {
          httpMetadata: { contentType: mime, cacheControl: "public, max-age=86400" },
        });

        const imagePath = "/updates/img/" + key;
        return json({ ok: true, image: imagePath, url: url.origin + imagePath }, 200, corsHeaders);
      } catch (e) {
        return json({ error: "upload failed" }, 500, corsHeaders);
      }
    }

    // ==========================================
    // ADMIN: Live-Updates (POST)
    // ==========================================
    if (path === "/admin/updates" && request.method === "POST") {
      const auth = request.headers.get("Authorization") || "";
      if (!env.ADMIN_SECRET || auth !== "Bearer " + env.ADMIN_SECRET) {
        return json({ error: "unauthorized" }, 401, corsHeaders);
      }
      if (!env.UPDATES) {
        return json({ error: "KV binding UPDATES fehlt" }, 500, corsHeaders);
      }

      try {
        const body = await request.json();
        const store = await readStore(env);

        if (body.action === "ping") {
          return json({ ok: true }, 200, corsHeaders);
        }

        if (body.action === "create") {
          const imagePath = sanitizeImagePath(body.image, url.origin);
          const item = {
            id: "u_" + Date.now().toString(36),
            title: String(body.title || "").slice(0, 120),
            body: String(body.body || "").slice(0, 1200),
            active: body.active !== false,
            highlight: body.highlight === true,
            created: new Date().toISOString(),
          };
          if (imagePath) item.image = imagePath;
          store.items = [item, ...(store.items || [])].slice(0, 20);
          await writeStore(env, store);
          return json({ ok: true, item }, 200, corsHeaders);
        }

        if (body.action === "toggle-active" && body.id) {
          store.items = (store.items || []).map(function (item) {
            if (item.id !== body.id) return item;
            var isActive = item.active !== false;
            return Object.assign({}, item, {
              active: !isActive,
              updated: new Date().toISOString(),
            });
          });
          await writeStore(env, store);
          return json({ ok: true }, 200, corsHeaders);
        }

        if (body.action === "toggle-highlight" && body.id) {
          store.items = (store.items || []).map(function (item) {
            if (item.id !== body.id) return item;
            return Object.assign({}, item, {
              highlight: !item.highlight,
              updated: new Date().toISOString(),
            });
          });
          await writeStore(env, store);
          return json({ ok: true }, 200, corsHeaders);
        }

        // Legacy: alter Admin-Code
        if (body.action === "toggle" && body.id) {
          store.items = (store.items || []).map(function (item) {
            if (item.id !== body.id) return item;
            var next = Object.assign({}, item, {
              updated: new Date().toISOString(),
            });
            if (body.field === "highlight") {
              next.highlight = !item.highlight;
            } else {
              next.active = item.active === false;
            }
            return next;
          });
          await writeStore(env, store);
          return json({ ok: true }, 200, corsHeaders);
        }

        if (body.action === "delete" && body.id) {
          store.items = (store.items || []).filter(function (item) {
            return item.id !== body.id;
          });
          await writeStore(env, store);
          return json({ ok: true }, 200, corsHeaders);
        }

        return json({ error: "bad request" }, 400, corsHeaders);
      } catch (e) {
        return json({ error: "server error" }, 500, corsHeaders);
      }
    }

    // ==========================================
    // GET: Updates, Downloads, Status, Filme, Serien
    // ==========================================
    if (request.method === "GET") {
      // Bilder für Meldungen
      if (path.startsWith("/updates/img/") && env.UPDATE_IMAGES) {
        const key = path.slice("/updates/img/".length);
        if (!key || key.includes("..") || key.includes("/")) {
          return new Response("Not found", { status: 404, headers: corsHeaders });
        }
        const obj = await env.UPDATE_IMAGES.get(key);
        if (!obj) {
          return new Response("Not found", { status: 404, headers: corsHeaders });
        }
        const headers = Object.assign({}, corsHeaders, {
          "Content-Type": obj.httpMetadata?.contentType || "image/jpeg",
          "Cache-Control": "public, max-age=86400",
        });
        return new Response(obj.body, { headers });
      }

      // Live-Updates für Startseite
      if (path === "/updates") {
        const store = env.UPDATES ? await readStore(env) : { items: [] };
        return json(store, 200, corsHeaders);
      }

      // APK-Downloads (URLs nur in Cloudflare Secrets)
      if (path.startsWith("/dl/")) {
        const map = {
          "/dl/xc-apk": env.DOWNLOAD_XC_APK,
          "/dl/pro-apk": env.DOWNLOAD_PRO_APK,
          "/dl/pc-app": env.DOWNLOAD_PC_APP,
        };
        const target = map[path];
        if (!target) {
          return new Response("Not found", { status: 404, headers: corsHeaders });
        }
        return Response.redirect(target, 302);
      }

      try {
        const baseUrl =
          env.XTREAM_URL +
          "/player_api.php?username=" +
          encodeURIComponent(env.XTREAM_USER) +
          "&password=" +
          encodeURIComponent(env.XTREAM_PASS);

        if (path === "/filme" || path === "/serien") {
          const cache = caches.default;
          const cacheKey = new Request(url.toString(), request);
          const cachedResponse = await cache.match(cacheKey);
          if (cachedResponse) return cachedResponse;

          const isVod = path === "/filme";
          const catAction = isVod ? "get_vod_categories" : "get_series_categories";
          const streamAction = isVod ? "get_vod_streams" : "get_series";

          const [catRes, streamRes] = await Promise.all([
            fetch(baseUrl + "&action=" + catAction),
            fetch(baseUrl + "&action=" + streamAction),
          ]);

          const categories = await catRes.json();
          let streams = await streamRes.json();
          if (!Array.isArray(streams)) streams = [];

          const allowedCatIds = new Set(
            categories
              .filter(function (c) {
                return c.category_name && c.category_name.toUpperCase().includes(lang);
              })
              .map(function (c) {
                return String(c.category_id || "");
              })
          );

          const filteredStreams = streams.filter(function (s) {
            return allowedCatIds.has(String(s.category_id || ""));
          });

          const sorted = filteredStreams
            .sort(function (a, b) {
              if (isVod) {
                return parseInt(b.stream_id || 0, 10) - parseInt(a.stream_id || 0, 10);
              }
              const timeB = b.last_modified ? parseInt(b.last_modified, 10) : parseInt(b.series_id || 0, 10);
              const timeA = a.last_modified ? parseInt(a.last_modified, 10) : parseInt(a.series_id || 0, 10);
              return timeB - timeA;
            })
            .slice(0, 20);

          const cleanData = sorted.map(function (item) {
            return {
              name: item.name,
              cover: item.stream_icon || item.cover || "https://via.placeholder.com/150x225/111827/4ade80?text=Kein+Bild",
            };
          });

          const finalResponse = new Response(JSON.stringify(cleanData), {
            headers: Object.assign({}, corsHeaders, {
              "Content-Type": "application/json",
              "Cache-Control": "s-maxage=3600, max-age=3600",
            }),
          });

          ctx.waitUntil(cache.put(cacheKey, finalResponse.clone()));
          return finalResponse;
        }

        // Server-Status (Root GET)
        if (path === "/" || path === "") {
          const response = await fetch(baseUrl);
          const data = await response.json();
          if (response.ok && data.user_info) {
            return json({ status: "online" }, 200, corsHeaders);
          }
          return json({ status: "offline" }, 200, corsHeaders);
        }

        return new Response("Not found", { status: 404, headers: corsHeaders });
      } catch (error) {
        if (path === "/" || path === "") {
          return json({ status: "offline" }, 200, corsHeaders);
        }
        return new Response(JSON.stringify({ error: "server error" }), {
          status: 500,
          headers: Object.assign({}, corsHeaders, { "Content-Type": "application/json" }),
        });
      }
    }

    // ==========================================
    // POST: Legacy-Chatbot (falls noch genutzt)
    // ==========================================
    if (request.method === "POST") {
      try {
        const { message } = await request.json();

        const openAiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + env.OPENAI_API_KEY,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: `Du bist der smarte Support-Filter und Wegweiser für Tivim-Web. Deine Hauptaufgabe ist es, häufige Probleme sofort zu lösen und Support-Anfragen abzufangen.

DEINE REGELN & TONFALL:
1. Antworte extrem kurz, freundlich und im "Du".
2. Erfinde KEINE eigenen Lösungswege oder Menüpunkte.
3. Nutze IMMER die unten stehenden Lösungs-Szenarien.

DEINE 4 LÖSUNGS-SZENARIEN:

SZENARIO 1: Aussetzer, Ruckeln, Buffering oder schwarzes Bild
- Nutzer sagt z.B.: "Bild hängt", "Ruckelt abends", "Server down?"
- Deine Antwort: "Unsere Server laufen stabil! Wenn es abends ruckelt (besonders oft bei Telekom-Kunden), hilft meistens ein VPN. Bitte nimm vorher deinen Router und dein Gerät für 5 Minuten komplett vom Strom. Hilft das nicht, schau dir unsere VPN-Tipps an: https://tivim-web.com/vpn.html"

SZENARIO 2: Sender fehlen, EPG (Programm) leer, Filme nicht da
- Nutzer sagt z.B.: "Wo ist Sender XY?", "Kein Programm", "Filme laden nicht"
- Deine Antwort: "Hast du deine Wiedergabeliste heute schon aktualisiert? Das löst 90 % dieser Probleme! Hilfe findest du auf https://tivim-web.com – einfach in die Suche tippen."

SZENARIO 3: Allgemeine Fragen zu Installation & Bedienung
- Nutzer fragt nach Einrichtung, Downloader-Codes oder Favoriten.
- Deine Antwort: Verweise freundlich auf https://tivim-web.com

SZENARIO 4: Abos, Preise, Testzugänge oder unlösbare Probleme
- Nutzer fragt nach Käufen, Testlines oder der Bot weiß nicht weiter.
- Deine Antwort: "Schreib der Person, von der du die Zugangsdaten hast – am besten mit Benutzernamen und Foto vom Fehler."`,
              },
              { role: "user", content: message },
            ],
          }),
        });

        const data = await openAiResponse.json();
        if (data.error) {
          return json({ reply: "OpenAI Fehler: " + data.error.message }, 200, corsHeaders);
        }
        return json({ reply: data.choices[0].message.content }, 200, corsHeaders);
      } catch (error) {
        return json({ reply: "Technischer Fehler: " + error.message }, 200, corsHeaders);
      }
    }

    return new Response("Methode nicht erlaubt", { status: 405, headers: corsHeaders });
  },
};

function json(data, status, corsHeaders) {
  return new Response(JSON.stringify(data), {
    status: status,
    headers: Object.assign({}, corsHeaders, { "Content-Type": "application/json" }),
  });
}

async function readStore(env) {
  return (await env.UPDATES.get("broadcast", "json")) || { items: [] };
}

async function writeStore(env, data) {
  await env.UPDATES.put("broadcast", JSON.stringify(data));
}

function sanitizeImagePath(raw, origin) {
  if (!raw) return "";
  var s = String(raw).trim();
  if (s.indexOf("/updates/img/") === 0) return s.slice(0, 200);
  if (origin && s.indexOf(origin + "/updates/img/") === 0) {
    return s.slice(origin.length).slice(0, 200);
  }
  return "";
}
