const Joi = require("joi")
const UserOrderStatus = require("../utils/OrderStatus")

const updateOrderStatusSchema = Joi.object({
    status: Joi.string()
        .valid(...Object.values(UserOrderStatus))
        .required()
})

module.exports = {
    updateOrderStatusSchema
}