const YTDlpWrap = require("yt-dlp-wrap").default;
const path = require("path");
const ffmpegPath = require("ffmpeg-static");

const ytDlp = new YTDlpWrap();

const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36';

async function analyzeVideo(url) {
  try {
    const metadata = await ytDlp.getVideoInfo([url, '--force-ipv4', '--user-agent', userAgent]);
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
      const metadata = await ytDlp.getVideoInfo([url, '--force-ipv4', '--user-agent', userAgent]);
      const outputTemplate = path.join(__dirname, "temp", `${metadata.id}.mp4`);
      
      const args = [
        url,
        "--force-ipv4",
        "--user-agent", userAgent,
        "--ffmpeg-location", ffmpegPath,
        "-f", "bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/bv*+ba/b",
        "--no-warnings", "-o", outputTemplate, "--progress",
      ];

      const ytDlpProcess = ytDlp.exec(args);

      ytDlpProcess.on("progress", (progress) => {
        progressCallback(progress.percent);
      });
      ytDlpProcess.on("error", (error) => reject(new Error("The download process failed.")));
      ytDlpProcess.on("close", () => resolve(outputTemplate));
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = { analyzeVideo, downloadVideo };