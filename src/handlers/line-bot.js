'use strict';

const line = require('@line/bot-sdk');
const crypto = require('crypto');

const client = new line.Client({ channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN });

exports.lineBotHandler = async (event) => {
  for (const { messageId, body, messageAttributes } of event.Records) {
    let signature = crypto.createHmac('sha256', process.env.CHANNEL_SECRET).update(body).digest('base64');
    let checkHeader = messageAttributes['line-signature']['stringValue'];
    let webhookBody = JSON.parse(body);

    if (signature === checkHeader) {
      if (webhookBody.events[0].replyToken === '00000000000000000000000000000000') {
        // 接続確認時
        return { statusCode: 200, body: 'OK' };
      } else {
        const message = {
          type: 'text',
          text: webhookBody.events[0].message.text
        };

        await client.replyMessage(webhookBody.events[0].replyToken, message).
          then((response) => {
            return { statusCode: 200, body: message };
          }).
          catch((err) => console.error(err));
      }
    } else {
      console.error('署名検証エラー');
      return { statusCode: 401, body: 'Unauthorized' };
    }
  }
};
