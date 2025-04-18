window.settleOrder = async function (orderId) {
    console.log("Settle order called with ID:", orderId); 

    try {
        const response = await fetch(`/settle_order/${orderId}`, {
            method: "POST"
        });

        let data;
        try {
            data = await response.json();
        } catch {
            data = { error: "Server returned an unexpected response." };
        }

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

// Optional filterOrders function if not yet implemented
window.filterOrders = function () {
    const filterValue = document.getElementById('filter').value;
    const orders = document.querySelectorAll('.order-row');

    orders.forEach(order => {
        const status = order.getAttribute('data-status');
        const settled = order.getAttribute('data-settled');

        if (filterValue === 'all') {
            order.style.display = 'block';
        } else if (filterValue === 'success' && status === 'success') {
            order.style.display = 'block';
        } else if (filterValue === 'failed' && status === 'failed') {
            order.style.display = 'block';
        } else if (filterValue === 'settled' && settled === 'yes') {
            order.style.display = 'block';
        } else {
            order.style.display = 'none';
        }
    });
};