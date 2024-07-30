const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

const app = express();
const port = process.env.PORT || 3000;

const appId = 'db5971c7ec8a45fb895ae1cc3ad3cf4b'; 
// Replace with your Agora App ID 
const appCertificate = 'b811e0a60bd04e48b01fbb4bf5d63ca9'; 
// Replace with your Agora App Certificate

// Token expiration time in seconds
const tokenExpirationInSecond = 3600;

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

    // Generate Token
    const token = RtcTokenBuilder.buildTokenWithUid(
        appId,
        appCertificate,
        channelName,
        uid,
        roleType,
        privilegeExpiredTs
    );

    console.log(`Generated Token: ${token}`); // Log token for debugging

    res.json({ token }); // Send token in response
});

// Endpoint to kick a user
app.post('/kick_user', async (req, res) => {
    const { channelName, uid } = req.body;

    if (!channelName || !uid) {
        return res.status(400).send('Missing parameters');
    }

    const options = {
        method: 'DELETE',
        url: 'http://api.sd-rtn.com/dev/v1/kicking-rule',
        headers: {
            Authorization: `Basic ${Buffer.from(`${process.env.AGORA_APP_ID}:${process.env.AGORA_APP_CERTIFICATE}`).toString('base64')}`,
            Accept: 'application/json',
        },
        data: {
            cname: channelName,
            uid: uid,
            // Add any other necessary parameters as per Agora API requirements
        }
    };

    try {
        const { data } = await axios.request(options);
        console.log(data);
        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).send('Failed to kick user');
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Token server listening at http://localhost:${port}`);
});
