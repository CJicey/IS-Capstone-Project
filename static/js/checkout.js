document.addEventListener("DOMContentLoaded", function () {
    const checkoutForm = document.getElementById("checkout-form");
    const creditCardInput = document.getElementById("creditcard");
    const cardTypeDisplay = document.getElementById("card-type");
    const checkoutButton = document.querySelector(".button");

    // Detect card type
    function getCardType(number) {
        const firstTwo = number.slice(0, 2);
        const firstFour = number.slice(0, 4);
        const firstSix = number.slice(0, 6);
        const firstOne = number.slice(0, 1);

        if (/^4/.test(number)) return "Visa";
        if (/^5[1-5]/.test(number)) return "MasterCard";
        if (/^3[47]/.test(number)) return "American Express";
        if (/^6(?:011|5)/.test(number)) return "Discover";
        if (/^35(2[89]|[3-8][0-9])/.test(number)) return "JCB";
        if (/^3(?:0[0-5]|[68])/.test(number)) return "Diners Club";

        return "";
    }

    // Format card number with spaces
    creditCardInput.addEventListener("input", function (e) {
        const rawValue = e.target.value.replace(/\D/g, "").slice(0, 16);
        const cardType = getCardType(rawValue);
        let formatted = rawValue;

        if (cardType === "American Express") {
            // XXXX XXXXXX XXXXX
            formatted = rawValue
                .replace(/^(\d{4})(\d{0,6})(\d{0,5}).*/, (_, g1, g2, g3) =>
                    [g1, g2, g3].filter(Boolean).join(" ")
                )
                .slice(0, 17);
        } else {
            // XXXX XXXX XXXX XXXX
            formatted = rawValue
                .replace(/(.{4})/g, "$1 ")
                .trim()
                .slice(0, 19);
        }

        e.target.value = formatted;
        cardTypeDisplay.textContent = cardType ? `Card Type: ${cardType}` : "";
        creditCardInput.setSelectionRange(formatted.length, formatted.length);
    });

    // Submit form
    checkoutForm.addEventListener("submit", async function (event) {
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
            creditcard: creditCardInput.value.replace(/\s+/g, ""), // Remove spaces before sending
            expdate: document.getElementById("expdate").value.trim(),
            CVV: document.getElementById("CVV").value.trim()
        };

        if (!formData.fname || !formData.lname || !formData.address || !formData.city || !formData.state || !formData.zipcode || !formData.creditcard || !formData.expdate || !formData.CVV) {
            alert("Please fill in all required fields.");
            checkoutButton.disabled = false;
            checkoutButton.textContent = "Checkout Now";
            return;
        }

        try {
            const response = await fetch("/process_payment", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
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
});