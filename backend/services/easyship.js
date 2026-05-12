const axios = require("axios");

const EASYSHIP_BASE_URL =
  process.env.EASYSHIP_BASE_URL || "https://api.easyship.com";
const EASYSHIP_API_KEY = process.env.EASYSHIP_API_KEY;

// =========================
// EASYSHIP SHIPPING SERVICE (IMPROVED PRODUCTION VERSION)
// =========================

const normalizeCountry = (order) => {
  const country = order?.country;

  if (country) return country;

  const postal = order?.postal_code || order?.shipping_address?.postal_code;

  if (postal) {
    const code = String(postal).toUpperCase();

    // Canada postal code pattern (A1A)
    if (/^[A-Z]\d[A-Z]/.test(code)) return "CA";
  }

  return "NG";
};

const createShipment = async (order) => {
  try {
    if (!order) throw new Error("No order provided");
    if (!EASYSHIP_API_KEY) throw new Error("Missing Easyship API key");

    // =========================
    // SAFE NORMALIZATION
    // =========================
    const name = order.name || order.customer_name || "Customer";
    const email = order.email || "";

    const address =
      typeof order.address === "string"
        ? order.address
        : order.shipping_address?.address_line_1 || "";

    const city = order.city || order.shipping_address?.city || "Lagos";
    const postal_code = order.postal_code || order.shipping_address?.postal_code || "";

    const country = normalizeCountry(order);

    // =========================
    // PAYLOAD
    // =========================
    const payload = {
      origin_address: {
        country_alpha2: "NG",
      },
      destination_address: {
        name,
        email,
        address_line_1: address,
        city,
        postal_code,
        country_alpha2: country,
      },
      items: [
        {
          description: "Order Items",
          quantity: order.items?.length || 1,
          declared_value: Number(order.total || 0),
        },
      ],
      total_value: Number(order.total || 0),
      incoterms: "DDU",
    };

    console.log("🚚 EASYSHIP SHIPMENT REQUEST", {
      endpoint: `${EASYSHIP_BASE_URL}/2023-01/shipments`,
      country,
      city,
      hasKey: !!EASYSHIP_API_KEY,
    });

    // =========================
    // API CALL
    // =========================
    const response = await axios.post(
      `${EASYSHIP_BASE_URL}/2023-01/shipments`,
      payload,
      {
        headers: {
          Authorization: EASYSHIP_API_KEY.startsWith("Bearer ")
            ? EASYSHIP_API_KEY
            : `Bearer ${EASYSHIP_API_KEY}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        timeout: 15000,
      }
    );

    const shipment = response.data;

    if (!shipment) throw new Error("Empty Easyship response");

    // =========================
    // NORMALIZED RETURN
    // =========================
    return {
      id: shipment.id || shipment.shipment_id || null,
      tracking_id:
        shipment.tracking_number || shipment.tracking_id || null,
      courier: "Easyship",
      status: shipment.status || "processing",
    };
  } catch (err) {
    console.log("❌ EASYSHIP CREATE ERROR:", {
      message: err.message,
      response: err.response?.data || null,
    });

    // safe fallback (do not break order flow)
    return {
      id: null,
      tracking_id: null,
      courier: "Easyship",
      status: "pending",
      error: true,
    };
  }
};

module.exports = createShipment;