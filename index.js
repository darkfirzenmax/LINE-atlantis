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

// 記錄所有請求
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  if (req.body) {
    console.log('Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// 解析 JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 主頁路由
app.get('/', (req, res) => {
  res.send('Bot is running!');
});

// LINE Webhook 驗證
app.get('/webhook', (req, res) => {
  console.log('Webhook GET request received');
  res.status(200).end();
});

// LINE Webhook
app.post('/webhook', async (req, res) => {
  console.log('Webhook POST request received');
  
  try {
    // 立即回應 LINE Platform
    res.status(200).end();

    // 檢查是否有事件
    if (!req.body || !req.body.events) {
      console.log('No events in webhook');
      return;
    }

    // 處理每個事件
    for (let event of req.body.events) {
      console.log('Processing event:', event);
      
      if (event.type === 'message' && event.message.type === 'text') {
        // 發送到 Discord
        await sendToDiscord({
          content: `LINE: ${event.message.text}`
        });

        // 回覆 LINE 訊息
        await lineClient.replyMessage(event.replyToken, {
          type: 'text',
          text: '訊息已轉發到 Discord！'
        });
      }
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
  }
});

// Discord Webhook
app.post('/discord-webhook', async (req, res) => {
  console.log('Discord webhook received:', req.body);

  try {
    if (!req.body.content) {
      throw new Error('No message content');
    }

    // 發送到 LINE
    await lineClient.broadcast({
      type: 'text',
      text: `Discord: ${req.body.content}`
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error sending to LINE:', error);
    res.status(500).json({ error: error.message });
  }
});

// Discord 發送函數
async function sendToDiscord(payload) {
  console.log('Sending to Discord:', payload);
  
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
  console.log('LINE Bot Config:', {
    channelSecret: lineConfig.channelSecret ? 'Set' : 'Not set',
    channelAccessToken: lineConfig.channelAccessToken ? 'Set' : 'Not set',
    webhookUrl: DISCORD_WEBHOOK_URL ? 'Set' : 'Not set'
  });
});

// 錯誤處理
process.on('unhandledRejection', (error) => {
  console.error('Unhandled Promise Rejection:', error);
});
