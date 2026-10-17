const axios = require("axios");

/*
  إرسال الإيميلات عن طريق API (مش SMTP)
  ليه؟ Render في الخطة المجانية بيقفل بورتات SMTP — فـ Gmail/nodemailer مش هيشتغل هناك.

  اختار واحد بس وحط مفاتيحه في Environment على Render:

  1) Resend  (الأفضل مع الدومين بتاعك)
     RESEND_API_KEY = re_xxxxx
     MAIL_FROM      = no-reply@yourdomain.com      (لازم الدومين يكون متفعّل في Resend)

  2) Brevo   (ينفع بإيميل جيميل عادي من غير دومين)
     BREVO_API_KEY  = xkeysib-xxxxx
     MAIL_FROM      = yourmail@gmail.com            (لازم يكون Sender متفعّل في Brevo)

  اختياري: MAIL_FROM_NAME = بيت الذوق
*/

const provider = () => {
    if (process.env.RESEND_API_KEY) return "resend";
    if (process.env.BREVO_API_KEY) return "brevo";
    return null;
};

const isMailConfigured = () => Boolean(provider() && process.env.MAIL_FROM);

async function sendMail({ to, subject, html, text }) {
    const from = process.env.MAIL_FROM;
    const name = process.env.MAIL_FROM_NAME || "Store";
    const p = provider();

    if (!p || !from) {
        console.warn("[mail] مفيش RESEND_API_KEY / BREVO_API_KEY أو MAIL_FROM — الإيميل متبعتش:", subject, "→", to);
        return { skipped: true };
    }

    try {
        if (p === "resend") {
            await axios.post(
                "https://api.resend.com/emails",
                { from: `${name} <${from}>`, to: [to], subject, html, text },
                { headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` }, timeout: 15000 }
            );
        } else {
            await axios.post(
                "https://api.brevo.com/v3/smtp/email",
                { sender: { email: from, name }, to: [{ email: to }], subject, htmlContent: html, textContent: text },
                { headers: { "api-key": process.env.BREVO_API_KEY }, timeout: 15000 }
            );
        }
        return { sent: true };
    } catch (err) {
        const detail = err.response?.data ? JSON.stringify(err.response.data) : err.message;
        console.error(`[mail] فشل الإرسال عن طريق ${p}:`, detail);
        const e = new Error("Could not send the email right now, please try again later");
        e.status = 502;
        throw e;
    }
}

module.exports = { sendMail, isMailConfigured };
