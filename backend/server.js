// backend/server.js
const express = require("express");
const path = require("path");

const app = express();
const PORT = 5000;

// ---------- PATHS ----------
const FRONTEND_DIR = path.join(__dirname, "..", "frontend");

// ---------- MIDDLEWARE ----------
app.use(express.static(FRONTEND_DIR));       // serve HTML / CSS / JS / images
app.use(express.json());

// Optional: serve /templates explicitly (images)
app.use(
  "/templates",
  express.static(path.join(FRONTEND_DIR, "templates"))
);

// ---------- PAGE ROUTES ----------

// Default: show login page first
app.get("/", (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, "login.html"));
});

// Convenience routes for your pages
app.get("/home", (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, "index.html"));
});
app.get("/index", (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, "index.html"));
});

app.get("/quiz", (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, "quiz.html"));
});
app.get("/reminders", (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, "reminders.html"));
});
app.get("/routine", (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, "routine.html"));
});
app.get("/products", (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, "products.html"));
});
app.get("/profile", (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, "profile.html"));
});
app.get("/login", (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, "login.html"));
});

// ---------- PRODUCTS API (BACKEND LOGIC) ----------

// This mapping is used by /api/products/recommend
const PRODUCT_LINKS = {
  toner: {
    oily: [
      {
        label: "Good Vibes Green Tea Toner 200 ml",
        url: "https://www.goodvibesonly.in/products/toner-green-tea-200-ml-1",
      },
      {
        label: "Plum CeraSense Milky Toner with Açaí",
        url: "https://plumgoodness.com/products/plum-cerasense-milky-toner-with-acai-1-nmf",
      },
      {
        label: "Hyphen Hydrating Ceramide Toner Essence",
        url: "https://letshyphen.com/products/hydrating-ceramide-toner-essence",
      },
    ],
    dry: [
      {
        label: "Hyphen Hydrating Ceramide Toner Essence",
        url: "https://letshyphen.com/products/hydrating-ceramide-toner-essence",
      },
      {
        label: "Aqualogica Hydrate & Refresh Toning Mist",
        url: "https://aqualogica.in/products/hydrate-refresh-toning-mist-100-ml?variant=44268094193889&country=IN&currency=INR",
      },
      {
        label: "Cetaphil Cica Balancing Toner 150ml",
        url: "https://www.cetaphil.in/products/product-categories/cetaphil-soothing-and-comforting-cica-balancing-toner---150ml/3499320017305.html",
      },
    ],
    sensitive: [
      {
        label: "Minimalist Soothing Toner (gentle)",
        url: "https://beminimalist.co/products/hocl-skin-relief-spray-150-ppm",
      },
      {
        label: "Wonder Milky Mochi Toner",
        url: "https://tonymoly.us/products/wonder-ceramide-mochi-toner-1",
      },
      {
        label: "Cetaphil Soothing and Comforting CICA Balancing Toner",
        url: "https://www.cetaphil.in/products/product-categories/cetaphil-soothing-and-comforting-cica-balancing-toner---150ml/3499320017305.html",
      },
    ],
    combination: [
      {
        label: "Plum CeraSense Milky Toner with Açaí",
        url: "https://plumgoodness.com/products/plum-cerasense-milky-toner-with-acai-1-nmf",
      },
      {
        label: "Hyphen Ceramide Toner",
        url: "https://letshyphen.com/products/hydrating-ceramide-toner-essence",
      },
      {
        label: "Aqualogica Toning Mist",
        url: "https://aqualogica.in/products/hydrate-refresh-toning-mist-100-ml",
      },
    ],
  },

  cleanser: {
    general: [
      {
        label: "Cetaphil Gentle Skin Cleanser",
        url: "https://www.cetaphil.in/products/cleansers/gentle-skin-cleanser/8906005274105.html",
      },
      {
        label: "CeraVe Balancing Air Foam Facial Cleanser",
        url: "https://www.cerave.com/skincare/cleansers/air-foam-foaming-facial-cleanser",
      },
      {
        label: "The Derma Co. Salicylic Cleanser",
        url: "https://thedermaco.com/product/sali-cinamide-anti-acne-face-wash-with-2-salicylic-acid-2-niacinamide-100ml",
      },
      {
        label: "Minimalist 2% Salicylic Acid Cleanser",
        url: "https://beminimalist.co/products/salicylic-lha-2-cleanser",
      },
    ],
    oily: [
      {
        label: "Cetaphil Pro Oil Control Foam wash",
        url: "https://www.cetaphil.in/products/cleansers/cetaphil-pro-oil-control-foam-wash/3499320011877.html",
      },
      {
        label: "Cerave Acne Control Cleanser",
        url: "https://www.cerave.com/skincare/cleansers/acne-salicylic-acid-cleanser",
      },
    ],
    dry: [
      {
        label: "Cetaphil Gentle Skin Cleanser",
        url: "https://www.cetaphil.in/products/gentle-skin-cleanser",
      },
      {
        label: "Minimalist 2% Salicylic Acid Cleanser",
        url: "https://beminimalist.co/products/salicylic-lha-2-cleanser",
      },
    ],
    sensitive: [
      {
        label: "Cetaphil Gentle Skin Cleanser",
        url: "https://www.cetaphil.in/products/gentle-skin-cleanser",
      },
      {
        label: "Cerave Hydrating Facial Cleanser",
        url: "https://www.cerave.com/skincare/cleansers/hydrating-facial-cleanser",
      },
    ],
  },

  serum: {
    general: [
      {
        label: "Minimalist 10% Vitamin C Serum",
        url: "https://beminimalist.co/collections/best-sellers/products/vitamin-c-ethyl-ascorbic-acid-10-acetyl-glucosamine-1",
      },
      {
        label: "Hyphen Double shot face serum",
        url: "https://letshyphen.com/products/double-shot-radiance-lift-serum",
      },
      {
        label:
          "10% Vitamin C Face Serum with 5% Niacinamide & Hyaluronic Acid",
        url: "https://thedermaco.com/product/10-vitamin-c-face-serum-with-niacinamide-hyaluronic-acid-for-skin-radiance-30ml",
      },
    ],
    acne: [
      {
        label: "Minimalist Niacinamide Serum",
        url: "https://beminimalist.co/products/niacinamide-10-with-matmarine",
      },
      {
        label: "The Derma Co. Niacinamide Serum",
        url: "https://thedermaco.com/product/10-percent-niacinamide-serum",
      },
    ],
    "reduce pigmentation": [
      {
        label:
          "2% Kojic Acid Face Serum with 1% Alpha Arbutin & Niacinamide",
        url: "https://thedermaco.com/product/2-kojic-acid-face-serum-with-1-alpha-arbutin-niacinamide-30-ml",
      },
      {
        label: "Hyphen Golden Hour Glow serum",
        url: "https://letshyphen.com/products/golden-hour-glow-face-serum",
      },
    ],
  },

  eyecream: {
    general: [
      {
        label: "Coffee Under Eye Cream",
        url: "https://www.mcaffeine.com/products/coffee-under-eye-cream-1",
      },
      {
        label:
          "Snail Peptide 96 Under Eye Repair Cream with Snail Mucin & Peptide Complex",
        url: "https://thedermaco.com/product/snail-peptide-96-under-eye-repair-cream-with-snail-mucin-peptide-complex-for-dark-circles-puffiness-15-g",
      },
    ],
  },

  moisturizer: {
    dry: [
      {
        label: "Neutrogena Hydro Boost Hyaluronic Acid Water Gel",
        url: "https://www.neutrogena.in/face/moisturizers/hydro-boost-hyaluronic-acid-water-gel",
      },
      {
        label: "Cetaphil Moisturizing Cream",
        url: "https://www.cetaphil.in/products",
      },
      {
        label: "Marula Oil 5% Face Moisturizer",
        url: "https://beminimalist.co/products/marula-05-moisturizer",
      },
    ],
    oily: [
      {
        label: "Cica + Niacinamide Oil Free Moisturizer",
        url: "https://www.dotandkey.com/products/cica-5-niacinamide-oil-free-moisturizer-for-dark-spots-acne-fragrance-free-oily-sensitive-acne-prone-skin",
      },
      {
        label: "Vitamin B5 10% Moisturizer",
        url: "https://beminimalist.co/products/vitamin-b5-10-moisturizer",
      },
      {
        label: "2% Cica Exosomes Oil-free Moisturizer",
        url: "https://letshyphen.com/products/oil-free-moisturizer",
      },
    ],
    sensitive: [
      {
        label:
          "Lakmē Absolute Perfect Radiance Skin Brightening Light Creme 50 g",
        url: "https://www.lakmeindia.com/products/lakme-absolute-perfect-radiance-skin-brightening-light-creme-50g",
      },
      {
        label: "Cetaphil Moisturizing Cream",
        url: "https://www.cetaphil.in/moisturizers/moisturising-cream/8906005273436.html",
      },
    ],
  },

  sunscreen: {
    dry: [
      {
        label: "Minimalist SPF 50 Sunscreen",
        url: "https://beminimalist.co/products/multi-vitamin-spf-50",
      },
      {
        label: "Cetaphil SPF 50+ Sunscreen",
        url: "https://www.cetaphil.in/sunscreens/cetaphil-spf-50%2B-sunscreen/3499320013192.html",
      },
    ],
    oily: [
      {
        label: "Hyphen Sun milk 100% mineral sunscreen spf 50 pa++++",
        url: "https://letshyphen.com/products/sun-milk-100-mineral-sunscreen-spf-50-pa",
      },
      {
        label: "Watermelon Sunscreen, SPF 50+ PA++++",
        url: "https://www.dotandkey.com/products/watermelon-cooling-spf-50-face-sunscreen",
      },
    ],
    sensitive: [
      {
        label:
          "Oats & Ceramide Sunscreen for Sensitive Skin - SPF 50+ PA ++++",
        url: "https://www.drsheths.com/products/oats-ceramide-sensitive-skin-sunscreen-50g",
      },
      {
        label: "Barrier Repair Hydrating Sunscreen SPF 50+ PA++++",
        url: "https://www.dotandkey.com/products/barrier-repair-sunscreen",
      },
    ],
    combination: [
      {
        label:
          "Niacinamide Oil Balance Fluid Sunscreen | SPF50 PA++++",
        url: "https://www.mywishcare.com/products/niacinamide-oil-balance-fluid-spf-50-sunscreen",
      },
    ],
  },

  scrub: {
    general: [
      {
        label: "Coffee Face Scrub with Walnut",
        url: "https://www.mcaffeine.com/products/naked-raw-coffee-face-scrub-with-vitamin-e",
      },
      {
        label:
          "Volcanic Lava Ash Face Scrub with Yugdugu & White Lotus",
        url: "https://discoverpilgrim.com/products/volcanic-lava-ash-face-scrub-with-yugdugu-white-lotus",
      },
    ],
  },

  facemask: {
    general: [
      {
        label: "Skin Radiance De-Tan Mask",
        url: "https://foxtale.in/products/skin-radiance-mask",
      },
      {
        label: "Vitamin C Pink Clay Mask",
        url: "https://www.dotandkey.com/products/vitamin-c-pink-clay-mask",
      },
      {
        label:
          "Super Glow Flash Facial 25% AHA+BHA+PHA Face Mask",
        url: "https://www.mcaffeine.com/products/super-glow-flash-facial-25-aha-bha-pha-face-mask-50gm",
      },
    ],
  },
};

// POST /api/products/recommend
app.post("/api/products/recommend", (req, res) => {
  const { skinType, products } = req.body || {};
  if (!skinType || !Array.isArray(products) || products.length === 0) {
    return res.status(400).json({
      error: "skinType and products[] are required",
    });
  }

  const result = {};

  products.forEach((key) => {
    const entry = PRODUCT_LINKS[key];
    if (!entry) {
      result[key] = [];
      return;
    }

    let items = [];
    if (entry[skinType]) items = entry[skinType];
    else if (entry.general) items = entry.general;

    result[key] = items || [];
  });

  res.json({
    skinType,
    products,
    linksByProduct: result,
  });
});
// Chatbot page
app.get('/chat', (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'chatbot.html'));
});
// --- Simple chatbot API for EVI ---
// Frontend calls POST /api/chat with JSON { q: "user question" }
// We return { reply: string, sources: string[] }

app.post('/api/chat', (req, res) => {
  const qRaw = (req.body && req.body.q) || '';
  const q = String(qRaw).trim();

  if (!q) {
    return res.status(400).json({
      reply: "Please type a question so I can help.",
      sources: []
    });
  }

  const lower = q.toLowerCase();
  let reply = null;
  const sources = [];

  // Very simple rule-based logic (mirrors the frontend fallback)
  function set(text) { reply = text; }

  if (/(cleanser|face wash)/i.test(q)) {
    set("A gentle, non-stripping cleanser twice a day is usually enough. Choose one suited to your skin type and avoid harsh soaps or scrubs.");
  } else if (/(sunscreen|spf|sun)/i.test(q)) {
    set("Use a broad-spectrum sunscreen SPF 30+ every morning, even on cloudy days. Reapply every 2 hours if you’re outdoors or near windows.");
  } else if (/(acne|pimple|breakout)/i.test(q)) {
    set("For acne, keep your routine simple: gentle cleanser, non-comedogenic moisturizer and daily sunscreen. Add a salicylic acid or benzoyl peroxide treatment if needed, and see a dermatologist for persistent or severe acne.");
  } else if (/(serum|vitamin c|retinol)/i.test(q)) {
    set("Vitamin C is usually used in the morning under sunscreen for brightening and antioxidant protection. Retinol is typically used at night, starting 2–3 times a week and slowly increasing as tolerated.");
  } else if (/(dry skin|dryness|flaky)/i.test(q)) {
    set("For dry skin, look for cleansers without sulfates and moisturizers with ceramides, glycerin or hyaluronic acid. Limit hot showers and avoid strong alcohol-based toners.");
  } else if (/(scrub|exfoli)/i.test(q)) {
    set("Most people only need exfoliation 1–3 times per week. Over-exfoliating can damage your barrier and make skin red or sensitive.");
  } else if (/(hello|hi|hey|namaste)/i.test(q)) {
    set("Hi, I’m EVI 👋 I can help you build simple skincare routines, suggest product categories, and explain how often to use each step.");
  } else if(/(moisturising|moisturizer|moisturizers|cream|moisturiser)/i.test(q)){
    set("Squeeze the enough amount of moisturizer and use your fingers to spread it evenly.Gently massage your skin in a circular motion with your hands to make sure the cream is fully absorbed. When washing your face in the morning or removing your makeup at night, use gentle patting motions to prevent irritating your skin.")
  }

  if (!reply) {
    reply =
      "I’m not sure about that one yet. Try asking about cleansers, sunscreen, acne, scrubs, or basic routine steps. " +
      "For medical questions or serious skin concerns, please see a dermatologist.";
  }

  res.json({ reply, sources });
}); 
// Chatbot page
app.get('/chat', (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'chatbot.html'));
});


// ---------- 404 HANDLER ----------
app.use((req, res) => {
  console.log("404 for URL:", req.originalUrl);
  res.status(404).send("404 Not Found: " + req.originalUrl);
});

// ---------- START SERVER ----------
app.listen(PORT, () => {
  console.log(`SkinCircuit running at: http://localhost:${PORT}`);
  console.log("Serving frontend from:", FRONTEND_DIR);
});


