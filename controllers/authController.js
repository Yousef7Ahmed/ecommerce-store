const User = require ("../models/User.Model")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const Product = require("../models/ProductModel");
const Category = require("../models/CategoryModel");
require("dotenv").config()


const register = async (req, res) =>{
    const {firstName ,lastName,email,password , phoneNumber} = req.body
    const UserExists = await User.findOne({ email })
    if (UserExists) {
        return res.json({
            message:"User already exists"
        })
    }
    const hashedPassword = await bcrypt.hash(password, 10)
    const newUser = await User.create({firstName , lastName , email,password: hashedPassword , phoneNumber})
    const token = jwt.sign(
    {
        id:newUser._id,
        role:newUser.role
    },
    process.env.JWT_SECRET_KEY
    ,
    {expiresIn: "7d"}
    )
    res.json({
        user: {
            id: newUser._id,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            phoneNumber: newUser.phoneNumber,
            email: newUser.email,
            role: newUser.role
        },
        token : token
    })
}

const login = async(req, res) =>{
    const {email, password } = req.body
    const foundUser = await User.findOne({ email })
    if(!foundUser){
        return res.status(404).json({message : "Invalid credentials"})
    }
    const isMatch = await bcrypt.compare(password ,foundUser.password )
    if(!isMatch) {
        return res.status(401).json({message : "Invalid credentials"})
    }
    const token = jwt.sign(
    {
        id:foundUser._id,
        role:foundUser.role
    },
    process.env.JWT_SECRET_KEY
    ,
    {expiresIn: "7d"}
    )
    res.status(200).json({
        user: {
            id: foundUser._id,
            firstName: foundUser.firstName,
            lastName: foundUser.lastName,
            email: foundUser.email,
            phoneNumber: foundUser.phoneNumber,
            role: foundUser.role
        },
        token : token
    })
}
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

    getAllUsers,

    updateUserRole,

    deleteUser,

    getDashboardStats,
};