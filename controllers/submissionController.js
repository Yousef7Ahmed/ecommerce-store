const Submission = require("../models/SubmissionModel");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// PUBLIC: إرسال فورم التواصل أو الاشتراك في النشرة
exports.createSubmission = async (req, res) => {
  try {
    const { type, name = "", email = "", phone = "", message = "", page = "" } = req.body || {};

    if (!["contact", "newsletter"].includes(type)) {
      return res.status(400).json({ message: "نوع الفورم غير صحيح" });
    }
    if (!EMAIL_RE.test(String(email).trim())) {
      return res.status(400).json({ message: "من فضلك اكتب إيميل صحيح" });
    }
    if (type === "contact" && String(message).trim().length < 3) {
      return res.status(400).json({ message: "من فضلك اكتب رسالتك" });
    }

    if (type === "newsletter") {
      const exists = await Submission.findOne({ type, email: String(email).trim().toLowerCase() });
      if (exists) return res.json({ message: "أنت مشترك بالفعل، شكرًا لك!" });
    }

    await Submission.create({
      type,
      name: String(name).slice(0, 120),
      email: String(email).slice(0, 200),
      phone: String(phone).slice(0, 40),
      message: String(message).slice(0, 5000),
      page: String(page).slice(0, 200),
    });

    res.status(201).json({
      message: type === "newsletter" ? "تم الاشتراك بنجاح!" : "تم إرسال رسالتك، هنرد عليك قريب.",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ADMIN
exports.getSubmissions = async (req, res) => {
  try {
    const filter = {};
    if (req.query.type) filter.type = req.query.type;
    const items = await Submission.find(filter).sort({ createdAt: -1 }).limit(1000);
    const unread = await Submission.countDocuments({ read: false });
    res.json({ items, unread });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.markRead = async (req, res) => {
  try {
    const item = await Submission.findByIdAndUpdate(
      req.params.id,
      { read: req.body?.read !== false },
      { new: true }
    );
    if (!item) return res.status(404).json({ message: "Not found" });
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteSubmission = async (req, res) => {
  try {
    await Submission.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
