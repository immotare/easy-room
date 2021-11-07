# easy-room
スクリーンショット

![easy-room_screeshot](https://user-images.githubusercontent.com/85956392/140644364-97412878-843a-46b8-a4e3-9b103ba12245.png)

# 環境変数
同じslackのワークスペースに入っているユーザー同士での使用を想定しています。また通信部分はskywayを使っているのでskywayの登録が必要です。
.envファイルに以下を設定すれば動くはずです。

#### ・ SLACK_SECRET
Slack APIのシークレットキー
#### ・ SLACK_CLIENT
Slack APIのクライアントキー

#### ・ SLACK_BOT_USER
Slack APIのBot userトークン(権限にusers.profile:readを設定)

#### ・ SKYWAY_SECRET
skywayのシークレットキー

#### ・ SKYWAY_API_KEY
skywayのapiキー

#### ・ COOKIE_SECRET
Cookieの検証用のキー、必要ないかもしれません

#### ・ SLACK_API_URL
SlackのコールバックURL、client_id等各種パラメータをクエリに含めたもの
