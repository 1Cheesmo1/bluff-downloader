const { google } = require("googleapis");
require("dotenv").config();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_DRIVE_CLIENT_ID,
  process.env.GOOGLE_DRIVE_CLIENT_SECRET,
  "urn:ietf:wg:oauth:2.0:oob" // This is the special redirect URI for this method
);

if (!process.argv[2]) {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/drive.file"],
    prompt: "consent",
  });
  console.log("Authorize this app by visiting this url:");
  console.log(authUrl);
  console.log("\nThen run this command with the code you get:");
  console.log("node getRefreshToken.js YOUR_CODE_HERE");
} else {
  const code = process.argv[2];
  oauth2Client.getToken(code, (err, token) => {
    if (err) return console.error("Error retrieving access token", err);
    console.log("✅ Your Refresh Token is:\n");
    console.log(token.refresh_token);
    console.log("\nCopy this and paste it into your .env file!");
  });
}