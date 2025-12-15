const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// ================== CONFIG ==================
const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

// 📥 กลุ่มต้นทาง (กลุ่มที่ให้บอทอ่าน)
const SOURCE_GROUP_ID = 'ใส่_GROUP_ID_ต้นทาง';

// 👤 userId ที่อนุญาต + กลุ่มปลายทาง
const USER_TARGET_MAP = {
  // ตัวอย่าง
  // 'USER_ID_1': ['GROUP_ID_B', 'GROUP_ID_C'],
  // 'USER_ID_2': ['GROUP_ID_D']
};

// ============================================

app.post('/webhook', async (req, res) => {
  res.sendStatus(200);

  const event = req.body.events?.[0];
  if (!event) return;

  // รับเฉพาะข้อความจากกลุ่มต้นทาง
  if (event.source.type !== 'group') return;
  if (event.source.groupId !== SOURCE_GROUP_ID) return;
  if (event.type !== 'message') return;
  if (event.message.type !== 'text') return;

  const userId = event.source.userId;
  const text = event.message.text;

  // เช็คว่า user นี้อนุญาตไหม
  const targetGroups = USER_TARGET_MAP[userId];
  if (!targetGroups) return;

  // ส่งไปทุกกลุ่มปลายทาง
  for (const groupId of targetGroups) {
    try {
      await axios.post(
        'https://api.line.me/v2/bot/message/push',
        {
          to: groupId,
          messages: [{ type: 'text', text }]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`
          }
        }
      );
    } catch (err) {
      console.error('Push error:', err.response?.data || err.message);
    }
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log('Server running on port', PORT);
});
