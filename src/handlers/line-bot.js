'use strict';

const line = require( '@line/bot-sdk' );
const crypto = require( 'crypto' );

const client = new line.Client( {channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN} );

exports.lineBotHandler = function ( event ) {
    let signature = crypto.createHmac('sha256', process.env.CHANNEL_SECRET).update(event.body).digest('base64');
    let checkHeader = (event.headers || {})['X-Line-Signature'];
    let body = JSON.parse(event.body);

    if ( signature === checkHeader ) {
        if ( body.events[0].replyToken === '00000000000000000000000000000000' ) {
            // 接続確認時
            return {
                statusCode: 200,
                headers: {"X-Line-Status": "OK"}
            }
        } else {
            const message = {
                "type": "text",
                "text": "$ LINE emoji $",
                "emojis": [
                    {
                        "index": 0,
                        "productId": "5ac1bfd5040ab15980c9b435",
                        "emojiId": "001"
                    },
                    {
                        "index": 13,
                        "productId": "5ac1bfd5040ab15980c9b435",
                        "emojiId": "002"
                    }
                ]
            }

            client.replyMessage( body.events[0].replyToken, message )
                  .then( ( response ) => {
                      return {
                          statusCode: 200,
                          headers: {"X-Line-Status": "OK"}
                      }
                  } ).catch( ( err ) => console.error( err ) );
        }
    } else {
        console.error( '署名認証エラー' );
    }
}
