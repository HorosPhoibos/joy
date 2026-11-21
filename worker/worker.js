// Kotak Pos Stroberi — Cloudflare Worker untuk website Joy.
// Menerima foto / tulisan dari website dan meneruskannya ke Telegram kakak.
// Token bot TIDAK ditulis di sini. Atur di Cloudflare → Worker → Settings → Variables:
//   BOT_TOKEN      (Secret)  token dari @BotFather
//   CHAT_ID        (Text)    ID chat tujuan (chat pribadimu)
//   ALLOWED_ORIGIN (Text)    origin website Joy, mis. https://namamu.github.io  (wajib)

const MAX_BYTES = 8 * 1024 * 1024;
const TYPES = /^image\/(jpeg|png|webp)$/;

export default {
  async fetch(req, env) {
    const allowed = env.ALLOWED_ORIGIN || "";
    const cors = {
      "Access-Control-Allow-Origin": allowed || "null",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin",
    };
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (req.method !== "POST") return json({ ok: false, error: "method" }, 405, cors);
    if (!allowed || (req.headers.get("Origin") || "") !== allowed) return json({ ok: false, error: "origin" }, 403, cors);
    if (!env.BOT_TOKEN || !env.CHAT_ID) return json({ ok: false, error: "config" }, 500, cors);

    let form;
    try { form = await req.formData(); } catch { return json({ ok: false, error: "form" }, 400, cors); }
    const tg = (method, body, isForm) => fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/${method}`, isForm
      ? { method: "POST", body }
      : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      .then(r => r.json()).catch(() => ({}));

    const photo = form.get("photo");
    const hasPhoto = photo && typeof photo !== "string";
    const message = String(form.get("message") || "").trim().slice(0, 500);

    if (!hasPhoto && message) {
      const j = await tg("sendMessage", { chat_id: env.CHAT_ID, text: `🌙 Joy nitip ke bulan:\n\n${message}` });
      return j.ok ? json({ ok: true }, 200, cors) : json({ ok: false, error: "telegram" }, 502, cors);
    }
    if (!hasPhoto) return json({ ok: false, error: "nophoto" }, 400, cors);
    if (!TYPES.test(photo.type)) return json({ ok: false, error: "type" }, 415, cors);
    if (photo.size > MAX_BYTES) return json({ ok: false, error: "size" }, 413, cors);

    const note = String(form.get("note") || "").replace(/\s+/g, " ").trim().slice(0, 200);
    const fd = new FormData();
    fd.append("chat_id", env.CHAT_ID);
    fd.append("photo", photo, "foto.jpg");
    fd.append("caption", "🍓 Kiriman dari Joy" + (note ? `\n\n💬 ${note}` : ""));
    const j = await tg("sendPhoto", fd, true);
    return j.ok ? json({ ok: true }, 200, cors) : json({ ok: false, error: "telegram" }, 502, cors);
  },
};

function json(obj, status, headers) {
  return new Response(JSON.stringify(obj), { status, headers: { ...headers, "Content-Type": "application/json" } });
}
