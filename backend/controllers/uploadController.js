const { Readable } = require("stream");
const cloudinary = require("../config/cloudinary");

// Upload the in-memory Multer file directly to Cloudinary.
const uploadWithFallback = async (buffer) => {
  const baseOptions = { folder: "joyjar/memories", resource_type: "image" };
  const preset = process.env.CLOUDINARY_UPLOAD_PRESET;

  const upload = (options) =>
    new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(options, (error, uploadedImage) =>
        error ? reject(error) : resolve(uploadedImage)
      );
      Readable.from(buffer).pipe(stream);
    });

  try {
    if (preset) {
      return await upload({ ...baseOptions, upload_preset: preset });
    }
    return await upload(baseOptions);
  } catch (error) {
    if (preset && (error?.http_code === 403 || /preset/i.test(error?.message || ""))) {
      return await upload(baseOptions);
    }
    throw error;
  }
};

const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please choose an image to upload." });
    }

    const result = await uploadWithFallback(req.file.buffer);

    const transform = (options) => cloudinary.url(result.public_id, { secure: true, transformation: options });
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    return res.status(201).json({
      imageUrl: result.secure_url,
      publicId: result.public_id,
      cloudName,
      cloudinaryId: result.public_id,
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
