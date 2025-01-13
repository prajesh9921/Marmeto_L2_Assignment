// Format price in Indian Rupees
const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(price).replace('₹', 'Rs. ');
};

// Cart state management
let cartItems = [];

// Loading spinner
const showLoader = () => {
    const loader = document.createElement('div');
    loader.className = 'loader';
    loader.innerHTML = `
        <div style="
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            padding: 20px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
        ">
            <div style="margin-bottom: 10px;">Loading cart...</div>
            <div class="spinner"></div>
        </div>
    `;
    document.body.appendChild(loader);
};

const hideLoader = () => {
    const loader = document.querySelector('.loader');
    if (loader) {
        loader.remove();
    }
};

// Load cart data from API
const loadCartData = async () => {
    showLoader();
    try {
        const response = await fetch('https://cdn.shopify.com/s/files/1/0883/2188/4479/files/apiCartData.json?v=1728384889');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        cartItems = data.items.map(item => ({
            ...item,
            price: item.price / 100,
            line_price: item.line_price / 100,
            final_line_price: item.final_line_price / 100
        }));
        
        renderCart();
    } catch (error) {
        console.error('Error loading cart data:', error);
        document.querySelector('.cart-items').innerHTML = `
            <div style="padding: 20px; text-align: center; color: red;">
                Failed to load cart data. Please try again later.
                <button onclick="loadCartData()" style="
                    margin-top: 10px;
                    padding: 8px 16px;
                    background: #B88E2F;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                ">Retry</button>
            </div>
        `;
    } finally {
        hideLoader();
    }
};

// Cart items
const renderCart = () => {
    const cartContainer = document.querySelector('.cart-items');
    
    if (!cartItems.length) {
        cartContainer.innerHTML = `
            <div style="padding: 40px; text-align: center;">
                <p>Your cart is empty</p>
                <a style="
                    display: inline-block;
                    margin-top: 20px;
                    padding: 10px 20px;
                    background: #B88E2F;
                    color: white;
                    text-decoration: none;
                    border-radius: 4px;
                ">Continue Shopping</a>
            </div>
        `;
        return;
    }

    cartContainer.innerHTML = cartItems.map(item => `
        <div class="cart-item" data-id="${item.id}">
            <div class="product-info">
                <img src="${item.image}" alt="${item.title}" 
                     onerror="this.src='placeholder.jpg'">
                <span>${item.title}</span>
            </div>
            <div>${formatPrice(item.price)}</div>
            <div>
                <input type="number" 
                       class="quantity-input" 
                       value="${item.quantity}" 
                       min="1"
                       max="99">
            </div>
            <div>${formatPrice(item.price * item.quantity)}</div>
            <div class="remove-item">
                <i class="fas fa-trash"></i>
            </div>
        </div>
    `).join('');

    updateTotals();
};

// Updating cart totals
const updateTotals = () => {
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    document.querySelector('.subtotal').textContent = formatPrice(subtotal);
    document.querySelector('.total').textContent = formatPrice(subtotal);

    // Updating cart icon count.
    const cartCount = document.querySelector('.cart-count');
    if (cartCount) {
        const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
    }
};

// Handeling quantity changes
const handleQuantityChange = (itemId, newQuantity) => {
    const itemIndex = cartItems.findIndex(item => item.id == itemId);
    if (itemIndex !== -1) {
        // Ensuring quantity is within valid range
        newQuantity = Math.max(1, Math.min(99, newQuantity));
        cartItems[itemIndex].quantity = newQuantity;
        updateTotals();
        
        // Updating the display of the specific item's subtotal
        const itemElement = document.querySelector(`.cart-item[data-id="${itemId}"]`);
        const subtotalElement = itemElement.querySelector('div:nth-child(4)');
        subtotalElement.textContent = formatPrice(cartItems[itemIndex].price * newQuantity);
    }
};

// Item removal
const removeItem = (itemId) => {
    if (confirm('Are you sure you want to remove this item from your cart?')) {
        cartItems = cartItems.filter(item => item.id != itemId);
        renderCart();
    }
};

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    loadCartData();

    // Quantity changes
    document.addEventListener('change', (e) => {
        if (e.target.classList.contains('quantity-input')) {
            const itemId = e.target.closest('.cart-item').dataset.id;
            const quantity = parseInt(e.target.value);
            handleQuantityChange(itemId, quantity);
        }
    });

    // Item removal
    document.addEventListener('click', (e) => {
        if (e.target.closest('.remove-item')) {
            const itemId = e.target.closest('.cart-item').dataset.id;
            removeItem(itemId);
        }
    });

    // Checkout button
    const checkoutButton = document.querySelector('.checkout-btn');
    if (checkoutButton) {
        checkoutButton.addEventListener('click', () => {
            if (cartItems.length === 0) {
                alert('Your cart is empty');
                return;
            }
            alert('Proceeding to checkout...');
        });
    }
});