const Page = require("../models/PageModel");

const slugify = (text = "") =>
  String(text)
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

const pick = (body) => {
  const data = {};
  const fields = [
    "title",
    "slug",
    "sections",
    "seoTitle",
    "seoDescription",
    "showInNav",
    "showInFooter",
    "order",
    "active",
  ];
  fields.forEach((key) => {
    if (body[key] !== undefined) data[key] = body[key];
  });
  if (data.slug !== undefined) data.slug = slugify(data.slug);
  return data;
};

// PUBLIC: قائمة الصفحات (للـ Navbar والـ Footer) من غير الـ sections
exports.getPublicPages = async (req, res) => {
  try {
    const pages = await Page.find({ active: true })
      .select("title slug showInNav showInFooter order")
      .sort({ order: 1, createdAt: 1 });
    res.json(pages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUBLIC: صفحة واحدة بالـ slug
exports.getPageBySlug = async (req, res) => {
  try {
    const page = await Page.findOne({
      slug: String(req.params.slug).toLowerCase(),
      active: true,
    });
    if (!page) return res.status(404).json({ message: "Page not found" });

    const data = page.toObject();
    data.sections = (data.sections || []).filter((s) => s.active !== false);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ADMIN
exports.getAllPages = async (req, res) => {
  try {
    const pages = await Page.find().sort({ order: 1, createdAt: 1 });
    res.json(pages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPageById = async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);
    if (!page) return res.status(404).json({ message: "Page not found" });
    res.json(page);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createPage = async (req, res) => {
  try {
    const data = pick(req.body);
    if (!data.title) return res.status(400).json({ message: "العنوان مطلوب" });
    if (!data.slug) data.slug = slugify(data.title);
    if (!data.slug) data.slug = `page-${Date.now()}`;

    // لو الرابط مستخدم نزوّد رقم في الآخر (about-2, about-3 ...)
    const base = data.slug;
    let n = 2;
    while (await Page.exists({ slug: data.slug })) {
      data.slug = `${base}-${n++}`;
    }

    const count = await Page.countDocuments();
    if (data.order === undefined) data.order = count;

    const page = await Page.create(data);
    res.status(201).json(page);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updatePage = async (req, res) => {
  try {
    const data = pick(req.body);

    if (data.slug) {
      const exists = await Page.findOne({ slug: data.slug, _id: { $ne: req.params.id } });
      if (exists) {
        return res.status(400).json({ message: "الرابط (slug) مستخدم في صفحة تانية" });
      }
    }

    const page = await Page.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true,
    });
    if (!page) return res.status(404).json({ message: "Page not found" });
    res.json(page);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deletePage = async (req, res) => {
  try {
    const page = await Page.findByIdAndDelete(req.params.id);
    if (!page) return res.status(404).json({ message: "Page not found" });
    res.json({ message: "Page deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
