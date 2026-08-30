const catalog=Array.isArray(window.CATALOG)?window.CATALOG:[];
const $=(s,c=document)=>c.querySelector(s), $$=(s,c=document)=>[...c.querySelectorAll(s)];
const PAGE_SIZE=32;
let activeGender='all',query='',sort='featured',visible=PAGE_SIZE,filtered=[];

const menuToggle=$('#menuToggle'),mainMenu=$('#mainMenu');
function closeMenu(){if(!menuToggle||!mainMenu)return;mainMenu.classList.remove('open');menuToggle.classList.remove('open');menuToggle.setAttribute('aria-expanded','false');menuToggle.setAttribute('aria-label','Open menu');document.body.classList.remove('menu-open')}
if(menuToggle&&mainMenu){menuToggle.addEventListener('click',()=>{const opening=!mainMenu.classList.contains('open');mainMenu.classList.toggle('open',opening);menuToggle.classList.toggle('open',opening);menuToggle.setAttribute('aria-expanded',String(opening));menuToggle.setAttribute('aria-label',opening?'Close menu':'Open menu');document.body.classList.toggle('menu-open',opening)});mainMenu.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeMenu));document.addEventListener('keydown',event=>{if(event.key==='Escape')closeMenu()});window.addEventListener('resize',()=>{if(innerWidth>800)closeMenu()})}
window.addEventListener('scroll',()=>$('#nav').classList.toggle('scrolled',scrollY>40),{passive:true});

const counts=catalog.reduce((acc,p)=>(acc[p.gender]=(acc[p.gender]||0)+1,acc),{women:0,men:0,unisex:0});
$('#countAll').textContent=catalog.length.toLocaleString();$('#countWomen').textContent=(counts.women||0).toLocaleString();$('#countMen').textContent=(counts.men||0).toLocaleString();$('#countUnisex').textContent=(counts.unisex||0).toLocaleString();$('#totalCount').textContent=catalog.length.toLocaleString();

function escapeHtml(value){return String(value).replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]))}
const CART_KEY='nectar-cart';
function loadCart(){try{const saved=JSON.parse(localStorage.getItem(CART_KEY));return Array.isArray(saved)?saved:[]}catch{return[]}}
let cart=loadCart(),toastTimer;
const money=value=>`$${value}`;
function saveCart(){localStorage.setItem(CART_KEY,JSON.stringify(cart))}
function cartCount(){return cart.reduce((sum,item)=>sum+item.qty,0)}
function openCart(){$('#cartDrawer').classList.add('open');$('#cartOverlay').classList.add('open');$('#cartDrawer').setAttribute('aria-hidden','false');document.body.classList.add('cart-open')}
function closeCart(){$('#cartDrawer').classList.remove('open');$('#cartOverlay').classList.remove('open');$('#cartDrawer').setAttribute('aria-hidden','true');document.body.classList.remove('cart-open')}
function renderCart(){
  const count=cartCount(),total=cart.reduce((sum,item)=>sum+item.price*item.qty,0);
  $('#bagCount').textContent=count;$('#drawerCount').textContent=count;$('#cartTotal').textContent=money(total);
  $('#cartEmpty').hidden=cart.length>0;$('#cartFooter').hidden=!cart.length;
  $('#cartItems').innerHTML=cart.map(item=>`<article class="cart-item"><img src="${escapeHtml(item.image)}" alt=""><div><p>${escapeHtml(item.size)} ML · Eau de parfum</p><h3>${escapeHtml(item.name)}</h3><div class="qty"><button data-action="minus" data-id="${escapeHtml(item.key)}" aria-label="Decrease quantity">−</button><span>${item.qty}</span><button data-action="plus" data-id="${escapeHtml(item.key)}" aria-label="Increase quantity">+</button></div></div><div><strong>${money(item.price*item.qty)}</strong><button class="remove" data-action="remove" data-id="${escapeHtml(item.key)}">Remove</button></div></article>`).join('');
  const orderLines=cart.map((item,index)=>`${index+1}. ${item.name}\nSize: ${item.size} ML\nQuantity: ${item.qty}\nItem total: ${money(item.price*item.qty)}`);
  const orderMessage=`Hello, I would like to place this perfume order:\n\n${orderLines.join('\n\n')}\n\nSubtotal: ${money(total)}`;
  $('#whatsappCheckout').href=`https://wa.me/96176441471?text=${encodeURIComponent(orderMessage)}`;
  saveCart();
}
function addToCart(product,size,price){
  const key=`${product.id}-${size}`,existing=cart.find(item=>item.key===key);
  if(existing)existing.qty++;else cart.push({key,id:product.id,name:product.title,size,price,image:product.image,qty:1});
  renderCart();
  $('#toastDetail').textContent=`${size} ML · ${money(price)}`;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),2400);
}
function productCard(p){
  const title=escapeHtml(p.title.replace(/^Our Creation of\s*/i,''));
  const genderLabel=p.gender==='unspecified'?'Not specified':p.gender;
  return `<article class="product-card" data-gender="${p.gender}" data-product-id="${p.id}"><div class="product-image"><span class="gender-tag">${genderLabel}</span><img loading="lazy" src="${escapeHtml(p.image)}" alt="${escapeHtml(p.title)} bottle"></div><div class="product-info"><div class="product-vendor">${escapeHtml(p.vendor||'Source catalog')}</div><h2>${title}</h2><div class="size-options" role="group" aria-label="Choose bottle size"><button class="size-option selected" data-size="50" data-price="7" aria-pressed="true"><span>50 ML</span><strong>$7</strong></button><button class="size-option" data-size="100" data-price="11" aria-pressed="false"><span>100 ML</span><strong>$11</strong></button></div><button class="add-to-bag" type="button">Add selected size to bag <span>+</span></button></div></article>`;
}
function applyFilters(reset=true){
  if(reset)visible=PAGE_SIZE;
  const needle=query.trim().toLowerCase();
  filtered=catalog.filter(p=>(activeGender==='all'||p.gender===activeGender)&&(!needle||`${p.title} ${p.vendor}`.toLowerCase().includes(needle)));
  if(sort==='az')filtered.sort((a,b)=>a.title.localeCompare(b.title));
  render();
}
function render(){
  const shown=filtered.slice(0,visible);$('#productGrid').innerHTML=shown.map(productCard).join('');
  $('#resultCount').textContent=filtered.length.toLocaleString();$('#emptyState').hidden=filtered.length!==0;$('#productGrid').hidden=filtered.length===0;
  $('#loadMore').hidden=visible>=filtered.length;$('#progressText').textContent=filtered.length?`Showing ${Math.min(visible,filtered.length).toLocaleString()} of ${filtered.length.toLocaleString()}`:'';
}

$$('.filter').forEach(button=>button.addEventListener('click',()=>{activeGender=button.dataset.filter;$$('.filter').forEach(b=>b.classList.toggle('active',b===button));applyFilters()}));
let searchTimer;$('#searchInput').addEventListener('input',event=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>{query=event.target.value;applyFilters()},140)});
$('#sortSelect').addEventListener('change',event=>{sort=event.target.value;applyFilters()});
$('#loadMore').addEventListener('click',()=>{visible+=PAGE_SIZE;render()});
$('#productGrid').addEventListener('click',event=>{
  const option=event.target.closest('.size-option');
  if(option){const card=option.closest('.product-card');card.querySelectorAll('.size-option').forEach(button=>{const selected=button===option;button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',String(selected))});return}
  const addButton=event.target.closest('.add-to-bag');if(!addButton)return;
  const card=addButton.closest('.product-card'),product=catalog.find(item=>String(item.id)===card.dataset.productId),selected=card.querySelector('.size-option.selected');
  if(!product||!selected)return;addToCart(product,selected.dataset.size,Number(selected.dataset.price));
  addButton.classList.add('added');addButton.firstChild.textContent='Added to bag ';setTimeout(()=>{addButton.classList.remove('added');addButton.firstChild.textContent='Add selected size to bag '},1200);
});
$('#clearFilters').addEventListener('click',()=>{activeGender='all';query='';sort='featured';$('#searchInput').value='';$('#sortSelect').value='featured';$$('.filter').forEach(b=>b.classList.toggle('active',b.dataset.filter==='all'));applyFilters()});

const glow=$('.cursor-glow');window.addEventListener('pointermove',event=>{glow.style.left=event.clientX+'px';glow.style.top=event.clientY+'px'});
$('#bagBtn').addEventListener('click',openCart);$('#closeCart').addEventListener('click',closeCart);$('#cartOverlay').addEventListener('click',closeCart);$('#closeToast').addEventListener('click',()=>$('#toast').classList.remove('show'));
$('#emptyShop').addEventListener('click',()=>{closeCart();$('#filterRail').scrollIntoView({behavior:'smooth'})});
$('#cartItems').addEventListener('click',event=>{const button=event.target.closest('[data-action]');if(!button)return;const item=cart.find(entry=>entry.key===button.dataset.id);if(!item)return;if(button.dataset.action==='plus')item.qty++;if(button.dataset.action==='minus')item.qty--;if(button.dataset.action==='remove'||item.qty<1)cart=cart.filter(entry=>entry.key!==item.key);renderCart()});
document.addEventListener('keydown',event=>{if(event.key==='Escape')closeCart()});
renderCart();applyFilters();
