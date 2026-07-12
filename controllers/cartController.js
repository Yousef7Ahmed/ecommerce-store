const User = require("../models/User.Model")
const Product = require("../models/ProductModel")
const { response } = require("express")

const addToCart = async (req, res) => {
    const userId = req.user.id
    const { productId, quantity } = req.body
    try{ const product = await Product.findById(productId)
        console.log("المنتج الذي تم العثور عليه:", product);
        if (!product) {
        return res.status(404).json({
            message: "Product not found"
        })
    }
    if (!quantity || quantity <= 0) {
        return res.status(400).json({
            message: "Invalid quantity"
        })}
        const user = await User.findById(userId)
    if (!user) {
    return res.status(404).json({
        message: "User not found"
    })
    }
    const existingItem = user.cart.find((e)=>{
        return e.productId.toString() === productId
    })
    
    if ( existingItem ) {
        existingItem.quantity =existingItem.quantity + quantity
    } else {
        user.cart.push({
            productId : product._id,
            quantity : quantity,
        })
    }
        const newUser  = await user.save()
    return res.json({
        message:"user updated",
        user: newUser.cart
    })


    } catch (error) {
        return res.status(400).json({msg: error.message })
    }
}

const getMyCart = async (req, res) =>{
    const userId = req.user.id

    const user = await User.findById(userId).populate("cart.productId")

    if(!user){
        return res.status(404).json("User not found")
    }

    res.json({
        "cart": user.cart
    })
}

const deleteProductFromCart = async (req, res) =>{
    const userId = req.user.id

    const user = await User.findById(userId)

    const productId = req.params.id

    const deleteProductFromCart  =  user.cart.filter((e)=>{
        return e.productId.toString() !== productId
    })

    if (user.cart.length == deleteProductFromCart.length) {
        return res.json({ error: "Product not found" })
    }
    
    user.cart = deleteProductFromCart
    await user.save()

    res.json({
        message: "Product deleted successfully",
        cart: deleteProductFromCart
    })
}

const updateMyCart = async (req,res) =>{
    const userId = req.user.id
    try{
    const user = await User.findById(userId)
    if (!user) {
    return res.status(404).json({
        message: "User not found"
    })
    }
    const { productId, quantity } = req.body
    if (!quantity || quantity <= 0) {
        return res.status(400).json({
            message: "Invalid quantity"
    })}
    if (!productId ){
        return res.status(400).json({
            message: "Invalid productId"
        })
    }

    const existingItem  = user.cart.find((e)=>{
        return e.productId.toString() === productId
    })
    if ( existingItem ) {
        existingItem.quantity =quantity
    } else {
        return res.status(404).json({
            message: "Product not found in cart"
        })
    }

    await user.save()
    res.json({
        message:"cart updated succefuly",
        cart : user.cart
    })
    } catch (error) {
        return res.status(400).json({msg: error.message })
    }
}

const ClearCart = async (req, res) =>{
    const userId = req.user.id
    try{
        const user = await User.findById(userId)
        if (!user) {
        return res.status(404).json({
            message: "User not found"
        })
        }
        user.cart = []
        await user.save()
        res.json({
            message :"Cart cleared successfully"
        })
    }catch (error) {
        return res.status(400).json({msg: error.message })
    }

}

module.exports = {
    addToCart,
    getMyCart,
    deleteProductFromCart,
    updateMyCart,
    ClearCart
}