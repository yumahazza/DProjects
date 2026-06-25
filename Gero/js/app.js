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
        document.documentElement.classList.remove('dark');
        const stored = localStorage.getItem('theme');
        if(stored === 'dark') { applyThemeClass(true); updateToggleUI(true); return }
        if(stored === 'light') { applyThemeClass(false); updateToggleUI(false); return }
        // no stored preference: default to light theme
        updateToggleUI(false);
    }

    function saveTheme(isDark){
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }

    themeToggle?.addEventListener('click', ()=>{
        const isDark = !document.documentElement.classList.contains('dark');
        applyThemeClass(isDark);
        saveTheme(isDark);
        updateToggleUI(isDark);
    });

    const productIndex = {};

    async function loadProducts(){
        const basePath = window.location.pathname.includes('/pages/') ? '../' : '';
        const productsUrl = `${basePath}data/products.json`;
        const container = document.getElementById('cont_card');

        try {
            const response = await fetch(productsUrl);
            if(!response.ok) throw new Error('Unable to fetch products');
            const products = await response.json();
            const formatter = new Intl.NumberFormat('id-ID');

            products.forEach(product => {
                productIndex[product.id] = product;
            });

            if(container){
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
            }
        } catch (error) {
            if(container) container.innerHTML = '<p class="error">Gagal memuat produk. Silakan refresh halaman.</p>';
            console.error(error);
        }
    }

    function resolveProduct(id){
        return productIndex[id] || {id, name: id, price: 0};
    }

    // Cart and product helpers
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

        const messageEl = document.getElementById('cart-message');
        if(messageEl) messageEl.textContent = '';

        if(items.length === 0) {
            cartListEl.innerHTML = '<p>Keranjang kosong.</p>';
            document.getElementById('confirm-rental')?.setAttribute('disabled', '');
            return;
        }

        let total = 0;
        cartListEl.innerHTML = items.map(item => {
            const product = resolveProduct(item.id);
            const subtotal = product.price * item.qty;
            total += subtotal;
            return `
                <div class="cart-item" data-id="${item.id}">
                    <div class="cart-item-details">
                        <strong>${product.name}</strong>
                        <div>${item.qty} x Rp ${fmt(product.price)} = Rp ${fmt(subtotal)}</div>
                    </div>
                    <div class="cart-controls">
                        <button type="button" class="cart-control" data-action="decrease" data-id="${item.id}" aria-label="Kurangi jumlah">−</button>
                        <button type="button" class="cart-control" data-action="increase" data-id="${item.id}" aria-label="Tambah jumlah">+</button>
                        <button type="button" class="cart-item-remove" data-action="remove" data-id="${item.id}">Hapus</button>
                    </div>
                </div>`;
        }).join('') + `
            <div class="cart-total">Total: <strong>Rp ${fmt(total)}</strong></div>`;

        document.getElementById('confirm-rental')?.removeAttribute('disabled');
    }

    function handleCartAction(event){
        const button = event.target.closest('[data-action]');
        if(!button) return;
        const action = button.dataset.action;
        const id = button.dataset.id;
        if(!id) return;

        if(action === 'increase') updateQuantity(id, 1);
        if(action === 'decrease') updateQuantity(id, -1);
        if(action === 'remove') removeItem(id);
    }

    function updateQuantity(id, delta){
        const items = getCart();
        const item = items.find(i=>i.id===id);
        if(!item) return;
        item.qty += delta;
        if(item.qty <= 0) return removeItem(id);
        setCart(items);
    }

    function removeItem(id){
        const items = getCart().filter(i=>i.id !== id);
        setCart(items);
    }

    function confirmRental(){
        const items = getCart();
        if(items.length === 0) return;
        localStorage.removeItem('cart');
        renderCart();
        const messageEl = document.getElementById('cart-message');
        if(messageEl) messageEl.textContent = 'Sewa berhasil dikonfirmasi. Terima kasih!';
    }

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

    function wireCartActions(){
        document.body.addEventListener('click', handleCartAction);
        document.getElementById('confirm-rental')?.addEventListener('click', confirmRental);
    }

    loadTheme();
    loadProducts();
    renderCart();
    wireCartActions();
})();
