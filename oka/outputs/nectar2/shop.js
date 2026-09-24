import { getSupabase } from './supabase-client.js';
import { productImageForPosition } from './product-images.js';

const $ = (selector, context = document) => context.querySelector(selector);
const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];
const PAGE_SIZE = 6;

let activeGender = 'all';
let searchQuery = '';
let sort = 'featured';
let currentPage = -1;
let products = [];
let totalResults = 0;
let requestToken = 0;
let loading = false;
let supabase;

const menuToggle = $('#menuToggle');
const mainMenu = $('#mainMenu');

function closeMenu() {
  if (!menuToggle || !mainMenu) return;
  mainMenu.classList.remove('open');
  menuToggle.classList.remove('open');
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Open menu');
  document.body.classList.remove('menu-open');
}

if (menuToggle && mainMenu) {
  menuToggle.addEventListener('click', () => {
    const opening = !mainMenu.classList.contains('open');
    mainMenu.classList.toggle('open', opening);
    menuToggle.classList.toggle('open', opening);
    menuToggle.setAttribute('aria-expanded', String(opening));
    menuToggle.setAttribute('aria-label', opening ? 'Close menu' : 'Open menu');
    document.body.classList.toggle('menu-open', opening);
  });
  mainMenu.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });
  window.addEventListener('resize', () => {
    if (innerWidth > 800) closeMenu();
  });
}

window.addEventListener('scroll', () => $('#nav').classList.toggle('scrolled', scrollY > 40), {
  passive: true,
});

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  })[character]);
}

function formatMoney(value) {
  const amount = Number(value);
  return `$${Number.isInteger(amount) ? amount : amount.toFixed(2)}`;
}

function displayName(product) {
  return `${product.brand_name} ${product.name}`.trim();
}

function searchableTerm(value) {
  return value.trim().replace(/[%_(),]/g, ' ').replace(/\s+/g, ' ');
}

function productCard(product, position) {
  const sizes = Array.isArray(product.sizes) ? product.sizes : [];
  const productImage = productImageForPosition(position, PAGE_SIZE);
  const sizeButtons = sizes.map((size, index) => {
    const price = size.override_price ?? size.default_price ?? size.price;
    return `<button class="size-option${index === 0 ? ' selected' : ''}" data-size="${escapeHtml(size.capacity)}" data-price="${escapeHtml(price)}" aria-pressed="${index === 0}"><span>${escapeHtml(size.capacity)} ML</span><strong>${formatMoney(price)}</strong></button>`;
  }).join('');
  const genderLabel = product.sex === 'unspecified' ? 'Not specified' : product.sex;
  const name = displayName(product);

  return `<article class="product-card" data-gender="${escapeHtml(product.sex)}" data-product-id="${escapeHtml(product.id)}" data-product-image="${escapeHtml(productImage)}"><div class="product-image"><span class="gender-tag">${escapeHtml(genderLabel)}</span><img loading="lazy" src="${escapeHtml(productImage)}" alt="${escapeHtml(name)} bottle"></div><div class="product-info"><div class="product-vendor">${escapeHtml(product.brand_name)}</div><h2>${escapeHtml(product.name)}</h2><div class="size-options" role="group" aria-label="Choose bottle size">${sizeButtons || '<span>Currently unavailable</span>'}</div><button class="add-to-bag" type="button"${sizeButtons ? '' : ' disabled'}>Add selected size to bag <span>+</span></button></div></article>`;
}

function showCatalogMessage(title, message) {
  $('#emptyState h2').textContent = title;
  $('#emptyState p').textContent = message;
  $('#emptyState').hidden = false;
  $('#productGrid').hidden = true;
}

function renderProducts() {
  $('#productGrid').innerHTML = products.map(productCard).join('');
  $('#resultCount').textContent = totalResults.toLocaleString();

  const empty = totalResults === 0;
  $('#emptyState h2').textContent = 'No scent found.';
  $('#emptyState p').textContent = 'Try another name or clear the filters.';
  $('#emptyState').hidden = !empty;
  $('#productGrid').hidden = empty;
  $('#loadMore').hidden = empty || products.length >= totalResults;
  $('#progressText').textContent = empty
    ? ''
    : `Showing ${products.length.toLocaleString()} of ${totalResults.toLocaleString()}`;
}

function setLoading(isLoading) {
  loading = isLoading;
  $('#loadMore').disabled = isLoading;
  $('#loadMore').firstChild.textContent = isLoading ? 'Loading ' : 'Reveal more ';
  if (isLoading && products.length === 0) $('#progressText').textContent = 'Loading fragrances…';
}

function buildCatalogQuery(page) {
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  let request = supabase
    .from('perfume_catalog')
    .select('*', { count: 'exact' });

  if (activeGender !== 'all') request = request.eq('sex', activeGender);

  const term = searchableTerm(searchQuery);
  if (term) request = request.or(`name.ilike.%${term}%,brand_name.ilike.%${term}%`);

  if (sort === 'az') {
    request = request.order('name', { ascending: true });
  } else {
    request = request
      .order('is_featured', { ascending: false })
      .order('name', { ascending: true });
  }

  return request.order('id', { ascending: true }).range(from, to);
}

async function fetchProducts({ reset = false } = {}) {
  if (!supabase || (loading && !reset)) return;

  const page = reset ? 0 : currentPage + 1;
  const token = ++requestToken;
  if (reset) {
    products = [];
    currentPage = -1;
    $('#productGrid').innerHTML = '';
  }

  setLoading(true);
  const { data, count, error } = await buildCatalogQuery(page);
  if (token !== requestToken) return;
  setLoading(false);

  if (error) {
    console.error('Unable to load catalog:', error);
    showCatalogMessage('Catalog unavailable.', 'Check the Supabase environment variables, view, grants, and RLS policies.');
    $('#loadMore').hidden = true;
    $('#progressText').textContent = '';
    return;
  }

  currentPage = page;
  products = reset ? (data ?? []) : [...products, ...(data ?? [])];
  totalResults = count ?? products.length;
  renderProducts();
}

async function loadFilterCounts() {
  if (!supabase) return;

  const countFor = async (gender) => {
    let request = supabase
      .from('perfume_catalog')
      .select('id', { count: 'exact', head: true });
    if (gender) request = request.eq('sex', gender);
    const { count, error } = await request;
    if (error) throw error;
    return count ?? 0;
  };

  try {
    const [all, women, men, unisex] = await Promise.all([
      countFor(null),
      countFor('women'),
      countFor('men'),
      countFor('unisex'),
    ]);
    $('#countAll').textContent = all.toLocaleString();
    $('#countWomen').textContent = women.toLocaleString();
    $('#countMen').textContent = men.toLocaleString();
    $('#countUnisex').textContent = unisex.toLocaleString();
    $('#totalCount').textContent = all.toLocaleString();
  } catch (error) {
    console.error('Unable to load catalog counts:', error);
  }
}

const CART_KEY = 'nectar-cart';

function loadCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(CART_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

let cart = loadCart();
let toastTimer;

function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function cartCount() {
  return cart.reduce((sum, item) => sum + item.qty, 0);
}

function openCart() {
  $('#cartDrawer').classList.add('open');
  $('#cartOverlay').classList.add('open');
  $('#cartDrawer').setAttribute('aria-hidden', 'false');
  document.body.classList.add('cart-open');
}

function closeCart() {
  $('#cartDrawer').classList.remove('open');
  $('#cartOverlay').classList.remove('open');
  $('#cartDrawer').setAttribute('aria-hidden', 'true');
  document.body.classList.remove('cart-open');
}

function renderCart() {
  const count = cartCount();
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  $('#bagCount').textContent = count;
  $('#drawerCount').textContent = count;
  $('#cartTotal').textContent = formatMoney(total);
  $('#cartEmpty').hidden = cart.length > 0;
  $('#cartFooter').hidden = !cart.length;
  $('#cartItems').innerHTML = cart.map((item) => `<article class="cart-item"><img src="${escapeHtml(item.image)}" alt=""><div><p>${escapeHtml(item.size)} ML · Eau de parfum</p><h3>${escapeHtml(item.name)}</h3><div class="qty"><button data-action="minus" data-id="${escapeHtml(item.key)}" aria-label="Decrease quantity">−</button><span>${item.qty}</span><button data-action="plus" data-id="${escapeHtml(item.key)}" aria-label="Increase quantity">+</button></div></div><div><strong>${formatMoney(item.price * item.qty)}</strong><button class="remove" data-action="remove" data-id="${escapeHtml(item.key)}">Remove</button></div></article>`).join('');

  const orderLines = cart.map((item, index) => `${index + 1}. ${item.name}\nSize: ${item.size} ML\nQuantity: ${item.qty}\nItem total: ${formatMoney(item.price * item.qty)}`);
  const orderMessage = `Hello, I would like to place this perfume order:\n\n${orderLines.join('\n\n')}\n\nSubtotal: ${formatMoney(total)}`;
  $('#whatsappCheckout').href = `https://wa.me/96171646308?text=${encodeURIComponent(orderMessage)}`;
  saveCart();
}

function addToCart(product, size, price, image) {
  const key = `${product.id}-${size}`;
  const existing = cart.find((item) => item.key === key);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      key,
      id: product.id,
      name: displayName(product),
      size,
      price,
      image,
      qty: 1,
    });
  }
  renderCart();
  $('#toastDetail').textContent = `${size} ML · ${formatMoney(price)}`;
  $('#toast').classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('#toast').classList.remove('show'), 2400);
}

$$('.filter').forEach((button) => button.addEventListener('click', () => {
  activeGender = button.dataset.filter;
  $$('.filter').forEach((item) => item.classList.toggle('active', item === button));
  fetchProducts({ reset: true });
}));

let searchTimer;
$('#searchInput').addEventListener('input', (event) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    searchQuery = event.target.value;
    fetchProducts({ reset: true });
  }, 300);
});

$('#sortSelect').addEventListener('change', (event) => {
  sort = event.target.value;
  fetchProducts({ reset: true });
});

$('#loadMore').addEventListener('click', () => fetchProducts());

$('#productGrid').addEventListener('click', (event) => {
  const option = event.target.closest('.size-option');
  if (option) {
    const card = option.closest('.product-card');
    card.querySelectorAll('.size-option').forEach((button) => {
      const selected = button === option;
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    return;
  }

  const addButton = event.target.closest('.add-to-bag');
  if (!addButton) return;
  const card = addButton.closest('.product-card');
  const product = products.find((item) => String(item.id) === card.dataset.productId);
  const selected = card.querySelector('.size-option.selected');
  if (!product || !selected) return;

  addToCart(product, selected.dataset.size, Number(selected.dataset.price), card.dataset.productImage);
  addButton.classList.add('added');
  addButton.firstChild.textContent = 'Added to bag ';
  setTimeout(() => {
    addButton.classList.remove('added');
    addButton.firstChild.textContent = 'Add selected size to bag ';
  }, 1200);
});

$('#clearFilters').addEventListener('click', () => {
  activeGender = 'all';
  searchQuery = '';
  sort = 'featured';
  $('#searchInput').value = '';
  $('#sortSelect').value = 'featured';
  $$('.filter').forEach((button) => button.classList.toggle('active', button.dataset.filter === 'all'));
  fetchProducts({ reset: true });
});

const glow = $('.cursor-glow');
window.addEventListener('pointermove', (event) => {
  glow.style.left = `${event.clientX}px`;
  glow.style.top = `${event.clientY}px`;
});

$('#bagBtn').addEventListener('click', openCart);
$('#closeCart').addEventListener('click', closeCart);
$('#cartOverlay').addEventListener('click', closeCart);
$('#closeToast').addEventListener('click', () => $('#toast').classList.remove('show'));
$('#whatsappCheckout').addEventListener('click', () => setTimeout(() => {
  cart = [];
  renderCart();
  closeCart();
}, 0));
$('#emptyShop').addEventListener('click', () => {
  closeCart();
  $('#filterRail').scrollIntoView({ behavior: 'smooth' });
});
$('#cartItems').addEventListener('click', (event) => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const item = cart.find((entry) => entry.key === button.dataset.id);
  if (!item) return;
  if (button.dataset.action === 'plus') item.qty += 1;
  if (button.dataset.action === 'minus') item.qty -= 1;
  if (button.dataset.action === 'remove' || item.qty < 1) {
    cart = cart.filter((entry) => entry.key !== item.key);
  }
  renderCart();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeCart();
});

renderCart();

async function initializeCatalog() {
  try {
    supabase = await getSupabase();
    await Promise.all([
      loadFilterCounts(),
      fetchProducts({ reset: true }),
    ]);
  } catch (error) {
    console.error('Unable to initialize Supabase:', error);
    showCatalogMessage('Catalog unavailable.', 'Check the browser console and confirm that the Supabase project, catalog view, and RLS policies are available.');
    $('#loadMore').hidden = true;
  }
}

initializeCatalog();
