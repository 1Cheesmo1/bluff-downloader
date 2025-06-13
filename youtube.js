const YTDlpWrap = require("yt-dlp-wrap").default;
const path = require("path");
const ffmpegPath = require("ffmpeg-static");
const ytdl = require("ytdl-core");

// Use the yt-dlp binary downloaded by our postinstall script.
const ytDlpBinaryPath = path.join(__dirname, 'bin', 'yt-dlp');
const ytDlp = new YTDlpWrap(ytDlpBinaryPath);

const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36';

async function analyzeVideo(url) {
  // First attempt with ytdl-core (lighter and less likely to trigger 429)
  try {
    const info = await ytdl.getInfo(url, {
      requestOptions: { headers: { 'User-Agent': userAgent } },
    });

    const details = info.videoDetails;
    const thumbnails = details.thumbnails || [];
    const bestThumb = thumbnails.length ? thumbnails[thumbnails.length - 1].url : null;

    return {
      id: details.videoId,
      title: details.title,
      duration: formatDuration(details.lengthSeconds),
      thumbnail: bestThumb,
      uploader: details.author ? details.author.name : undefined,
    };
  } catch (err) {
    console.warn('[ytdl-core fallback] failed, falling back to yt-dlp', err);
  }

  // Fallback to yt-dlp if ytdl-core fails.
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
    console.error('[yt-dlp analysis error]', error);
    throw new Error('Failed to get video info from YouTube. It may be rate-limited; please try again later.');
  }
}

function formatDuration(totalSeconds) {
  const sec = parseInt(totalSeconds, 10);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h) return `${h}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
  return `${m}:${s.toString().padStart(2,'0')}`;
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