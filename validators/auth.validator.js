const Joi = require("joi")

const lang = Joi.string().valid("ar", "en")

const registerSchema = Joi.object({
    firstName: Joi.string().trim().min(2).max(30).required(),
    lastName: Joi.string().trim().min(2).max(30).required(),
    email: Joi.string().trim().email().required(),
    password: Joi.string().min(8).max(30).required(),
    phoneNumber: Joi.string().trim().min(11).max(15).required(),
    lang,
})

const loginSchema = Joi.object({
    email: Joi.string().trim().email().required(),
    password: Joi.string().required()
})

const emailSchema = Joi.object({
    email: Joi.string().trim().email().required(),
    lang,
})

const resetSchema = Joi.object({
    token: Joi.string().hex().length(64).required(),
    password: Joi.string().min(8).max(30).required(),
})

module.exports = { registerSchema, loginSchema, emailSchema, resetSchema }
