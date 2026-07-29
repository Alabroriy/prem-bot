// Telegram WebApp Client Logic
let tg = window.Telegram?.WebApp;

// App State
let catalogData = null;
let selectedCategory = null;
let selectedItem = null;

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Telegram WebApp SDK
  if (tg) {
    tg.ready();
    tg.expand();

    // Apply Telegram Theme Colors if available
    if (tg.setHeaderColor) {
      tg.setHeaderColor('#090d16');
    }
  }

  initUserInfo();
  initTabNavigation();
  fetchCatalog();
  initModalHandlers();
});

/**
 * Extract Telegram user context
 */
function initUserInfo() {
  const userNameEl = document.getElementById('userName');
  const userTagEl = document.getElementById('userTag');
  const userAvatarEl = document.getElementById('userAvatar');
  const targetUsernameInput = document.getElementById('targetUsernameInput');

  if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
    const u = tg.initDataUnsafe.user;
    userNameEl.textContent = `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'Foydalanuvchi';
    userTagEl.textContent = u.username ? `@${u.username}` : 'Username yo\'q';
    userAvatarEl.textContent = (u.first_name || 'U').charAt(0).toUpperCase();
    
    if (u.username) {
      targetUsernameInput.value = u.username;
    }
  } else {
    userNameEl.textContent = 'Mijoz';
    userTagEl.textContent = '@mehmons';
    userAvatarEl.textContent = 'M';
  }
}

/**
 * Handle Bottom / Top Tab Switching
 */
function initTabNavigation() {
  const tabs = document.querySelectorAll('.nav-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      triggerHaptic();

      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const targetTab = tab.getAttribute('data-tab');
      document.querySelectorAll('.catalog-section').forEach(sec => sec.classList.remove('active'));

      const activeSec = document.getElementById(`sec-${targetTab}`);
      if (activeSec) {
        activeSec.classList.add('active');
      }
    });
  });
}

/**
 * Fetch Catalog Data from Server
 */
async function fetchCatalog() {
  try {
    const res = await fetch('/api/catalog');
    const data = await res.json();
    if (data.success) {
      catalogData = data.catalog;
      renderStars(catalogData.stars);
      renderPremium(catalogData.premium);
      renderGifts(catalogData.gifts);
      renderNumbers(catalogData.numbers);
    }
  } catch (err) {
    console.error('Catalog fetch error:', err);
    showToast('Katalog ma\'lumotlarini yuklashda xatolik');
  }
}

/**
 * Render Stars Cards
 */
function renderStars(items) {
  const container = document.getElementById('starsGrid');
  if (!items || !container) return;

  container.innerHTML = items.map(item => `
    <div class="card-item" onclick="openCheckout('stars', '${item.id}')">
      ${item.badge ? `<span class="card-badge">${item.badge}</span>` : ''}
      <div class="card-icon">⭐️</div>
      <div class="card-title">${item.title}</div>
      <div class="card-desc">Instantly delivered to username</div>
      <div class="card-footer">
        <span class="card-price">${item.price_formatted}</span>
        <button class="buy-btn-sm">Olish</button>
      </div>
    </div>
  `).join('');
}

/**
 * Render Premium Cards
 */
function renderPremium(items) {
  const container = document.getElementById('premiumGrid');
  if (!items || !container) return;

  container.innerHTML = items.map(item => `
    <div class="card-item" onclick="openCheckout('premium', '${item.id}')">
      ${item.badge ? `<span class="card-badge">${item.badge}</span>` : ''}
      <div style="display:flex; align-items:center; gap:12px; margin-bottom:8px;">
        <div class="card-icon" style="margin:0;">👑</div>
        <div>
          <div class="card-title">${item.title}</div>
          <div class="card-desc" style="margin:0;">${item.desc}</div>
        </div>
      </div>
      <div class="card-footer">
        <span class="card-price">${item.price_formatted}</span>
        <button class="buy-btn-sm">Rasmiylashtirish</button>
      </div>
    </div>
  `).join('');
}

/**
 * Render Gifts Cards
 */
function renderGifts(items) {
  const container = document.getElementById('giftsGrid');
  if (!items || !container) return;

  container.innerHTML = items.map(item => `
    <div class="card-item" onclick="openCheckout('gifts', '${item.id}')">
      <span class="card-badge">${item.rarity}</span>
      <div class="card-icon">${item.icon}</div>
      <div class="card-title">${item.title}</div>
      <div class="card-desc">${item.category}</div>
      <div class="card-footer">
        <span class="card-price">${item.price_formatted}</span>
        <button class="buy-btn-sm">Sovg'a qilish</button>
      </div>
    </div>
  `).join('');
}

/**
 * Render Numbers Cards
 */
function renderNumbers(items) {
  const container = document.getElementById('numbersGrid');
  if (!items || !container) return;

  container.innerHTML = items.map(item => `
    <div class="card-item" onclick="openCheckout('numbers', '${item.id}')">
      <span class="card-badge">${item.status}</span>
      <div style="display:flex; align-items:center; gap:12px; margin-bottom:8px;">
        <div class="card-icon" style="margin:0;">📱</div>
        <div>
          <div class="card-title">${item.number}</div>
          <div class="card-desc" style="margin:0;">${item.type}</div>
        </div>
      </div>
      <div class="card-footer">
        <span class="card-price">${item.price_formatted}</span>
        <button class="buy-btn-sm">Sotib olish</button>
      </div>
    </div>
  `).join('');
}

/**
 * Open Checkout Modal Sheet
 */
function openCheckout(category, itemId) {
  triggerHaptic();

  if (!catalogData) return;

  selectedCategory = category;
  selectedItem = catalogData[category].find(i => i.id === itemId);

  if (!selectedItem) return;

  const modal = document.getElementById('checkoutModal');
  const modalProdName = document.getElementById('modalProdName');
  const modalProdPrice = document.getElementById('modalProdPrice');
  const modalProdIcon = document.getElementById('modalProdIcon');

  modalProdName.textContent = selectedItem.title || selectedItem.number;
  modalProdPrice.textContent = selectedItem.price_formatted;

  if (category === 'stars') modalProdIcon.textContent = '⭐️';
  else if (category === 'premium') modalProdIcon.textContent = '👑';
  else if (category === 'gifts') modalProdIcon.textContent = selectedItem.icon || '🎁';
  else if (category === 'numbers') modalProdIcon.textContent = '📱';

  modal.classList.add('active');
}

/**
 * Init Modal Handlers
 */
function initModalHandlers() {
  const modal = document.getElementById('checkoutModal');
  const closeModalBtn = document.getElementById('closeModal');
  const confirmPayBtn = document.getElementById('confirmPayBtn');

  closeModalBtn.addEventListener('click', () => {
    modal.classList.remove('active');
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
    }
  });

  confirmPayBtn.addEventListener('click', handleConfirmPurchase);
}

/**
 * Process Purchase Action
 */
async function handleConfirmPurchase() {
  triggerHaptic();

  const targetUsernameInput = document.getElementById('targetUsernameInput');
  const targetUsername = targetUsernameInput.value.trim();

  if (!targetUsername) {
    showToast('Iltimos, Telegram username kiriting!');
    return;
  }

  const confirmBtn = document.getElementById('confirmPayBtn');
  confirmBtn.disabled = true;
  confirmBtn.innerHTML = '<span>Jarayonda...</span>';

  const userChatId = tg?.initDataUnsafe?.user?.id || null;

  try {
    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: selectedCategory,
        itemId: selectedItem.id,
        targetUsername: targetUsername,
        userChatId: userChatId
      })
    });

    const data = await response.json();

    if (data.success) {
      showToast('🎉 Buyurtma muvaffaqiyatli qabul qilindi!');
      
      // Send WebApp Data back to Telegram Bot if inside Telegram
      if (tg && tg.sendData) {
        tg.sendData(JSON.stringify(data.order));
      }

      document.getElementById('checkoutModal').classList.remove('active');
    } else {
      showToast('❌ Xatolik: ' + (data.message || 'Xarid bajarilmadi'));
    }
  } catch (err) {
    console.error('Checkout API error:', err);
    showToast('Server bilan bog\'lanishda xatolik yuz berdi');
  } finally {
    confirmBtn.disabled = false;
    confirmBtn.innerHTML = '<span>Xarid Qilish</span><span class="btn-arrow">→</span>';
  }
}

/**
 * Haptic Feedback Helper
 */
function triggerHaptic() {
  if (tg && tg.HapticFeedback) {
    tg.HapticFeedback.impactOccurred('medium');
  }
}

/**
 * Show Toast Notification
 */
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}
