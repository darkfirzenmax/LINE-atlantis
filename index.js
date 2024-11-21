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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 記錄所有請求
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  if (req.body) console.log('Body:', JSON.stringify(req.body, null, 2));
  next();
});

// 測試路由
app.get('/', (req, res) => {
  res.send('Bot is running!');
});

// 從 Discord 接收訊息的路由
app.post('/discord-webhook', async (req, res) => {
  console.log('Received from Discord:', req.body);
  
  try {
    if (!req.body.content) {
      throw new Error('No message content');
    }

    // 發送到 LINE
    await lineClient.broadcast({
      type: 'text',
      text: `Discord: ${req.body.content}`
    });

    console.log('Successfully sent to LINE');
    res.json({ success: true });
  } catch (error) {
    console.error('Error sending to LINE:', error);
    res.status(500).json({ error: error.message });
  }
});

// LINE Webhook
app.post('/webhook', line.middleware(lineConfig), async (req, res) => {
  console.log('Received from LINE:', req.body);
  
  try {
    const events = req.body.events;
    await Promise.all(events.map(handleEvent));
    res.json({ success: true });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 處理 LINE 事件
async function handleEvent(event) {
  console.log('Processing event:', event);

  if (event.type !== 'message' || event.message.type !== 'text') {
    return null;
  }

  try {
    // 發送到 Discord
    await sendToDiscord({
      content: `LINE: ${event.message.text}`
    });

    // 回覆 LINE 訊息
    return await lineClient.replyMessage(event.replyToken, {
      type: 'text',
      text: '訊息已轉發到 Discord!'
    });
  } catch (error) {
    console.error('Event handling error:', error);
  }
}

// Discord 發送函數
async function sendToDiscord(payload) {
  try {
    console.log('Sending to Discord:', payload);
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
    console.error('Discord sending error:', error);
    throw error;
  }
}

// 啟動伺服器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log('Environment variables check:');
  console.log('LINE Channel Secret:', lineConfig.channelSecret ? 'Set' : 'Not set');
  console.log('LINE Channel Access Token:', lineConfig.channelAccessToken ? 'Set' : 'Not set');
  console.log('Discord Webhook URL:', DISCORD_WEBHOOK_URL ? 'Set' : 'Not set');
});
