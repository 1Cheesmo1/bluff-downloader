const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs").promises;
require("dotenv").config();

const { analyzeVideo, downloadVideo } = require("./youtube.js");
// --- IMPORT THE NEW DELETE FUNCTION ---
const { uploadToGoogleDrive, deleteFromGoogleDrive } = require("./googleDrive.js");
const { convertToMp3 } = require("./converter.js");

const app = express();
const PORT = process.env.PORT || 3003; // Using 3003 as we established

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const downloadProgress = new Map();
const tempDir = path.join(__dirname, "temp");
fs.mkdir(tempDir, { recursive: true }).catch(console.error);

// ... (The /api/analyze and /api/progress routes are unchanged) ...
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


// --- THE MAIN UPDATED FUNCTION ---
async function processDownload(downloadId, url, format, quality) {
  const update = (progress, message) => downloadProgress.set(downloadId, { status: "processing", progress, message });
  try {
    update(5, "Fetching video info...");
    
    // --- REAL-TIME PROGRESS ---
    // We pass a function to downloadVideo that updates the progress map
    const videoPath = await downloadVideo(url, quality, (percent) => {
      // We scale the percentage to fit within the 10% to 80% range of the progress bar
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

    // --- AUTO-DELETE LOGIC ---
    // Schedule the file to be deleted in 30 minutes (1,800,000 milliseconds)
    setTimeout(() => {
      deleteFromGoogleDrive(driveFile.id);
    }, 30 * 60 * 1000);

    await fs.unlink(finalPath);
    // We no longer need to delete the progress map entry here
  } catch (error) {
    console.error("Processing Error:", error);
    downloadProgress.set(downloadId, { status: "error", message: error.message });
  }
}

app.listen(PORT, () => {
  console.log(`✅ Bluff Downloader server is running on http://localhost:${PORT}`);
});