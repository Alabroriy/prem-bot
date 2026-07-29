const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const { initBot, sendUserNotification } = require('./bot');
const fragmentApi = require('./services/fragmentApi');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Catalog Data Definition
const CATALOG = {
  stars: [
    { id: 'stars_50', title: '50 Telegram Stars', count: 50, price: 15000, price_formatted: "15,000 UZS", badge: 'Mashhur' },
    { id: 'stars_100', title: '100 Telegram Stars', count: 100, price: 29000, price_formatted: "29,000 UZS", badge: null },
    { id: 'stars_250', title: '250 Telegram Stars', count: 250, price: 69000, price_formatted: "69,000 UZS", badge: 'Foydali' },
    { id: 'stars_500', title: '500 Telegram Stars', count: 500, price: 135000, price_formatted: "135,000 UZS", badge: 'Top Seller' },
    { id: 'stars_1000', title: '1,000 Telegram Stars', count: 1000, price: 265000, price_formatted: "265,000 UZS", badge: null },
    { id: 'stars_2500', title: '2,500 Telegram Stars', count: 2500, price: 650000, price_formatted: "650,000 UZS", badge: 'VIP' },
    { id: 'stars_5000', title: '5,000 Telegram Stars', count: 5000, price: 1290000, price_formatted: "1,290,000 UZS", badge: 'Mega Pack' }
  ],
  premium: [
    { id: 'prem_3m', title: '3 Oylik Telegram Premium', months: 3, price: 145000, price_formatted: "145,000 UZS", desc: "4GB fayl yuklash, Cheksiz bulut, Badge va Exo stikerlar" },
    { id: 'prem_6m', title: '6 Oylik Telegram Premium', months: 6, price: 245000, price_formatted: "245,000 UZS", badge: 'Chegirma 15%', desc: "Ovozli xabarlarni matnga aylantirish + Eksklyuziv funksiyalar" },
    { id: 'prem_12m', title: '12 Oylik Telegram Premium (1 Yil)', months: 12, price: 420000, price_formatted: "420,000 UZS", badge: 'Eng Kam Xarajat 40%', desc: "1 Yillik maksimal imkoniyatlar to'plami" }
  ],
  gifts: [
    { id: 'gift_star_cake', title: 'Star Birthday Cake', category: 'NFT Gift', rarity: 'Rare', price: 95000, price_formatted: "95,000 UZS", icon: '🎂' },
    { id: 'gift_golden_crown', title: 'Golden Imperial Crown', category: 'NFT Gift', rarity: 'Legendary', price: 350000, price_formatted: "350,000 UZS", icon: '👑' },
    { id: 'gift_diamond_ring', title: 'Fragment Diamond Ring', category: 'NFT Gift', rarity: 'Epic', price: 210000, price_formatted: "210,000 UZS", icon: '💍' },
    { id: 'gift_cyber_rocket', title: 'Cyber Rocket Booster', category: 'NFT Gift', rarity: 'Uncommon', price: 120000, price_formatted: "120,000 UZS", icon: '🚀' }
  ],
  numbers: [
    { id: 'num_888_0192', number: '+888 0192 8841', status: 'Available', type: 'Fragment Anonymous', price: 490000, price_formatted: "490,000 UZS" },
    { id: 'num_888_7749', number: '+888 7749 1102', status: 'Available', type: 'Fragment Anonymous', price: 590000, price_formatted: "590,000 UZS" },
    { id: 'num_888_9900', number: '+888 9900 3344', status: 'Available', type: 'Fragment VIP Number', price: 1200000, price_formatted: "1,200,000 UZS" },
    { id: 'num_888_5555', number: '+888 5555 7788', status: 'Available', type: 'Fragment Ultra VIP', price: 2500000, price_formatted: "2,500,000 UZS" }
  ]
};

// API Route: Get Catalog
app.get('/api/catalog', (req, res) => {
  res.json({
    success: true,
    catalog: CATALOG
  });
});

// API Route: Checkout / Order Processing
app.post('/api/checkout', async (req, res) => {
  try {
    const { category, itemId, targetUsername, userChatId } = req.body;

    if (!category || !itemId || !targetUsername) {
      return res.status(400).json({ success: false, message: "Barcha majburiy maydonlarni to'ldiring." });
    }

    const cleanUsername = targetUsername.replace(/^@/, '').trim();
    let result;
    let orderSummary = {};

    if (category === 'stars') {
      const product = CATALOG.stars.find(p => p.id === itemId);
      if (!product) return res.status(404).json({ success: false, message: "Mahsulot topilmadi" });

      orderSummary = {
        service_name: product.title,
        price_formatted: product.price_formatted,
        target_username: cleanUsername
      };

      // Call Fragment API Uzbekistan for Telegram Stars
      const fragmentRes = await fragmentApi.buyStars(cleanUsername, product.count);
      result = fragmentRes;
      if (fragmentRes.success) {
        orderSummary.order_id = fragmentRes.order_id || `STARS-${Date.now()}`;
      }
    } else if (category === 'premium') {
      const product = CATALOG.premium.find(p => p.id === itemId);
      if (!product) return res.status(404).json({ success: false, message: "Mahsulot topilmadi" });

      orderSummary = {
        service_name: product.title,
        price_formatted: product.price_formatted,
        target_username: cleanUsername
      };

      // Call Fragment API Uzbekistan for Telegram Premium
      const fragmentRes = await fragmentApi.buyPremium(cleanUsername, product.months);
      result = fragmentRes;
      if (fragmentRes.success) {
        orderSummary.order_id = fragmentRes.order_id || `PREM-${Date.now()}`;
      }
    } else if (category === 'gifts') {
      const product = CATALOG.gifts.find(p => p.id === itemId);
      if (!product) return res.status(404).json({ success: false, message: "Mahsulot topilmadi" });

      const orderId = `GIFT-${Date.now()}`;
      result = {
        success: true,
        order_id: orderId,
        message: `GIFT buyurtmasi qabul qilindi. Sovg'a @${cleanUsername} hisobiga yuboriladi.`
      };
      orderSummary = {
        service_name: product.title,
        price_formatted: product.price_formatted,
        target_username: cleanUsername,
        order_id: orderId
      };
    } else if (category === 'numbers') {
      const product = CATALOG.numbers.find(p => p.id === itemId);
      if (!product) return res.status(404).json({ success: false, message: "Mahsulot topilmadi" });

      const orderId = `NUM-${Date.now()}`;
      result = {
        success: true,
        order_id: orderId,
        message: `Raqam buyurtmasi (${product.number}) qabul qilindi.`
      };
      orderSummary = {
        service_name: `Telegram Number: ${product.number}`,
        price_formatted: product.price_formatted,
        target_username: cleanUsername,
        order_id: orderId
      };
    } else {
      return res.status(400).json({ success: false, message: "Noma'lum kategoriya" });
    }

    // Send Telegram Notification if userChatId is passed
    if (userChatId && result.success) {
      const notifyText = 
        `🎉 <b>Xarid muvaffaqiyatli amalga oshirildi!</b>\n\n` +
        `📦 <b>Xizmat:</b> ${orderSummary.service_name}\n` +
        `👤 <b>Qabul qiluvchi:</b> @${orderSummary.target_username}\n` +
        `💰 <b>Summa:</b> ${orderSummary.price_formatted}\n` +
        `🆔 <b>Order ID:</b> <code>${orderSummary.order_id}</code>\n\n` +
        `<i>fragment-api.uz tizimi orqali avtomatik ishlandi. Rahmat!</i>`;
      sendUserNotification(userChatId, notifyText);
    }

    return res.json({
      success: result.success,
      data: result,
      order: orderSummary
    });

  } catch (err) {
    console.error("Checkout error:", err);
    res.status(500).json({ success: false, message: "Serverda xatolik yuz berdi" });
  }
});

// Serve frontend SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize Telegram Bot
initBot();

// Start Express Server
app.listen(PORT, () => {
  console.log(`🌐 WebApp & API Server running on port ${PORT}`);
  console.log(`👉 WebApp URL: http://localhost:${PORT}`);
});
