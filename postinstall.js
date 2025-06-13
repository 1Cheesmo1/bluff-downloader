const YTDlpWrap = require('yt-dlp-wrap').default;
const path = require('path');
const fs = require('fs');

async function downloadYtDlp() {
    console.log('Downloading yt-dlp binary to local ./bin directory...');
    try {
        const binDir = path.join(__dirname, 'bin');
        if (!fs.existsSync(binDir)) {
            fs.mkdirSync(binDir, { recursive: true });
        }
        const binaryPath = path.join(binDir, 'yt-dlp');
        await YTDlpWrap.downloadFromGithub(binaryPath);
        console.log('yt-dlp binary downloaded successfully to:', binaryPath);
    } catch (error) {
        console.error('Error downloading yt-dlp binary:', error);
        process.exit(1);
    }
}

downloadYtDlp();
