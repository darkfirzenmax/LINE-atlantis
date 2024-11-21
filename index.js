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

// 測試路由
app.get('/', (req, res) => {
  res.send('Bot is running!');
});

// LINE Webhook
app.post('/webhook', line.middleware(lineConfig), async (req, res) => {
  try {
    const events = req.body.events;
    await Promise.all(events.map(handleEvent));
    res.json({ success: true });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 處理 LINE 事件
async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return null;
  }

  try {
    await sendToDiscord({
      content: `LINE 使用者訊息: ${event.message.text}`
    });

    return lineClient.replyMessage(event.replyToken, {
      type: 'text',
      text: '訊息已轉發到 Discord'
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

// Discord 發送函數
async function sendToDiscord(payload) {
  try {
    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`Discord API error: ${response.status}`);
    }
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// 啟動伺服器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});