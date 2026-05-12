const shippoLib = require("shippo");
const SHIPPO_API_KEY = process.env.SHIPPO_API_KEY;

// =========================
// SHIPPO SHIPPING SERVICE (PRODUCTION VERSION)
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

  return "CA";
};

const createShipment = async (order) => {
  try {
    if (!order) throw new Error("No order provided");
    if (!SHIPPO_API_KEY) throw new Error("Missing Shippo API key");

    const shippo = shippoLib(SHIPPO_API_KEY);

    // =========================
    // SAFE NORMALIZATION
    // =========================
    const name = order.name || order.customer_name || "Customer";
    const email = order.email || "";

    const address =
      typeof order.address === "string"
        ? order.address
        : order.shipping_address?.address_line_1 || "";

    const city = order.city || order.shipping_address?.city || "Toronto";
    const postal_code = order.postal_code || order.shipping_address?.postal_code || "";

    const country = normalizeCountry(order);

    // =========================
    // PAYLOAD
    // =========================
    const payload = {
      address_from: {
        name: "Velra",
        street1: "Toronto",
        city: "Toronto",
        state: "ON",
        zip: "M5V3L9",
        country: "CA",
      },

      address_to: {
        name,
        email,
        street1: address || "Unknown",
        city,
        zip: postal_code || "M5V3L9",
        country,
      },

      parcels: [
        {
          length: "10",
          width: "10",
          height: "5",
          distance_unit: "in",
          weight: "1",
          mass_unit: "lb",
        },
      ],

      async: false,
    };

    console.log("🚚 SHIPPO SHIPMENT REQUEST", {
      country,
      city,
      hasKey: !!SHIPPO_API_KEY,
    });

    // =========================
    // API CALL
    // =========================
    const shipment = await shippo.shipments.create(payload);
    console.log("🚚 SHIPPO SHIPMENT RESPONSE:", JSON.stringify(shipment, null, 2));

    if (!shipment) throw new Error("Empty Shippo response");

    // =========================
    // NORMALIZED RETURN
    // =========================
    return {
      id: shipment.object_id || shipment.shipment_id || null,
      tracking_id:
        shipment.tracking_number || shipment.tracking_id || null,
      courier: "Shippo",
      status: shipment.status || "processing",
    };
  } catch (err) {
    console.log("❌ SHIPPO CREATE ERROR:", err.message);
    console.log("❌ SHIPPO FULL ERROR:", err.response?.data || err);

    // safe fallback (do not break order flow)
    return {
      id: null,
      tracking_id: null,
      courier: "Shippo",
      status: "pending",
      error: true,
    };
  }
};

module.exports = createShipment;