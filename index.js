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

// 解析 JSON 和 URL 編碼的請求
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 主頁路由
app.get('/', (req, res) => {
  res.send('Bot is running!');
});

// LINE Webhook 路由
app.post('/webhook', (req, res) => {
  console.log('Received webhook request');
  
  // 驗證請求的簽名
  const signature = req.get('x-line-signature');
  if (!signature) {
    console.log('No signature');
    return res.status(400).json({ error: 'No signature' });
  }

  Promise.resolve()
    .then(() => {
      console.log('Request body:', req.body);
      
      // 處理事件
      const events = req.body.events;
      return Promise.all(events.map(handleEvent));
    })
    .then(() => {
      res.status(200).json({ success: true });
    })
    .catch((err) => {
      console.error('Error handling webhook:', err);
      res.status(500).json({ error: err.message });
    });
});

// 處理 LINE 事件
async function handleEvent(event) {
  console.log('Event type:', event.type);
  
  if (event.type !== 'message' || event.message.type !== 'text') {
    console.log('Skipping non-text message');
    return Promise.resolve(null);
  }

  // 發送到 Discord
  try {
    await sendToDiscord({
      content: `LINE使用者: ${event.message.text}`
    });

    // 回覆 LINE 訊息
    return lineClient.replyMessage(event.replyToken, {
      type: 'text',
      text: '訊息已轉發到 Discord！'
    });
  } catch (error) {
    console.error('Error handling event:', error);
    return Promise.resolve(null);
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
      throw new Error(`Discord API error: ${response.status}`);
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
  console.log(`Server is running on port ${PORT}`);
  console.log('Environment check:');
  console.log('LINE Channel Secret:', lineConfig.channelSecret ? 'Set' : 'Not set');
  console.log('LINE Channel Access Token:', lineConfig.channelAccessToken ? 'Set' : 'Not set');
  console.log('Discord Webhook URL:', DISCORD_WEBHOOK_URL ? 'Set' : 'Not set');
});
