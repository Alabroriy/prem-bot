import os
import sys
import json
import time
import threading
import http.server
import socketserver
import urllib.parse
import urllib.request
from pathlib import Path

# Ensure UTF-8 output on Windows console
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass


# Load environment variables
def load_env():
    env_path = Path('.env')
    if env_path.exists():
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    k, v = line.split('=', 1)
                    os.environ[k.strip()] = v.strip()

load_env()

BOT_TOKEN = os.getenv('BOT_TOKEN', '8783132884:AAGWFy50PWOhSnDEYfTCOMLyTTdsys1ukDw')
PORT = int(os.getenv('PORT', 3000))
WEBAPP_URL = os.getenv('WEBAPP_URL', f'http://localhost:{PORT}')
FRAGMENT_API_URL = os.getenv('FRAGMENT_API_URL', 'https://fragment-api.uz/api')
FRAGMENT_API_KEY = os.getenv('FRAGMENT_API_KEY', 'demo_key')
ADMIN_CHAT_ID = os.getenv('ADMIN_CHAT_ID', '')

# Catalog Definition
CATALOG = {
    "stars": [
        {"id": "stars_50", "title": "50 Telegram Stars", "count": 50, "price": 15000, "price_formatted": "15,000 UZS", "badge": "Mashhur"},
        {"id": "stars_100", "title": "100 Telegram Stars", "count": 100, "price": 29000, "price_formatted": "29,000 UZS", "badge": None},
        {"id": "stars_250", "title": "250 Telegram Stars", "count": 250, "price": 69000, "price_formatted": "69,000 UZS", "badge": "Foydali"},
        {"id": "stars_500", "title": "500 Telegram Stars", "count": 500, "price": 135000, "price_formatted": "135,000 UZS", "badge": "Top Seller"},
        {"id": "stars_1000", "title": "1,000 Telegram Stars", "count": 1000, "price": 265000, "price_formatted": "265,000 UZS", "badge": None},
        {"id": "stars_2500", "title": "2,500 Telegram Stars", "count": 2500, "price": 650000, "price_formatted": "650,000 UZS", "badge": "VIP"},
        {"id": "stars_5000", "title": "5,000 Telegram Stars", "count": 5000, "price": 1290000, "price_formatted": "1,290,000 UZS", "badge": "Mega Pack"}
    ],
    "premium": [
        {"id": "prem_3m", "title": "3 Oylik Telegram Premium", "months": 3, "price": 145000, "price_formatted": "145,000 UZS", "desc": "4GB fayl yuklash, Cheksiz bulut, Badge va Exo stikerlar"},
        {"id": "prem_6m", "title": "6 Oylik Telegram Premium", "months": 6, "price": 245000, "price_formatted": "245,000 UZS", "badge": "Chegirma 15%", "desc": "Ovozli xabarlarni matnga aylantirish + Eksklyuziv funksiyalar"},
        {"id": "prem_12m", "title": "12 Oylik Telegram Premium (1 Yil)", "months": 12, "price": 420000, "price_formatted": "420,000 UZS", "badge": "Eng Kam Xarajat 40%", "desc": "1 Yillik maksimal imkoniyatlar to'plami"}
    ],
    "gifts": [
        {"id": "gift_star_cake", "title": "Star Birthday Cake", "category": "NFT Gift", "rarity": "Rare", "price": 95000, "price_formatted": "95,000 UZS", "icon": "🎂"},
        {"id": "gift_golden_crown", "title": "Golden Imperial Crown", "category": "NFT Gift", "rarity": "Legendary", "price": 350000, "price_formatted": "350,000 UZS", "icon": "👑"},
        {"id": "gift_diamond_ring", "title": "Fragment Diamond Ring", "category": "NFT Gift", "rarity": "Epic", "price": 210000, "price_formatted": "210,000 UZS", "icon": "💍"},
        {"id": "gift_cyber_rocket", "title": "Cyber Rocket Booster", "category": "NFT Gift", "rarity": "Uncommon", "price": 120000, "price_formatted": "120,000 UZS", "icon": "🚀"}
    ],
    "numbers": [
        {"id": "num_888_0192", "number": "+888 0192 8841", "status": "Available", "type": "Fragment Anonymous", "price": 490000, "price_formatted": "490,000 UZS"},
        {"id": "num_888_7749", "number": "+888 7749 1102", "status": "Available", "type": "Fragment Anonymous", "price": 590000, "price_formatted": "590,000 UZS"},
        {"id": "num_888_9900", "number": "+888 9900 3344", "status": "Available", "type": "Fragment VIP Number", "price": 1200000, "price_formatted": "1,200,000 UZS"},
        {"id": "num_888_5555", "number": "+888 5555 7788", "status": "Available", "type": "Fragment Ultra VIP", "price": 2500000, "price_formatted": "2,500,000 UZS"}
    ]
}

# Send Message via Telegram API
def send_telegram_msg(chat_id, text):
    if not BOT_TOKEN or not chat_id:
        return
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    payload = json.dumps({
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "HTML"
    }).encode('utf-8')
    req = urllib.request.Request(url, data=payload, headers={'Content-Type': 'application/json'})
    try:
        urllib.request.urlopen(req)
    except Exception as e:
        print(f"Telegram notify error: {e}")

# Fragment API Uzbekistan Helper
def fragment_api_call(endpoint, data):
    if not FRAGMENT_API_KEY or FRAGMENT_API_KEY in ['demo_key', 'your_fragment_api_key_here']:
        print(f"[FRAGMENT API SANDBOX] Request to {endpoint}: {data}")
        return {
            "success": True,
            "sandbox": True,
            "order_id": f"FRAG-{int(time.time()*1000)}",
            "message": "Sandbox mode: fragment-api.uz ga so'rov o'rniga namuna javob qaytarildi."
        }
    
    url = f"{FRAGMENT_API_URL.rstrip('/')}/{endpoint.lstrip('/')}"
    headers = {
        'Authorization': f'Bearer {FRAGMENT_API_KEY}',
        'Content-Type': 'application/json'
    }
    req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            res_data = json.loads(resp.read().decode('utf-8'))
            return {"success": True, "data": res_data}
    except Exception as e:
        return {"success": False, "error": str(e)}

# HTTP Handler for Static Files & API
class WebAppRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory="public", **kwargs)

    def do_GET(self):
        if self.path == '/api/catalog':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({"success": True, "catalog": CATALOG}).encode('utf-8'))
            return
        
        return super().do_GET()

    def do_POST(self):
        if self.path == '/api/checkout':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            body = json.loads(post_data.decode('utf-8'))

            category = body.get('category')
            item_id = body.get('itemId')
            target_username = body.get('targetUsername', '').replace('@', '').strip()
            user_chat_id = body.get('userChatId')

            if not category or not item_id or not target_username:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "message": "Ma'lumotlar to'liq emas"}).encode('utf-8'))
                return

            order_summary = {"target_username": target_username}
            result = {"success": True}

            if category == 'stars':
                product = next((p for p in CATALOG['stars'] if p['id'] == item_id), None)
                if product:
                    order_summary['service_name'] = product['title']
                    order_summary['price_formatted'] = product['price_formatted']
                    frag_res = fragment_api_call('stars/buy', {"username": target_username, "quantity": product['count']})
                    order_summary['order_id'] = frag_res.get('order_id', f"STARS-{int(time.time())}")
            
            elif category == 'premium':
                product = next((p for p in CATALOG['premium'] if p['id'] == item_id), None)
                if product:
                    order_summary['service_name'] = product['title']
                    order_summary['price_formatted'] = product['price_formatted']
                    frag_res = fragment_api_call('premium/buy', {"username": target_username, "months": product['months']})
                    order_summary['order_id'] = frag_res.get('order_id', f"PREM-{int(time.time())}")
            
            elif category == 'gifts':
                product = next((p for p in CATALOG['gifts'] if p['id'] == item_id), None)
                if product:
                    order_summary['service_name'] = product['title']
                    order_summary['price_formatted'] = product['price_formatted']
                    order_summary['order_id'] = f"GIFT-{int(time.time())}"
            
            elif category == 'numbers':
                product = next((p for p in CATALOG['numbers'] if p['id'] == item_id), None)
                if product:
                    order_summary['service_name'] = f"Telegram Number: {product['number']}"
                    order_summary['price_formatted'] = product['price_formatted']
                    order_summary['order_id'] = f"NUM-{int(time.time())}"

            # Telegram notification
            if user_chat_id:
                notify_text = (
                    f"🎉 <b>Xarid muvaffaqiyatli amalga oshirildi!</b>\n\n"
                    f"📦 <b>Xizmat:</b> {order_summary.get('service_name')}\n"
                    f"👤 <b>Qabul qiluvchi:</b> @{order_summary.get('target_username')}\n"
                    f"💰 <b>Summa:</b> {order_summary.get('price_formatted')}\n"
                    f"🆔 <b>Order ID:</b> <code>{order_summary.get('order_id')}</code>\n\n"
                    f"<i>fragment-api.uz tizimi orqali ishlandi. Rahmat!</i>"
                )
                send_telegram_msg(user_chat_id, notify_text)

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"success": True, "order": order_summary}).encode('utf-8'))
            return

        self.send_response(404)
        self.end_headers()

# Telegram Bot Polling Worker
def run_telegram_bot():
    if not BOT_TOKEN:
        return

    print("🤖 Telegram Bot Polling ishga tushdi...")
    offset = 0
    while True:
        try:
            url = f"https://api.telegram.org/bot{BOT_TOKEN}/getUpdates?offset={offset}&timeout=30"
            req = urllib.request.Request(url)
            with urllib.request.urlopen(req, timeout=35) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                if data.get('ok') and data.get('result'):
                    for update in data['result']:
                        offset = update['update_id'] + 1
                        message = update.get('message')
                        if message and 'text' in message:
                            text = message['text']
                            chat_id = message['chat']['id']
                            first_name = message.get('from', {}).get('first_name', 'Foydalanuvchi')

                            if text == '/start':
                                welcome = (
                                    f"👋 <b>Salom, {first_name}!</b>\n\n"
                                    f"🚀 <b>Telegram Digital Store Botiga xush kelibsiz!</b>\n\n"
                                    f"⭐️ <b>Telegram Stars</b> — Avtomatik instant yulduzlar\n"
                                    f"👑 <b>Telegram Premium</b> — 3, 6, 12 oylik obunalar\n"
                                    f"🎁 <b>Telegram Gifts</b> — Eksklyuziv sovg'alar\n"
                                    f"📱 <b>Telegram Numbers</b> — Anonymous (+888) raqamlar\n\n"
                                    f"⚡️ Premium va Stars <b>fragment-api.uz</b> API tizimi orqali taqdim etiladi.\n\n"
                                    f"👇 Xaridlarni bajarish uchun pastdagi <b>Web App</b> tugmasini bosing:"
                                )
                                payload = json.dumps({
                                    "chat_id": chat_id,
                                    "text": welcome,
                                    "parse_mode": "HTML",
                                    "reply_markup": {
                                        "inline_keyboard": [[
                                            {"text": "🛍 Do'konni Ochish (Web App)", "web_app": {"url": WEBAPP_URL}}
                                        ]]
                                    }
                                }).encode('utf-8')
                                req_send = urllib.request.Request(f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage", data=payload, headers={'Content-Type': 'application/json'})
                                urllib.request.urlopen(req_send)

        except Exception as e:
            time.sleep(3)

if __name__ == '__main__':
    # Start bot polling in background thread
    bot_thread = threading.Thread(target=run_telegram_bot, daemon=True)
    bot_thread.start()

    # Start Web App HTTP Server
    server_address = ('', PORT)
    httpd = socketserver.TCPServer(server_address, WebAppRequestHandler)
    print(f"🌐 Telegram WebApp server ishga tushdi: http://localhost:{PORT}")
    print(f"🔑 Bot Token: {BOT_TOKEN[:15]}...")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer to'xtatildi.")
