const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_DRIVE_CLIENT_ID,
  process.env.GOOGLE_DRIVE_CLIENT_SECRET
);
oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN });
const drive = google.drive({ version: "v3", auth: oauth2Client });

async function uploadToGoogleDrive(filePath, format) {
  const response = await drive.files.create({
    requestBody: {
      name: path.basename(filePath),
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
    },
    media: {
      mimeType: format === "mp3" ? "audio/mpeg" : "video/mp4",
      body: fs.createReadStream(filePath),
    },
    fields: "id,webViewLink",
  });
  await drive.permissions.create({ fileId: response.data.id, requestBody: { role: "reader", type: "anyone" } });
  return response.data;
}

// --- NEW FUNCTION ---
// This function will delete a file from Google Drive
async function deleteFromGoogleDrive(fileId) {
  try {
    await drive.files.delete({ fileId: fileId });
    console.log(`✅ Successfully deleted file ${fileId} from Google Drive.`);
  } catch (error) {
    console.error(`Failed to delete file ${fileId}:`, error);
  }
}

module.exports = { uploadToGoogleDrive, deleteFromGoogleDrive }; // <-- Add the new function here