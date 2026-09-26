const Settings = require("../models/SettingsModel");
const DEFAULTS = require("../utils/defaultSettings");

const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);

// دمج عميق: القيم المحفوظة فوق الافتراضية
const merge = (base, extra) => {
  const out = { ...base };
  Object.keys(extra || {}).forEach((k) => {
    out[k] = isObj(base[k]) && isObj(extra[k]) ? merge(base[k], extra[k]) : extra[k];
  });
  return out;
};

const getStoreSettings = async () => {
  const doc = await Settings.findOne({ key: "store" }).lean();
  return merge(DEFAULTS, doc?.data || {});
};

exports.getStoreSettings = getStoreSettings;

exports.getSettings = async (req, res) => {
  try {
    res.json(await getStoreSettings());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const current = await Settings.findOne({ key: "store" });
    const allowed = Object.keys(DEFAULTS);
    const body = {};
    allowed.forEach((k) => {
      if (isObj(req.body?.[k])) body[k] = req.body[k];
    });

    const data = merge(current?.data || {}, body);

    await Settings.findOneAndUpdate(
      { key: "store" },
      { key: "store", data },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json(merge(DEFAULTS, data));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
