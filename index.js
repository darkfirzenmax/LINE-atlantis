const express = require('express');
const app = express();

// 基本中介軟體
app.use(express.json());

// 測試路由
app.get('/', (req, res) => {
    res.send('OK');
});

// Webhook 路由
app.post('/webhook', (req, res) => {
    res.status(200).send('OK');
});

// 啟動伺服器
const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});const express = require('express');
const app = express();

// 基本中介軟體
app.use(express.json());

// 測試路由
app.get('/', (req, res) => {
    res.send('OK');
});

// Webhook 路由
app.post('/webhook', (req, res) => {
    res.status(200).send('OK');
});

// 啟動伺服器
const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});
