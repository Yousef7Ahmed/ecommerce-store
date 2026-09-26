const Joi = require("joi")

// الوصف بيتكتب بالـ Rich Text Editor فبيطلع HTML طويل
// الحد القديم (1000 حرف) كان بيرفض المنتجات اللي وصفها طويل
const DESCRIPTION_MAX = 50000

const createProductSchema = Joi.object({
    title: Joi.string().trim().min(2).max(200).required(),
    description: Joi.string().min(3).max(DESCRIPTION_MAX).required(),
    titleAr: Joi.string().trim().max(200).allow(""),
    descriptionAr: Joi.string().max(DESCRIPTION_MAX).allow(""),
    price: Joi.number().positive().required(),
    compareAtPrice: Joi.number().min(0).allow("", null),
    stock: Joi.number().integer().min(0).required(),
    category: Joi.string().min(2).max(100).required()
})

const updateProductSchema = Joi.object({
    title: Joi.string().trim().min(2).max(200),
    description: Joi.string().min(3).max(DESCRIPTION_MAX),
    titleAr: Joi.string().trim().max(200).allow(""),
    descriptionAr: Joi.string().max(DESCRIPTION_MAX).allow(""),
    image: Joi.string(),
    price: Joi.number().positive(),
    compareAtPrice: Joi.number().min(0).allow("", null),
    stock: Joi.number().integer().min(0),
    category: Joi.string().min(2).max(100)
})

module.exports = {
    createProductSchema,
    updateProductSchema
}
