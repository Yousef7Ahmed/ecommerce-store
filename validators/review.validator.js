const Joi = require("joi")

const createReviewSchema = Joi.object({

    rating:Joi.number()
    .integer()
    .min(1)
    .max(5)
    .required(),

    comment:Joi.string()
    .allow("")
    .max(500)

})

module.exports = {
    createReviewSchema
}