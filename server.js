const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs").promises;
require("dotenv").config();

const { analyzeVideo, downloadVideo } = require("./youtube.js");
const { uploadToGoogleDrive, deleteFromGoogleDrive } = require("./googleDrive.js");
const { convertToMp3 } = require("./converter.js");

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(express.json());

// --- API ROUTES ARE NOW DEFINED FIRST ---
// This ensures they are matched before the static file server.

const downloadProgress = new Map();

app.post("/api/analyze", async (req, res) => {
  try {
    const videoInfo = await analyzeVideo(req.body.url);
    res.json(videoInfo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/download", (req, res) => {
  const { url, format, quality } = req.body;
  const downloadId = require("uuid").v4();
  downloadProgress.set(downloadId, { status: "starting", progress: 0, message: "Initializing..." });
  processDownload(downloadId, url, format, quality);
  res.json({ downloadId });
});

app.get("/api/progress/:id", (req, res) => {
  const progress = downloadProgress.get(req.params.id);
  if (!progress) return res.status(404).json({ error: "Download not found" });
  res.json(progress);
});

// --- STATIC FILE SERVING IS NOW DEFINED LAST ---
// This serves all our frontend files (HTML, CSS, JS, PNGs)
app.use(express.static(__dirname));

// This is a catch-all route that sends index.html for any other GET request.
// This helps with refreshing the page on different routes in the future.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});


// --- The processDownload function remains the same ---
const tempDir = path.join(__dirname, "temp");
fs.mkdir(tempDir, { recursive: true }).catch(console.error);

async function processDownload(downloadId, url, format, quality) {
  const update = (progress, message) => downloadProgress.set(downloadId, { status: "processing", progress, message });
  try {
    update(5, "Fetching video info...");
    const videoPath = await downloadVideo(url, quality, (percent) => {
      update(10 + (percent * 0.7), `Downloading... ${Math.floor(percent)}%`);
    });
    update(80, "Processing file...");
    let finalPath = videoPath;
    if (format === "mp3") {
      update(85, "Converting to MP3...");
      finalPath = await convertToMp3(videoPath);
      await fs.unlink(videoPath);
    }
    update(90, "Uploading to Google Drive...");
    const driveFile = await uploadToGoogleDrive(finalPath, format);
    downloadProgress.set(downloadId, {
      status: "completed",
      progress: 100,
      message: "Download complete!",
      downloadUrl: driveFile.webViewLink,
    });
    setTimeout(() => {
      deleteFromGoogleDrive(driveFile.id);
    }, 30 * 60 * 1000);
    await fs.unlink(finalPath);
  } catch (error) {
    console.error("Processing Error:", error);
    downloadProgress.set(downloadId, { status: "error", message: error.message });
  }
}

app.listen(PORT, () => {
  console.log(`✅ Bluff Downloader server is running on http://localhost:${PORT}`);
});