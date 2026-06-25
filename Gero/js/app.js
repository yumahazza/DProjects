(function(){
    const themeToggle = document.getElementById('theme-toggle');
    const cartCountEl = document.getElementById('cart-count');
    const cartListEl = document.getElementById('cart-list');

    function applyThemeClass(isDark){
        if(isDark) document.documentElement.classList.add('dark'); 
        else document.documentElement.classList.remove('dark');
    }

    function updateToggleUI(isDark){
        if(!themeToggle) return;
        themeToggle.setAttribute('aria-pressed', isDark ? 'true' : 'false');
        themeToggle.textContent = isDark ? '🌙' : '🌓';
    }

    function loadTheme(){
        const stored = localStorage.getItem('theme');
        if(stored === 'light') { applyThemeClass(true); updateToggleUI(true); document.documentElement.classList.remove('prefers-set'); return }
        if(stored === 'dark') { applyThemeClass(false); updateToggleUI(false); document.documentElement.classList.remove('prefers-set'); return }
        // no stored preference: mark that we used OS preference fallback
        document.documentElement.classList.add('prefers-set');
        const isOsDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        applyThemeClass(isOsDark);
        updateToggleUI(isOsDark);
    }

    function saveTheme(isDark){
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        // When user explicitly sets theme remove prefers-set marker
        document.documentElement.classList.remove('prefers-set');
    }

    themeToggle?.addEventListener('click', ()=>{
        const isDark = !document.documentElement.classList.contains('dark');
        applyThemeClass(isDark);
        saveTheme(isDark);
        updateToggleUI(isDark);
    });

    async function loadProducts(){
        const container = document.getElementById('cont_card');
        if(!container) return;

        try {
            const response = await fetch('data/products.json');
            if(!response.ok) throw new Error('Unable to fetch products');
            const products = await response.json();
            const formatter = new Intl.NumberFormat('id-ID');

            container.innerHTML = products.map(product => {
                return `
                    <article class="card_prod" role="listitem" data-id="${product.id}" data-price="${product.price}">
                        <img alt="${product.name}" src="${product.image}">
                        <h3>${product.name}</h3>
                        <p class="muted">${product.category}</p>
                        <p class="price" data-value="${product.price}">Rp ${formatter.format(product.price)} / hari</p>
                        <div class="card-actions">
                            <button class="btn add-cart">Add to cart</button>
                        </div>
                    </article>`;
            }).join('');
            wireButtons();
        } catch (error) {
            container.innerHTML = '<p class="error">Gagal memuat produk. Silakan refresh halaman.</p>';
            console.error(error);
        }
    }

    // Cart
    function getCart(){
        try{ return JSON.parse(localStorage.getItem('cart')||'[]') }catch(e){ return [] }
    }
    function setCart(items){
        localStorage.setItem('cart', JSON.stringify(items));
        renderCart();
    }

    function addToCart(id){
        const items = getCart();
        const found = items.find(i=>i.id===id);
        if(found) found.qty += 1; else items.push({id, qty:1});
        setCart(items);
    }

    function fmt(num){ return new Intl.NumberFormat('id-ID').format(num) }

    function renderCart(){
        const items = getCart();
        cartCountEl && (cartCountEl.textContent = items.reduce((s,i)=>s+i.qty,0));
        if(!cartListEl) return;
        if(items.length === 0) { cartListEl.textContent = 'Keranjang kosong.'; return }
        let total = 0;
        const rows = items.map(it=>{
            const card = document.querySelector(`[data-id="${it.id}"]`);
            const name = card ? (card.querySelector('h3')?.textContent || it.id) : it.id;
            const price = card ? parseFloat(card.dataset.price || (card.querySelector('.price')?.dataset?.value)) || 0 : 0;
            const subtotal = price * it.qty;
            total += subtotal;
            return {name, qty: it.qty, price, subtotal};
        });
        cartListEl.innerHTML = '<ul>' + rows.map(r=>`<li>${r.name} — Rp ${fmt(r.price)} × ${r.qty} = Rp ${fmt(r.subtotal)}</li>`).join('') + '</ul>' +
            `<div class="cart-total">Total: <strong>Rp ${fmt(total)}</strong></div>`;
    }

    // Fungsi add-to-cart
    function wireButtons(){
        document.querySelectorAll('.add-cart').forEach(btn=>{
        btn.addEventListener('click', ()=>{
            const article = btn.closest('[data-id]');
            const id = article?.getAttribute('data-id');
            if(!id) return;
            addToCart(id);
        });
        });
    }

    loadTheme();
    loadProducts();
    renderCart();
})();
