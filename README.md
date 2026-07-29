# Telegram Digital Store WebApp Bot 🚀

Ushbu bot **Telegram Premium**, **Telegram Stars**, **Telegram Gifts**, va **Telegram Numbers (+888)** xizmatlarini Telegram WebApp orqali sotish va yetkazib berish uchun mo'ljallangan to'liq tizimdir.

⭐ **Premium va Stars uchun API integratsiyasi**: `fragment-api.uz`

---

## 📁 Loyiha Tuzilishi

```
telegram-digital-store-bot/
├── .env                  # Bot va Fragment API sozlamalari (tokenlar)
├── .env.example          # Sozlamalar namunasi
├── package.json          # Node.js loyiha fayli va bog'liqliklar
├── server.js             # Express Web Server & API router
├── bot.js                # Telegram Bot mantig'i va buyruqlar
├── services/
│   └── fragmentApi.js    # fragment-api.uz API mijozi (Stars & Premium)
└── public/
    ├── index.html        # Telegram WebApp interfeysi
    ├── style.css         # Glassmorphism quyuq dizayn (CSS)
    └── app.js            # WebApp mijoz mantig'i va Telegram SDK
```

---

## ⚡️ Tezkor Ishga Tushirish

### 1. Bog'liqliklarni o'rnatish
```bash
npm install
```

### 2. `.env` faylini sozlash
`.env` faylida bot tokeningiz va `fragment-api.uz` kalitingiz ko'rsatilgan:

```env
BOT_TOKEN=8783132884:AAGWFy50PWOhSnDEYfTCOMLyTTdsys1ukDw
PORT=3000
WEBAPP_URL=http://localhost:3000
FRAGMENT_API_URL=https://fragment-api.uz/api
FRAGMENT_API_KEY=sizning_fragment_api_kalitingiz
ADMIN_CHAT_ID=
```

### 3. Server va Botni ishga tushirish
```bash
npm start
```

---

## 📱 BotFather-da WebApp o'rnatish

Botingiz Telegramda foydalanuvchilarga WebApp tugmasini ko'rsatishi uchun:

1. Telegramda [@BotFather](https://t.me/BotFather) botiga kiring.
2. `/mybots` buyrug'ini yuboring va botingizni tanlang (`@bot_username`).
3. **Bot Settings** -> **Menu Button** -> **Configure menu button** tugmalarini bosing.
4. WebApp URL manzilini kiriting (masalan, `https://sizning-domeneyingiz.uz` yoki testing uchun `ngrok` linki).
5. Yoki `/newapp` orqali alohida Direct WebApp link yarating!

---

## 🔌 fragment-api.uz Integratsiyasi

- **Stars (Yulduzlar)**: Foydalanuvchi tanlagan yulduzlar miqdori va Telegram username `fragment-api.uz/api/stars/buy` so'roviga yuboriladi.
- **Premium**: Foydalanuvchi obuna muddati (3, 6, 12 oy) `fragment-api.uz/api/premium/buy` so'roviga yuboriladi.
- **Sandbox rejasi**: Agar `.env` faylida `FRAGMENT_API_KEY` kiritilmagan bo'lsa yoki `demo_key` bo'lsa, tizim sandbox (mock) rejimida xavfsiz ishlaydi va terminalda konsolga yozadi.

---

## 🛠 Texnologiyalar
- **Backend**: Node.js, Express.js, `node-telegram-bot-api`, `axios`
- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3 Glassmorphism
- **SDK**: Telegram WebApp JS SDK
