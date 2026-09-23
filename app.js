// ===== NAVBAR SCROLL =====
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  if (window.scrollY > 40) navbar.classList.add('scrolled');
  else navbar.classList.remove('scrolled');
});

// ===== HAMBURGER MENU =====
const hamburger = document.getElementById('hamburger-btn');
const mobileMenu = document.getElementById('mobile-menu');
hamburger.addEventListener('click', () => {
  mobileMenu.classList.toggle('open');
});
mobileMenu.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => mobileMenu.classList.remove('open'));
});

// ===== SEARCH TABS =====
document.querySelectorAll('.search-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.search-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const placeholders = {
      'tab-domain': 'yourbuisness.in — check availability!',
      'tab-transfer': 'Enter domain to transfer (e.g. mybusiness.com)',
      'tab-whois': 'Enter domain for WHOIS lookup'
    };
    const btn = { 'tab-domain': 'Search', 'tab-transfer': 'Transfer', 'tab-whois': 'Lookup' };
    document.getElementById('domain-input').placeholder = placeholders[tab.id] || '';
    document.getElementById('search-btn').textContent = btn[tab.id] || 'Search';
  });
});

// ===== DOMAIN SEARCH SIMULATION =====
const DOMAIN_PRICES = {
  '.in': 299, '.com': 699, '.co.in': 399,
  '.net': 799, '.org': 799, '.store': 499,
  '.online': 349, '.shop': 549
};
// Simulate availability (random for demo, real version uses API)
const TAKEN = ['google', 'facebook', 'amazon', 'flipkart', 'zomato', 'swiggy', 'paytm', 'ola'];

function extractParts(input) {
  let val = input.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '');
  let tld = '';
  const knownTlds = Object.keys(DOMAIN_PRICES).sort((a, b) => b.length - a.length);
  for (const t of knownTlds) {
    if (val.endsWith(t)) {
      tld = t;
      val = val.slice(0, val.length - t.length);
      break;
    }
  }
  if (!tld) tld = '.in'; // default
  return { name: val || 'yourbusiness', tld };
}

function searchDomain() {
  const input = document.getElementById('domain-input').value.trim();
  const result = document.getElementById('domain-result');
  if (!input) { result.innerHTML = ''; return; }

  // Loading state
  result.innerHTML = '<div class="result-loading"><span>🔍 Checking availability...</span></div>';

  setTimeout(() => {
    const { name, tld } = extractParts(input);
    const domain = name + tld;
    const price = DOMAIN_PRICES[tld] || 499;
    const isAvailable = !TAKEN.includes(name);

    if (isAvailable) {
      result.innerHTML = `
        <div class="result-available">
          <span class="result-icon">✅</span>
          <div class="result-text">
            <div class="result-domain">${domain}</div>
            <div class="result-status">🎉 Available! Grab it before someone else does.</div>
          </div>
          <div class="result-price">₹${price}/yr</div>
          <button class="result-btn" onclick="addToCart('${domain}', ${price})">Add to Cart</button>
        </div>`;
    } else {
      // Suggest alternatives
      const alts = ['.net', '.store', '.online', '.co.in'].filter(t => t !== tld);
      const altHtml = alts.slice(0, 3).map(t =>
        `<a href="#" class="tld-chip" style="margin-right:6px" onclick="suggestDomain('${name}${t}')">${name}${t} <strong>₹${DOMAIN_PRICES[t]}/yr</strong></a>`
      ).join('');
      result.innerHTML = `
        <div class="result-taken">
          <span class="result-icon">❌</span>
          <div class="result-text">
            <div class="result-domain">${domain}</div>
            <div class="result-status">This domain is already taken. Try these alternatives:</div>
            <div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:6px">${altHtml}</div>
          </div>
        </div>`;
    }
  }, 900);
}

function addToCart(domain, price) {
  alert(`✅ ${domain} added to cart!\n\nPrice: ₹${price}/year\n\n(This is a demo — in the live site this will take you to checkout)`);
}

function suggestDomain(domain) {
  document.getElementById('domain-input').value = domain;
  searchDomain();
}

document.getElementById('search-btn').addEventListener('click', searchDomain);
document.getElementById('domain-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') searchDomain();
});

// TLD chip click — fill search
document.querySelectorAll('.tld-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    const tld = chip.textContent.split(' ')[0];
    const current = document.getElementById('domain-input').value.split('.')[0] || 'yourbusiness';
    document.getElementById('domain-input').value = current + tld;
    searchDomain();
  });
});

// ===== PRICING TOGGLE =====
const billingToggle = document.getElementById('billing-toggle');
billingToggle.addEventListener('change', () => {
  const isYearly = billingToggle.checked;
  document.querySelectorAll('.amount').forEach(el => {
    el.textContent = isYearly ? el.dataset.yearly : el.dataset.monthly;
  });
  // Update billing text
  const billings = {
    'billing-starter': isYearly ? 'Billed ₹1,188/year' : 'Billed ₹149/month',
    'billing-business': isYearly ? 'Billed ₹2,388/year' : 'Billed ₹299/month',
    'billing-pro': isYearly ? 'Billed ₹4,788/year' : 'Billed ₹599/month'
  };
  Object.entries(billings).forEach(([id, text]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  });
});

// ===== COUNTER ANIMATION =====
function animateCounter(el) {
  const target = parseInt(el.dataset.target, 10);
  const duration = 2000;
  const step = target / (duration / 16);
  let current = 0;
  const timer = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = Math.floor(current).toLocaleString('en-IN');
    if (current >= target) clearInterval(timer);
  }, 16);
}

const statsObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.querySelectorAll('.stat-num').forEach(animateCounter);
      statsObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.3 });

const heroStats = document.querySelector('.hero-stats');
if (heroStats) statsObserver.observe(heroStats);

// ===== SCROLL REVEAL =====
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.service-card, .why-card, .pricing-card, .testimonial-card, .contact-card, .step-item').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(30px)';
  el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  revealObserver.observe(el);
});

// ===== PLAN BUTTON INTERACTIONS =====
document.querySelectorAll('.btn-plan, .btn-buy').forEach(btn => {
  btn.addEventListener('click', e => {
    e.preventDefault();
    const plan = btn.closest('.pricing-card, tr');
    const name = plan ? (plan.querySelector('.plan-name, .tld-name') || {}).textContent : 'this plan';
    alert(`You selected ${name}!\n\n(In the live site, this will take you to checkout with payment options: UPI, Cards, Net Banking, Paytm)`);
  });
});

// Smooth CTA button scroll
document.getElementById('cta-search-btn').addEventListener('click', e => {
  e.preventDefault();
  document.getElementById('hero').scrollIntoView({ behavior: 'smooth' });
  setTimeout(() => document.getElementById('domain-input').focus(), 800);
});
