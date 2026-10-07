import { getSupabase } from './supabase-client.js';
import { productImageForPosition } from './product-images.js';

const q=(s,c=document)=>c.querySelector(s), qa=(s,c=document)=>[...c.querySelectorAll(s)];
const escapeHtml=value=>String(value??'').replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
const VIP_PACKAGE_IMAGE='assets/nectar-vip-package.jpeg';

const glow=q('.cursor-glow');
window.addEventListener('pointermove',e=>{glow.style.left=e.clientX+'px';glow.style.top=e.clientY+'px'});
window.addEventListener('scroll',()=>q('#nav').classList.toggle('scrolled',scrollY>40),{passive:true});

const menuToggle=q('#menuToggle'),mainMenu=q('#mainMenu');
function closeMenu(){if(!menuToggle||!mainMenu)return;mainMenu.classList.remove('open');menuToggle.classList.remove('open');menuToggle.setAttribute('aria-expanded','false');menuToggle.setAttribute('aria-label','Open menu');document.body.classList.remove('menu-open')}
if(menuToggle&&mainMenu){menuToggle.addEventListener('click',()=>{const opening=!mainMenu.classList.contains('open');mainMenu.classList.toggle('open',opening);menuToggle.classList.toggle('open',opening);menuToggle.setAttribute('aria-expanded',String(opening));menuToggle.setAttribute('aria-label',opening?'Close menu':'Open menu');document.body.classList.toggle('menu-open',opening)});mainMenu.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeMenu));document.addEventListener('keydown',event=>{if(event.key==='Escape')closeMenu()});window.addEventListener('resize',()=>{if(innerWidth>800)closeMenu()})}

const observer=new IntersectionObserver(entries=>entries.forEach((e,i)=>{
  if(e.isIntersecting){setTimeout(()=>e.target.classList.add('visible'),i*70);observer.unobserve(e.target)}
}),{threshold:.15});
qa('.reveal').forEach(el=>observer.observe(el));

function addTilt(el,intensity=8){
  if(!el)return;
  el.addEventListener('pointermove',e=>{const r=el.getBoundingClientRect();const x=(e.clientX-r.left)/r.width-.5;const y=(e.clientY-r.top)/r.height-.5;el.style.transform=`perspective(1000px) rotateX(${-y*intensity}deg) rotateY(${x*intensity}deg) scale(1.015)`});
  el.addEventListener('pointerleave',()=>el.style.transform='perspective(1000px) rotateX(0) rotateY(0) scale(1)');
}
addTilt(q('#heroTilt'),2);

qa('.magnetic').forEach(btn=>{
  btn.addEventListener('pointermove',e=>{const r=btn.getBoundingClientRect();btn.style.transform=`translate(${(e.clientX-r.left-r.width/2)*.08}px,${(e.clientY-r.top-r.height/2)*.12}px)`});
  btn.addEventListener('pointerleave',()=>btn.style.transform='');
});

qa('.note-card').forEach(card=>card.addEventListener('click',()=>{
  qa('.note-card').forEach(c=>c.classList.remove('active'));card.classList.add('active');card.style.setProperty('--card',card.dataset.color);
}));

qa('.accordion').forEach(btn=>btn.addEventListener('click',()=>{
  const body=btn.nextElementSibling,willOpen=!body.classList.contains('open');
  qa('.accordion').forEach(b=>{b.classList.remove('open');b.querySelector('b').textContent='+'});qa('.accordion-body').forEach(b=>b.classList.remove('open'));
  if(willOpen){btn.classList.add('open');body.classList.add('open');btn.querySelector('b').textContent='−'}
}));

const CART_KEY='nectar-cart';
const DELIVERY_FEE=4;
function loadCart(){try{const saved=JSON.parse(localStorage.getItem(CART_KEY));return Array.isArray(saved)?saved:[]}catch{return[]}}
let cart=loadCart(),toastTimer;
const money=n=>`$${n}`;
function saveCart(){localStorage.setItem(CART_KEY,JSON.stringify(cart))}
function cartCount(){return cart.reduce((sum,item)=>sum+item.qty,0)}
function openCart(){q('#cartDrawer').classList.add('open');q('#cartOverlay').classList.add('open');q('#cartDrawer').setAttribute('aria-hidden','false');document.body.classList.add('cart-open')}
function closeCart(){q('#cartDrawer').classList.remove('open');q('#cartOverlay').classList.remove('open');q('#cartDrawer').setAttribute('aria-hidden','true');document.body.classList.remove('cart-open')}
function updateCheckoutLink(total){
  const location=q('#deliveryLocation').value.trim();
  const orderLines=cart.map((item,index)=>`${index+1}. ${item.name}\nSize: ${item.size} ML\nEdition: ${item.tier||'Regular'}\nQuantity: ${item.qty}\nItem total: ${money(item.price*item.qty)}`);
  const orderMessage=`Hello, I would like to place this perfume order:\n\n${orderLines.join('\n\n')}\n\nLocation: ${location}\nSubtotal: ${money(total)}\nDelivery: ${money(DELIVERY_FEE)}\nTotal: ${money(total+DELIVERY_FEE)}`;
  q('#whatsappCheckout').href=`https://wa.me/96179195270?text=${encodeURIComponent(orderMessage)}`;
}
function renderCart(){
  const count=cartCount(),total=cart.reduce((sum,item)=>sum+item.price*item.qty,0);
  q('#bagCount').textContent=count;q('#drawerCount').textContent=count;q('#cartTotal').textContent=money(total);q('#orderTotal').textContent=money(total+DELIVERY_FEE);
  q('#cartEmpty').hidden=cart.length>0;q('#cartFooter').hidden=!cart.length;
  q('#cartItems').innerHTML=cart.map(item=>`<article class="cart-item"><img src="${item.tier==='VIP'?VIP_PACKAGE_IMAGE:item.image}" alt=""><div><p>${item.size} ML · <span class="cart-tier ${item.tier==='VIP'?'vip':''}">${item.tier||'Regular'}</span></p><h3>${item.name}</h3><div class="qty"><button data-action="minus" data-id="${item.key}" aria-label="Decrease quantity">−</button><span>${item.qty}</span><button data-action="plus" data-id="${item.key}" aria-label="Increase quantity">+</button></div></div><div><strong>${money(item.price*item.qty)}</strong><button class="remove" data-action="remove" data-id="${item.key}">Remove</button></div></article>`).join('');
  updateCheckoutLink(total);
  saveCart();
}
q('#featuredGrid').addEventListener('click',event=>{
  const btn=event.target.closest('.quick-add');
  if(!btn)return;
  const card=btn.closest('.product-card'),size=btn.dataset.size,tier=btn.dataset.tier||'Regular',price=Number(btn.dataset.price),key=`${card.dataset.id}-${size}-${tier.toLowerCase()}`,existing=cart.find(item=>item.key===key);
  if(existing)existing.qty++;else cart.push({key,id:card.dataset.id,name:card.dataset.name,size,tier,price,image:tier==='VIP'?VIP_PACKAGE_IMAGE:card.dataset.image,qty:1});
  q('#toastDetail').textContent=`${size} ML · ${tier} · ${money(price)}`;
  renderCart();q('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>q('#toast').classList.remove('show'),2600);
});
q('#closeToast').addEventListener('click',()=>q('#toast').classList.remove('show'));
q('#bagBtn').addEventListener('click',openCart);q('#closeCart').addEventListener('click',closeCart);q('#cartOverlay').addEventListener('click',closeCart);
q('#deliveryLocation').addEventListener('input',()=>{q('#deliveryLocation').removeAttribute('aria-invalid');q('#locationError').textContent='';updateCheckoutLink(cart.reduce((sum,item)=>sum+item.price*item.qty,0))});
q('#whatsappCheckout').addEventListener('click',event=>{const location=q('#deliveryLocation');if(!location.value.trim()){event.preventDefault();location.setAttribute('aria-invalid','true');q('#locationError').textContent='Please enter your delivery location.';location.focus();return}setTimeout(()=>{cart=[];renderCart();closeCart()},0)});
q('#emptyShop').addEventListener('click',()=>{window.location.href='shop.html'});
q('#cartItems').addEventListener('click',e=>{const button=e.target.closest('[data-action]');if(!button)return;const item=cart.find(i=>i.key===button.dataset.id);if(!item)return;if(button.dataset.action==='plus')item.qty++;if(button.dataset.action==='minus')item.qty--;if(button.dataset.action==='remove'||item.qty<1)cart=cart.filter(i=>i.key!==item.key);renderCart()});
async function loadFeaturedProducts(){
  let supabase;
  try{supabase=await getSupabase()}catch(error){console.error('Unable to initialize Supabase:',error);return}
  const [catalogResult,sizeResult,featuredResult]=await Promise.all([
    supabase.from('perfume_catalog').select('id',{count:'exact',head:true}),
    supabase.from('sizes').select('id',{count:'exact',head:true}),
    supabase.from('perfume_catalog').select('*').eq('is_featured',true).order('id',{ascending:true}).limit(6),
  ]);
  const error=catalogResult.error||sizeResult.error||featuredResult.error;
  if(error){console.error('Unable to load live catalog numbers:',error);return}
  const data=featuredResult.data??[];
  const updateCount=(selector,value)=>qa(selector).forEach(element=>{element.textContent=Number(value??0).toLocaleString()});
  updateCount('[data-catalog-count]',catalogResult.count);
  updateCount('[data-featured-count]',data.length);
  updateCount('[data-size-count]',sizeResult.count);
  q('#featuredGrid').innerHTML=data.map((product,index)=>{
    const productName=`${product.brand_name} ${product.name}`.trim();
    const productImage=productImageForPosition(index,10);
    const sizes=Array.isArray(product.sizes)?product.sizes:[];
    const options=sizes.map(size=>{const price=size.override_price??size.default_price??size.price;const hasVip=size.vip_enabled===true&&size.vip_price!==null;return `<div class="featured-size ${hasVip?'has-vip':''}"><span>${escapeHtml(size.capacity)} ML</span><div><button class="quick-add" data-size="${escapeHtml(size.capacity)}" data-tier="Regular" data-price="${escapeHtml(price)}"><small>Regular</small><b>${money(Number(price))}</b></button>${hasVip?`<button class="quick-add vip" data-size="${escapeHtml(size.capacity)}" data-tier="VIP" data-price="${escapeHtml(size.vip_price)}"><small>VIP</small><b>${money(Number(size.vip_price))}</b></button>`:''}</div></div>`}).join('');
    return `<article class="product-card reveal visible" data-id="${escapeHtml(product.id)}" data-name="${escapeHtml(productName)}" data-image="${escapeHtml(productImage)}"><div class="product-image"><div class="product-image-track" tabindex="0" aria-label="Images for ${escapeHtml(productName)}"><div class="product-image-slide"><img loading="lazy" src="${escapeHtml(productImage)}" alt="${escapeHtml(productName)} bottle"><span class="image-edition">Regular</span></div><div class="product-image-slide"><img loading="lazy" src="assets/nectar-vip-package.jpeg" alt="Nectar VIP presentation package for ${escapeHtml(productName)}"><span class="image-edition vip">VIP package</span></div></div></div><div class="product-info"><p>${escapeHtml(product.brand_name)}</p><h3>${escapeHtml(product.brand_name)}<br>${escapeHtml(product.name)}</h3><div class="featured-options">${options}</div></div></article>`;
  }).join('');
}

document.addEventListener('keydown',e=>{if(e.key==='Escape')closeCart()});renderCart();loadFeaturedProducts();
if(new URLSearchParams(window.location.search).get('bag')==='open')openCart();
