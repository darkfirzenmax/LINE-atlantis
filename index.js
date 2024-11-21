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

// 全域錯誤處理
process.on('unhandledRejection', (error) => {
  console.error('Unhandled Promise Rejection:', error);
});

// 解析請求
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 記錄所有請求
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  next();
});

// 基本路由
app.get('/', (req, res) => {
  res.send('Server is running');
});

// LINE Webhook 路由
app.post('/webhook', (req, res) => {
  console.log('Received webhook request');
  console.log('Body:', req.body);
  
  if (!lineConfig.channelSecret) {
    console.error('LINE Channel Secret is not set');
    return res.status(200).json({
      status: 'error',
      message: 'Channel secret is not configured'
    });
  }

  // 回應 LINE 平台
  res.status(200).json({
    status: 'success',
    message: 'Webhook received successfully'
  });

  // 非同步處理訊息
  if (req.body.events && req.body.events.length > 0) {
    handleEvents(req.body.events).catch(console.error);
  }
});

// 異步處理事件
async function handleEvents(events) {
  for (const event of events) {
    if (event.type === 'message' && event.message.type === 'text') {
      console.log('Processing message:', event.message.text);
      
      try {
        // 發送到 Discord
        await sendToDiscord({
          content: `LINE: ${event.message.text}`
        });

        // 回覆 LINE 訊息
        await lineClient.replyMessage(event.replyToken, {
          type: 'text',
          text: '訊息已轉發到 Discord！'
        });
      } catch (error) {
        console.error('Error handling message:', error);
      }
    }
  }
}

// Discord Webhook 路由
app.post('/discord-webhook', async (req, res) => {
  console.log('Received Discord webhook:', req.body);
  
  try {
    if (!req.body.content) {
      throw new Error('No content in Discord message');
    }

    // 發送到 LINE
    await lineClient.broadcast({
      type: 'text',
      text: `Discord: ${req.body.content}`
    });

    res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('Error handling Discord webhook:', error);
    res.status(200).json({ 
      status: 'error',
      message: error.message
    });
  }
});

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
  } catch (error) {
    console.error('Discord sending error:', error);
    throw error;
  }
}

// 啟動伺服器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Environment check:');
  console.log('LINE Channel Secret:', lineConfig.channelSecret ? 'Set' : 'Not set');
  console.log('LINE Channel Access Token:', lineConfig.channelAccessToken ? 'Set' : 'Not set');
  console.log('Discord Webhook URL:', DISCORD_WEBHOOK_URL ? 'Set' : 'Not set');
});
