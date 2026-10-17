const User = require ("../models/User.Model")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const Product = require("../models/ProductModel");
const Category = require("../models/CategoryModel");
require("dotenv").config()


const crypto = require("crypto");
const { sendMail, isMailConfigured } = require("../services/mailService");
const { buildEmail } = require("../utils/emailTemplates");
const { getStoreSettings } = require("./settingsController");

const VERIFY_TTL = 24 * 60 * 60 * 1000; // 24 ساعة
const RESET_TTL = 60 * 60 * 1000; // ساعة
const RESEND_WAIT = 60 * 1000; // دقيقة بين كل إيميل والتاني

const hashToken = (t) => crypto.createHash("sha256").update(String(t)).digest("hex");
const newToken = () => {
    const raw = crypto.randomBytes(32).toString("hex");
    return { raw, hash: hashToken(raw) };
};
const normEmail = (e = "") => String(e).trim().toLowerCase();
const emailRx = (e) => new RegExp(`^${normEmail(e).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");

const publicUser = (u) => ({
    id: u._id,
    firstName: u.firstName,
    lastName: u.lastName,
    phoneNumber: u.phoneNumber,
    email: u.email,
    role: u.role,
});

const signToken = (u) => jwt.sign({ id: u._id, role: u.role }, process.env.JWT_SECRET_KEY, { expiresIn: "7d" });

// رابط الموقع اللي هيتحط في الإيميل
// CLIENT_URL على Render = https://yourdomain.com (ممكن أكتر من واحد مفصولين بفاصلة)
// بناخد الـ Origin بتاع الطلب بس لو موجود في القائمة دي — عشان محدش يقدر يخلي اللينك يروح لموقع تاني
const clientUrl = (req) => {
    const list = String(process.env.CLIENT_URL || "")
        .split(",")
        .map((x) => x.trim().replace(/\/+$/, ""))
        .filter(Boolean);
    const origin = String(req.get("origin") || "").replace(/\/+$/, "");
    if (list.includes(origin)) return origin;
    if (list.length) return list[0];
    // من غير CLIENT_URL: لو الطلب جاي من localhost (تطوير) استخدمه
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return origin;
    return null;
};

const storeInfo = async () => {
    try {
        const s = await getStoreSettings();
        return { store: s.header?.logoText || s.seo?.title || "Store", accent: s.theme?.accent || "#121212" };
    } catch {
        return { store: "Store", accent: "#121212" };
    }
};

const sendVerifyEmail = async (req, user, lang) => {
    const base = clientUrl(req);
    if (!base) throw Object.assign(new Error("CLIENT_URL is not set on the server"), { status: 500 });
    const { raw, hash } = newToken();
    user.emailVerifyToken = hash;
    user.emailVerifyExpires = new Date(Date.now() + VERIFY_TTL);
    user.emailVerifySentAt = new Date();
    await user.save();
    const link = `${base}/verify-email?token=${raw}`;
    const mail = buildEmail("verify", { lang, name: user.firstName, link, ...(await storeInfo()) });
    await sendMail({ to: user.email, ...mail });
};

const register = async (req, res) => {
    try {
        const { firstName, lastName, password, phoneNumber } = req.body;
        const email = normEmail(req.body.email);
        const lang = req.body.lang === "en" ? "en" : "ar";

        const exists = await User.findOne({ email: emailRx(email) });
        if (exists) {
            return res.status(409).json({ message: "This email is already registered", code: "EMAIL_EXISTS" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const mailOn = isMailConfigured();

        // لو الإيميلات لسه متظبطتش على السيرفر: الحساب بيتفعل علطول (زي الأول) عشان التسجيل ميقفش
        const newUser = await User.create({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            phoneNumber,
            emailVerified: !mailOn,
        });

        if (!mailOn) {
            console.warn("[auth] الإيميلات مش متظبطة — الحساب اتفعل من غير تأكيد:", email);
            return res.status(201).json({ user: publicUser(newUser), token: signToken(newUser) });
        }

        try {
            await sendVerifyEmail(req, newUser, lang);
        } catch (e) {
            // الحساب اتعمل؛ العميل يقدر يطلب إعادة الإرسال من صفحة تسجيل الدخول
            console.error("[auth] verify email failed:", e.message);
            return res.status(201).json({ needsVerification: true, email: newUser.email, mailFailed: true });
        }

        res.status(201).json({ needsVerification: true, email: newUser.email });
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { password } = req.body;
        const foundUser = await User.findOne({ email: emailRx(req.body.email) });
        if (!foundUser) return res.status(401).json({ message: "Invalid email or password" });

        const isMatch = await bcrypt.compare(password || "", foundUser.password);
        if (!isMatch) return res.status(401).json({ message: "Invalid email or password" });

        // الحسابات القديمة (قبل التحديث ده) مالهاش الخانة دي فبتعدي عادي
        if (foundUser.emailVerified === false) {
            return res.status(403).json({
                message: "Please confirm your email first — check your inbox",
                code: "EMAIL_NOT_VERIFIED",
                email: foundUser.email,
            });
        }

        res.status(200).json({ user: publicUser(foundUser), token: signToken(foundUser) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// POST /api/users/verify-email  { token }
const verifyEmail = async (req, res) => {
    try {
        const token = String(req.body.token || "");
        if (!token) return res.status(400).json({ message: "Invalid link" });

        const user = await User.findOne({ emailVerifyToken: hashToken(token) });
        if (!user) return res.status(400).json({ message: "This link is invalid or was already used", code: "INVALID_TOKEN" });
        if (!user.emailVerifyExpires || user.emailVerifyExpires < new Date()) {
            return res.status(400).json({ message: "This link has expired — request a new one", code: "TOKEN_EXPIRED", email: user.email });
        }

        user.emailVerified = true;
        user.emailVerifyToken = undefined;
        user.emailVerifyExpires = undefined;
        await user.save();

        // بعد التأكيد بيدخل علطول
        res.json({ message: "Email confirmed", user: publicUser(user), token: signToken(user) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// POST /api/users/resend-verification  { email, lang }
const resendVerification = async (req, res) => {
    try {
        const user = await User.findOne({ email: emailRx(req.body.email) });
        // نفس الرد في كل الحالات عشان محدش يعرف مين مسجل
        const ok = { message: "If this email needs confirmation, a new link was sent" };
        if (!user || user.emailVerified !== false) return res.json(ok);

        if (user.emailVerifySentAt && Date.now() - user.emailVerifySentAt.getTime() < RESEND_WAIT) {
            return res.status(429).json({ message: "Please wait a minute before requesting another email" });
        }
        await sendVerifyEmail(req, user, req.body.lang === "en" ? "en" : "ar");
        res.json(ok);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
};

// POST /api/users/forgot-password  { email, lang }
const forgotPassword = async (req, res) => {
    try {
        const ok = { message: "If an account exists for this email, we sent a reset link" };
        const user = await User.findOne({ email: emailRx(req.body.email) });
        if (!user) return res.json(ok);

        if (!isMailConfigured()) {
            return res.status(503).json({ message: "Password reset is not available right now, please contact us" });
        }
        if (user.resetPasswordSentAt && Date.now() - user.resetPasswordSentAt.getTime() < RESEND_WAIT) {
            return res.status(429).json({ message: "Please wait a minute before requesting another email" });
        }

        const base = clientUrl(req);
        if (!base) return res.status(500).json({ message: "CLIENT_URL is not set on the server" });

        const { raw, hash } = newToken();
        user.resetPasswordToken = hash;
        user.resetPasswordExpires = new Date(Date.now() + RESET_TTL);
        user.resetPasswordSentAt = new Date();
        await user.save();

        const link = `${base}/reset-password?token=${raw}`;
        const mail = buildEmail("reset", { lang: req.body.lang === "en" ? "en" : "ar", name: user.firstName, link, ...(await storeInfo()) });
        await sendMail({ to: user.email, ...mail });
        res.json(ok);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
};

// POST /api/users/reset-password  { token, password }
const resetPassword = async (req, res) => {
    try {
        const token = String(req.body.token || "");
        const password = String(req.body.password || "");
        if (password.length < 8 || password.length > 30) {
            return res.status(400).json({ message: "Password must be 8–30 characters" });
        }

        const user = await User.findOne({ resetPasswordToken: hashToken(token) });
        if (!user || !user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
            return res.status(400).json({ message: "This link is invalid or has expired — request a new one", code: "INVALID_TOKEN" });
        }

        user.password = await bcrypt.hash(password, 10);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        // اللي فتح اللينك من إيميله أثبت إن الإيميل بتاعه
        if (user.emailVerified === false) {
            user.emailVerified = true;
            user.emailVerifyToken = undefined;
            user.emailVerifyExpires = undefined;
        }
        await user.save();

        res.json({ message: "Password updated", user: publicUser(user), token: signToken(user) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ==========================
// Get All Users
// ==========================
const getAllUsers = async (req, res) => {

    try {

        const users = await User.find()

            .select("-password")

            .sort({ createdAt: -1 });

        res.status(200).json(users);

    } catch (error) {

        res.status(500).json({

            message: error.message

        });

    }

};

// ==========================
// Update User Role
// ==========================
const updateUserRole = async (req, res) => {

    try {

        const { role } = req.body;

        if (!["ADMIN", "MANAGER", "USER"].includes(role)) {

            return res.status(400).json({

                message: "Invalid role"

            });

        }

        const user = await User.findByIdAndUpdate(

            req.params.id,

            { role },

            {

                new: true,

                select: "-password"

            }

        );

        if (!user) {

            return res.status(404).json({

                message: "User not found"

            });

        }

        res.json({

            message: "Role updated successfully",

            user

        });

    } catch (error) {

        res.status(500).json({

            message: error.message

        });

    }

};

// ==========================
// Delete User
// ==========================
const deleteUser = async (req, res) => {

    try {

        const user = await User.findById(req.params.id);

        if (!user) {

            return res.status(404).json({

                message: "User not found"

            });

        }

        await User.findByIdAndDelete(req.params.id);

        res.json({

            message: "User deleted successfully"

        });

    } catch (error) {

        res.status(500).json({

            message: error.message

        });

    }

};
const getDashboardStats = async (req, res) => {

    try {

        const products = await Product.countDocuments();

        const categories = await Category.countDocuments();

        const users = await User.countDocuments();

        res.json({

            products,

            categories,

            users,

            orders: 0,

            revenue: 0,

        });

    } catch (error) {

        res.status(500).json({

            message: error.message,

        });

    }

};
module.exports = {

    register,

    login,

    verifyEmail,

    resendVerification,

    forgotPassword,

    resetPassword,

    getAllUsers,

    updateUserRole,

    deleteUser,

    getDashboardStats,
};