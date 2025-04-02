document.addEventListener("DOMContentLoaded", function () {
    const checkoutForm = document.getElementById("checkout-form");

    checkoutForm.addEventListener("submit", async function (event) {
        event.preventDefault(); 

        const formData = {
            fname: document.getElementById("fname").value,
            lname: document.getElementById("lname").value,
            address: document.getElementById("address").value,
            city: document.getElementById("city").value,
            state: document.getElementById("state").value,
            zipcode: document.getElementById("zipcode").value,
            creditcard: document.getElementById("creditcard").value,
            expdate: document.getElementById("expdate").value,
            CVV: document.getElementById("CVV").value
        };

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
                alert("Transaction Approved! Thank you for your purchase.");
            } else {
                alert("Transaction Failed. Please check your details.");
            }
        } catch (error) {
            console.error("Error processing transaction:", error);
            alert("An error occurred. Please try again.");
        }
    });
});