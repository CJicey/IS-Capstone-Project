document.addEventListener("DOMContentLoaded", function () {
    const checkoutForm = document.getElementById("checkout-form");
    const creditCardInput = document.getElementById("creditcard");
    const cardTypeDisplay = document.getElementById("card-type");
    const checkoutButton = document.querySelector(".button");

    // Detect card type
    function getCardType(number) {
        if (/^4/.test(number)) return "Visa";
        if (/^5[1-5]/.test(number)) return "MasterCard";
        if (/^3[47]/.test(number)) return "American Express";
        if (/^6(?:011|5)/.test(number)) return "Discover";
        if (/^35(2[89]|[3-8][0-9])/.test(number)) return "JCB";
        if (/^3(?:0[0-5]|[68])/.test(number)) return "Diners Club";
        return "";
    }

    // Format card number
    creditCardInput?.addEventListener("input", function (e) {
        const rawValue = e.target.value.replace(/\D/g, "").slice(0, 16);
        const cardType = getCardType(rawValue);
        let formatted = rawValue;

        if (cardType === "American Express") {
            formatted = rawValue
                .replace(/^(\d{4})(\d{0,6})(\d{0,5}).*/, (_, g1, g2, g3) =>
                    [g1, g2, g3].filter(Boolean).join(" ")
                )
                .slice(0, 17);
        } else {
            formatted = rawValue
                .replace(/(.{4})/g, "$1 ")
                .trim()
                .slice(0, 19);
        }

        e.target.value = formatted;
        cardTypeDisplay.textContent = cardType ? `Card Type: ${cardType}` : "";
        creditCardInput.setSelectionRange(formatted.length, formatted.length);
    });

    // Submit checkout form
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

    // Order filtering logic
    const filterSelect = document.getElementById("filter");
    if (filterSelect) {
        filterSelect.addEventListener("change", filterOrders);
    }

    function filterOrders() {
        const filter = document.getElementById("filter").value;
        const rows = document.querySelectorAll(".order-row");

        rows.forEach(row => {
            const status = row.getAttribute("data-status") === "True";
            const settled = row.getAttribute("data-settled") === "True";

            if (
                filter === "all" ||
                (filter === "success" && status) ||
                (filter === "failed" && !status) ||
                (filter === "settled" && settled)
            ) {
                row.style.display = "";
            } else {
                row.style.display = "none";
            }
        });
    }

    // Settle order (inline button)
    window.settleOrder = async function (orderId) {
        try {
            const response = await fetch(`/settle_order/${orderId}`, {
                method: "POST"
            });
            const data = await response.json();

            if (response.ok) {
                alert(data.message);
                window.location.reload();
            } else {
                alert(data.error || "An error occurred during settlement.");
            }
        } catch (error) {
            console.error("Settle order failed:", error);
            alert("Failed to settle the order. Please try again.");
        }
    };
};