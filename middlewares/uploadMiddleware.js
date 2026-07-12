const multer = require("multer")

// مكان تخزين الملفات مؤقتًا.
// memoryStorage يعني الصورة هتتحفظ في RAM مش على الهارد.
const storage = multer.memoryStorage()

// فلتر يمنع رفع أي ملفات غير الصور
const fileFilter = (req, file, cb) => {

    // أنواع الصور المسموح بيها
    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/jpg"
    ]

    if (allowedTypes.includes(file.mimetype)) {

        // اسمح برفع الملف
        cb(null, true)

    } else {

        // ارفض الملف
        cb(new Error("Only image files are allowed"), false)

    }

}

// إنشاء الـ Multer Middleware
const upload = multer({

    storage,

    fileFilter,

    // الحد الأقصى لحجم الصورة
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }

})

module.exports = upload