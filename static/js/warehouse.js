// Define a global async function to settle an order by its ID
window.settleOrder = async function (orderId) {
    console.log("Settle order called with ID:", orderId); // Debug log

    try {
        // Send a POST request to the server to settle the specified order
        const response = await fetch(`/settle_order/${orderId}`, {
            method: "POST"
        });

        let data;
        try {
            // Try to parse the JSON response from the server
            data = await response.json();
        } catch {
            // Handle case where server response is not valid JSON
            data = { error: "Server returned an unexpected response." };
        }

        if (response.ok) {
            // If the request was successful, alert the user with the server message
            alert(data.message);
            window.location.reload(); // Reload the page to reflect changes
        } else {
            // If the request failed, alert the user with the error or a default message
            alert(data.error || "An error occurred during settlement.");
        }
    } catch (error) {
        // Catch any network or unexpected errors
        console.error("Settle order failed:", error);
        alert("Failed to settle the order. Please try again.");
    }
};

// Optional utility function to filter displayed orders based on selected criteria
window.filterOrders = function () {
    const filterValue = document.getElementById('filter').value; // Get selected filter value from dropdown
    const orders = document.querySelectorAll('.order-row'); // Get all rows representing orders

    orders.forEach(order => {
        const status = order.getAttribute('data-status');   // Get status attribute (e.g., "success", "failed")
        const settled = order.getAttribute('data-settled'); // Get settled attribute (e.g., "yes" or "no")

        // Logic to determine whether to show or hide each order row
        if (filterValue === 'all') {
            order.style.display = 'block'; // Show all orders
        } else if (filterValue === 'success' && status === 'success') {
            order.style.display = 'block'; // Show only successful orders
        } else if (filterValue === 'failed' && status === 'failed') {
            order.style.display = 'block'; // Show only failed orders
        } else if (filterValue === 'settled' && settled === 'yes') {
            order.style.display = 'block'; // Show only settled orders
        } else {
            order.style.display = 'none'; // Hide order if it doesn't match the filter
        }
    });
};