const Banner = require("../models/BannerModel");
const cloudinaryService = require("../services/cloudinaryService");

const TEXT_FIELDS = ["link", "altText", "eyebrow", "title", "subtitle", "buttonText", "button2Text", "button2Link", "textPosition", "textColor", "group"];

const applyBody = (banner, body = {}) => {
  TEXT_FIELDS.forEach((k) => {
    if (body[k] !== undefined) banner[k] = String(body[k]);
  });
  if (body.group !== undefined) banner.group = String(body.group || "main").trim().toLowerCase() || "main";
  if (body.overlay !== undefined) banner.overlay = Math.min(Math.max(Number(body.overlay) || 0, 0), 90);
  if (body.order !== undefined) banner.order = Number(body.order) || 0;
  if (body.active !== undefined) banner.active = body.active === true || body.active === "true";
  if (body.textBox !== undefined) banner.textBox = body.textBox === true || body.textBox === "true";
  if (body.startAt !== undefined) banner.startAt = body.startAt ? new Date(body.startAt) : null;
  if (body.endAt !== undefined) banner.endAt = body.endAt ? new Date(body.endAt) : null;
};

const upload = async (file) => {
  const res = await cloudinaryService.uploadImage(file.buffer);
  return { url: res.secure_url, publicId: res.public_id };
};

// PUBLIC: البانرات الشغالة دلوقتي (ممكن تفلتر بـ ?group=)
const getActiveBanners = async (req, res) => {
  try {
    const now = new Date();
    const filter = {
      active: true,
      $and: [
        { $or: [{ startAt: null }, { startAt: { $lte: now } }] },
        { $or: [{ endAt: null }, { endAt: { $gte: now } }] },
      ],
    };
    if (req.query.group) {
      const group = String(req.query.group).toLowerCase();
      // البانرات القديمة ملهاش group فبنعتبرها "main"
      filter.$and.push(group === "main" ? { $or: [{ group: "main" }, { group: { $exists: false } }, { group: "" }] } : { group });
    }

    const banners = await Banner.find(filter).sort({ order: 1, createdAt: -1 });
    res.status(200).json(banners);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ADMIN
const getAllBanners = async (req, res) => {
  try {
    const banners = await Banner.find().sort({ group: 1, order: 1, createdAt: -1 });
    res.status(200).json(banners);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createBanner = async (req, res) => {
  try {
    const desktopFile = req.files?.desktopImage?.[0];
    const mobileFile = req.files?.mobileImage?.[0];

    if (!desktopFile) {
      return res.status(400).json({ message: "صورة الديسكتوب مطلوبة" });
    }

    const [desktopImage, mobileImage] = await Promise.all([
      upload(desktopFile),
      mobileFile ? upload(mobileFile) : Promise.resolve({ url: "", publicId: "" }),
    ]);

    const banner = new Banner({ desktopImage, mobileImage });
    applyBody(banner, req.body);

    if (req.body.order === undefined) {
      banner.order = await Banner.countDocuments({ group: banner.group });
    }

    await banner.save();
    res.status(201).json({ message: "Banner created successfully", banner });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) return res.status(404).json({ message: "Banner not found" });

    const desktopFile = req.files?.desktopImage?.[0];
    const mobileFile = req.files?.mobileImage?.[0];

    if (desktopFile) {
      const old = banner.desktopImage?.publicId;
      banner.desktopImage = await upload(desktopFile);
      if (old) cloudinaryService.deleteImage(old).catch(() => null);
    }

    if (mobileFile) {
      const old = banner.mobileImage?.publicId;
      banner.mobileImage = await upload(mobileFile);
      if (old) cloudinaryService.deleteImage(old).catch(() => null);
    } else if (req.body.removeMobile === "true") {
      const old = banner.mobileImage?.publicId;
      banner.mobileImage = { url: "", publicId: "" };
      if (old) cloudinaryService.deleteImage(old).catch(() => null);
    }

    applyBody(banner, req.body);
    await banner.save();

    res.status(200).json({ message: "Banner updated successfully", banner });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ADMIN: ترتيب البانرات بالسحب
const reorderBanners = async (req, res) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
    await Promise.all(ids.map((id, i) => Banner.updateOne({ _id: id }, { order: i })));
    res.json({ message: "Order updated" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) return res.status(404).json({ message: "Banner not found" });

    await Promise.all(
      [banner.desktopImage?.publicId, banner.mobileImage?.publicId]
        .filter(Boolean)
        .map((id) => cloudinaryService.deleteImage(id).catch(() => null))
    );

    await Banner.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Banner deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getActiveBanners, getAllBanners, createBanner, updateBanner, reorderBanners, deleteBanner };
