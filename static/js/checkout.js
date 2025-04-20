document.addEventListener("DOMContentLoaded", function () {
    updateCartCount();
    updateCartTotalDisplay(); // Show total at page load

    const checkoutForm = document.getElementById("checkout-form");
    const creditCardInput = document.getElementById("creditcard");
    const cardTypeDisplay = document.getElementById("card-type");
    const checkoutButton = document.querySelector(".button");

    function getCardType(number) {
        if (/^4/.test(number)) return "Visa";
        if (/^5[1-5]/.test(number)) return "MasterCard";
        if (/^3[47]/.test(number)) return "American Express";
        if (/^6(?:011|5)/.test(number)) return "Discover";
        return "";
    }

    creditCardInput?.addEventListener("input", function (e) {
        const rawDigits = e.target.value.replace(/\D/g, "");
        let formatted = rawDigits;
        const cardType = getCardType(rawDigits);

        // Format
        if (cardType === "American Express") {
            formatted = rawDigits.replace(/^(\d{4})(\d{0,6})(\d{0,5}).*/, (_, g1, g2, g3) =>
                [g1, g2, g3].filter(Boolean).join(" ")
            ).slice(0, 17);
        } else {
            formatted = rawDigits.replace(/(.{4})/g, "$1 ").trim().slice(0, 19);
        }

        e.target.value = formatted;
        creditCardInput.setSelectionRange(formatted.length, formatted.length);

        cardTypeDisplay.textContent = rawDigits.length >= 6
            ? (cardType ? `Card Type: ${cardType}` : "Unknown Card Type")
            : "";
    });

    checkoutForm?.addEventListener("submit", async function (event) {
        event.preventDefault();
        checkoutButton.disabled = true;
        checkoutButton.textContent = "Processing...";

        const formData = {
            fname: document.getElementById("fname").value.trim(),
            lname: document.getElementById("lname").value.trim(),
            address: document.getElementById("address").value.trim(),
            city: document.getElementById("city").value.trim(),
            state: document.getElementById("state").value.trim(),
            zipcode: document.getElementById("zipcode").value.trim(),
            creditcard: creditCardInput.value.replace(/\s+/g, ""),
            expdate: document.getElementById("expdate").value.trim(),
            CVV: document.getElementById("CVV").value.trim()
        };

        if (Object.values(formData).some(v => !v)) {
            alert("Please fill in all required fields.");
            checkoutButton.disabled = false;
            checkoutButton.textContent = "Checkout Now";
            return;
        }

        // Calculate total amount from cart
        const cart = JSON.parse(localStorage.getItem("cart")) || [];
        const totalAmount = cart.reduce((sum, item) => {
            return sum + parseFloat(item.price) * item.quantity;
        }, 0);

        formData.totalAmount = totalAmount;

        try {
            const response = await fetch("/process_payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok && data.status === "success") {
                alert(`✅ Transaction Approved!\nCard Type: ${data.card_type}\nMasked: ${data.masked_card}\nAmount: $${data.amount}`);
                checkoutForm.reset();
                cardTypeDisplay.textContent = "";

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

function updateCartCount() {
    const countElement = document.getElementById("cart-count");
    let cartItemCount = parseInt(localStorage.getItem('cartCount')) || 0;
    countElement.textContent = cartItemCount;

    const icon = document.querySelector(".cart-icon");
    icon.style.transform = "scale(1.2)";
    setTimeout(() => {
        icon.style.transform = "scale(1)";
    }, 300);
}

function toggleCartPreview() {
    const preview = document.getElementById("cart-preview");
    preview.style.display = preview.style.display === "block" ? "none" : "block";
    populateCartPreview();
}

function populateCartPreview() {
    const cartItemsContainer = document.getElementById("cart-items");
    cartItemsContainer.innerHTML = "";

    const cart = JSON.parse(localStorage.getItem("cart")) || [];

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = "<li>Your cart is empty.</li>";
        return;
    }

    cart.forEach(item => {
        const li = document.createElement("li");
        li.textContent = `${item.name} - $${parseFloat(item.price).toFixed(2)} x ${item.quantity}`;
        cartItemsContainer.appendChild(li);
    });

    updateCartTotalDisplay(); // Update display when items change
}

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