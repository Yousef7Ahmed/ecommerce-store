const Joi = require("joi")

const shippingSchema = Joi.object({
    shippingAddress: Joi.object({
        fullName:Joi.string().min(2).max(100).required(),
        phone:Joi.string().min(11).max(15).required(),
        governorate:Joi.string().min(2).max(100).required(),
        city:Joi.string().min(2).max(100).required(),
        street:Joi.string().min(2).max(100).required(),
        buildingNumber:Joi.string().required(),
        floor:Joi.string(),
        apartment:Joi.string(),
        postalCode:Joi.string().max(20),
        notes:Joi.string().max(500)
    }).required()
})
module.exports = {
    shippingSchema
}