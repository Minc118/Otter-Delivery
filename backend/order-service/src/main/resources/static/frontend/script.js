const ORDER_API_URL = "/orders";
const RESTAURANT_API_URL = "/restaurants";

const CURRENT_CUSTOMER_ID = 1;

let currentMenuItems = [];
let cart = [];

async function loadRestaurants() {
    const response = await fetch(RESTAURANT_API_URL);
    const restaurants = await response.json();

    const restaurantSelect = document.getElementById("restaurantSelect");
    restaurantSelect.innerHTML = `<option value="">Choose a restaurant</option>`;

    restaurants.forEach(restaurant => {
        const option = document.createElement("option");
        option.value = restaurant.id;
        option.textContent = restaurant.name;
        restaurantSelect.appendChild(option);
    });
}

async function loadMenuItems() {
    const restaurantId = document.getElementById("restaurantSelect").value;

    const menuItemSelect = document.getElementById("menuItemSelect");
    menuItemSelect.innerHTML = `<option value="">Choose a menu item</option>`;

    currentMenuItems = [];
    cart = [];
    renderCart();

    if (!restaurantId) {
        return;
    }

    const response = await fetch(`${RESTAURANT_API_URL}/${restaurantId}/menu`);
    const menuItems = await response.json();

    currentMenuItems = menuItems;

    menuItems.forEach(item => {
        const option = document.createElement("option");
        option.value = item.id;
        option.textContent = `${item.name} - ${item.price} €`;
        menuItemSelect.appendChild(option);
    });
}

function addToCart() {
    const menuItemId = document.getElementById("menuItemSelect").value;
    const quantity = Number(document.getElementById("quantity").value);

    if (!menuItemId) {
        alert("Please choose a menu item.");
        return;
    }

    if (quantity <= 0) {
        alert("Quantity must be at least 1.");
        return;
    }

    const selectedItem = currentMenuItems.find(
        item => item.id === Number(menuItemId)
    );

    const existingItem = cart.find(
        item => item.menuItemId === selectedItem.id
    );

    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            menuItemId: selectedItem.id,
            itemName: selectedItem.name,
            quantity: quantity,
            priceAtOrderTime: selectedItem.price
        });
    }

    renderCart();
}

function removeFromCart(menuItemId) {
    cart = cart.filter(item => item.menuItemId !== menuItemId);
    renderCart();
}

function renderCart() {
    const cartContainer = document.getElementById("cartContainer");

    if (cart.length === 0) {
        cartContainer.innerHTML = "<p>Your cart is empty.</p>";
        return;
    }

    cartContainer.innerHTML = "";

    let total = 0;

    cart.forEach(item => {
        const subtotal = item.quantity * item.priceAtOrderTime;
        total += subtotal;

        cartContainer.innerHTML += `
            <div class="item">
                <p><strong>${item.itemName}</strong></p>
                <p>Quantity: ${item.quantity}</p>
                <p>Price: ${item.priceAtOrderTime} €</p>
                <p>Subtotal: ${subtotal} €</p>
                <button onclick="removeFromCart(${item.menuItemId})">Remove</button>
            </div>
        `;
    });

    cartContainer.innerHTML += `
        <h3>Total: ${total} €</h3>
    `;
}

async function createOrder() {
    const restaurantId = document.getElementById("restaurantSelect").value;

    if (!restaurantId) {
        alert("Please choose a restaurant first.");
        return;
    }

    if (cart.length === 0) {
        alert("Please add at least one item to the cart.");
        return;
    }

    const order = {
        customerId: CURRENT_CUSTOMER_ID,
        restaurantId: Number(restaurantId),
        items: cart
    };

    await fetch(ORDER_API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(order)
    });

    cart = [];
    renderCart();
    loadOrders();

    alert("Order created successfully!");
}

async function loadOrders() {
    const response = await fetch(ORDER_API_URL);
    const orders = await response.json();

    const ordersContainer = document.getElementById("ordersContainer");
    ordersContainer.innerHTML = "";

    orders.forEach(order => {
        const div = document.createElement("div");
        div.className = "order";

        div.innerHTML = `
            <h3>Order #${order.id}</h3>
            <p>Restaurant ID: ${order.restaurantId}</p>
            <p>Status: ${order.status}</p>
            <p>Total Price: ${order.totalPrice} €</p>
            <h4>Items</h4>
        `;

        order.items.forEach(item => {
            div.innerHTML += `
                <div class="item">
                    <p><strong>${item.itemName}</strong></p>
                    <p>Quantity: ${item.quantity}</p>
                    <p>Price: ${item.priceAtOrderTime} €</p>
                </div>
            `;
        });

        ordersContainer.appendChild(div);
    });
}

loadRestaurants();
loadOrders();