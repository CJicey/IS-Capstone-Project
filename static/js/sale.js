function updateCartCountDisplay() {
    const cart = JSON.parse(sessionStorage.getItem('cart')) || [];
    document.getElementById('cart-count').textContent = cart.length;
}

function addToCart(productName, price) {
    let cart = JSON.parse(sessionStorage.getItem('cart')) || [];
    cart.push({ name: productName, price: price });
    sessionStorage.setItem('cart', JSON.stringify(cart));
    updateCartCountDisplay();
}
document.addEventListener('DOMContentLoaded', updateCartCountDisplay);
