const express = require('express');
const line = require('@line/bot-sdk');
const fetch = require('node-fetch');
const app = express();

// LINE Bot 設定
const lineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
};

// Discord Webhook URL
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

// LINE Bot client
const lineClient = new line.Client(lineConfig);

// 解析 JSON
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

// 記錄所有請求
app.use((req, res, next) => {
  console.log('=== New Request ===');
  console.log('Time:', new Date().toISOString());
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', req.headers);
  if (req.body) console.log('Body:', JSON.stringify(req.body, null, 2));
  next();
});

// 主頁路由
app.get('/', (req, res) => {
  res.send('Bot is running!');
});

// LINE Webhook 驗證
app.get('/webhook', (req, res) => {
  console.log('Received webhook verification request');
  res.sendStatus(200);
});

// 從 Discord 接收訊息
app.post('/discord-webhook', async (req, res) => {
  console.log('=== Discord Message Received ===');
  console.log('Message:', req.body);
  
  try {
    if (!req.body.content) {
      throw new Error('No message content from Discord');
    }

    // 嘗試取得用戶 ID
    let userIds = [];
    try {
      const profile = await lineClient.getProfile(process.env.LINE_USER_ID);
      userIds.push(profile.userId);
      console.log('Found LINE user:', profile.userId);
    } catch (error) {
      console.error('Error getting LINE profile:', error);
    }

    if (userIds.length === 0) {
      console.log('No valid LINE user IDs found, trying broadcast');
      // 如果沒有特定用戶，嘗試廣播
      await lineClient.broadcast({
        type: 'text',
        text: `Discord: ${req.body.content}`
      });
    } else {
      console.log('Sending to specific users:', userIds);
      // 發送給特定用戶
      await lineClient.multicast(userIds, {
        type: 'text',
        text: `Discord: ${req.body.content}`
      });
    }

    console.log('Successfully sent to LINE');
    res.json({ success: true });
  } catch (error) {
    console.error('Error processing Discord message:', error);
    res.status(500).json({ error: error.message });
  }
});

// LINE Webhook
app.post('/webhook', line.middleware(lineConfig), async (req, res) => {
  console.log('=== LINE Webhook Triggered ===');
  try {
    const events = req.body.events;
    console.log('LINE events:', JSON.stringify(events, null, 2));
    
    await Promise.all(events.map(handleEvent));
    res.status(200).json({ status: 'ok' });
  } catch (err) {
    console.error('LINE webhook error:', err);
    res.status(200).json({ status: 'error', message: err.message });
  }
});

// 處理 LINE 事件
async function handleEvent(event) {
  console.log('=== Processing LINE Event ===');
  console.log('Event:', JSON.stringify(event, null, 2));

  if (event.type !== 'message' || event.message.type !== 'text') {
    console.log('Not a text message, skipping');
    return null;
  }

  try {
    // 儲存用戶 ID
    if (event.source.userId) {
      console.log('LINE User ID:', event.source.userId);
      // 可以在這裡將用戶 ID 儲存到環境變數或資料庫
    }

    // 發送到 Discord
    await sendToDiscord({
      content: `LINE: ${event.message.text}`
    });

    // 回覆 LINE 訊息
    return await lineClient.replyMessage(event.replyToken, {
      type: 'text',
      text: '訊息已轉發到 Discord！'
    });
  } catch (error) {
    console.error('Error handling LINE event:', error);
  }
}

// Discord 發送函數
async function sendToDiscord(payload) {
  console.log('=== Sending to Discord ===');
  console.log('Payload:', payload);
  
  try {
    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Discord API error: ${response.status}, ${errorText}`);
    }
    console.log('Successfully sent to Discord');
  } catch (error) {
    console.error('Error sending to Discord:', error);
    throw error;
  }
}

// 啟動伺服器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('=== Server Started ===');
  console.log(`Server is running on port ${PORT}`);
  console.log('Environment check:');
  console.log('LINE Channel Secret:', lineConfig.channelSecret ? 'Set' : 'Not set');
  console.log('LINE Channel Access Token:', lineConfig.channelAccessToken ? 'Set' : 'Not set');
  console.log('Discord Webhook URL:', DISCORD_WEBHOOK_URL ? 'Set' : 'Not set');
  console.log('LINE User ID:', process.env.LINE_USER_ID ? 'Set' : 'Not set');
});
