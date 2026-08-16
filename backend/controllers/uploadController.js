const { Readable } = require("stream");
const cloudinary = require("../config/cloudinary");

// Upload the in-memory Multer file directly to Cloudinary.
const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please choose an image to upload." });
    }

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "joyjar/memories",
          resource_type: "image",
          ...(process.env.CLOUDINARY_UPLOAD_PRESET && { upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET }),
        },
        (error, uploadedImage) => (error ? reject(error) : resolve(uploadedImage))
      );
      Readable.from(req.file.buffer).pipe(stream);
    });

    const transform = (options) => cloudinary.url(result.public_id, { secure: true, transformation: options });
    return res.status(201).json({
      imageUrl: result.secure_url,
      publicId: result.public_id,
      thumbnailUrl: transform([
        { width: 300, height: 300, crop: "fill", gravity: "auto" },
        { quality: "auto", fetch_format: "auto" },
      ]),
      polaroidUrl: transform([
        { width: 700, crop: "limit" },
        { border: "14px_solid_white", radius: 18, effect: "shadow" },
        { quality: "auto", fetch_format: "auto" },
      ]),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadImage };
