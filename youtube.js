const YTDlpWrap = require("yt-dlp-wrap").default;
const path = require("path");

const ytDlp = new YTDlpWrap();
// On Render, we don't need to set a binary path because it's installed globally
// But we'll leave this for local development
if (process.env.NODE_ENV !== 'production') {
    ytDlp.setBinaryPath(path.join(__dirname, "yt-dlp.exe"));
}

async function analyzeVideo(url) {
  try {
    // --- THE FIX IS HERE ---
    // We add the --force-ipv4 flag to the command
    const metadata = await ytDlp.getVideoInfo([url, '--force-ipv4']);
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

async function downloadVideo(url, quality, progressCallback) {
  return new Promise(async (resolve, reject) => {
    try {
      const metadata = await ytDlp.getVideoInfo([url, '--force-ipv4']);
      const outputTemplate = path.join(__dirname, "temp", `${metadata.id}.mp4`);

      const args = [
        url,
        "--force-ipv4", // --- AND ALSO HERE ---
        "--ffmpeg-location",
        process.env.NODE_ENV === 'production' ? 'ffmpeg' : path.join(__dirname, "ffmpeg.exe"),
        "-f",
        "bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/bv*+ba/b",
        "--no-warnings",
        "-o",
        outputTemplate,
        "--progress",
      ];

      const ytDlpProcess = ytDlp.exec(args);

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