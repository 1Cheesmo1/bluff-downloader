const YTDlpWrap = require("yt-dlp-wrap").default;
const path = require("path");

const ytDlp = new YTDlpWrap();
ytDlp.setBinaryPath(path.join(__dirname, "yt-dlp.exe"));

async function analyzeVideo(url) {
  try {
    const metadata = await ytDlp.getVideoInfo(url);
    return {
      id: metadata.id,
      title: metadata.title,
      duration: metadata.duration,
      thumbnail: metadata.thumbnail,
      uploader: metadata.channel,
    };
  } catch (error) {
    console.error("[yt-dlp analysis error]", error);
    throw new Error("Failed to get video info with yt-dlp.");
  }
}

// --- UPDATED FUNCTION ---
// It now accepts a progressCallback to report real-time progress
async function downloadVideo(url, quality, progressCallback) {
  return new Promise(async (resolve, reject) => {
    try {
      const metadata = await ytDlp.getVideoInfo(url);
      const outputTemplate = path.join(__dirname, "temp", `${metadata.id}.mp4`);

      const args = [
        url,
        "--ffmpeg-location",
        path.join(__dirname, "ffmpeg.exe"),
        "-f",
        "bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/bv*+ba/b",
        "--no-warnings",
        "-o",
        outputTemplate,
        "--progress",
      ];

      const ytDlpProcess = ytDlp.exec(args);

      // This now calls the callback function with the progress percentage
      ytDlpProcess.on("progress", (progress) => {
        progressCallback(progress.percent);
      });

      ytDlpProcess.on("error", (error) => {
        reject(new Error("The download process failed."));
      });

      ytDlpProcess.on("close", () => {
        resolve(outputTemplate);
      });
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  analyzeVideo,
  downloadVideo,
};