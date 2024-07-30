const express = require('express');
const bodyParser = require('body-parser');

const RtcTokenBuilder = require("../src/RtcTokenBuilder2").RtcTokenBuilder;
const RtcRole = require("../src/RtcTokenBuilder2").Role;

const app = express();
const port = process.env.PORT || 3000;

// Hard-coded Agora App ID and App Certificate
const appId = 'db5971c7ec8a45fb895ae1cc3ad3cf4b'; // Replace with your Agora App ID
const appCertificate = 'b811e0a60bd04e48b01fbb4bf5d63ca9'; // Replace with your Agora App Certificate

// Token expiration time in seconds
const tokenExpirationInSecond = 3600;

// Mock database for user activity
let userActivity = {}; // Store activity timestamps

app.use(bodyParser.json());

// Endpoint to fetch or renew RTC token
app.post('/fetch_rtc_token', (req, res) => {
    const { uid, channelName, role } = req.body;

    if (!uid || !channelName || !role) {
        return res.status(400).send('Missing parameters');
    }

    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + tokenExpirationInSecond;

    let roleType;
    if (role === 'broadcaster') {
        roleType = RtcRole.PUBLISHER;
    } else if (role === 'audience') {
        roleType = RtcRole.SUBSCRIBER;
    } else {
        return res.status(400).send('Invalid role');
    }

    const token = RtcTokenBuilder.buildTokenWithUid(
        appId,
        appCertificate,
        channelName,
        uid,
        roleType,
        privilegeExpiredTs
    );

    // Update user activity timestamp
    userActivity[uid] = currentTimestamp;

    console.log(`Generated Token: ${token}`); // Log token for debugging

    res.json({ token }); // Send token in response
});

// Endpoint to kick inactive users
app.post('/kick_inactive_users', (req, res) => {
    const { channelName, inactivityThreshold } = req.body; // inactivityThreshold in seconds

    if (!channelName || !inactivityThreshold) {
        return res.status(400).send('Missing parameters');
    }

    const currentTimestamp = Math.floor(Date.now() / 1000);
    for (const [uid, lastActivity] of Object.entries(userActivity)) {
        if (currentTimestamp - lastActivity > inactivityThreshold) {
            // Logic to kick user from the channel
            // This will depend on your Agora implementation
            console.log(`User ${uid} kicked from channel ${channelName} due to inactivity`);
        }
    }

    res.send('Checked for inactive users');
});

app.listen(port, () => {
    console.log(`Token server listening at http://localhost:${port}`);
});
