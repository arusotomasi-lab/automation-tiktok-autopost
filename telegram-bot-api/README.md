# Telegram Bot API (self-hosted, local mode)

Lets the n8n bot receive videos up to 2 GB (cloud Bot API limit is 20 MB).

Railway service (project `giving-success`), root directory `telegram-bot-api/`.
Required variables (set in Railway dashboard, from https://my.telegram.org → API development tools):
- `TELEGRAM_API_ID`
- `TELEGRAM_API_HASH`

n8n reaches it privately at `http://telegram-bot-api.railway.internal:8080`
(set as **Base URL** in the n8n Telegram credential).

One-time: call `https://api.telegram.org/bot<TOKEN>/logOut` before switching, so the bot
moves from the cloud Bot API to this server.
