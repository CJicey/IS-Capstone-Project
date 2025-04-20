document.addEventListener("DOMContentLoaded", function () {
    updateCartCount();
    populateCartPreview();
});

function addToCart(productName, productPrice) {
    if (!productName || !productPrice) {
        console.error("Missing product name or price!");
        return;
    }

    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    const existingIndex = cart.findIndex(item => item.name === productName);

    if (existingIndex !== -1) {
        cart[existingIndex].quantity += 1;
    } else {
        cart.push({
            name: productName,
            price: productPrice,
            quantity: 1
        });
    }

    localStorage.setItem("cart", JSON.stringify(cart));

    const totalCount = cart.reduce((acc, item) => acc + item.quantity, 0);
    localStorage.setItem("cartCount", totalCount.toString());

    updateCartCount();
    populateCartPreview();
}

function updateCartCount() {
    const countElement = document.getElementById("cart-count");
    const count = parseInt(localStorage.getItem("cartCount")) || 0;
    countElement.textContent = count;

    const icon = document.querySelector(".cart-icon");
    if (icon) {
        icon.style.transform = "scale(1.2)";
        setTimeout(() => {
            icon.style.transform = "scale(1)";
        }, 300);
    }
}

function populateCartPreview() {
    const cartItemsContainer = document.getElementById("cart-items");
    if (!cartItemsContainer) return;

    cartItemsContainer.innerHTML = "";
    const cart = JSON.parse(localStorage.getItem("cart")) || [];

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = "<li>Your cart is empty.</li>";
        return;
    }

    let subtotal = 0;

    cart.forEach(item => {
        const li = document.createElement("li");
        li.textContent = `${item.name} - $${item.price.toFixed(2)} x ${item.quantity}`;
        cartItemsContainer.appendChild(li);
        subtotal += item.price * item.quantity;
    });

    const subtotalItem = document.createElement("li");
    subtotalItem.style.fontWeight = "bold";
    subtotalItem.style.marginTop = "10px";
    subtotalItem.textContent = `Subtotal: $${subtotal.toFixed(2)}`;
    cartItemsContainer.appendChild(subtotalItem);
}
