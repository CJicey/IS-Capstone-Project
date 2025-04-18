window.filterOrders = function () {
    const filterValue = document.getElementById("filter").value;
    const orders = document.querySelectorAll(".order-row");

    orders.forEach(order => {
        const status = order.dataset.status;
        const settled = order.dataset.settled;

        let show = false;

        if (filterValue === "all") {
            show = true;
        } else if (filterValue === "success" && status === "success") {
            show = true;
        } else if (filterValue === "failed" && status === "failed") {
            show = true;
        } else if (filterValue === "settled" && settled === "yes") {
            show = true;
        }

        order.style.display = show ? "block" : "none";
    });
};