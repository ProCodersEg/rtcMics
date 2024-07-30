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

app.post('/kick_user', async (req, res) => {
    const { appid, cname, uid, ip, time, time_in_seconds, privileges } = req.body;

    if (!appid || !cname || !time || !time_in_seconds || !privileges) {
        return res.status(400).send('Missing parameters');
    }

    const data = {
        appid: appid,
        cname: cname,
        uid: uid || null,
        ip: ip || null,
        time: time,
        time_in_seconds: time_in_seconds,
        privileges: privileges
    };

    try {
        const response = await axios.post('https://api.agora.io/dev/v1/kicking-rule', data, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        console.log('Kicking response:', response.data);
        res.json(response.data);
    } catch (error) {
        console.error('Error kicking user:', {
            message: error.message,
            response: error.response ? error.response.data : null
        });
        res.status(500).send('Error kicking user');
    }
});

