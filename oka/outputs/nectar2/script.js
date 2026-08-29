const q=(s,c=document)=>c.querySelector(s), qa=(s,c=document)=>[...c.querySelectorAll(s)];

const glow=q('.cursor-glow');
window.addEventListener('pointermove',e=>{glow.style.left=e.clientX+'px';glow.style.top=e.clientY+'px'});
window.addEventListener('scroll',()=>q('#nav').classList.toggle('scrolled',scrollY>40),{passive:true});

const observer=new IntersectionObserver(entries=>entries.forEach((e,i)=>{
  if(e.isIntersecting){setTimeout(()=>e.target.classList.add('visible'),i*70);observer.unobserve(e.target)}
}),{threshold:.15});
qa('.reveal').forEach(el=>observer.observe(el));

function addTilt(el,intensity=8){
  el.addEventListener('pointermove',e=>{const r=el.getBoundingClientRect();const x=(e.clientX-r.left)/r.width-.5;const y=(e.clientY-r.top)/r.height-.5;el.style.transform=`perspective(1000px) rotateX(${-y*intensity}deg) rotateY(${x*intensity}deg) scale(1.015)`});
  el.addEventListener('pointerleave',()=>el.style.transform='perspective(1000px) rotateX(0) rotateY(0) scale(1)');
}
addTilt(q('#heroTilt'),2);addTilt(q('#ritualTilt'),7);

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

let cart=[],toastTimer;
const money=n=>`$${n}`;
function cartCount(){return cart.reduce((sum,item)=>sum+item.qty,0)}
function openCart(){q('#cartDrawer').classList.add('open');q('#cartOverlay').classList.add('open');q('#cartDrawer').setAttribute('aria-hidden','false');document.body.classList.add('cart-open')}
function closeCart(){q('#cartDrawer').classList.remove('open');q('#cartOverlay').classList.remove('open');q('#cartDrawer').setAttribute('aria-hidden','true');document.body.classList.remove('cart-open')}
function renderCart(){
  const count=cartCount(),total=cart.reduce((sum,item)=>sum+item.price*item.qty,0);
  q('#bagCount').textContent=count;q('#drawerCount').textContent=count;q('#cartTotal').textContent=money(total);
  q('#cartEmpty').hidden=cart.length>0;q('#cartFooter').hidden=!cart.length;
  q('#cartItems').innerHTML=cart.map(item=>`<article class="cart-item"><img src="${item.image}" alt=""><div><p>${item.size} ML · Eau de parfum</p><h3>${item.name}</h3><div class="qty"><button data-action="minus" data-id="${item.key}" aria-label="Decrease quantity">−</button><span>${item.qty}</span><button data-action="plus" data-id="${item.key}" aria-label="Increase quantity">+</button></div></div><div><strong>${money(item.price*item.qty)}</strong><button class="remove" data-action="remove" data-id="${item.key}">Remove</button></div></article>`).join('');
}
qa('.quick-add').forEach(btn=>btn.addEventListener('click',()=>{
  const card=btn.closest('.product-card'),size=btn.dataset.size,price=Number(btn.dataset.price),key=`${card.dataset.id}-${size}`,existing=cart.find(item=>item.key===key);
  if(existing)existing.qty++;else cart.push({key,id:card.dataset.id,name:card.dataset.name,size,price,image:card.dataset.image,qty:1});
  q('#toastDetail').textContent=`${size} ML · ${money(price)}`;
  renderCart();q('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>q('#toast').classList.remove('show'),2600);
}));
q('#closeToast').addEventListener('click',()=>q('#toast').classList.remove('show'));
q('#bagBtn').addEventListener('click',openCart);q('#closeCart').addEventListener('click',closeCart);q('#cartOverlay').addEventListener('click',closeCart);
q('#emptyShop').addEventListener('click',()=>{window.location.href='shop.html'});
q('#cartItems').addEventListener('click',e=>{const button=e.target.closest('[data-action]');if(!button)return;const item=cart.find(i=>i.key===button.dataset.id);if(!item)return;if(button.dataset.action==='plus')item.qty++;if(button.dataset.action==='minus')item.qty--;if(button.dataset.action==='remove'||item.qty<1)cart=cart.filter(i=>i.key!==item.key);renderCart()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeCart()});renderCart();
