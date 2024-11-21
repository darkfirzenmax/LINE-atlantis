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

// 測試路由
app.get('/', (req, res) => {
  res.send('Bot is running!');
});

// LINE Webhook 驗證
app.get('/webhook', (req, res) => {
  res.sendStatus(200);
});

// LINE Webhook 接收訊息
app.post('/webhook', line.middleware(lineConfig), async (req, res) => {
  try {
    const events = req.body.events || [];
    await Promise.all(events.map(handleEvent));
    res.status(200).json({ status: 'ok' });
  } catch (err) {
    console.error('Webhook Error:', err);
    res.status(200).json({ status: 'error', message: err.message });
  }
});

// 處理 LINE 事件
async function handleEvent(event) {
  console.log('Event:', event);
  if (event.type !== 'message' || event.message.type !== 'text') {
    return null;
  }

  try {
    // 發送到 Discord
    await sendToDiscord({
      content: `LINE: ${event.message.text}`
    });

    // 回覆 LINE 訊息
    return lineClient.replyMessage(event.replyToken, {
      type: 'text',
      text: '訊息已轉發到 Discord！'
    });
  } catch (error) {
    console.error('Handle Event Error:', error);
    return null;
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
    console.error('Discord Send Error:', error);
    throw error;
  }
}

// 從 Discord 接收訊息
app.post('/discord-webhook', async (req, res) => {
  try {
    const content = req.body.content;
    if (!content) {
      throw new Error('No content in Discord message');
    }

    await lineClient.broadcast({
      type: 'text',
      text: `Discord: ${content}`
    });

    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Discord Webhook Error:', error);
    res.status(200).json({ status: 'error', message: error.message });
  }
});

// 錯誤處理
app.use((err, req, res, next) => {
  console.error(err);
  res.status(200).json({
    status: 'error',
    message: err.message
  });
});

// 啟動伺服器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log('LINE Bot Config:', {
    channelSecret: lineConfig.channelSecret ? 'Set' : 'Not set',
    channelAccessToken: lineConfig.channelAccessToken ? 'Set' : 'Not set',
    webhookUrl: DISCORD_WEBHOOK_URL ? 'Set' : 'Not set'
  });
});
