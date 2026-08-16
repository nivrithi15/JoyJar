const { Readable } = require("stream");
const cloudinary = require("../config/cloudinary");
const { getMilestone } = require("../utils/milestone");
const {
  createMemory: saveMemory,
  getUserMemories,
  findMemoryById,
  removeMemory,
} = require("../utils/inMemoryStore");

const CATEGORIES = [
  "little-win",
  "someone-made-me-smile",
  "something-beautiful",
  "something-i-enjoyed",
  "something-silly",
  "just-because",
];

// Stream the Multer buffer to Cloudinary without writing a temporary local file.
const uploadToCloudinary = (buffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "joyjar/memories", resource_type: "image" },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    Readable.from(buffer).pipe(stream);
  });

/** Add display-only Cloudinary transformation URLs to a memory response. */
const formatMemory = (memory) => {
  const item = memory;
  if (!item.cloudinaryId) {
    return { ...item, thumbnailUrl: null, polaroidUrl: null };
  }

  return {
    ...item,
    thumbnailUrl: cloudinary.url(item.cloudinaryId, {
      secure: true,
      transformation: [
        { width: 300, height: 300, crop: "fill", gravity: "auto" },
        { quality: "auto", fetch_format: "auto" },
      ],
    }),
    polaroidUrl: cloudinary.url(item.cloudinaryId, {
      secure: true,
      transformation: [
        { width: 700, crop: "limit" },
        { border: "14px_solid_white", radius: 18, effect: "shadow" },
        { quality: "auto", fetch_format: "auto" },
      ],
    }),
  };
};

const createMemory = async (req, res, next) => {
  try {
    const { text, category } = req.body;
    if (!text || !text.trim() || !category) {
      return res.status(400).json({ message: "Text and category are required." });
    }
    if (!CATEGORIES.includes(category)) {
      return res.status(400).json({ message: "Please choose a valid category." });
    }

    let imageUrl = null;
    let cloudinaryId = null;
    if (req.file) {
      const uploadedImage = await uploadToCloudinary(req.file.buffer);
      imageUrl = uploadedImage.secure_url;
      cloudinaryId = uploadedImage.public_id;
    }

    const memory = saveMemory({
      userId: req.user.id,
      text: text.trim(),
      category,
      imageUrl,
      cloudinaryId,
    });
    const count = getUserMemories(req.user.id).length;
    const milestone = getMilestone(count);

    return res.status(201).json({
      message: "Memory saved!",
      memory: formatMemory(memory),
      milestoneUnlocked: Boolean(milestone),
      ...(milestone && { milestone }),
    });
  } catch (error) {
    next(error);
  }
};

const getMemories = async (req, res, next) => {
  try {
    const memories = getUserMemories(req.user.id).sort((a, b) => b.createdAt - a.createdAt);
    return res.json({ memories: memories.map(formatMemory) });
  } catch (error) {
    next(error);
  }
};

const getRandomMemory = async (req, res, next) => {
  try {
    const memories = getUserMemories(req.user.id);
    const memory = memories[Math.floor(Math.random() * memories.length)];
    if (!memory) return res.status(404).json({ message: "No memories found yet." });
    return res.json({ memory: formatMemory(memory) });
  } catch (error) {
    next(error);
  }
};

const deleteMemory = async (req, res, next) => {
  try {
    const memory = findMemoryById(req.params.id);
    if (!memory) return res.status(404).json({ message: "Memory not found." });
    if (memory.userId !== req.user.id) {
      return res.status(403).json({ message: "You can only delete your own memories." });
    }

    if (memory.cloudinaryId) {
      await cloudinary.uploader.destroy(memory.cloudinaryId, { resource_type: "image" });
    }
    removeMemory(memory.id);
    return res.json({ message: "Memory deleted successfully." });
  } catch (error) {
    next(error);
  }
};

module.exports = { createMemory, getMemories, getRandomMemory, deleteMemory };
