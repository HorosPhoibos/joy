// Kotak Pos Lentera — Cloudflare Worker
// Menerima foto dari website "Sebelum Tidur" dan website Joy (horosphoibos.github.io/joy), lalu meneruskannya ke Telegram.
// Kiriman dari website Joy membawa field site=joy supaya labelnya beda.
// Token bot TIDAK ditulis di sini. Simpan sebagai secret di Cloudflare:
//   BOT_TOKEN      (Secret)  token dari @BotFather
//   CHAT_ID        (Text)    ID chat tujuan, mis. ID pribadimu
//   ALLOWED_ORIGIN (Text, opsional) default https://horosphoibos.github.io

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB (batas sendPhoto Telegram 10 MB)
const TYPES = /^image\/(jpeg|png|webp)$/;

export default {
  async fetch(req, env) {
    const allowed = env.ALLOWED_ORIGIN || "https://horosphoibos.github.io";
    const cors = {
      "Access-Control-Allow-Origin": allowed,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin",
    };

    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (req.method !== "POST") return json({ ok: false, error: "method" }, 405, cors);
    if ((req.headers.get("Origin") || "") !== allowed) return json({ ok: false, error: "origin" }, 403, cors);
    if (!env.BOT_TOKEN || !env.CHAT_ID) return json({ ok: false, error: "config" }, 500, cors);

    let form;
    try { form = await req.formData(); } catch { return json({ ok: false, error: "form" }, 400, cors); }

    const photo = form.get("photo");
    const hasPhoto = photo && typeof photo !== "string";

    // Pesan teks dari kotak "titip sesuatu ke bulan"
    const isJoy = String(form.get("site") || "") === "joy";
    const message = String(form.get("message") || "").trim().slice(0, 500);
    if (!hasPhoto && message) {
      const r = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: env.CHAT_ID, text: (isJoy ? "🍓 Joy nitip ke bulan:" : "🌙 Titipan ke bulan:") + `\n\n${message}` }),
      });
      const j = await r.json().catch(() => ({}));
      if (!j.ok) return json({ ok: false, error: "telegram" }, 502, cors);
      return json({ ok: true }, 200, cors);
    }

    if (!hasPhoto) return json({ ok: false, error: "nophoto" }, 400, cors);
    if (!TYPES.test(photo.type)) return json({ ok: false, error: "type" }, 415, cors);
    if (photo.size > MAX_BYTES) return json({ ok: false, error: "size" }, 413, cors);

    const note = String(form.get("note") || "").replace(/\s+/g, " ").trim().slice(0, 200);
    const caption = (isJoy ? "🍓 Kiriman photobooth dari Joy" : "📸 Kiriman dari website Sebelum Tidur") + (note ? `\n\n💬 ${note}` : "");

    const tg = new FormData();
    tg.append("chat_id", env.CHAT_ID);
    tg.append("photo", photo, "foto.jpg");
    tg.append("caption", caption);

    const r = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendPhoto`, { method: "POST", body: tg });
    const j = await r.json().catch(() => ({}));
    if (!j.ok) return json({ ok: false, error: "telegram" }, 502, cors);
    return json({ ok: true }, 200, cors);
  },
};

function json(obj, status, headers) {
  return new Response(JSON.stringify(obj), { status, headers: { ...headers, "Content-Type": "application/json" } });
}
