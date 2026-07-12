const cloudinaryService = require("../services/cloudinaryService")

const uploadImage = async (req, res) => {

    try {

        if (!req.file) {
            return res.status(400).json({
                message: "No image uploaded"
            })
        }

        const image = await cloudinaryService.uploadImage(req.file.buffer)

        return res.status(200).json({
            message: "Image uploaded successfully",
            image
        })

    } catch (error) {

        return res.status(500).json({
            message: error.message
        })

    }

}

module.exports = {
    uploadImage
}