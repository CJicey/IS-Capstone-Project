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