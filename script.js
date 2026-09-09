
const API_URL = "http://localhost:5000";

/* =========================
   USER
========================= */

function getUser() {
    const savedUser = localStorage.getItem("gatnoraUser");

    if (!savedUser) {
        return null;
    }

    try {
        return JSON.parse(savedUser);
    } catch (error) {
        return null;
    }
}


/* =========================
   LOGOUT
========================= */

function logout() {
    localStorage.removeItem("gatnoraUser");
    localStorage.removeItem("gatnoraToken");

    window.location.href = "index.html";
}


/* =========================
   REGISTER
========================= */

const registerForm = document.getElementById("registerForm");

if (registerForm) {

    registerForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const name = document.getElementById("registerName").value.trim();
        const email = document.getElementById("registerEmail").value.trim();
        const password = document.getElementById("registerPassword").value;

        try {

            const response = await fetch(
                `${API_URL}/api/register`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        name: name,
                        email: email,
                        password: password
                    })
                }
            );

            const data = await response.json();

            alert(data.message);

            if (response.ok) {

                registerForm.reset();

                window.location.href = "login.html";
            }

        } catch (error) {

            console.error(error);

            alert(
                "Could not connect to server. Make sure server.js is running."
            );

        }

    });

}


/* =========================
   LOGIN
========================= */

const loginForm = document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const email =
            document.getElementById("loginEmail").value.trim();

        const password =
            document.getElementById("loginPassword").value;

        try {

            const response = await fetch(
                `${API_URL}/api/login`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        email: email,
                        password: password
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {

                alert(data.message);

                return;
            }

            localStorage.setItem(
                "gatnoraUser",
                JSON.stringify(data.user)
            );

            localStorage.setItem(
                "gatnoraToken",
                data.token
            );

            alert("Login successful!");

            window.location.href = "dashboard.html";

        } catch (error) {

            console.error(error);

            alert("Cannot connect to server.");

        }

    });

}


/* =========================
   CREATE ORDER
========================= */

const orderForm = document.getElementById("orderForm");

if (orderForm) {

    orderForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const user = getUser();

        if (!user) {

            alert("Please login first.");

            window.location.href = "login.html";

            return;
        }

        const orderData = {

            userId: user.id,

            studentName:
                document.getElementById("studentName").value.trim(),

            hostel:
                document.getElementById("hostel").value.trim(),

            block:
                document.getElementById("block").value.trim(),

            room:
                document.getElementById("room").value.trim(),

            phone:
                document.getElementById("phone").value.trim(),

            deliveryType:
                document.getElementById("deliveryType").value,

            itemDetails:
                document.getElementById("itemDetails").value.trim(),

            instructions:
                document.getElementById("instructions").value.trim()
        };

        try {

            const response = await fetch(
                `${API_URL}/api/orders`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify(orderData)
                }
            );

            const data = await response.json();

            if (response.ok) {

                alert(data.message);

                orderForm.reset();

                window.location.href = "dashboard.html";

            } else {

                alert(data.message);

            }

        } catch (error) {

            console.error(error);

            alert("Could not create delivery.");

        }

    });

}


/* =========================
   PARTNER REGISTER
========================= */

const partnerForm = document.getElementById("partnerForm");

if (partnerForm) {

    partnerForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const user = getUser();

        if (!user) {

            alert("Please login first.");

            window.location.href = "login.html";

            return;
        }

        const availabilityElement =
            document.getElementById("availability");

        const partnerData = {

            userId: user.id,

            name:
                document.getElementById("partnerName").value.trim(),

            hostel:
                document.getElementById("partnerHostel").value.trim(),

            block:
                document.getElementById("partnerBlock").value.trim(),

            phone:
                document.getElementById("partnerPhone").value.trim(),

            studentId:
                document.getElementById("studentId").value.trim(),

            availability:
                availabilityElement
                    ? availabilityElement.value
                    : "Available"
        };

        try {

            const response = await fetch(
                `${API_URL}/api/partners`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify(partnerData)
                }
            );

            const data = await response.json();

            alert(data.message);

            if (response.ok) {

                window.location.href =
                    "partner-dashboard.html";

            }

        } catch (error) {

            console.error(error);

            alert("Partner registration failed.");

        }

    });

}


/* =========================
   STUDENT DASHBOARD
========================= */

async function loadDashboard() {

    const ordersList =
        document.getElementById("ordersList");

    if (!ordersList) {
        return;
    }

    const user = getUser();

    if (!user) {

        window.location.href = "login.html";

        return;
    }

    const welcome =
        document.getElementById("welcome");

    if (welcome) {

        welcome.innerText =
            "Welcome, " + user.name;
    }

    try {

        const response = await fetch(
            `${API_URL}/api/orders/user/${user.id}`
        );

        const orders = await response.json();

        if (!response.ok) {

            throw new Error(
                orders.message || "Could not load orders"
            );
        }

        const totalOrders =
            document.getElementById("totalOrders");

        if (totalOrders) {

            totalOrders.innerText = orders.length;
        }

        const activeOrders =
            orders.filter(
                order => order.status !== "Delivered"
            );

        const activeOrdersElement =
            document.getElementById("activeOrders");

        if (activeOrdersElement) {

            activeOrdersElement.innerText =
                activeOrders.length;
        }

        if (orders.length === 0) {

            ordersList.innerHTML =
                "<p>No deliveries yet. Create your first delivery!</p>";

            return;
        }

        ordersList.innerHTML =
            orders.map(order => `

                <div class="order-card">

                    <h3>${order.deliveryType}</h3>

                    <p>
                        <strong>Hostel:</strong>
                        ${order.hostel}
                    </p>

                    <p>
                        <strong>Block:</strong>
                        ${order.block}
                    </p>

                    <p>
                        <strong>Room:</strong>
                        ${order.room}
                    </p>

                    <p>
                        <strong>Item:</strong>
                        ${order.itemDetails || "Not specified"}
                    </p>

                    <p>
                        <strong>Fee:</strong>
                        ₹${order.totalFee}
                    </p>

                    <p>
                        <strong>Status:</strong>
                        ${order.status}
                    </p>

                </div>

            `).join("");

        loadSubscription();

    } catch (error) {

        console.error(error);

        ordersList.innerHTML =
            "<p>Could not load orders.</p>";
    }

}


/* =========================
   LOAD SUBSCRIPTION
========================= */

async function loadSubscription() {

    const user = getUser();

    if (!user) {
        return;
    }

    try {

        const response = await fetch(
            `${API_URL}/api/user/${user.id}`
        );

        const data = await response.json();

        if (!response.ok) {
            return;
        }

        const subscriptionElement =
            document.getElementById("subscriptionOrders");

        if (!subscriptionElement) {
            return;
        }

        if (
            data.subscription &&
            data.subscription.active
        ) {

            subscriptionElement.innerText =
                data.subscription.usedOrders +
                " / " +
                data.subscription.totalOrders;

        } else {

            subscriptionElement.innerText = "No Pass";
        }

    } catch (error) {

        console.error(error);
    }

}


/* =========================
   AVAILABLE ORDERS
========================= */

async function loadAvailableOrders() {

    const container =
        document.getElementById("availableOrders");

    if (!container) {
        return;
    }

    try {

        const response = await fetch(
            `${API_URL}/api/orders/available`
        );

        const orders = await response.json();

        if (!response.ok) {

            throw new Error(
                orders.message || "Could not load orders"
            );
        }

        const count =
            document.getElementById("availableCount");

        if (count) {

            count.innerText = orders.length;
        }

        if (orders.length === 0) {

            container.innerHTML =
                "<p>No delivery requests available.</p>";

            return;
        }

        container.innerHTML =
            orders.map(order => `

                <div class="order-card">

                    <h3>${order.deliveryType}</h3>

                    <p>
                        <strong>Hostel:</strong>
                        ${order.hostel}
                    </p>

                    <p>
                        <strong>Block:</strong>
                        ${order.block}
                    </p>

                    <p>
                        <strong>Room:</strong>
                        ${order.room}
                    </p>

                    <p>
                        <strong>Item:</strong>
                        ${order.itemDetails || "Not specified"}
                    </p>

                    <p>
                        💰 <strong>
                            Earn ₹${order.partnerEarning || 7}
                        </strong>
                    </p>

                    <button
                        class="primary-btn"
                        onclick="acceptOrder('${order._id}')">

                        Accept Order

                    </button>

                </div>

            `).join("");

    } catch (error) {

        console.error(error);

        container.innerHTML =
            "<p>Could not load available orders.</p>";
    }

}


/* =========================
   ACCEPT ORDER
========================= */

async function acceptOrder(orderId) {

    const user = getUser();

    if (!user) {

        alert("Please login first.");

        window.location.href = "login.html";

        return;
    }

    try {

        const partnerResponse = await fetch(
            `${API_URL}/api/partners/user/${user.id}`
        );

        const partner =
            await partnerResponse.json();

        if (!partnerResponse.ok) {

            alert(
                "You must register as a partner first."
            );

            window.location.href = "partner.html";

            return;
        }

        const response = await fetch(
            `${API_URL}/api/orders/${orderId}/accept`,
            {
                method: "PUT",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    partnerId: partner._id
                })
            }
        );

        const data = await response.json();

        alert(data.message);

        if (response.ok) {

            loadAvailableOrders();

            loadPartnerOrders();
        }

    } catch (error) {

        console.error(error);

        alert("Could not accept order.");
    }

}


/* =========================
   PARTNER ORDERS
========================= */

async function loadPartnerOrders() {

    const container =
        document.getElementById("partnerOrders");

    if (!container) {
        return;
    }

    const user = getUser();

    if (!user) {

        window.location.href = "login.html";

        return;
    }

    try {

        const partnerResponse = await fetch(
            `${API_URL}/api/partners/user/${user.id}`
        );

        const partner =
            await partnerResponse.json();

        if (!partnerResponse.ok) {

            container.innerHTML =
                "<p>You are not registered as a partner.</p>";

            return;
        }

        const deliveryCount =
            document.getElementById("deliveryCount");

        const earnings =
            document.getElementById("earnings");

        if (deliveryCount) {

            deliveryCount.innerText =
                partner.totalDeliveries || 0;
        }

        if (earnings) {

            earnings.innerText =
                "₹" + (partner.totalEarnings || 0);
        }

        const response = await fetch(
            `${API_URL}/api/orders/partner/${partner._id}`
        );

        const orders =
            await response.json();

        if (!response.ok) {

            throw new Error(
                orders.message ||
                "Could not load partner orders"
            );
        }

        if (orders.length === 0) {

            container.innerHTML =
                "<p>No accepted deliveries yet.</p>";

            return;
        }

        container.innerHTML =
            orders.map(order => `

                <div class="order-card">

                    <h3>${order.deliveryType}</h3>

                    <p>
                        <strong>Hostel:</strong>
                        ${order.hostel}
                    </p>

                    <p>
                        <strong>Block:</strong>
                        ${order.block}
                    </p>

                    <p>
                        <strong>Room:</strong>
                        ${order.room}
                    </p>

                    <p>
                        <strong>Item:</strong>
                        ${order.itemDetails || "Not specified"}
                    </p>

                    <p>
                        <strong>Status:</strong>
                        ${order.status}
                    </p>

                    <select
                        onchange="updateStatus(
                            '${order._id}',
                            this.value
                        )">

                        <option
                            value="Partner Assigned"
                            ${order.status === "Partner Assigned"
                                ? "selected"
                                : ""}>

                            Partner Assigned

                        </option>

                        <option
                            value="Picked Up"
                            ${order.status === "Picked Up"
                                ? "selected"
                                : ""}>

                            Picked Up

                        </option>

                        <option
                            value="On the Way"
                            ${order.status === "On the Way"
                                ? "selected"
                                : ""}>

                            On the Way

                        </option>

                        <option
                            value="Delivered"
                            ${order.status === "Delivered"
                                ? "selected"
                                : ""}>

                            Delivered

                        </option>

                    </select>

                </div>

            `).join("");

    } catch (error) {

        console.error(error);

        container.innerHTML =
            "<p>Could not load partner deliveries.</p>";
    }

}


/* =========================
   UPDATE ORDER STATUS
========================= */

async function updateStatus(orderId, status) {

    try {

        const response = await fetch(
            `${API_URL}/api/orders/${orderId}/status`,
            {
                method: "PUT",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    status: status
                })
            }
        );

        const data = await response.json();

        if (response.ok) {

            alert(data.message);

            loadPartnerOrders();

        } else {

            alert(data.message);
        }

    } catch (error) {

        console.error(error);

        alert(
            "Could not update delivery status."
        );
    }

}


/* =========================
   SUBSCRIPTION
========================= */

async function buySubscription() {

    const user = getUser();

    if (!user) {

        alert("Please login first.");

        window.location.href = "login.html";

        return;
    }

    const confirmed = confirm(
        "Gatnora Pass\n\n₹50 for 10 delivery credits.\n\nContinue?"
    );

    if (!confirmed) {
        return;
    }

    try {

        const response = await fetch(
            `${API_URL}/api/subscription/${user.id}`,
            {
                method: "POST"
            }
        );

        const data = await response.json();

        if (response.ok) {

            alert(data.message);

            loadSubscription();

        } else {

            alert(data.message);
        }

    } catch (error) {

        console.error(error);

        alert(
            "Subscription activation failed."
        );
    }

}


/* =========================
   INITIAL PAGE LOAD
========================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadDashboard();

        loadAvailableOrders();

        loadPartnerOrders();

    }
);

