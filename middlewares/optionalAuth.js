const jwt = require("jsonwebtoken");

// زي authMiddleware بس مش إجباري: لو فيه توكن صحيح بنعرف مين المستخدم، غير كده بيكمل كـ Guest
module.exports = (req, res, next) => {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (token && token !== "null" && token !== "undefined") {
        try {
            req.user = jwt.verify(token, process.env.JWT_SECRET_KEY);
        } catch {
            req.user = null;
        }
    }
    next();
};
