const catalog=Array.isArray(window.CATALOG)?window.CATALOG:[];
const $=(s,c=document)=>c.querySelector(s), $$=(s,c=document)=>[...c.querySelectorAll(s)];
const PAGE_SIZE=32;
let activeGender='all',query='',sort='featured',visible=PAGE_SIZE,filtered=[];

const counts=catalog.reduce((acc,p)=>(acc[p.gender]=(acc[p.gender]||0)+1,acc),{women:0,men:0,unisex:0});
$('#countAll').textContent=catalog.length.toLocaleString();$('#countWomen').textContent=(counts.women||0).toLocaleString();$('#countMen').textContent=(counts.men||0).toLocaleString();$('#countUnisex').textContent=(counts.unisex||0).toLocaleString();$('#totalCount').textContent=catalog.length.toLocaleString();

function escapeHtml(value){return String(value).replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]))}
function productCard(p){
  const title=escapeHtml(p.title.replace(/^Our Creation of\s*/i,''));
  return `<article class="product-card" data-gender="${p.gender}" data-product-id="${p.id}"><a class="product-link" href="${escapeHtml(p.url)}" target="_blank" rel="noopener" aria-label="View ${escapeHtml(p.title)}"><div class="product-image"><span class="gender-tag">${p.gender}</span><span class="open-arrow">↗</span><img loading="lazy" src="${escapeHtml(p.image)}" alt="${escapeHtml(p.title)} bottle"></div></a><div class="product-info"><div class="product-vendor">${escapeHtml(p.vendor||'Nectar creation')}</div><h2>${title}</h2><div class="size-options" role="group" aria-label="Choose bottle size"><button class="size-option selected" data-size="50" data-price="7" aria-pressed="true"><span>50 ML</span><strong>$7</strong></button><button class="size-option" data-size="100" data-price="11" aria-pressed="false"><span>100 ML</span><strong>$11</strong></button></div></div></article>`;
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
$('#productGrid').addEventListener('click',event=>{const option=event.target.closest('.size-option');if(!option)return;const card=option.closest('.product-card');card.querySelectorAll('.size-option').forEach(button=>{const selected=button===option;button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',String(selected))})});
$('#clearFilters').addEventListener('click',()=>{activeGender='all';query='';sort='featured';$('#searchInput').value='';$('#sortSelect').value='featured';$$('.filter').forEach(b=>b.classList.toggle('active',b.dataset.filter==='all'));applyFilters()});

const glow=$('.cursor-glow');window.addEventListener('pointermove',event=>{glow.style.left=event.clientX+'px';glow.style.top=event.clientY+'px'});
applyFilters();
