const cloudinary = require("cloudinary").v2
const streamifier = require("streamifier")

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

const uploadImage = async (buffer) => {

    try {

        return await new Promise((resolve, reject) => {

            const stream = cloudinary.uploader.upload_stream(
                {
                    folder: "ecommerce-products"
                },
                (error, result) => {

                    if (error) {
                        return reject(error)
                    }

                    resolve(result)

                }
            )

            streamifier.createReadStream(buffer).pipe(stream)

        })

    } catch (error) {

        throw error

    }

}

const deleteImage = async (publicId) => {

    try {

        const result = await cloudinary.uploader.destroy(publicId)

        return result

    } catch (error) {

        throw error

    }

}

module.exports = {
    uploadImage,
    deleteImage
}