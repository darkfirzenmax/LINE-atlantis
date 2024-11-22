// 引入必要的套件
const express = require('express');
const app = express();

// 設定中介軟體
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 主頁路由
app.get('/', (req, res) => {
    res.send('Server is running');
});

// Webhook 路由
app.post('/webhook', (req, res) => {
    console.log('Received webhook request');
    res.status(200).send('OK');
});

// 啟動伺服器
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
