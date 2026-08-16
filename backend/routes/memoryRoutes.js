const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");
const {
  createMemory,
  getMemories,
  getRandomMemory,
  deleteMemory,
} = require("../controllers/memoryController");

const router = express.Router();
router.use(protect);

// Place /random before /:id so Express never treats "random" as an id.
router.get("/random", getRandomMemory);
router.route("/").post(upload.single("image"), createMemory).get(getMemories);
router.delete("/:id", deleteMemory);

module.exports = router;

