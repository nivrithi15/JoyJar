const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const memoryRoutes = require("./routes/memoryRoutes");
const uploadRoutes = require("./routes/uploadRoutes");

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));
// Serve the JoyJar pages from this same server so image uploads use the same origin.
app.use(express.static(path.join(__dirname, "..")));

app.get("/", (req, res) => res.json({ message: "JoyJar API is running." }));
app.use("/api/auth", authRoutes);
app.use("/api/memories", memoryRoutes);
app.use("/api/upload", uploadRoutes);

// Centralized error response: controllers can simply call next(error).
app.use((error, req, res, next) => {
  console.error(error);
  if (error instanceof require("multer").MulterError) {
    return res.status(400).json({ message: error.message });
  }
  return res.status(error.statusCode || 500).json({ message: error.message || "Internal server error." });
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`JoyJar API listening on port ${port}`));
