const Joi = require("joi")

const createProductSchema = Joi.object({

    title: Joi.string().min(2).max(100).required(),

    description: Joi.string().min(10).max(1000).required(),

    price: Joi.number().positive().required(),

    stock: Joi.number().integer().min(0).required(),

    category: Joi.string().min(2).max(100).required()

})

const updateProductSchema = Joi.object({
    title: Joi.string().min(2).max(100),

    description: Joi.string().min(10).max(1000),

    image: Joi.string(),

    price: Joi.number().positive(),

    stock: Joi.number().integer().min(0),

    category: Joi.string().min(2).max(100)
})

module.exports = {
    createProductSchema,
    updateProductSchema
}