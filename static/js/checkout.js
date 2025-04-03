document.addEventListener("DOMContentLoaded", function () {
    const checkoutForm = document.getElementById("checkout-form");
    const checkoutButton = document.querySelector(".button");

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
            creditcard: document.getElementById("creditcard").value.trim(),
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