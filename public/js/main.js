// ===== CART MANAGEMENT =====
let cart = JSON.parse(localStorage.getItem("bloomCart")) || [];
let plantsCache = [];

// Fetch plants data on load
fetch("/api/plants")
  .then((res) => res.json())
  .then((data) => {
    plantsCache = data;
    updateCartCount();
  });

function addToCart(plantId) {
  const plant = plantsCache.find((p) => p.id === plantId);
  if (!plant) return;

  const existing = cart.find((item) => item.id === plantId);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      id: plant.id,
      name: plant.name,
      price: plant.price,
      image: plant.image,
      quantity: 1,
    });
  }

  saveCart();
  updateCartCount();
  showToast(`🌿 ${plant.name} added to cart!`);
}

function removeFromCart(plantId) {
  cart = cart.filter((item) => item.id !== plantId);
  saveCart();
  updateCartCount();
  renderCart();
}

function updateQuantity(plantId, delta) {
  const item = cart.find((i) => i.id === plantId);
  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) {
    removeFromCart(plantId);
    return;
  }

  saveCart();
  updateCartCount();
  renderCart();
}

function saveCart() {
  localStorage.setItem("bloomCart", JSON.stringify(cart));
}

function updateCartCount() {
  const countEl = document.getElementById("cart-count");
  if (countEl) {
    const total = cart.reduce((sum, item) => sum + item.quantity, 0);
    countEl.textContent = total;
  }
}

function showToast(message) {
  const toast = document.createElement("div");
  toast.textContent = message;
  toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #2d6a4f;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 2000;
        animation: slideIn 0.3s ease;
    `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

// ===== RENDER CART PAGE =====
function renderCart() {
  const container = document.getElementById("cart-items");
  const emptyMsg = document.getElementById("empty-message");
  const summary = document.getElementById("cart-summary");

  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = "";
    if (emptyMsg) emptyMsg.style.display = "block";
    if (summary) summary.style.display = "none";
    return;
  }

  if (emptyMsg) emptyMsg.style.display = "none";
  if (summary) summary.style.display = "block";

  container.innerHTML = cart
    .map(
      (item) => `
        <div class="cart-item">
            <img src="${item.image}" alt="${item.name}" />
            <div class="cart-item-info">
                <h3>${item.name}</h3>
                <p class="price">$${item.price.toFixed(2)}</p>
            </div>
            <div class="qty-controls">
                <button class="qty-btn" onclick="updateQuantity(${item.id}, -1)">−</button>
                <span class="qty-display">${item.quantity}</span>
                <button class="qty-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
            </div>
            <div class="item-total">$${(item.price * item.quantity).toFixed(2)}</div>
            <button class="remove-btn" onclick="removeFromCart(${item.id})">✕</button>
        </div>
    `,
    )
    .join("");

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const shipping = 5.0;
  const total = subtotal + shipping;

  const subtotalEl = document.getElementById("subtotal");
  const totalEl = document.getElementById("total");
  if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
  if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
}

// ===== RENDER CHECKOUT SUMMARY =====
function renderCheckout() {
  const container = document.getElementById("checkout-items");
  const totalEl = document.getElementById("checkout-total");
  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = "<p>Your cart is empty.</p>";
    if (totalEl) totalEl.textContent = "$0.00";
    return;
  }

  container.innerHTML = cart
    .map(
      (item) => `
        <div class="checkout-item">
            <span>${item.name} × ${item.quantity}</span>
            <span>$${(item.price * item.quantity).toFixed(2)}</span>
        </div>
    `,
    )
    .join("");

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const total = subtotal + 5.0;
  if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
}

// ===== SHOP FILTERING & SORTING =====
function initShopFilters() {
  const filterBtns = document.querySelectorAll(".filter-btn[data-filter]");
  const categoryBtns = document.querySelectorAll(".filter-btn[data-category]");
  const sortSelect = document.getElementById("sort");
  const grid = document.getElementById("plant-grid");

  if (!grid) return;

  let activeCare = "all";
  let activeCategory = "all";

  function applyFilters() {
    const cards = Array.from(grid.querySelectorAll(".plant-card"));
    cards.forEach((card) => {
      const care = card.dataset.care;
      const category = card.dataset.category;
      const careMatch = activeCare === "all" || care === activeCare;
      const categoryMatch =
        activeCategory === "all" || category === activeCategory;
      card.style.display = careMatch && categoryMatch ? "flex" : "none";
    });
  }

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      activeCare = btn.dataset.filter;
      applyFilters();
    });
  });

  categoryBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      categoryBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      activeCategory = btn.dataset.category;
      applyFilters();
    });
  });

  if (sortSelect) {
    sortSelect.addEventListener("change", () => {
      const cards = Array.from(grid.querySelectorAll(".plant-card"));
      const value = sortSelect.value;

      cards.sort((a, b) => {
        if (value === "price-low")
          return parseFloat(a.dataset.price) - parseFloat(b.dataset.price);
        if (value === "price-high")
          return parseFloat(b.dataset.price) - parseFloat(a.dataset.price);
        if (value === "name")
          return a.dataset.name.localeCompare(b.dataset.name);
        return 0;
      });

      grid.innerHTML = "";
      cards.forEach((card) => grid.appendChild(card));
    });
  }

  // Handle URL query params from home category links
  const params = new URLSearchParams(window.location.search);
  const cat = params.get("category");
  const care = params.get("careLevel");
  if (cat) {
    activeCategory = cat.toLowerCase();
    categoryBtns.forEach((b) => {
      b.classList.toggle("active", b.dataset.category === activeCategory);
    });
    applyFilters();
  }
  if (care) {
    activeCare = care.toLowerCase();
    filterBtns.forEach((b) => {
      b.classList.toggle("active", b.dataset.filter === activeCare);
    });
    applyFilters();
  }
}

// ===== CONTACT FORM =====
function initContactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const message = document.getElementById("message").value.trim();
    const msgBox = document.getElementById("form-message");

    if (!name || !email || !message) {
      msgBox.innerHTML =
        '<div class="alert alert-error">Please fill in all required fields.</div>';
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      msgBox.innerHTML =
        '<div class="alert alert-error">Please enter a valid email address.</div>';
      return;
    }

    msgBox.innerHTML =
      '<div class="alert alert-success">✅ Message sent! We\'ll get back to you soon.</div>';
    form.reset();
  });
}

// ===== CHECKOUT FORM =====
function initCheckoutForm() {
  const form = document.getElementById("checkout-form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const orderNumber = "BLM-" + Math.floor(100000 + Math.random() * 900000);
    document.getElementById("order-number").textContent = orderNumber;
    document.getElementById("confirmation-modal").classList.add("active");
    localStorage.removeItem("bloomCart");
    cart = [];
    updateCartCount();
  });
}

// ===== INIT =====
document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();
  renderCart();
  renderCheckout();
  initShopFilters();
  initContactForm();
  initCheckoutForm();
});
