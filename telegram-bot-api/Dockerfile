# Self-hosted Telegram Bot API (local mode: up to 2 GB files) + nginx so n8n can
# download files over HTTP from the same base URL it uses for API calls.
FROM aiogram/telegram-bot-api:latest

RUN apk add --no-cache nginx
COPY nginx.conf /etc/nginx/nginx.conf
COPY start.sh /start.sh
RUN chmod +x /start.sh

ENV TELEGRAM_LOCAL=1 \
    TELEGRAM_HTTP_PORT=8081 \
    PORT=8080

EXPOSE 8080
ENTRYPOINT ["/start.sh"]
