/**
 * tivim-chatbot – Cloudflare Worker (vollständig)
 *
 * Cloudflare Dashboard einrichten:
 * 1. Bindings → KV → Variable name: UPDATES
 * 2. Bindings → R2 → Variable name: UPDATE_IMAGES (Bucket z.B. tivim-update-images)
 * 3. Settings → Secrets:
 *    ADMIN_SECRET, DOWNLOAD_PRO_APK, DOWNLOAD_XC_APK, DOWNLOAD_PC_APP
 *    WISHBOX_TO (Empfänger – nie ins Repo!)
 *    Optional: WISHBOX_FROM = wunschbox@tivim-web.com (Absender für Mailchannels)
 *    TRAKT_CLIENT_ID (Trakt-Suche Wunschbox – nur Client ID, kein OAuth nötig)
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

        if (body.action === "get-downloads") {
          return json({ ok: true, downloads: await readDownloads(env) }, 200, corsHeaders);
        }

        if (body.action === "set-downloads") {
          var proCode = sanitizeInstallCode(body.proCode || body["pro-code"]);
          var xcCode = sanitizeInstallCode(body.xcCode || body["xc-code"]);
          var dl = {
            "pro-code": proCode,
            "xc-code": xcCode,
            "pro-apk": proCode ? "https://go.aftvnews.com/" + proCode : "",
            "xc-apk": xcCode ? "https://go.aftvnews.com/" + xcCode : "",
            "pc-app": String(body.pcApp || body["pc-app"] || "").trim().slice(0, 500),
          };
          await writeDownloads(env, dl);
          return json({ ok: true, downloads: dl }, 200, corsHeaders);
        }

        if (body.action === "get-poll") {
          var pollData = await readPoll(env);
          var pollRef = pollData || defaultPoll();
          var voteRef = pollRef.id ? await readPollVotes(env, pollRef.id) : { counts: {} };
          return json(
            { ok: true, poll: pollRef, votes: voteRef.counts || {} },
            200,
            corsHeaders
          );
        }

        if (body.action === "save-poll") {
          var prevPoll = await readPoll(env);
          var pollOptions = normalizePollOptions(body.options);
          if (body.active === true && pollOptions.length < 2) {
            return json({ error: "Mindestens 2 Antworten nötig" }, 400, corsHeaders);
          }
          var nextKey = pollOptions
            .map(function (o) {
              return o.label;
            })
            .join("\0");
          var prevKey = ((prevPoll && prevPoll.options) || [])
            .map(function (o) {
              return o.label;
            })
            .join("\0");
          var resetVotes = body.resetVotes === true || nextKey !== prevKey;
          var pollId =
            prevPoll && prevPoll.id && !resetVotes ? prevPoll.id : "p_" + Date.now().toString(36);
          var nextPoll = {
            id: pollId,
            active: body.active === true,
            title: String(body.title || "").slice(0, 120),
            text: String(body.text || "").slice(0, 500),
            options: pollOptions,
            updated: new Date().toISOString(),
          };
          await writePoll(env, nextPoll);
          if (resetVotes) {
            await writePollVotes(env, pollId, { counts: {}, ips: {} });
          }
          var savedVotes = await readPollVotes(env, pollId);
          return json(
            { ok: true, poll: nextPoll, votes: savedVotes.counts || {} },
            200,
            corsHeaders
          );
        }

        if (body.action === "reset-poll-votes") {
          var currentPoll = await readPoll(env);
          if (!currentPoll || !currentPoll.id) {
            return json({ error: "no poll" }, 404, corsHeaders);
          }
          await writePollVotes(env, currentPoll.id, { counts: {}, ips: {} });
          return json({ ok: true, votes: {} }, 200, corsHeaders);
        }

        if (body.action === "get-wishes") {
          var wishItems = (await readWishes(env)).items || [];
          wishItems = wishItems.map(function (w) {
            if (!w.trakt || !w.trakt.type || !w.trakt.id) return w;
            return Object.assign({}, w, {
              trakt: Object.assign({}, w.trakt, {
                poster: posterPublicUrl(url.origin, w.trakt.type, w.trakt.id),
              }),
            });
          });
          return json({ ok: true, wishes: wishItems }, 200, corsHeaders);
        }

        if (body.action === "delete-wish" && body.id) {
          var wishes = await readWishes(env);
          wishes.items = (wishes.items || []).filter(function (w) {
            return w.id !== body.id;
          });
          await writeWishes(env, wishes);
          return json({ ok: true }, 200, corsHeaders);
        }

        if (body.action === "update-wish" && body.id) {
          var wishStore = await readWishes(env);
          var wishFound = false;
          wishStore.items = (wishStore.items || []).map(function (w) {
            if (w.id !== body.id) return w;
            wishFound = true;
            var next = Object.assign({}, w, {
              updated: new Date().toISOString(),
            });
            if (body.note != null) {
              next.adminNote = String(body.note || "").trim().slice(0, 500);
            }
            if (body.date != null) {
              next.adminDate = sanitizeAdminDate(body.date);
            }
            if (body.done === true) next.done = true;
            if (body.done === false) next.done = false;
            return next;
          });
          if (!wishFound) {
            return json({ error: "not found" }, 404, corsHeaders);
          }
          await writeWishes(env, wishStore);
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
    // Wunschbox (POST) – Empfänger nur in Secret WISHBOX_TO
    // ==========================================
    if (path === "/wishbox" && request.method === "POST") {
      if (!env.WISHBOX_TO) {
        return json({ error: "not configured" }, 503, corsHeaders);
      }

      try {
        const body = await request.json();
        if (body.website) {
          return json({ ok: true }, 200, corsHeaders);
        }

        const messageRaw = String(body.message || "").trim();
        const name = String(body.name || "").trim().slice(0, 80);
        const contact = String(body.contact || "").trim().slice(0, 120);
        const userNote = String(body.note || "").trim().slice(0, 500);

        var trakt = null;
        if (body.trakt && body.trakt.type && body.trakt.id) {
          try {
            trakt = await buildTraktPreview(env, body.trakt.type, body.trakt.id);
          } catch (traktErr) {
            trakt = null;
          }
          if (!trakt) {
            return json({ error: "invalid trakt" }, 400, corsHeaders);
          }
          trakt.poster = posterPublicUrl(url.origin, trakt.type, trakt.id);
        }

        var message = messageRaw;
        if (trakt) {
          message = trakt.title + (trakt.year ? " (" + trakt.year + ")" : "");
        }

        if (!trakt && message.length < 10) {
          return json({ error: "too short" }, 400, corsHeaders);
        }
        if (message.length > 2000) {
          return json({ error: "too long" }, 400, corsHeaders);
        }
        if (contact && !isValidEmail(contact)) {
          return json({ error: "invalid email" }, 400, corsHeaders);
        }

        const ip = request.headers.get("CF-Connecting-IP") || "unknown";
        const allowed = await checkWishboxRate(env, ip);
        if (!allowed) {
          return json({ error: "rate limit" }, 429, corsHeaders);
        }
        if (!env.UPDATES) {
          return json({ error: "not configured" }, 503, corsHeaders);
        }

        await appendWish(env, { message, name, contact, ip, trakt, userNote });

        var mailed = false;
        try {
          await sendWishboxEmail(env, { message, name, contact, ip, trakt: trakt, userNote: userNote });
          mailed = true;
        } catch (mailErr) {
          mailed = false;
        }

        return json({ ok: true, mailed: mailed }, 200, corsHeaders);
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

      if (path === "/poll" && request.method === "GET") {
        var publicPoll = await readPoll(env);
        if (!publicPoll || !publicPoll.active || !publicPoll.options || !publicPoll.options.length) {
          return json({ active: false }, 200, corsHeaders);
        }
        return json(
          {
            active: true,
            id: publicPoll.id,
            title: publicPoll.title,
            text: publicPoll.text,
            options: publicPoll.options.map(function (o) {
              return { id: o.id, label: o.label };
            }),
          },
          200,
          corsHeaders
        );
      }

      if (path === "/poll/vote" && request.method === "POST") {
        if (!env.UPDATES) {
          return json({ error: "unavailable" }, 503, corsHeaders);
        }
        try {
          var voteBody = await request.json();
          var livePoll = await readPoll(env);
          if (!livePoll || !livePoll.active) {
            return json({ error: "inactive" }, 400, corsHeaders);
          }
          var voteOptionId = String(voteBody.optionId || "").trim();
          var validOption = (livePoll.options || []).some(function (o) {
            return o.id === voteOptionId;
          });
          if (!validOption) {
            return json({ error: "invalid option" }, 400, corsHeaders);
          }
          var voterIp = request.headers.get("CF-Connecting-IP") || "unknown";
          var voteStore = await readPollVotes(env, livePoll.id);
          if (voteStore.ips && voteStore.ips[voterIp]) {
            return json({ error: "already voted", results: buildPollResults(livePoll, voteStore.counts) }, 409, corsHeaders);
          }
          voteStore.counts = voteStore.counts || {};
          voteStore.ips = voteStore.ips || {};
          voteStore.counts[voteOptionId] = (voteStore.counts[voteOptionId] || 0) + 1;
          voteStore.ips[voterIp] = voteOptionId;
          await writePollVotes(env, livePoll.id, voteStore);
          return json({ ok: true, results: buildPollResults(livePoll, voteStore.counts) }, 200, corsHeaders);
        } catch (voteErr) {
          return json({ error: "vote failed" }, 500, corsHeaders);
        }
      }

      if (path === "/poll/results" && request.method === "GET") {
        var resultsPoll = await readPoll(env);
        if (!resultsPoll || !resultsPoll.active) {
          return json({ active: false }, 200, corsHeaders);
        }
        var resultsVotes = await readPollVotes(env, resultsPoll.id);
        return json(
          {
            active: true,
            id: resultsPoll.id,
            results: buildPollResults(resultsPoll, resultsVotes.counts || {}),
          },
          200,
          corsHeaders
        );
      }

      // Downloader-Codes für TV-Anleitung (tivim.html)
      if (path === "/install-codes") {
        const codes = await readInstallCodes(env);
        return json(codes, 200, corsHeaders);
      }

      // APK-Downloads (Secrets oder KV „downloads“)
      if (path.startsWith("/dl/")) {
        var slug = path.slice("/dl/".length).replace(/\/$/, "");
        if (!slug || slug.includes("/")) {
          return new Response("Not found", { status: 404, headers: corsHeaders });
        }
        const target = await resolveDownload(env, slug);
        if (!target) {
          return new Response("Not found", { status: 404, headers: corsHeaders });
        }
        return Response.redirect(target, 302);
      }

      // Trakt-Suche für Wunschbox (Client ID nur im Worker)
      if (path === "/trakt/img") {
        var imgType = url.searchParams.get("type");
        var imgId = parseInt(url.searchParams.get("id") || "", 10);
        if ((imgType !== "show" && imgType !== "movie") || !imgId) {
          return new Response("", { status: 400, headers: corsHeaders });
        }
        if (!String(env.TRAKT_CLIENT_ID || "").trim()) {
          return new Response("", { status: 503, headers: corsHeaders });
        }
        var imgIp = request.headers.get("CF-Connecting-IP") || "unknown";
        var imgCacheKey = new Request(url.origin + "/trakt/img?v=1&type=" + imgType + "&id=" + imgId);
        var imgCached = await caches.default.match(imgCacheKey);
        if (imgCached) return imgCached;

        var imgClientId = String(env.TRAKT_CLIENT_ID).trim();
        var posterSrc = await resolveTraktPoster(env, imgClientId, imgType, imgId, imgIp, ctx);
        if (!posterSrc) {
          return new Response("", { status: 404, headers: corsHeaders });
        }
        var imgResp = await fetch(posterSrc, {
          headers: { "User-Agent": "Tivim-Wunschbox/1.0 (tivim-web.com)" },
        });
        if (!imgResp.ok) {
          return new Response("", { status: 404, headers: corsHeaders });
        }
        var imgOut = new Response(imgResp.body, {
          headers: {
            "Content-Type": imgResp.headers.get("Content-Type") || "image/jpeg",
            "Cache-Control": "public, s-maxage=604800, max-age=604800",
            ...corsHeaders,
          },
        });
        ctx.waitUntil(caches.default.put(imgCacheKey, imgOut.clone()));
        return imgOut;
      }

      if (path === "/trakt/search") {
        if (!String(env.TRAKT_CLIENT_ID || "").trim()) {
          return json({ error: "trakt not configured" }, 503, corsHeaders);
        }
        var traktClientId = String(env.TRAKT_CLIENT_ID).trim();
        var q = String(url.searchParams.get("q") || "").trim().slice(0, 80);
        if (q.length < 3) {
          return json({ results: [] }, 200, corsHeaders);
        }
        var searchIp = request.headers.get("CF-Connecting-IP") || "unknown";
        var cache = caches.default;
        var cacheKey = new Request(url.origin + "/trakt/search?v=5&q=" + encodeURIComponent(q.toLowerCase()));
        var cachedSearch = await cache.match(cacheKey);
        if (cachedSearch) return cachedSearch;
        if (!(await consumeTraktRate(env, searchIp, "search"))) {
          return json({ error: "rate limit" }, 429, corsHeaders);
        }
        try {
          var searchResp = await traktFetch(traktClientId, "/search/movie,show", {
            query: q,
            limit: 8,
          });
          if (!searchResp.ok) {
            return traktErrorResponse(searchResp, corsHeaders);
          }
          var searchRaw = await searchResp.json();
          var results = [];
          if (Array.isArray(searchRaw)) {
            searchRaw.forEach(function (row) {
              var kind = row.type === "movie" ? "movie" : row.type === "show" ? "show" : null;
              if (!kind) return;
              var item = row[kind];
              if (!item || !item.ids || !item.ids.trakt) return;
              results.push({
                type: kind,
                id: item.ids.trakt,
                title: String(item.title || "").slice(0, 200),
                year: item.year || null,
                poster: posterPublicUrl(url.origin, kind, item.ids.trakt),
              });
            });
          }
          var searchOut = json({ results: results }, 200, corsHeaders);
          searchOut.headers.set("Cache-Control", "public, s-maxage=600, max-age=600");
          ctx.waitUntil(cache.put(cacheKey, searchOut.clone()));
          return searchOut;
        } catch (searchErr) {
          return json({ error: "trakt error" }, 502, corsHeaders);
        }
      }

      if (path === "/trakt/preview") {
        if (!String(env.TRAKT_CLIENT_ID || "").trim()) {
          return json({ error: "trakt not configured" }, 503, corsHeaders);
        }
        var previewType = url.searchParams.get("type");
        var previewId = parseInt(url.searchParams.get("id") || "", 10);
        if ((previewType !== "show" && previewType !== "movie") || !previewId) {
          return json({ error: "bad request" }, 400, corsHeaders);
        }
        var previewIp = request.headers.get("CF-Connecting-IP") || "unknown";
        try {
          var previewCacheKey = new Request(
            url.origin + "/trakt/preview?v=3&type=" + previewType + "&id=" + previewId
          );
          var cachedPreview = await caches.default.match(previewCacheKey);
          if (cachedPreview) return cachedPreview;

          if (!(await consumeTraktRate(env, previewIp, "preview"))) {
            return json({ error: "rate limit" }, 429, corsHeaders);
          }

          var preview = await buildTraktPreview(env, previewType, previewId);
          if (!preview) return json({ error: "not found" }, 404, corsHeaders);
          preview.poster = posterPublicUrl(url.origin, previewType, previewId);
          var previewOut = json(preview, 200, corsHeaders);
          previewOut.headers.set("Cache-Control", "public, s-maxage=1800, max-age=1800");
          ctx.waitUntil(caches.default.put(previewCacheKey, previewOut.clone()));
          return previewOut;
        } catch (previewErr) {
          return json({ error: "trakt error" }, 502, corsHeaders);
        }
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

async function readDownloads(env) {
  if (!env.UPDATES) return {};
  return (await env.UPDATES.get("downloads", "json")) || {};
}

async function writeDownloads(env, data) {
  await env.UPDATES.put("downloads", JSON.stringify(data));
}

async function readWishes(env) {
  if (!env.UPDATES) return { items: [] };
  return (await env.UPDATES.get("wishbox", "json")) || { items: [] };
}

async function writeWishes(env, data) {
  await env.UPDATES.put("wishbox", JSON.stringify(data));
}

function defaultPoll() {
  return {
    id: "",
    active: false,
    title: "Bald geht's los!",
    text: "Wir bereiten gerade die ersten Umfragen vor. Schau in Kürze wieder vorbei!",
    options: [],
    updated: null,
  };
}

function normalizePollOptions(raw) {
  var arr = Array.isArray(raw) ? raw : [];
  var out = [];
  arr.forEach(function (item, i) {
    var label = "";
    var id = "";
    if (typeof item === "string") label = item.trim();
    else if (item && item.label) {
      label = String(item.label).trim();
      id = String(item.id || "").trim();
    }
    if (!label) return;
    if (!id) id = "o_" + (i + 1);
    out.push({ id: id.slice(0, 24), label: label.slice(0, 120) });
  });
  return out.slice(0, 8);
}

function buildPollResults(poll, counts) {
  var total = 0;
  (poll.options || []).forEach(function (o) {
    total += counts && counts[o.id] ? counts[o.id] : 0;
  });
  return (poll.options || []).map(function (o) {
    var count = counts && counts[o.id] ? counts[o.id] : 0;
    return {
      id: o.id,
      label: o.label,
      count: count,
      pct: total ? Math.round((count / total) * 100) : 0,
    };
  });
}

async function readPoll(env) {
  if (!env.UPDATES) return null;
  return await env.UPDATES.get("poll", "json");
}

async function writePoll(env, data) {
  await env.UPDATES.put("poll", JSON.stringify(data));
}

async function readPollVotes(env, pollId) {
  if (!env.UPDATES || !pollId) return { counts: {}, ips: {} };
  return (await env.UPDATES.get("poll_votes:" + pollId, "json")) || { counts: {}, ips: {} };
}

async function writePollVotes(env, pollId, data) {
  if (!env.UPDATES || !pollId) return;
  await env.UPDATES.put("poll_votes:" + pollId, JSON.stringify(data), { expirationTtl: 7776000 });
}

async function appendWish(env, payload) {
  var store = await readWishes(env);
  var item = {
    id: "w_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 6),
    message: payload.message,
    name: payload.name || "",
    contact: payload.contact || "",
    created: new Date().toISOString(),
  };
  if (payload.trakt) item.trakt = payload.trakt;
  if (payload.userNote) item.userNote = payload.userNote;
  store.items = [item, ...(store.items || [])].slice(0, 50);
  await writeWishes(env, store);
  return item;
}

var DEFAULT_INSTALL_CODES = { pro: "5276912", xc: "2853690" };
var DEFAULT_PC_APP =
  "https://drive.google.com/file/d/1TqqzKKtyVRux-cw_DmgWxzD1v9hvkKNG/view?usp=sharing";

function sanitizeInstallCode(raw) {
  return String(raw || "")
    .trim()
    .replace(/\D/g, "")
    .slice(0, 12);
}

function sanitizeAdminDate(raw) {
  var s = String(raw || "").trim().slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  return "";
}

async function readInstallCodes(env) {
  var cfg = env.UPDATES ? await readDownloads(env) : {};
  return {
    pro: cfg["pro-code"] || DEFAULT_INSTALL_CODES.pro,
    xc: cfg["xc-code"] || DEFAULT_INSTALL_CODES.xc,
  };
}

async function resolveDownload(env, slug) {
  var secretMap = {
    "pro-apk": env.DOWNLOAD_PRO_APK,
    "xc-apk": env.DOWNLOAD_XC_APK,
    "pc-app": env.DOWNLOAD_PC_APP,
  };
  var fromSecret = secretMap[slug];
  if (fromSecret && String(fromSecret).trim()) return String(fromSecret).trim();
  var kv = await readDownloads(env);
  var fromKv = kv[slug];
  if (fromKv && String(fromKv).trim()) return String(fromKv).trim();
  var codes = await readInstallCodes(env);
  if (slug === "pro-apk" && codes.pro) return "https://go.aftvnews.com/" + codes.pro;
  if (slug === "xc-apk" && codes.xc) return "https://go.aftvnews.com/" + codes.xc;
  if (slug === "pc-app") return DEFAULT_PC_APP;
  return null;
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

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function checkWishboxRate(env, ip) {
  if (!env.UPDATES) return true;
  var key = "wish_rl:" + ip;
  var raw = await env.UPDATES.get(key);
  var now = Date.now();
  var windowMs = 3600000;
  var max = 5;
  var entries = raw ? JSON.parse(raw) : [];
  entries = entries.filter(function (t) {
    return now - t < windowMs;
  });
  if (entries.length >= max) return false;
  entries.push(now);
  await env.UPDATES.put(key, JSON.stringify(entries), { expirationTtl: 3600 });
  return true;
}

function buildWishboxText(payload) {
  var lines = ["Neuer Wunsch über tivim-web.com", ""];
  if (payload.name) lines.push("Name: " + payload.name);
  if (payload.contact) lines.push("Kontakt: " + payload.contact);
  if (payload.trakt) {
    lines.push("Typ: " + (payload.trakt.type === "movie" ? "Film" : "Serie"));
    if (payload.trakt.dateLabel) lines.push("Termin: " + payload.trakt.dateLabel);
  }
  if (payload.userNote) lines.push("Zusatz: " + payload.userNote);
  lines.push("", payload.message);
  if (payload.ip && payload.ip !== "unknown") {
    lines.push("", "—", "IP (Rate-Limit): " + payload.ip);
  }
  return lines.join("\n");
}

var TRAKT_API = "https://api.trakt.tv";

function traktHeaders(clientId) {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    "User-Agent": "Tivim-Wunschbox/1.0 (tivim-web.com)",
    "trakt-api-version": "2",
    "trakt-api-key": String(clientId || "").trim(),
  };
}

async function traktFetch(clientId, path, params) {
  var target = TRAKT_API + path;
  if (params) {
    var parts = [];
    Object.keys(params).forEach(function (k) {
      if (params[k] != null && params[k] !== "") {
        parts.push(encodeURIComponent(k) + "=" + encodeURIComponent(String(params[k])));
      }
    });
    if (parts.length) target += "?" + parts.join("&");
  }
  return fetch(target, {
    headers: traktHeaders(clientId),
    cf: { cacheEverything: true, cacheTtl: 300 },
  });
}

function traktErrorResponse(resp, corsHeaders) {
  if (resp && resp.status === 429) {
    return json({ error: "rate limit", source: "trakt" }, 429, corsHeaders);
  }
  if (resp && (resp.status === 401 || resp.status === 403)) {
    return json({ error: "trakt auth" }, 503, corsHeaders);
  }
  return json({ error: "trakt unavailable" }, 502, corsHeaders);
}

async function traktJson(resp) {
  if (!resp || !resp.ok) return null;
  var text = "";
  try {
    text = await resp.text();
  } catch (e) {
    return null;
  }
  if (!text || !String(text).trim()) return null;
  try {
    return JSON.parse(text);
  } catch (e) {
    return null;
  }
}

function formatTraktDate(iso) {
  if (!iso) return "";
  var d = iso.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return iso.slice(0, 10);
  var p = d.split("-");
  return p[2] + "." + p[1] + "." + p[0];
}

function epCode(season, episode) {
  return "S" + String(season).padStart(2, "0") + "E" + String(episode).padStart(2, "0");
}

async function buildTraktPreview(env, type, id) {
  var clientId = String(env.TRAKT_CLIENT_ID || "").trim();
  if (!clientId) return null;
  var numId = parseInt(id, 10);
  if (!numId || numId < 1) return null;
  if (type === "movie") return buildMoviePreview(clientId, numId);
  if (type === "show") return buildShowPreview(clientId, numId);
  return null;
}

async function buildMoviePreview(clientId, id) {
  var resp = await traktFetch(clientId, "/movies/" + id, { extended: "full" });
  var movie = await traktJson(resp);
  if (!movie || !movie.ids || !movie.ids.trakt) return null;
  var released = movie.released ? String(movie.released).slice(0, 10) : "";
  return {
    type: "movie",
    id: movie.ids.trakt,
    title: String(movie.title || "").slice(0, 200),
    year: movie.year || null,
    status: "",
    dateLabel: released ? "Release · " + formatTraktDate(released) : "Release unbekannt",
    dateIso: sanitizeAdminDate(released),
    episodeCode: "",
    poster: pickTraktPoster(movie),
  };
}

async function buildShowPreview(clientId, id) {
  var showResp = await traktFetch(clientId, "/shows/" + id, { extended: "full" });
  var show = await traktJson(showResp);
  if (!show || !show.ids || !show.ids.trakt) return null;

  var status = String(show.status || "");
  var next = null;
  var last = null;

  if (status !== "ended") {
    var nextResp = await traktFetch(clientId, "/shows/" + id + "/next_episode", { extended: "full" });
    next = await traktJson(nextResp);
  }
  if (!next || status === "ended") {
    var lastResp = await traktFetch(clientId, "/shows/" + id + "/last_episode", { extended: "full" });
    last = await traktJson(lastResp);
  }

  var dateLabel = "Termin unbekannt";
  var dateIso = "";
  var episodeCode = "";

  if (next && next.first_aired && next.season != null && next.number != null) {
    episodeCode = epCode(next.season, next.number);
    dateLabel = "Nächste Folge " + episodeCode + " · " + formatTraktDate(next.first_aired);
    dateIso = sanitizeAdminDate(next.first_aired);
  } else if (status === "ended" && last && last.first_aired && last.season != null && last.number != null) {
    episodeCode = epCode(last.season, last.number);
    dateLabel = "Beendet · letzte Folge " + episodeCode + " · " + formatTraktDate(last.first_aired);
    dateIso = sanitizeAdminDate(last.first_aired);
  } else if (last && last.first_aired && last.season != null && last.number != null) {
    episodeCode = epCode(last.season, last.number);
    dateLabel = "Letzte Folge " + episodeCode + " · " + formatTraktDate(last.first_aired);
    dateIso = sanitizeAdminDate(last.first_aired);
  } else if (status === "ended") {
    dateLabel = "Beendet";
  } else if (status === "returning" || status === "in production") {
    dateLabel = "Läuft · Termin offen";
  }

  return {
    type: "show",
    id: show.ids.trakt,
    title: String(show.title || "").slice(0, 200),
    year: show.year || null,
    status: status,
    dateLabel: dateLabel,
    dateIso: dateIso,
    episodeCode: episodeCode,
    poster: pickTraktPoster(show),
  };
}

function posterPublicUrl(origin, type, id) {
  if (!origin || !type || !id) return "";
  return (
    origin +
    "/trakt/img?type=" +
    encodeURIComponent(type) +
    "&id=" +
    encodeURIComponent(String(id))
  );
}

function normalizePosterUrl(raw) {
  if (!raw) return "";
  var url = String(raw).trim();
  if (!url) return "";
  if (url.indexOf("//") === 0) url = "https:" + url;
  else if (url.indexOf("http") !== 0) url = "https://" + url;
  return url.slice(0, 500);
}

function pickTraktPoster(entity) {
  if (!entity || !entity.images) return "";
  var imgs = entity.images;
  var keys = ["poster", "thumb", "banner", "fanart"];
  for (var i = 0; i < keys.length; i++) {
    var val = imgs[keys[i]];
    var raw = "";
    if (Array.isArray(val) && val[0]) raw = val[0];
    else if (typeof val === "string") raw = val;
    var url = normalizePosterUrl(raw);
    if (url) return url;
  }
  return "";
}

async function resolveTraktPoster(env, clientId, type, traktId, ip, ctx) {
  var kvKey = "trakt_poster:" + type + ":" + traktId;
  if (env.UPDATES) {
    var kvHit = await env.UPDATES.get(kvKey);
    if (kvHit) return kvHit;
  }

  var cache = caches.default;
  var cacheKey = new Request("https://poster.cache/trakt/v2/" + type + "/" + traktId);
  var cached = await cache.match(cacheKey);
  if (cached) {
    try {
      var hit = await cached.json();
      if (hit && hit.poster) {
        if (env.UPDATES && hit.poster) {
          ctx.waitUntil(env.UPDATES.put(kvKey, hit.poster, { expirationTtl: 604800 }));
        }
        return hit.poster;
      }
    } catch (e) {
      /* ignore */
    }
  }
  if (!(await consumeTraktRate(env, ip, "meta"))) return "";

  var apiPath = type === "movie" ? "/movies/" + traktId : "/shows/" + traktId;
  var resp = await traktFetch(clientId, apiPath, { extended: "full" });
  if (!resp.ok) return "";
  var data = await traktJson(resp);
  var poster = pickTraktPoster(data);
  var out = json({ poster: poster || "" }, 200, {});
  out.headers.set("Cache-Control", "public, max-age=604800");
  if (ctx) {
    ctx.waitUntil(cache.put(cacheKey, out.clone()));
    if (env.UPDATES && poster) {
      ctx.waitUntil(env.UPDATES.put(kvKey, poster, { expirationTtl: 604800 }));
    }
  } else {
    await cache.put(cacheKey, out.clone());
    if (env.UPDATES && poster) {
      await env.UPDATES.put(kvKey, poster, { expirationTtl: 604800 });
    }
  }
  return poster;
}

async function consumeTraktRate(env, ip, kind) {
  if (!env.UPDATES) return true;
  var limits = {
    search: { max: 80, windowMs: 3600000 },
    preview: { max: 40, windowMs: 3600000 },
    meta: { max: 120, windowMs: 3600000 },
  };
  var cfg = limits[kind] || limits.search;
  var key = "trakt_rl:" + kind + ":" + ip;
  var raw = await env.UPDATES.get(key);
  var now = Date.now();
  var entries = raw ? JSON.parse(raw) : [];
  entries = entries.filter(function (t) {
    return now - t < cfg.windowMs;
  });
  if (entries.length >= cfg.max) return false;
  entries.push(now);
  await env.UPDATES.put(key, JSON.stringify(entries), { expirationTtl: 3600 });
  return true;
}

function parseWishboxFrom(raw) {
  var fallback = { email: "wunschbox@tivim-web.com", name: "Tivim Wunschbox" };
  if (!raw) return fallback;
  var s = String(raw).trim();
  var m = s.match(/^(.+?)\s*<([^>]+)>$/);
  if (m) return { name: m[1].trim(), email: m[2].trim() };
  if (s.indexOf("@") !== -1) return { name: fallback.name, email: s };
  return fallback;
}

async function sendWishboxEmail(env, payload) {
  var to = env.WISHBOX_TO;
  var from = parseWishboxFrom(env.WISHBOX_FROM);
  var subject = "Neuer Wunsch – Tivim";
  var text = buildWishboxText(payload);

  var body = {
    personalizations: [{ to: [{ email: to }] }],
    from: { email: from.email, name: from.name },
    subject: subject,
    content: [{ type: "text/plain", value: text }],
  };
  if (payload.contact) body.reply_to = { email: payload.contact };

  var res = await fetch("https://api.mailchannels.net/tx/v1/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("mail failed");
}
