const createShipment = async (order) => {
  try {
    if (!order) {
      throw new Error("Order is required");
    }

    if (!order.address || !order.name || !order.phone) {
      throw new Error("Missing required delivery fields");
    }

    const shipKey = process.env.SHIPBUBBLE_SANDBOX_KEY?.trim();

    if (!shipKey) {
      throw new Error("Shipbubble API key missing in environment variables");
    }

    console.log("🚚 SHIPBUBBLE KEY LOADED:", !!shipKey);

    const res = await fetch("https://api.shipbubble.com/v1/shipping/labels", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": shipKey
      },
      body: JSON.stringify({
        store_id: process.env.SHIPBUBBLE_STORE_ID || undefined,
        pickup_address: {
          name: "Velra Store",
          address: "Lagos, Nigeria",
          phone: process.env.STORE_PHONE || "0000000000"
        },

        delivery_address: {
          name: order.name,
          address: order.address,
          phone: order.phone
        },

        package: {
          description: "Fashion order",
          weight: order.weight || 1,
          quantity: order.items?.length || 1
        }
      })
    });

    const data = await res.json();

    console.log("🚚 SHIPMENT CREATED:", data);

    return {
      success: true,
      tracking_id: data?.tracking_id || data?.id,
      raw: data
    };
  } catch (err) {
    console.log("❌ SHIPBUBBLE ERROR:", {
      message: err.message,
      response: err.response?.data || null
    });
    return null;
  }
};

// =========================
// 🚚 GET SHIPPING RATE (BEFORE CHECKOUT)
// =========================
createShipment.getShippingRate = async ({ address, items }) => {
  try {
    if (!address) throw new Error("Address is required");

    const shipKey = process.env.SHIPBUBBLE_SANDBOX_KEY?.trim();

    if (!shipKey) {
      throw new Error("Shipbubble API key missing in environment variables");
    }

    console.log("🚚 SHIPBUBBLE KEY LOADED:", !!shipKey);

    const res = await fetch("https://api.shipbubble.com/v1/shipping/rates", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": shipKey
      },
      body: JSON.stringify({
        store_id: process.env.SHIPBUBBLE_STORE_ID || undefined,

        pickup_address: {
          name: "Velra Store",
          address: "Lagos, Nigeria",
          phone: process.env.STORE_PHONE || "0000000000"
        },

        delivery_address: {
          address: address
        },

        package: {
          weight: items?.length || 1,
          quantity: items?.length || 1
        }
      })
    });

    const data = await res.json();

    return {
      success: true,
      shipping_fee: data?.price || data?.data?.price || 0,
      raw: data
    };

  } catch (err) {
    console.log("❌ SHIPPING RATE ERROR:", {
      message: err.message,
      response: err.response?.data || null
    });

    return {
      success: false,
      shipping_fee: 0
    };
  }
};

module.exports = createShipment;