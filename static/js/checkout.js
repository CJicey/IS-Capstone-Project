document.addEventListener("DOMContentLoaded", function () {
    const checkoutForm = document.getElementById("checkout-form");

    checkoutForm.addEventListener("submit", async function (event) {
        event.preventDefault(); // Prevent default form submission

        const creditCardNumber = document.getElementById("creditcard").value;
        const expDate = document.getElementById("expdate").value;
        const cvv = document.getElementById("CVV").value;

        let apiEndpoint = "";

        if (!creditCardNumber || !expDate || !cvv) {
            apiEndpoint = "https://e7642f03-e889-4c5c-8dc2-f1f52461a5ab.mock.pstmn.io/get?authorize=carddetails";
        } else if (creditCardNumber.startsWith("4")) { // Example: Visa cards succeed
            apiEndpoint = "https://e7642f03-e889-4c5c-8dc2-f1f52461a5ab.mock.pstmn.io/get?authorize=success";
        } else {
            apiEndpoint = "https://e7642f03-e889-4c5c-8dc2-f1f52461a5ab.mock.pstmn.io/get?authorize=insufficient";
        }

        try {
            const response = await fetch(apiEndpoint);
            const data = await response.json();

            if (data.status === "success") {
                alert("Transaction Approved! Thank you for your purchase.");
            } else if (data.status === "insufficient") {
                alert("Transaction Failed: Insufficient Funds.");
            } else {
                alert("Transaction Failed: Incorrect or Missing Card Details.");
            }
        } catch (error) {
            console.error("Error processing transaction:", error);
            alert("An error occurred. Please try again.");
        }
    });
});