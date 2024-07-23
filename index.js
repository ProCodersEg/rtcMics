// Import required modules

const cron = require('node-cron');
const express = require('express');
const bodyParser = require('body-parser');
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

const app = express();
const port = 3000; // Change to your desired port

const APP_ID = 'YOUR_APP_ID'; // Replace with your Agora App ID
const APP_CERTIFICATE = 'YOUR_APP_CERTIFICATE'; // Replace with your Agora App Certificate
const TOKEN_EXPIRE_TIME = 3600; // Token expiration time in seconds

app.use(bodyParser.json());

// Endpoint to fetch or renew RTC token
app.post('/fetch_rtc_token', (req, res) => {
    const { uid, channelName, role } = req.body;

    if (!uid || !channelName || !role) {
        return res.status(400).send('Missing parameters');
    }

    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + TOKEN_EXPIRE_TIME;

    const token = RtcTokenBuilder.buildTokenWithUid(
        APP_ID,
        APP_CERTIFICATE,
        channelName,
        uid,
        role === 'broadcaster' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER,
        privilegeExpiredTs
    );

    res.json({ token });
});

app.listen(port, () => {
    console.log(`Token server listening at http://localhost:${port}`);
});