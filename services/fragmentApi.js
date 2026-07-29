const axios = require('axios');

/**
 * Service handler for fragment-api.uz
 * Connects to Fragment API Uzbekistan for Telegram Stars & Premium purchases
 */
class FragmentApiService {
  constructor() {
    this.baseUrl = process.env.FRAGMENT_API_URL || 'https://fragment-api.uz/api';
    this.apiKey = process.env.FRAGMENT_API_KEY || '';
  }

  /**
   * Get HTTP Client with headers configured
   */
  getClient() {
    return axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 15000
    });
  }

  /**
   * Buy Telegram Premium via fragment-api.uz
   * @param {string} username - Target Telegram username (without @ or with @)
   * @param {number} months - 3, 6, or 12 months
   */
  async buyPremium(username, months) {
    const cleanUsername = username.replace(/^@/, '');
    
    // Check if running in sandbox/demo mode
    if (!this.apiKey || this.apiKey === 'demo_key' || this.apiKey === 'your_fragment_api_key_here') {
      console.log(`[FRAGMENT API - SANDBOX] Premium order for @${cleanUsername} (${months} months)`);
      return {
        success: true,
        sandbox: true,
        order_id: `PREM-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        status: 'completed',
        username: cleanUsername,
        service: 'premium',
        months: months,
        message: 'Sandbox rejada: Telegram Premium muvaffaqiyatli rasmiylashtirildi (API kalit kiritilsa fragment-api.uz ga yuboriladi).'
      };
    }

    try {
      const response = await this.getClient().post('/premium/buy', {
        username: cleanUsername,
        months: parseInt(months)
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('[FRAGMENT API ERROR - PREMIUM]:', error.response ? error.response.data : error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'fragment-api.uz serveri bilan ulanishda xatolik'
      };
    }
  }

  /**
   * Buy Telegram Stars via fragment-api.uz
   * @param {string} username - Target Telegram username
   * @param {number} starsCount - Amount of stars (e.g. 50, 100, 500, 1000)
   */
  async buyStars(username, starsCount) {
    const cleanUsername = username.replace(/^@/, '');
    
    if (!this.apiKey || this.apiKey === 'demo_key' || this.apiKey === 'your_fragment_api_key_here') {
      console.log(`[FRAGMENT API - SANDBOX] Stars order for @${cleanUsername} (${starsCount} stars)`);
      return {
        success: true,
        sandbox: true,
        order_id: `STARS-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        status: 'completed',
        username: cleanUsername,
        service: 'stars',
        stars: starsCount,
        message: 'Sandbox rejada: Telegram Stars muvaffaqiyatli yuborildi (API kalit kiritilsa fragment-api.uz ga yuboriladi).'
      };
    }

    try {
      const response = await this.getClient().post('/stars/buy', {
        username: cleanUsername,
        quantity: parseInt(starsCount)
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('[FRAGMENT API ERROR - STARS]:', error.response ? error.response.data : error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'fragment-api.uz yulduzlar API bilan ulanishda xatolik'
      };
    }
  }

  /**
   * Check order status from fragment-api.uz
   */
  async getOrderStatus(orderId) {
    if (!this.apiKey || this.apiKey === 'demo_key') {
      return { success: true, status: 'completed', sandbox: true };
    }
    try {
      const response = await this.getClient().get(`/order/status/${orderId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = new FragmentApiService();
