/**
 * PostureTru - Theme Javascript Operations
 * zero-dependency JS for interactive features and cart persistence
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- SHOPIFY CART API ---
  const fetchCart = () => fetch('/cart.js').then(r => r.json());

  // --- SELECTORS ---
  const menuBtn = document.getElementById('menuToggleBtn');
  const closeMenuBtn = document.getElementById('closeMenuBtn');
  const mobileNav = document.getElementById('mobileNavDrawer');
  
  const cartBtn = document.getElementById('cartIconBtn');
  const mobileCartBtn = document.getElementById('mobileCartIconBtn');
  const closeCartBtn = document.getElementById('closeCartBtn');
  const cartDrawer = document.getElementById('cartDrawer');
  const cartOverlay = document.getElementById('cartOverlay');
  const cartItemsContainer = document.getElementById('cartDrawerItems');
  const cartSubtotalEl = document.getElementById('cartSubtotalAmount');
  const cartBadge = document.getElementById('cartBadgeCount');
  const cartBadgeMobile = document.getElementById('cartBadgeCountMobile');
  
  // --- MOBILE MENU TOGGLE ---
  if (menuBtn && mobileNav) {
    menuBtn.addEventListener('click', () => {
      mobileNav.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  }
  
  if (closeMenuBtn && mobileNav) {
    closeMenuBtn.addEventListener('click', () => {
      mobileNav.classList.remove('active');
      document.body.style.overflow = '';
    });
  }

  // --- CART DRAWER TOGGLE ---
  const openCart = () => {
    if (cartDrawer && cartOverlay) {
      cartDrawer.classList.add('active');
      cartOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
      renderCartDrawer();
    }
  };

  const closeCart = () => {
    if (cartDrawer && cartOverlay) {
      cartDrawer.classList.remove('active');
      cartOverlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  };

  if (cartBtn) cartBtn.addEventListener('click', openCart);
  if (mobileCartBtn) mobileCartBtn.addEventListener('click', openCart);
  if (closeCartBtn) closeCartBtn.addEventListener('click', closeCart);
  if (cartOverlay) cartOverlay.addEventListener('click', closeCart);

  // --- CART UTILITIES & ACTIONS ---
  const updateCartBadges = async () => {
    try {
      const shopifyCart = await fetchCart();
      const totalQty = shopifyCart.item_count;
      if (cartBadge) {
        cartBadge.textContent = totalQty;
        cartBadge.style.display = totalQty > 0 ? 'flex' : 'none';
      }
      if (cartBadgeMobile) {
        cartBadgeMobile.textContent = totalQty;
        cartBadgeMobile.style.display = totalQty > 0 ? 'flex' : 'none';
      }
    } catch(e) {}
  };

  const removeCartItem = async (key) => {
    await fetch('/cart/change.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: key, quantity: 0 })
    });
    renderCartDrawer();
    updateCartBadges();
  };

  const updateQuantity = async (key, qty) => {
    if (qty < 0) qty = 0;
    await fetch('/cart/change.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: key, quantity: qty })
    });
    renderCartDrawer();
    updateCartBadges();
  };

  const renderCartDrawer = async () => {
    if (!cartItemsContainer) return;
    const cartViewCartBtn = document.getElementById('cartViewCartBtn');
    const cartCheckoutBtn = document.getElementById('cartCheckoutBtn');
    try {
      const shopifyCart = await fetchCart();

      if (shopifyCart.item_count === 0) {
        cartItemsContainer.innerHTML = `
          <div class="empty-cart-view">
            <svg width="48" height="48" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
            </svg>
            <p>Your cart is empty</p>
            <a href="/products/posturetru" class="btn btn-primary btn-sm" style="margin-top: 15px; padding: 10px 20px;">Shop Product</a>
          </div>
        `;
        if (cartSubtotalEl) cartSubtotalEl.textContent = '$0.00';
        if (cartViewCartBtn) cartViewCartBtn.style.display = 'none';
        if (cartCheckoutBtn) cartCheckoutBtn.style.display = 'none';
        return;
      }

      if (cartViewCartBtn) cartViewCartBtn.style.display = '';
      if (cartCheckoutBtn) cartCheckoutBtn.style.display = '';
      cartItemsContainer.innerHTML = '';
      shopifyCart.items.forEach(item => {
        const linePrice = (item.line_price / 100).toFixed(2);
        const itemEl = document.createElement('div');
        itemEl.className = 'cart-drawer-item';
        itemEl.innerHTML = `
          <div class="cart-item-img">
            <img src="${item.image}" alt="${item.product_title}" style="width:64px;height:64px;object-fit:contain;border-radius:4px;">
          </div>
          <div class="cart-item-info">
            <h4>${item.product_title}</h4>
            ${item.variant_title !== 'Default Title' ? `<p>${item.variant_title}</p>` : ''}
            <div class="quantity-selector" style="height:35px;width:100px;">
              <button class="qty-btn" style="width:30px;height:33px;" data-key="${item.key}" data-qty="${item.quantity - 1}">-</button>
              <span style="flex:1;text-align:center;font-size:14px;font-weight:600;">${item.quantity}</span>
              <button class="qty-btn" style="width:30px;height:33px;" data-key="${item.key}" data-qty="${item.quantity + 1}">+</button>
            </div>
          </div>
          <div style="text-align:right;display:flex;flex-direction:column;justify-content:space-between;align-items:flex-end;">
            <span style="font-weight:600;color:var(--color-primary);font-size:15px;">$${linePrice}</span>
            <button class="cart-remove-btn" style="margin-top:15px;padding:0;background:none;border:none;cursor:pointer;" data-key="${item.key}">Remove</button>
          </div>
        `;
        cartItemsContainer.appendChild(itemEl);
      });

      const subtotal = (shopifyCart.total_price / 100).toFixed(2);
      if (cartSubtotalEl) cartSubtotalEl.textContent = `$${subtotal}`;

      cartItemsContainer.querySelectorAll('.qty-btn').forEach(btn => {
        btn.addEventListener('click', e => {
          updateQuantity(e.target.dataset.key, parseInt(e.target.dataset.qty));
        });
      });
      cartItemsContainer.querySelectorAll('.cart-remove-btn').forEach(btn => {
        btn.addEventListener('click', e => removeCartItem(e.target.dataset.key));
      });
    } catch(e) { console.error('Cart render error:', e); }
  };

  // --- INTERCEPT ADD-TO-CART FORMS ---
  document.querySelectorAll('form[action="/cart/add"]').forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const variantId = form.querySelector('input[name="id"]').value;
      const qtyField = document.getElementById('productQty');
      const quantity = parseInt(qtyField ? qtyField.value : 1) || 1;
      const submitBtn = form.querySelector('[type="submit"]');
      if (submitBtn) { submitBtn.textContent = 'Adding...'; submitBtn.disabled = true; }
      try {
        await fetch('/cart/add.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: [{ id: variantId, quantity }] })
        });
        await updateCartBadges();
        openCart();
      } catch(e) { console.error('Add to cart error:', e); }
      finally {
        if (submitBtn) { submitBtn.textContent = 'Add to Cart'; submitBtn.disabled = false; }
      }
    });
  });

  // --- PRODUCT PAGE INTERACTIVITY ---
  
  // Quantity control buttons
  const qtyInput = document.getElementById('productQty');
  const qtyMinus = document.getElementById('qtyMinus');
  const qtyPlus = document.getElementById('qtyPlus');
  
  if (qtyInput && qtyMinus && qtyPlus) {
    qtyMinus.addEventListener('click', () => {
      let val = parseInt(qtyInput.value) || 1;
      if (val > 1) qtyInput.value = val - 1;
    });
    
    qtyPlus.addEventListener('click', () => {
      let val = parseInt(qtyInput.value) || 1;
      qtyInput.value = val + 1;
    });
  }

  // --- STICKY ATC BAR ON SCROLL ---
  // Renders a small floating bar on mobile when scrolled past ATC section
  const atcSection = document.querySelector('.atc-section');
  if (atcSection) {
    const productTitleEl = document.querySelector('.product-title');
    const productPriceEl = document.querySelector('.price-current');
    const productTitleText = productTitleEl ? productTitleEl.textContent.trim() : '';
    const productPriceText = productPriceEl ? productPriceEl.textContent.trim() : '';

    const stickyBar = document.createElement('div');
    stickyBar.className = 'sticky-atc-bar';
    stickyBar.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px;">
        <span style="font-weight:600; font-size:14px; font-family:var(--font-headings); color:var(--color-primary); display:block; max-width:140px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${productTitleText}</span>
        <span style="font-weight:700; color:var(--color-primary); font-size:16px;">${productPriceText}</span>
      </div>
      <button id="stickyAtcBtn" class="btn btn-secondary" style="padding: 10px 20px; font-size: 14px; margin:0;">Buy Now</button>
    `;
    document.body.appendChild(stickyBar);
    
    window.addEventListener('scroll', () => {
      const atcPos = atcSection.getBoundingClientRect().bottom;
      if (atcPos < 0) {
        stickyBar.classList.add('visible');
      } else {
        stickyBar.classList.remove('visible');
      }
    }, { passive: true });

    const stickyAtcBtn = document.getElementById('stickyAtcBtn');
    if (stickyAtcBtn) {
      stickyAtcBtn.addEventListener('click', () => {
        const form = document.querySelector('form[action="/cart/add"]');
        if (form) form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      });
    }
  }

  // --- ACCORDION INTERACTION (FAQ) ---
  const accordionHeaders = document.querySelectorAll('.accordion-header');
  accordionHeaders.forEach(header => {
    header.addEventListener('click', (e) => {
      const item = e.currentTarget.parentElement;
      const isActive = item.classList.contains('active');
      
      // Close all other items in the same section for visual neatness
      const parent = item.parentElement;
      parent.querySelectorAll('.accordion-item').forEach(i => {
        i.classList.remove('active');
        i.querySelector('.accordion-header').setAttribute('aria-expanded', 'false');
      });
      
      if (!isActive) {
        item.classList.add('active');
        e.currentTarget.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // --- LOAD RENDER CHECKS ---
  updateCartBadges();

  // --- HERO NAV FROSTED GLASS ON SCROLL ---
  const heroHeader = document.querySelector('.hero-header');
  if (heroHeader) {
    const onScroll = () => {
      if (window.scrollY > 12) {
        heroHeader.classList.add('scrolled');
      } else {
        heroHeader.classList.remove('scrolled');
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // --- STANDARD HEADER FROSTED GLASS ON SCROLL (non-homepage) ---
  const siteHeader = document.querySelector('header');
  if (siteHeader && !heroHeader) {
    const onHeaderScroll = () => {
      if (window.scrollY > 12) {
        siteHeader.classList.add('scrolled');
      } else {
        siteHeader.classList.remove('scrolled');
      }
    };
    window.addEventListener('scroll', onHeaderScroll, { passive: true });
    onHeaderScroll();
  }
});

// Helper Loader Keyframes added in JS dynamically
const styleSheet = document.createElement("style");
styleSheet.innerText = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

// --- SCROLL REVEAL MOTION (calm, additive) ---
(function () {
  // Page load fade in
  function triggerPageFade() {
    document.body.classList.add('page-loaded');
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', triggerPageFade);
  } else {
    triggerPageFade();
  }
  // Fallback so the page is never stuck invisible
  window.setTimeout(triggerPageFade, 600);
})();

(function () {
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion || !('IntersectionObserver' in window)) return;

  function initReveal() {
    var selectors = [
      '.section-header',
      '.product-preview-content',
      '.product-preview-img-container',
      '.pillar-card',
      '.final-cta .container',
      '.about-section',
      '.specs-layout',
      '.contact-layout',
      '.features-list',
      '.faq-accordion-container',
      '.feature-item',
      '.feature-card',
      '.benefit-card',
      '.guarantee-item',
      '.faq-item',
      '.contact-method-item',
      '.contact-form-card',
      '.contact-info-block',
      '.policy-content'
    ];
    var nodes = document.querySelectorAll(selectors.join(','));
    if (!nodes.length) return;

    var viewportH = window.innerHeight || document.documentElement.clientHeight;
    var toObserve = [];
    nodes.forEach(function (el) {
      // Skip elements handled by the custom word entrance system below
      if (el.matches('.product-preview-content, .product-preview-img-container, #PillarsSection .section-header, #productFeaturesSection .section-header, #productBenefitsSection .section-header, #faqAccordionSection .section-header')) return;
      // Skip anything already in view on load so it never flashes
      if (el.getBoundingClientRect().top < viewportH * 0.85) return;
      el.classList.add('reveal-item');
      toObserve.push(el);
    });
    if (!toObserve.length) return;

    var observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        el.classList.add('is-visible');
        obs.unobserve(el);
        window.setTimeout(function () {
          el.classList.remove('reveal-item');
          el.classList.remove('is-visible');
        }, 1100);
      });
    }, { threshold: 0.04, rootMargin: '0px 0px 0px 0px' });

    toObserve.forEach(function (el) { observer.observe(el); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReveal);
  } else {
    initReveal();
  }
})();

// --- WORD ENTRANCE ON SCROLL (Meet Verta, Trust Pillars) ---
(function () {
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion || !('IntersectionObserver' in window)) return;

  function shatterIn(words, startDelay) {
    var staggerBudget = 300;
    var stagger = words.length ? Math.min(32, staggerBudget / words.length) : 32;
    var wordTransition = 560;
    words.forEach(function (w) {
      var dx = (Math.random() * 90 - 45).toFixed(0);
      var dy = (Math.random() * 70 - 35).toFixed(0);
      var rot = (Math.random() * 18 - 9).toFixed(1);
      w.style.transform = 'translate(' + dx + 'px,' + dy + 'px) rotate(' + rot + 'deg)';
    });
    void document.body.offsetHeight;
    words.forEach(function (w, i) {
      var delay = startDelay + i * stagger;
      w.style.transition = 'transform ' + wordTransition + 'ms cubic-bezier(0.16,1,0.3,1) ' + delay + 'ms, opacity 420ms ease-out ' + delay + 'ms';
      w.style.opacity = '1';
      w.style.transform = 'translate(0,0) rotate(0deg)';
    });
    return words.length ? startDelay + (words.length - 1) * stagger + wordTransition : startDelay;
  }

  function fadeIn(el, delay) {
    if (!el) return;
    el.style.transition = 'opacity 480ms ease-out ' + delay + 'ms, transform 480ms cubic-bezier(0.16,1,0.3,1) ' + delay + 'ms';
    el.style.opacity = '1';
    el.style.transform = 'translateY(0)';
  }

  function playSection(root) {
    var heading = Array.prototype.slice.call(root.querySelectorAll('.intro-word'));
    var finishAt = shatterIn(heading, 0);

    var step = finishAt + 80;
    var fades = root.querySelectorAll('.entrance-fade');
    fades.forEach(function (el, i) {
      fadeIn(el, step + i * 90);
    });

    var img = root.querySelector('.entrance-fade-img');
    if (img) fadeIn(img, 0);
  }

  function initWordEntrances() {
    var sections = document.querySelectorAll('#productPreviewSection, #PillarsSection, #productFeaturesSection, #productBenefitsSection, #faqAccordionSection, #aboutStorySection, #aboutMissionSection, #aboutFounderSection, #aboutWhySection');
    if (!sections.length) return;

    var viewportH = window.innerHeight || document.documentElement.clientHeight;
    var toObserve = [];
    sections.forEach(function (section) {
      if (section.getBoundingClientRect().top < viewportH * 0.85) {
        playSection(section);
        return;
      }
      toObserve.push(section);
    });
    if (!toObserve.length) return;

    var observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        playSection(entry.target);
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.05 });

    toObserve.forEach(function (section) { observer.observe(section); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWordEntrances);
  } else {
    initWordEntrances();
  }
})();
