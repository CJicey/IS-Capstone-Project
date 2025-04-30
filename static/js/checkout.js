document.addEventListener("DOMContentLoaded", function () {
    // Initial UI updates
    updateCartCount();             // Update cart item count in header
    updateCartTotalDisplay();     // Show cart total at page load

    // DOM elements
    const checkoutForm = document.getElementById("checkout-form");
    const creditCardInput = document.getElementById("creditcard");
    const cardTypeDisplay = document.getElementById("card-type");
    const checkoutButton = document.querySelector(".button");

    // Function to determine credit card type based on prefix pattern
    function getCardType(number) {
        if (/^4/.test(number)) return "Visa";
        if (/^5[1-5]/.test(number)) return "MasterCard";
        if (/^3[47]/.test(number)) return "American Express";
        return ""; // Unknown type
    }

    // Event listener for real-time credit card formatting and type detection
    creditCardInput?.addEventListener("input", function (e) {
        const rawDigits = e.target.value.replace(/\D/g, ""); // Remove non-digits
        let formatted = rawDigits;
        const cardType = getCardType(rawDigits);

        // Format card number based on type
        if (cardType === "American Express") {
        // AmEx: 4-6-5 digit format
            formatted = rawDigits.replace(/^(\d{4})(\d{0,6})(\d{0,5}).*/, (_, g1, g2, g3) =>
                [g1, g2, g3].filter(Boolean).join(" ")
                ).slice(0, 17);
            } else {
            // Other cards: group in 4s
            formatted = rawDigits.replace(/(.{4})/g, "$1 ").trim().slice(0, 19);
            }

        e.target.value = formatted;
        creditCardInput.setSelectionRange(formatted.length, formatted.length); // Maintain cursor at end

        // Show card type if enough digits entered
        cardTypeDisplay.textContent = rawDigits.length >= 6
            ? (cardType ? `Card Type: ${cardType}` : "Unknown Card Type")
            : "";
    });

    // Event listener for checkout form submission
    checkoutForm?.addEventListener("submit", async function (event) {
        event.preventDefault(); // Prevent default form action
        checkoutButton.disabled = true;
        checkoutButton.textContent = "Processing...";

        // Gather input data
        const formData = {
            fname: document.getElementById("fname").value.trim(),
            lname: document.getElementById("lname").value.trim(),
            address: document.getElementById("address").value.trim(),
            city: document.getElementById("city").value.trim(),
            state: document.getElementById("state").value.trim(),
            zipcode: document.getElementById("zipcode").value.trim(),
            creditcard: creditCardInput.value.replace(/\s+/g, ""), // Remove spaces
            expdate: document.getElementById("expdate").value.trim(),
            CVV: document.getElementById("CVV").value.trim()
        };

        // Validate form: check for empty fields
        if (Object.values(formData).some(v => !v)) {
            alert("Please fill in all required fields.");
            checkoutButton.disabled = false;
            checkoutButton.textContent = "Checkout Now";
            return;
        }

        // Retrieve cart from localStorage and calculate total
        const cart = JSON.parse(localStorage.getItem("cart")) || [];
        const totalAmount = cart.reduce((sum, item) => {
            return sum + parseFloat(item.price) * item.quantity;
        }, 0);

        // Include cart data and total in form submission
        formData.totalAmount = totalAmount;
        formData.cart = cart;

        try {
            // Send data to backend
            const response = await fetch("/process_payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            // Handle response
            if (response.ok && data.status === "success") {
                alert(`✅ Transaction Approved!\nCard Type: ${data.card_type}\nMasked: ${data.masked_card}\nAmount: $${data.amount}`);
                checkoutForm.reset();
                cardTypeDisplay.textContent = "";

                // Clear cart on success
                localStorage.removeItem("cart");
                localStorage.setItem("cartCount", "0");
                updateCartCount();
                populateCartPreview();
                updateCartTotalDisplay();
            } else {
                alert(`❌ Transaction Failed\nReason: ${data.message}`);
            }
        } catch (error) {
            console.error("⚠️ Error processing transaction:", error);
            alert("An error occurred while processing your payment. Please try again.");
        } finally {
            checkoutButton.disabled = false;
            checkoutButton.textContent = "Checkout Now";
        }
    });
});

// Updates the cart item count in the UI
function updateCartCount() {
    const countElement = document.getElementById("cart-count");
    let cartItemCount = parseInt(localStorage.getItem('cartCount')) || 0;
    countElement.textContent = cartItemCount;

    // Animate icon briefly
    const icon = document.querySelector(".cart-icon");
    icon.style.transform = "scale(1.2)";
    setTimeout(() => {
        icon.style.transform = "scale(1)";
    }, 300);
}

// Toggle the visibility of the cart preview dropdown
function toggleCartPreview() {
    const preview = document.getElementById("cart-preview");
    preview.style.display = preview.style.display === "block" ? "none" : "block";
    populateCartPreview(); // Always refresh preview content
}

// Populate the cart preview area with items from localStorage
function populateCartPreview() {
    const cartItemsContainer = document.getElementById("cart-items");
    cartItemsContainer.innerHTML = "";

    const cart = JSON.parse(localStorage.getItem("cart")) || [];

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = "<li>Your cart is empty.</li>";
        updateCartTotalDisplay();
        return;
    }

    cart.forEach((item, index) => {
        const li = document.createElement("li");
        li.innerHTML = `
            ${item.name} - $${parseFloat(item.price).toFixed(2)} x ${item.quantity}
            <button onclick="removeFromCart(${index})" style="margin-left:10px; background:red; color:white; border:none; padding:2px 6px; cursor:pointer;">Remove</button>
        `;
        cartItemsContainer.appendChild(li);
    });

    updateCartTotalDisplay();
}

// Remove an item from the cart by index and update all displays
function removeFromCart(index) {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];

    if (index >= 0 && index < cart.length) {
        let cartCount = parseInt(localStorage.getItem("cartCount")) || 0;
        cartCount -= cart[index].quantity;
        if (cartCount < 0) cartCount = 0;

        // Remove item and update storage
        cart.splice(index, 1);
        localStorage.setItem("cart", JSON.stringify(cart));
        localStorage.setItem("cartCount", cartCount.toString());

        // Refresh displays
        updateCartCount();
        populateCartPreview();
        updateCartTotalDisplay();
    }
}

// Calculate and display the total cost of items in the cart
function updateCartTotalDisplay() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const total = cart.reduce((sum, item) => {
        return sum + parseFloat(item.price) * item.quantity;
    }, 0);

    const totalDisplay = document.getElementById("cart-total");
    if (totalDisplay) {
        totalDisplay.textContent = `Total: $${total.toFixed(2)}`;
    }
}