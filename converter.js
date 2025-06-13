const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
const path = require("path");

// Tell fluent-ffmpeg where to find the ffmpeg binary from the ffmpeg-static package.
ffmpeg.setFfmpegPath(ffmpegPath);

function convertToMp3(videoPath) {
  return new Promise((resolve, reject) => {
    const outputPath = videoPath.replace(".mp4", ".mp3");
    ffmpeg(videoPath)
      .toFormat("mp3")
      .audioBitrate(320)
      .on("end", () => resolve(outputPath))
      .on("error", (err) => reject(new Error(`MP3 conversion failed: ${err.message}`)))
      .save(outputPath);
  });
}

module.exports = { convertToMp3 };