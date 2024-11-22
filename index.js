const express = require('express');
const app = express();

// 基本設定
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 簡單的健康檢查路由
app.get('/', (req, res) => {
  res.send('Server is healthy');
});

// Webhook 路由
app.all('/webhook', (req, res) => {
  console.log('=== Webhook Request Received ===');
  console.log('Method:', req.method);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  
  // 總是回傳 200
  res.status(200).json({ status: 'success' });
});

// 錯誤處理
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(200).json({ status: 'error', message: err.message });
});

// 處理未捕獲的異常
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});

// 啟動伺服器
const PORT = process.env.PORT || 8080;
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// 優雅關閉
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Performing graceful shutdown...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
