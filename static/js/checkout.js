document.addEventListener("DOMContentLoaded", function () {
    const checkoutForm = document.getElementById("checkout-form");
    const checkoutButton = document.querySelector(".button");
    const creditCardInput = document.getElementById("creditcard");
    const cardTypeDisplay = document.getElementById("card-type"); // Assuming an element exists to display card type

    // Function to detect card type
    function detectCardType(number) {
        const cardPatterns = {
            visa: /^4[0-9]{12}(?:[0-9]{3})?$/,
            mastercard: /^5[1-5][0-9]{14}$/,
            amex: /^3[47][0-9]{13}$/,
            discover: /^6(?:011|5[0-9]{2})[0-9]{12}$/
        };

        for (const [type, pattern] of Object.entries(cardPatterns)) {
            if (pattern.test(number)) {
                return type.charAt(0).toUpperCase() + type.slice(1); // Capitalize first letter
            }
        }
        return "Unknown";
    }

    // Event listener for credit card input
    creditCardInput.addEventListener("input", function () {
        const cardType = detectCardType(creditCardInput.value.replace(/\s/g, "")); // Remove spaces
        cardTypeDisplay.textContent = cardType !== "Unknown" ? `Card Type: ${cardType}` : ""; // Update UI
    });

    checkoutForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        // Disable button to prevent multiple clicks
        checkoutButton.disabled = true;
        checkoutButton.textContent = "Processing...";

        const formData = {
            fname: document.getElementById("fname").value.trim(),
            lname: document.getElementById("lname").value.trim(),
            address: document.getElementById("address").value.trim(),
            city: document.getElementById("city").value.trim(),
            state: document.getElementById("state").value.trim(),
            zipcode: document.getElementById("zipcode").value.trim(),
            creditcard: creditCardInput.value.trim(),
            expdate: document.getElementById("expdate").value.trim(),
            CVV: document.getElementById("CVV").value.trim()
        };

        // Simple Frontend Validation
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

            if (data.status === "success") {
                alert("✅ Transaction Approved! Thank you for your purchase.");
                checkoutForm.reset(); // Clear form
                cardTypeDisplay.textContent = ""; // Clear detected card type
            } else {
                alert("❌ Transaction Failed: " + (data.message || "Please check your details."));
            }
        } catch (error) {
            console.error("⚠️ Error processing transaction:", error);
            alert("An error occurred while processing your payment. Please try again.");
        } finally {
            // Re-enable button after processing
            checkoutButton.disabled = false;
            checkoutButton.textContent = "Checkout Now";
        }
    });
});