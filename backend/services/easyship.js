const axios = require("axios");

const EASYSHIP_BASE_URL = process.env.EASYSHIP_BASE_URL;
const EASYSHIP_API_KEY = process.env.EASYSHIP_API_KEY;

// Create shipment from order
const createShipment = async (order) => {
  try {
    if (!order) throw new Error("No order provided");

    const payload = {
      to_address: {
        name: order.name,
        email: order.email,
        address_line_1: order.address,
        city: order.city || "Lagos",
        country: "NG",
      },
      items: [
        {
          description: "Order Items",
          quantity: 1,
          value: Number(order.total || 0),
        },
      ],
      total_value: Number(order.total || 0),
    };

    const response = await axios.post(
      `${EASYSHIP_BASE_URL}/shipments`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${EASYSHIP_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const shipment = response.data;

    return {
      id: shipment?.id,
      tracking_id: shipment?.tracking_number,
    };
  } catch (err) {
    console.log("❌ EASYSHIP CREATE ERROR:", err.response?.data || err.message);
    return null;
  }
};

module.exports = createShipment;