/* ==========================================================================
   BHARATHOST — ENTERPRISE CLIENT APPLICATION LOGIC
   Domain Search Engine, Cart System, Pricing Engine, and Checkout Flow
   ========================================================================== */

// --- STATE MANAGEMENT ---
const AppState = {
  cart: [],
  promoDiscount: 0,
  promoCode: '',
  activeBillingCycle: 'yearly', // 'monthly', 'yearly', 'triennial'
  pricingData: {
    starter: { monthly: 149, yearly: 99, triennial: 69, renew: { monthly: 149, yearly: 149, triennial: 149 } },
    business: { monthly: 299, yearly: 199, triennial: 149, renew: { monthly: 299, yearly: 299, triennial: 299 } },
    cloud: { monthly: 599, yearly: 399, triennial: 299, renew: { monthly: 599, yearly: 599, triennial: 599 } }
  },
  tldPrices: {
    '.in': { price: 399, renew: 599, tag: 'India Top Choice' },
    '.com': { price: 899, renew: 1199, tag: 'Global Standard' },
    '.co.in': { price: 299, renew: 499, tag: 'Best Value' },
    '.online': { price: 99, renew: 799, tag: '85% OFF' },
    '.store': { price: 149, renew: 899, tag: 'E-Commerce' },
    '.org': { price: 799, renew: 999, tag: 'Trust / NGO' }
  }
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  initNavbarScroll();
  initBillingPrices();
});

// --- NAVBAR & MOBILE DRAWER ---
function initNavbarScroll() {
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });
}

function toggleMobileNav() {
  const drawer = document.getElementById('mobile-drawer');
  const backdrop = document.getElementById('backdrop');
  drawer.classList.toggle('open');
  backdrop.classList.toggle('open');
}

function closeAllDrawers() {
  document.getElementById('mobile-drawer').classList.remove('open');
  document.getElementById('cart-drawer').classList.remove('open');
  document.getElementById('backdrop').classList.remove('open');
}

// --- DOMAIN SEARCH ENGINE ---
function quickFillTLD(tld) {
  const tldSelect = document.getElementById('tld-select');
  if (tldSelect) {
    tldSelect.value = tld;
  }
  const input = document.getElementById('domain-input');
  if (input) {
    input.focus();
    if (input.value.trim() !== '') {
      handleSearch();
    }
  }
}

function handleSearch(event) {
  if (event) event.preventDefault();

  const input = document.getElementById('domain-input');
  const rawQuery = input.value.trim().toLowerCase().replace(/https?:\/\//g, '').replace(/www\./g, '');

  if (!rawQuery) {
    showToast('⚠️ Please enter a domain name to search');
    input.focus();
    return;
  }

  // Sanitize query
  let baseName = rawQuery;
  let selectedTLD = document.getElementById('tld-select').value || '.in';

  // If user typed extension directly (e.g. jaipurcrafts.com)
  for (const ext in AppState.tldPrices) {
    if (rawQuery.endsWith(ext)) {
      baseName = rawQuery.replace(ext, '');
      selectedTLD = ext;
      document.getElementById('tld-select').value = ext;
      break;
    }
  }

  // Remove trailing dots or special characters
  baseName = baseName.replace(/[^a-z0-9-]/g, '');

  if (baseName.length < 2) {
    showToast('⚠️ Domain name must be at least 2 characters');
    return;
  }

  const fullDomain = baseName + selectedTLD;
  const tldInfo = AppState.tldPrices[selectedTLD] || { price: 399, renew: 599 };

  // Generate suggestions
  const suggestions = [
    { domain: `${baseName}.co.in`, price: 299, tld: '.co.in' },
    { domain: `${baseName}.in`, price: 399, tld: '.in' },
    { domain: `${baseName}.com`, price: 899, tld: '.com' },
    { domain: `get${baseName}.in`, price: 399, tld: '.in' },
    { domain: `${baseName}.online`, price: 99, tld: '.online' },
    { domain: `${baseName}.store`, price: 149, tld: '.store' }
  ].filter(s => s.domain !== fullDomain).slice(0, 4);

  const resultCard = document.getElementById('domain-result-card');
  resultCard.style.display = 'block';

  resultCard.innerHTML = `
    <div class="domain-result-main">
      <div class="result-info">
        <div class="result-status-badge">✓ Available for Registration</div>
        <div class="result-domain-name">${fullDomain}</div>
        <div style="font-size: 13px; color: #16A34A; margin-top: 4px;">
          🛡️ Includes Free Lifetime WHOIS Privacy &amp; 2-Step Domain Locking
        </div>
      </div>
      <div class="result-pricing-box">
        <div class="result-price-main">₹${tldInfo.price}<small style="font-size: 14px; font-weight: 500; color: #64748B;"> /1st yr</small></div>
        <div class="result-price-sub">Renews at ₹${tldInfo.renew}/yr &bull; Plus Taxes</div>
      </div>
      <div class="result-actions">
        <button class="btn-add-cart-large" onclick="addToCart('${fullDomain}', ${tldInfo.price}, 'domain')">
          Add to Cart 🛒
        </button>
      </div>
    </div>

    <div class="result-suggestions">
      <div class="suggestions-title">💡 Popular Available Alternatives for ${baseName}:</div>
      <div class="suggestions-grid">
        ${suggestions.map(s => `
          <div class="suggest-item">
            <div>
              <span class="suggest-name">${s.domain}</span>
              <span class="suggest-price"> — ₹${s.price}/yr</span>
            </div>
            <button class="btn-add-mini" onclick="addToCart('${s.domain}', ${s.price}, 'domain')">+ Add</button>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  // Scroll smoothly to results
  resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  showToast(`🎉 ${fullDomain} is available!`);
}

// --- BILLING CYCLE & PRICING ENGINE ---
function setBillingCycle(cycle) {
  AppState.activeBillingCycle = cycle;

  // Update active buttons
  document.querySelectorAll('.billing-toggle .toggle-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.cycle === cycle);
  });

  initBillingPrices();
}

function initBillingPrices() {
  const cycle = AppState.activeBillingCycle;
  const p = AppState.pricingData;

  // Starter
  document.getElementById('price-starter').innerText = p.starter[cycle];
  document.getElementById('renew-starter').innerText = 
    cycle === 'yearly' ? 'Renews at ₹149/mo • Billed ₹1,188/yr' :
    cycle === 'triennial' ? 'Renews at ₹149/mo • Billed ₹2,484/3yrs (Best Value)' :
    'Renews at ₹149/mo • Monthly Billing';

  // Business
  document.getElementById('price-business').innerText = p.business[cycle];
  document.getElementById('renew-business').innerText = 
    cycle === 'yearly' ? 'Renews at ₹299/mo • Free Domain Included' :
    cycle === 'triennial' ? 'Renews at ₹299/mo • Billed ₹5,364/3yrs (Save ₹5,400)' :
    'Renews at ₹299/mo • Monthly Billing';

  // Cloud
  document.getElementById('price-cloud').innerText = p.cloud[cycle];
  document.getElementById('renew-cloud').innerText = 
    cycle === 'yearly' ? 'Renews at ₹599/mo • Dedicated Resources' :
    cycle === 'triennial' ? 'Renews at ₹599/mo • Billed ₹10,764/3yrs' :
    'Renews at ₹599/mo • Monthly Billing';
}

function addHostingToCart(planName, planKey) {
  const cycle = AppState.activeBillingCycle;
  const monthlyRate = AppState.pricingData[planKey][cycle];
  
  let durationText = '1 Year (12 Months)';
  let totalAmount = monthlyRate * 12;

  if (cycle === 'monthly') {
    durationText = '1 Month';
    totalAmount = monthlyRate;
  } else if (cycle === 'triennial') {
    durationText = '3 Years (36 Months)';
    totalAmount = monthlyRate * 36;
  }

  addToCart(`${planName} (${durationText})`, totalAmount, 'hosting');
}

// --- SHOPPING CART SYSTEM ---
function addToCart(title, price, type) {
  // Check if item already exists
  const existingIndex = AppState.cart.findIndex(item => item.title === title);
  if (existingIndex > -1) {
    showToast(`🛒 ${title} is already in your cart!`);
    openCart();
    return;
  }

  AppState.cart.push({
    id: Date.now() + Math.random(),
    title: title,
    price: price,
    type: type
  });

  updateCartUI();
  openCart();
  showToast(`✓ Added ${title} to Cart!`);
}

function removeFromCart(id) {
  AppState.cart = AppState.cart.filter(item => item.id !== id);
  updateCartUI();
  showToast('Item removed from cart');
}

function openCart() {
  document.getElementById('cart-drawer').classList.add('open');
  document.getElementById('backdrop').classList.add('open');
}

function closeCart() {
  document.getElementById('cart-drawer').classList.remove('open');
  document.getElementById('backdrop').classList.remove('open');
}

function updateCartUI() {
  const count = AppState.cart.length;

  // Header & Mobile badges
  document.getElementById('header-cart-count').innerText = count;
  document.getElementById('drawer-cart-count').innerText = `${count} ${count === 1 ? 'item' : 'items'}`;
  const mobCount = document.getElementById('mob-cart-count');
  if (mobCount) mobCount.innerText = count;

  const emptyState = document.getElementById('empty-cart-state');
  const itemsList = document.getElementById('cart-items-list');
  const footer = document.getElementById('cart-drawer-footer');

  if (count === 0) {
    emptyState.style.display = 'block';
    itemsList.style.display = 'none';
    footer.style.display = 'none';
    return;
  }

  emptyState.style.display = 'none';
  itemsList.style.display = 'flex';
  footer.style.display = 'block';

  // Render items
  itemsList.innerHTML = AppState.cart.map(item => `
    <div class="cart-item-row">
      <div class="cart-item-details">
        <strong>${item.title}</strong>
        <span>${item.type === 'domain' ? '1 Year Registration &bull; Free WHOIS Privacy' : 'NVMe Cloud Hosting &bull; Free SSL'}</span>
      </div>
      <div class="cart-item-pricing">
        <div class="cart-item-price">₹${item.price.toLocaleString('en-IN')}</div>
        <button class="cart-remove-btn" onclick="removeFromCart(${item.id})">Remove</button>
      </div>
    </div>
  `).join('');

  // Calculations
  const subtotal = AppState.cart.reduce((sum, item) => sum + item.price, 0);
  const discountAmount = Math.round(subtotal * AppState.promoDiscount);
  const discountedSubtotal = subtotal - discountAmount;
  const gstTax = Math.round(discountedSubtotal * 0.18);
  const total = discountedSubtotal + gstTax;

  document.getElementById('cart-subtotal').innerText = `₹${subtotal.toLocaleString('en-IN')}`;

  const discountRow = document.getElementById('discount-row');
  if (AppState.promoDiscount > 0) {
    discountRow.style.display = 'flex';
    document.getElementById('cart-discount').innerText = `-₹${discountAmount.toLocaleString('en-IN')}`;
  } else {
    discountRow.style.display = 'none';
  }

  document.getElementById('cart-tax').innerText = `₹${gstTax.toLocaleString('en-IN')}`;
  document.getElementById('cart-total').innerText = `₹${total.toLocaleString('en-IN')}`;
}

// --- PROMO CODE ENGINE ---
function applyPromo() {
  const input = document.getElementById('promo-input');
  const code = input.value.trim().toUpperCase();
  const msg = document.getElementById('promo-msg');

  if (!code) {
    msg.innerHTML = '<span style="color: #DC2626;">Please enter a promo code</span>';
    return;
  }

  if (code === 'BHARAT10') {
    AppState.promoDiscount = 0.10;
    AppState.promoCode = 'BHARAT10';
    msg.innerHTML = '<span class="text-green">✓ BHARAT10 Applied! 10% Instant Discount</span>';
    updateCartUI();
    showToast('🎉 10% Discount Applied!');
  } else if (code === 'FIRSTBUY') {
    AppState.promoDiscount = 0.15;
    AppState.promoCode = 'FIRSTBUY';
    msg.innerHTML = '<span class="text-green">✓ FIRSTBUY Applied! 15% Welcome Discount</span>';
    updateCartUI();
    showToast('🎉 15% Discount Applied!');
  } else {
    msg.innerHTML = '<span style="color: #DC2626;">Invalid promo code. Try: BHARAT10</span>';
  }
}

// --- CHECKOUT MODAL & PAYMENT SIMULATION ---
function openCheckoutModal() {
  if (AppState.cart.length === 0) {
    showToast('⚠️ Your cart is empty');
    return;
  }

  const subtotal = AppState.cart.reduce((sum, item) => sum + item.price, 0);
  const discountAmount = Math.round(subtotal * AppState.promoDiscount);
  const discountedSubtotal = subtotal - discountAmount;
  const gstTax = Math.round(discountedSubtotal * 0.18);
  const total = discountedSubtotal + gstTax;

  document.getElementById('modal-total-amount').innerText = `₹${total.toLocaleString('en-IN')}`;

  closeCart();
  document.getElementById('checkout-modal').classList.add('open');
}

function closeCheckoutModal() {
  document.getElementById('checkout-modal').classList.remove('open');
}

function switchPayTab(tabName, el) {
  document.querySelectorAll('.payment-tabs .pay-tab').forEach(t => t.classList.remove('active'));
  if (el) el.classList.add('active');

  document.getElementById('pay-tab-upi').style.display = tabName === 'upi' ? 'block' : 'none';
  document.getElementById('pay-tab-card').style.display = tabName === 'card' ? 'block' : 'none';
  document.getElementById('pay-tab-netbanking').style.display = tabName === 'netbanking' ? 'block' : 'none';
}

function simulatePaymentSuccess() {
  closeCheckoutModal();
  showToast('🎉 Payment Verified! Welcome to BharatHost! Checking domain...');
  
  setTimeout(() => {
    alert('✅ ORDER SUCCESSFUL!\n\nThank you for choosing BharatHost.\nYour domain & hosting credentials have been generated.\nOfficial GST Tax Invoice has been sent to your email.');
    AppState.cart = [];
    AppState.promoDiscount = 0;
    updateCartUI();
  }, 1000);
}

// --- LOGIN MODAL ---
function openLoginModal() {
  document.getElementById('login-modal').classList.add('open');
}

function closeLoginModal() {
  document.getElementById('login-modal').classList.remove('open');
}

function handleLogin(event) {
  event.preventDefault();
  closeLoginModal();
  showToast('✓ Logged in successfully to BharatHost cPanel & Portal!');
}

// --- FAQ ACCORDION ---
function toggleFaq(btn) {
  const item = btn.parentElement;
  const isActive = item.classList.contains('active');

  document.querySelectorAll('.faq-item').forEach(i => {
    i.classList.remove('active');
    const chevron = i.querySelector('.faq-chevron');
    if (chevron) chevron.innerText = '+';
  });

  if (!isActive) {
    item.classList.add('active');
    const chevron = item.querySelector('.faq-chevron');
    if (chevron) chevron.innerText = '−';
  }
}

// --- TOAST NOTIFICATION ---
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.innerText = message;
  toast.classList.add('show');
  
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}
