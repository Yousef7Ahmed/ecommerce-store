// قوالب الإيميلات (عربي / English) — شكل بسيط بيشتغل في كل برامج الإيميل
const esc = (s = "") => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const TEXT = {
    verify: {
        en: {
            subject: (store) => `Confirm your email — ${store}`,
            title: "Confirm your email",
            body: (name) => `Hi ${name}, thanks for creating an account. Please confirm your email address to start shopping.`,
            button: "Confirm email",
            note: "This link expires in 24 hours. If you didn't create an account, you can ignore this email.",
        },
        ar: {
            subject: (store) => `تأكيد الإيميل — ${store}`,
            title: "أكّد الإيميل بتاعك",
            body: (name) => `أهلاً ${name}، شكراً إنك عملت حساب. أكّد الإيميل بتاعك عشان تبدأ تتسوق.`,
            button: "تأكيد الإيميل",
            note: "اللينك صالح لمدة 24 ساعة. لو مش انت اللي عملت الحساب تجاهل الرسالة دي.",
        },
    },
    reset: {
        en: {
            subject: (store) => `Reset your password — ${store}`,
            title: "Reset your password",
            body: (name) => `Hi ${name}, we received a request to reset your password. Click the button below to choose a new one.`,
            button: "Choose a new password",
            note: "This link expires in 1 hour. If you didn't ask to reset your password, you can ignore this email — your password won't change.",
        },
        ar: {
            subject: (store) => `استعادة كلمة السر — ${store}`,
            title: "استعادة كلمة السر",
            body: (name) => `أهلاً ${name}، وصلنا طلب لتغيير كلمة السر. اضغط على الزرار تحت واختار كلمة سر جديدة.`,
            button: "اختار كلمة سر جديدة",
            note: "اللينك صالح لمدة ساعة. لو مش انت اللي طلبت ده تجاهل الرسالة — كلمة السر مش هتتغير.",
        },
    },
};

function buildEmail(kind, { lang = "ar", name = "", link, store = "Store", accent = "#121212" }) {
    const L = lang === "en" ? "en" : "ar";
    const t = TEXT[kind][L];
    const dir = L === "ar" ? "rtl" : "ltr";
    const align = L === "ar" ? "right" : "left";

    const html = `<!doctype html><html lang="${L}" dir="${dir}"><body style="margin:0;background:#f4f4f5;font-family:Tahoma,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 12px;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:14px;overflow:hidden;">
<tr><td style="padding:22px 28px;border-bottom:1px solid #eee;font-size:20px;font-weight:bold;color:#111;text-align:${align};">${esc(store)}</td></tr>
<tr><td style="padding:28px;text-align:${align};color:#222;">
<h1 style="margin:0 0 12px;font-size:22px;color:#111;">${esc(t.title)}</h1>
<p style="margin:0 0 24px;font-size:15px;line-height:1.7;">${esc(t.body(name))}</p>
<a href="${esc(link)}" style="display:inline-block;padding:13px 26px;border-radius:10px;background:${esc(accent)};color:#ffffff;text-decoration:none;font-weight:bold;font-size:15px;">${esc(t.button)}</a>
<p style="margin:24px 0 0;font-size:12px;line-height:1.7;color:#777;">${esc(t.note)}</p>
<p style="margin:12px 0 0;font-size:11px;color:#999;word-break:break-all;direction:ltr;text-align:left;">${esc(link)}</p>
</td></tr></table></td></tr></table></body></html>`;

    const text = `${t.title}\n\n${t.body(name)}\n\n${link}\n\n${t.note}`;
    return { subject: t.subject(store), html, text };
}

module.exports = { buildEmail };
