const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

// ================== CONFIG ==================

// กลุ่มต้นทาง (Group A)
const SOURCE_GROUP_ID = 'Cxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

// ผูก userId → กลุ่มปลายทาง (เพิ่มได้เรื่อย ๆ)
const USER_TARGET_MAP = {
  // คนที่ 1
  'Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx': [
    'Cyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy',
    'Czzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz'
  ],

  // คนที่ 2
  'Uaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa': [
    'Cbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
  ]
};

// LINE config
const LINE_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

// ============================================

app.post('/webhook', async (req, res) => {
  res.sendStatus(200); // ตอบ 200 ทันที กัน timeout / 429

  const events = req.body.events;
  if (!events || events.length === 0) return;

  for (const event of events) {
    // รับเฉพาะข้อความจากกลุ่ม
    if (
      event.type !== 'message' ||
      event.message.type !== 'text' ||
      event.source.type !== 'group'
    ) {
      continue;
    }

    const groupId = event.source.groupId;
    const userId = event.source.userId;
    const text = event.message.text;

    console.log('FROM GROUP:', groupId);
    console.log('FROM USER:', userId);
    console.log('TEXT:', text);

    // ตรวจกลุ่มต้นทาง
    if (groupId !== SOURCE_GROUP_ID) continue;

    // ตรวจ user ที่อนุญาต
    const targetGroups = USER_TARGET_MAP[userId];
    if (!targetGroups) continue;

    // ส่งข้อความไปกลุ่มปลายทางทั้งหมด
    for (const targetGroupId of targetGroups) {
      try {
        await axios.post(
          'https://api.line.me/v2/bot/message/push',
          {
            to: targetGroupId,
            messages: [{ type: 'text', text }]
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${LINE_ACCESS_TOKEN}`
            }
          }
        );
      } catch (err) {
        console.error('Send error:', err.response?.data || err.message);
      }
    }
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
