// Run after the page is fully loaded
document.addEventListener("DOMContentLoaded", function () {
    updateCartCount();       // Update the cart icon count when the page loads
    populateCartPreview();   // Populate the cart preview area with items from localStorage
});

// Function to add a product to the cart
function addToCart(productName, productPrice) {
    // Validation: Ensure both name and price are provided
    if (!productName || !productPrice) {
        console.error("Missing product name or price!");
        return;
    }

    // Get current cart from localStorage or initialize as empty array
    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    // Check if product already exists in cart
    const existingIndex = cart.findIndex(item => item.name === productName);

    if (existingIndex !== -1) {
        // If product exists, increment quantity
        cart[existingIndex].quantity += 1;
    } else {
        // If new product, add it with quantity of 1
        cart.push({
            name: productName,
            price: productPrice,
            quantity: 1
        });
    }

    // Save updated cart to localStorage
    localStorage.setItem("cart", JSON.stringify(cart));

    // Recalculate and save total item count in cart
    const totalCount = cart.reduce((acc, item) => acc + item.quantity, 0);
    localStorage.setItem("cartCount", totalCount.toString());

    // Refresh UI to reflect new cart contents
    updateCartCount();
    populateCartPreview();
}

// Function to update the visual cart count on the UI
function updateCartCount() {
    const countElement = document.getElementById("cart-count");
    const count = parseInt(localStorage.getItem("cartCount")) || 0;
    countElement.textContent = count;  // Set count text

    const icon = document.querySelector(".cart-icon");
    if (icon) {
        // Animate the cart icon for user feedback
        icon.style.transform = "scale(1.2)";
        setTimeout(() => {
            icon.style.transform = "scale(1)";
        }, 300);
    }
}

// Function to populate the cart preview dropdown or sidebar
function populateCartPreview() {
    const cartItemsContainer = document.getElementById("cart-items");
    if (!cartItemsContainer) return;  // Exit if container not found

    cartItemsContainer.innerHTML = ""; // Clear previous contents
    const cart = JSON.parse(localStorage.getItem("cart")) || [];

    // If cart is empty, show message
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = "<li>Your cart is empty.</li>";
        return;
    }

    let subtotal = 0; // Initialize subtotal

    // Loop through cart and add each item to the preview
    cart.forEach(item => {
        const li = document.createElement("li");
        li.textContent = `${item.name} - $${item.price.toFixed(2)} x ${item.quantity}`;
        cartItemsContainer.appendChild(li);

        subtotal += item.price * item.quantity; // Add to subtotal
    });

    // Add subtotal at the end of the list
    const subtotalItem = document.createElement("li");
    subtotalItem.style.fontWeight = "bold";
    subtotalItem.style.marginTop = "10px";
    subtotalItem.textContent = `Subtotal: $${subtotal.toFixed(2)}`;
    cartItemsContainer.appendChild(subtotalItem);
}
