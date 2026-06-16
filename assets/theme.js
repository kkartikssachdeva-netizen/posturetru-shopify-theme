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
        return;
      }

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
  
  // Sizing buttons Selection
  let selectedSize = "Adjustable (One Size)";
  const sizeBtns = document.querySelectorAll('.size-option-btn');
  sizeBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      sizeBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      selectedSize = e.target.dataset.size;
    });
  });

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

  // Thumbnail selection carousel
  const thumbBtns = document.querySelectorAll('.thumb-button');
  const mainImageContainer = document.getElementById('mainImageContainer');
  const gallerySVGMap = {
    "main": `
      <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#F0F4F8"/>
        <!-- Main Product Angle -->
        <path d="M200,80 Q190,140 160,170 T150,260 L250,260 T240,170 Q210,140 200,80 Z" fill="#E8D8CD"/>
        <circle cx="200" cy="80" r="30" fill="#E8D8CD"/>
        <path d="M165,180 L235,180 L225,240 L175,240 Z" fill="#1B4965" stroke="#fff" stroke-width="2"/>
        <path d="M165,180 Q145,150 170,140 T200,165" fill="none" stroke="#1B4965" stroke-width="8" stroke-linecap="round"/>
        <path d="M235,180 Q255,150 230,140 T200,165" fill="none" stroke="#1B4965" stroke-width="8" stroke-linecap="round"/>
        <rect x="185" y="195" width="30" height="35" rx="5" fill="#D4A574" stroke="#fff" stroke-width="1.5"/>
        <circle cx="200" cy="212" r="5" fill="#5FB878"/>
        <text x="200" y="320" font-family="Outfit" font-size="20" font-weight="bold" fill="#1B4965" text-anchor="middle">Front View</text>
        <circle cx="178" cy="215" r="3" fill="#E74C3C"/><circle cx="178" cy="227" r="3" fill="#E74C3C"/><circle cx="222" cy="215" r="3" fill="#E74C3C"/><circle cx="222" cy="227" r="3" fill="#E74C3C"/>
      </svg>
    `,
    "side": `
      <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#F0F4F8"/>
        <!-- Side angle showing corrector profile -->
        <path d="M180,80 Q205,150 175,260 L230,260 Q240,150 215,80 Z" fill="#E8D8CD"/>
        <circle cx="198" cy="80" r="30" fill="#E8D8CD"/>
        <!-- Side strap profile -->
        <path d="M175,185 C190,185 205,190 200,210 C195,230 180,240 176,245" fill="none" stroke="#1B4965" stroke-width="8" stroke-linecap="round"/>
        <!-- Smart sensor profile -->
        <rect x="202" y="200" width="10" height="30" rx="3" fill="#D4A574" stroke="#fff" stroke-width="1"/>
        <circle cx="207" cy="215" r="3" fill="#5FB878"/>
        <text x="200" y="320" font-family="Outfit" font-size="20" font-weight="bold" fill="#1B4965" text-anchor="middle">Side Profile</text>
      </svg>
    `,
    "onperson": `
      <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#F0F4F8"/>
        <!-- Full-bodied silhouette showing alignment -->
        <path d="M200,50 L200,350" stroke="#5FB878" stroke-width="2" stroke-dasharray="8,8" />
        <circle cx="200" cy="90" r="25" fill="#E8D8CD"/>
        <path d="M200,115 Q170,120 160,170 L240,170 Q230,120 200,115 Z" fill="#E8D8CD"/>
        <path d="M160,170 Q150,230 165,300 L235,300 Q250,230 240,170 Z" fill="#E8D8CD"/>
        <!-- Perfect alignment guide line -->
        <path d="M165,180 L235,180 L225,245 L175,245 Z" fill="#1B4965" stroke="#5FB878" stroke-width="2"/>
        <path d="M165,180 Q140,150 170,140 T200,165" fill="none" stroke="#1B4965" stroke-width="6"/>
        <path d="M235,180 Q260,150 230,140 T200,165" fill="none" stroke="#1B4965" stroke-width="6"/>
        <!-- Arrows indicating support -->
        <path d="M130,180 L150,180 M145,175 L150,180 L145,185" stroke="#5FB878" stroke-width="3" fill="none"/>
        <path d="M270,180 L250,180 M255,175 L250,180 L255,185" stroke="#5FB878" stroke-width="3" fill="none"/>
        <text x="200" y="350" font-family="Outfit" font-size="18" font-weight="bold" fill="#1B4965" text-anchor="middle">Perfect Spinal Alignment</text>
      </svg>
    `,
    "closeup": `
      <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#F0F4F8"/>
        <!-- Zoomed section of back mesh + magnets -->
        <rect x="50" y="50" width="300" height="300" rx="15" fill="#FFFFFF" stroke="#E8ECEB" stroke-width="4"/>
        <!-- Breathable fabric pattern -->
        <pattern id="meshPattern" width="10" height="10" patternUnits="userSpaceOnUse">
          <circle cx="5" cy="5" r="1.5" fill="#E8ECEB"/>
        </pattern>
        <rect x="50" y="50" width="300" height="300" rx="15" fill="url(#meshPattern)"/>
        <!-- Magnets in details -->
        <circle cx="120" cy="120" r="15" fill="#C0392B" stroke="#fff" stroke-width="2"/>
        <circle cx="120" cy="120" r="5" fill="#fff"/>
        <circle cx="280" cy="120" r="15" fill="#C0392B" stroke="#fff" stroke-width="2"/>
        <circle cx="280" cy="120" r="5" fill="#fff"/>
        <circle cx="200" cy="200" r="25" fill="#1B4965" stroke="#fff" stroke-width="2"/>
        <path d="M190,200 L210,200 M200,190 L200,210" stroke="#fff" stroke-width="4" stroke-linecap="round"/>
        <!-- Neoprene padding thickness illustration -->
        <text x="200" y="310" font-family="Outfit" font-size="18" font-weight="bold" fill="#1B4965" text-anchor="middle">10x Therapeutic Nodes</text>
      </svg>
    `
  };

  thumbBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const button = e.currentTarget;
      thumbBtns.forEach(b => b.classList.remove('active'));
      button.classList.add('active');
      
      const angle = button.dataset.angle;
      if (mainImageContainer && gallerySVGMap[angle]) {
        mainImageContainer.innerHTML = gallerySVGMap[angle];
      }
    });
  });


  // --- STICKY ATC BAR ON SCROLL ---
  // Renders a small floating bar on mobile when scrolled past ATC section
  const atcSection = document.querySelector('.atc-section');
  if (atcSection) {
    const stickyBar = document.createElement('div');
    stickyBar.style.cssText = `
      position: fixed;
      bottom: 0;
      left: 0;
      width: 100%;
      background: #fff;
      padding: 12px 16px;
      box-shadow: 0 -4px 15px rgba(0,0,0,0.08);
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 99;
      transform: translateY(100%);
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border-top: 1px solid var(--color-border);
    `;
    stickyBar.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px;">
        <span style="font-weight:600; font-size:14px; font-family:var(--font-headings); color:var(--color-primary); display:block; max-width:140px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">Smart Corrector Belt</span>
        <span style="font-weight:700; color:var(--color-primary); font-size:16px;">$39.99</span>
      </div>
      <button id="stickyAtcBtn" class="btn btn-secondary" style="padding: 10px 20px; font-size: 14px; margin:0;">Buy Now</button>
    `;
    document.body.appendChild(stickyBar);
    
    window.addEventListener('scroll', () => {
      const atcPos = atcSection.getBoundingClientRect().bottom;
      if (atcPos < 0 && window.innerWidth < 768) {
        stickyBar.style.transform = 'translateY(0)';
      } else {
        stickyBar.style.transform = 'translateY(100%)';
      }
    });

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

  // --- CONTACT FORM SUBMISSION ---
  const contactForm = document.getElementById('contactForm');
  const contactSuccess = document.getElementById('contactFormSuccess');
  
  if (contactForm && contactSuccess) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // Verify inputs
      const name = contactForm.querySelector('input[type="text"]').value.trim();
      const email = contactForm.querySelector('input[type="email"]').value.trim();
      const message = contactForm.querySelector('textarea').value.trim();
      
      if (name === "" || email === "" || message === "") {
        alert("Please fill in all fields.");
        return;
      }
      
      // Submit visual state
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const origText = submitBtn.textContent;
      submitBtn.textContent = "Sending...";
      submitBtn.style.pointerEvents = 'none';
      submitBtn.style.opacity = '0.8';
      
      setTimeout(() => {
        contactForm.reset();
        submitBtn.textContent = origText;
        submitBtn.style.pointerEvents = '';
        submitBtn.style.opacity = '';
        
        contactForm.style.display = 'none';
        contactSuccess.style.display = 'block';
        contactSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 1000);
    });
  }

  // --- FOOTER NEWSLETTER FORM ---
  const newsletterForms = document.querySelectorAll('.newsletter-form');
  newsletterForms.forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = form.querySelector('input');
      if (input && input.value.trim() !== "") {
        alert("Thank you for subscribing! Check your inbox for your 10% off code.");
        input.value = "";
      }
    });
  });

  // --- LOAD RENDER CHECKS ---
  updateCartBadges();
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
