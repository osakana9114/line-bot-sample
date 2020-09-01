'use strict';

const line = require('@line/bot-sdk');
const crypto = require('crypto');
const AWS = require('aws-sdk');

// LINE Bot-SDKクライアント
const client = new line.Client(
  { channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN });
// AWS SDKクライアント
AWS.config.update({ region: 'ap-northeast-1' });
const docClient = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10' });
const tableName = 'line-user-test';

exports.lineBotHandler = async (event) => {
  for (const { body, messageAttributes } of event.Records) {
    let signature = crypto.createHmac('sha256', process.env.CHANNEL_SECRET).
      update(body).
      digest('base64');
    let checkHeader = messageAttributes['line-signature']['stringValue'];
    let webhookBody = JSON.parse(body);

    if (signature === checkHeader) {
      for (const { replyToken, source, message } of webhookBody.events) {
        // Webhookイベントの処理
        if (replyToken === '00000000000000000000000000000000') {
          // 接続確認時
          return { statusCode: 200, body: 'OK' };
        } else {
          // ユーザーデータ取得
          const searchParams = {
            TableName: tableName,
            Key: { 'userId': source.userId }
          };

          let searchResult;
          try {
            searchResult = await docClient.get(searchParams).promise();
          } catch (e) {
            console.error('データ取得エラー', e);
          }

          if (!Object.keys(searchResult).length) {
            // ユーザーデータがない場合は作成
            const putParams = {
              TableName: tableName,
              Item: {
                'userId': source.userId,
                'currentStep': 1
              }
            };

            try {
              await docClient.put(putParams).promise();
            } catch (e) {
              console.error('データ挿入エラー', e);
            }
          }

          const replyMessage = {
            type: 'text',
            text: message.text
          };

          await client.replyMessage(replyToken, replyMessage).
            then((response) => {
              return { statusCode: 200, body: replyMessage };
            }).
            catch((err) => console.error(err));
        }
      }
    } else {
      console.error('署名検証エラー');
      return { statusCode: 401, body: 'Unauthorized' };
    }
  }
};
