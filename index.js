const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// ================= CONFIG =================

// กลุ่มต้นทาง (กลุ่มที่ให้ก๊อปข้อความ)
const SOURCE_GROUP_ID = 'ใส่_GROUP_ID_ต้นทาง';

// userId → กลุ่มปลายทาง (เพิ่มได้เรื่อยๆ)
const USER_TARGET_MAP = {
  // user คนที่ 1
  'ใส่_USER_ID_คนที่1': [
    'ใส่_GROUP_ID_ปลายทาง_1',
    'ใส่_GROUP_ID_ปลายทาง_2'
  ],

  // user คนที่ 2
  'ใส่_USER_ID_คนที่2': [
    'ใส่_GROUP_ID_ปลายทาง_3'
  ]
};

const LINE_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

// ==========================================

app.post('/webhook', async (req, res) => {
  res.sendStatus(200); // ตอบ LINE ทันที กัน timeout

  const events = req.body.events || [];

  for (const event of events) {
    try {
      if (event.type !== 'message') continue;
      if (event.message.type !== 'text') continue;
      if (event.source.type !== 'group') continue;

      const { groupId, userId } = event.source;
      const text = event.message.text;

      // ต้องมาจากกลุ่มต้นทางเท่านั้น
      if (groupId !== SOURCE_GROUP_ID) continue;

      // ต้องเป็น user ที่อนุญาต
      const targetGroups = USER_TARGET_MAP[userId];
      if (!targetGroups) continue;

      // ส่งข้อความไปทุกกลุ่มปลายทาง
      for (const targetGroupId of targetGroups) {
        await axios.post(
          'https://api.line.me/v2/bot/message/push',
          {
            to: targetGroupId,
            messages: [{ type: 'text', text }]
          },
          {
            headers: {
              Authorization: `Bearer ${LINE_TOKEN}`,
              'Content-Type': 'application/json'
            }
          }
        );
      }

      console.log('Forwarded from', userId, text);

    } catch (err) {
      console.error('ERROR:', err.response?.data || err.message);
    }
  }
});

// health check
app.get('/', (req, res) => {
  res.send('LINE BOT OK');
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log('Server running on port', PORT);
});
