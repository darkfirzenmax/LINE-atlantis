const express = require('express');
const app = express();

// 解析 JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 所有路由都回傳 200
app.all('/webhook', (req, res) => {
  console.log('Webhook request received:', {
    method: req.method,
    headers: req.headers,
    body: req.body
  });
  res.sendStatus(200);
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
