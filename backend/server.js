const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ---------------- In-memory "database" (OK for hackathon demo) ----------------

let users = [];                 // { id, email, password, name, skinType, concerns }
let remindersByUser = {};       // userId -> [ { id, time, products } ]
let routinesByUser = {};        // userId -> routine object

// Simple ID generator
const makeId = () => Math.random().toString(36).substring(2, 9);

// ---------------- Auth (very basic – no hashing, fine for demo) --------------

app.post("/api/auth/signup", (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const existing = users.find((u) => u.email === email);
  if (existing) {
    return res.status(400).json({ error: "Email already registered." });
  }

  const user = {
    id: makeId(),
    email,
    password,
    name: name || "SkinCircuit user",
    skinType: null,
    concerns: []
  };

  users.push(user);

  res.status(201).json({
    message: "Signup successful",
    userId: user.id,
    name: user.name
  });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;

  const user = users.find((u) => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  res.json({
    message: "Login successful",
    userId: user.id,
    name: user.name,
    skinType: user.skinType,
    concerns: user.concerns
  });
});

// ---------------- Quiz: questions + submit -----------------------------------

const quizQuestions = [
  {
    id: "skinType",
    question: "How would you describe your skin overall?",
    options: ["Oily", "Dry", "Combination", "Normal", "Sensitive"]
  },
  {
    id: "mainConcern",
    question: "What is your main skin concern right now?",
    options: ["Acne", "Dark spots", "Redness", "Wrinkles", "Dehydration"]
  },
  {
    id: "sensitivity",
    question: "How sensitive is your skin to new products?",
    options: ["Very sensitive", "Sometimes reacts", "Rarely reacts"]
  }
];

app.get("/api/quiz/questions", (req, res) => {
  res.json(quizQuestions);
});

app.post("/api/quiz/submit", (req, res) => {
  // answers: { skinType, mainConcern, sensitivity }
  const { userId, answers } = req.body;
  if (!answers || !answers.skinType || !answers.mainConcern) {
    return res.status(400).json({ error: "Incomplete quiz answers." });
  }

  const skinType = answers.skinType;
  const concerns = [answers.mainConcern];

  // store on user if exists
  const user = users.find((u) => u.id === userId);
  if (user) {
    user.skinType = skinType;
    user.concerns = concerns;
  }

  const routine = buildRoutine(skinType, concerns);
  if (user) {
    routinesByUser[user.id] = routine;
  }

  const products = getProductSuggestions(skinType, concerns);

  res.json({
    skinType,
    concerns,
    routine,
    products
  });
});

// ---------------- Product suggestions ----------------------------------------

function getProductSuggestions(skinType, concerns) {
  // Very simple, hard-coded demo data – swap Amazon links with real ones
  const base = {
    Cleanser: {
      name: "Gentle Daily Cleanser",
      link: "https://www.amazon.com/s?k=gentle+facial+cleanser"
    },
    Toner: {
      name: "Hydrating Toner",
      link: "https://www.amazon.com/s?k=hydrating+face+toner"
    },
    Serum: {
      name: "Vitamin C Serum",
      link: "https://www.amazon.com/s?k=vitamin+c+serum+face"
    },
    Moisturizer: {
      name: "Lightweight Moisturizer",
      link: "https://www.amazon.com/s?k=lightweight+moisturizer"
    },
    Sunscreen: {
      name: "Broad Spectrum SPF 50",
      link: "https://www.amazon.com/s?k=spf+50+sunscreen+face"
    }
  };

  // tweak based on concern
  const mainConcern = concerns[0];

  if (mainConcern === "Acne") {
    base.Serum = {
      name: "Salicylic Acid Serum",
      link: "https://www.amazon.com/s?k=salicylic+acid+serum"
    };
    base.Cleanser = {
      name: "Foaming Acne Cleanser",
      link: "https://www.amazon.com/s?k=acne+face+wash"
    };
  } else if (mainConcern === "Dark spots") {
    base.Serum = {
      name: "Niacinamide + Alpha Arbutin Serum",
      link: "https://www.amazon.com/s?k=niacinamide+alpha+arbutin+serum"
    };
  } else if (mainConcern === "Dehydration") {
    base.Toner = {
      name: "Hyaluronic Acid Toner",
      link: "https://www.amazon.com/s?k=hyaluronic+acid+toner"
    };
    base.Moisturizer = {
      name: "Rich Hydrating Cream",
      link: "https://www.amazon.com/s?k=hydrating+face+cream"
    };
  }

  return base;
}

app.get("/api/products", (req, res) => {
  const { skinType, concern } = req.query;
  if (!skinType || !concern) {
    return res.status(400).json({ error: "skinType and concern are required." });
  }
  const products = getProductSuggestions(skinType, [concern]);
  res.json(products);
});

// ---------------- Routine (for Routine Preview + Generate Routine) ------------

function buildRoutine(skinType, concerns) {
  const mainConcern = concerns[0] || "General";

  const steps = [
    "Cleanser",
    "Toner",
    "Serum",
    "Moisturizer",
    "Sunscreen (AM only)"
  ];

  return {
    skinType,
    mainConcern,
    steps,
    notes: `Routine tailored for ${skinType} skin with focus on ${mainConcern}.`
  };
}

app.get("/api/routine", (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "userId is required." });

  const routine = routinesByUser[userId];
  if (!routine) {
    return res.json({ routine: null, message: "No routine yet — take the quiz." });
  }

  res.json({ routine });
});

// ---------------- Reminders ---------------------------------------------------

app.get("/api/reminders", (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "userId is required." });

  const reminders = remindersByUser[userId] || [];
  res.json(reminders);
});

app.post("/api/reminders", (req, res) => {
  const { userId, time, products } = req.body;
  if (!userId || !time) {
    return res.status(400).json({ error: "userId and time are required." });
  }

  const reminder = {
    id: makeId(),
    time,           // e.g. "2024-03-01T21:00:00Z" or "21:00"
    products: products || []
  };

  if (!remindersByUser[userId]) remindersByUser[userId] = [];
  remindersByUser[userId].push(reminder);

  res.status(201).json(reminder);
});

// ---------------- EVI chatbot -------------------------------------------------

function getEviResponse(message) {
  const text = (message || "").toLowerCase();

  if (text.includes("acne")) {
    return "For acne-prone skin, look for non-comedogenic products with salicylic acid or benzoyl peroxide, and avoid heavy oils.";
  }
  if (text.includes("dry") || text.includes("dehydrated")) {
    return "For dry or dehydrated skin, use a gentle cleanser, hydrating toner, serum with hyaluronic acid, and a thick moisturizer.";
  }
  if (text.includes("sunscreen") || text.includes("spf")) {
    return "Use a broad-spectrum sunscreen of at least SPF 30 every morning as the last step in your routine.";
  }
  if (text.includes("routine")) {
    return "A simple routine is: Cleanser → Toner → Serum → Moisturizer → Sunscreen (morning only). I can personalize it if you tell me your skin type.";
  }

  return "I'm EVI 🤖. I can help with routines, ingredients, and product types. Try asking about acne, dryness, dark spots, or sunscreen!";
}

app.post("/api/chat", (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: "message is required." });
  }
  const reply = getEviResponse(message);
  res.json({ reply });
});

// ---------------- Health check ------------------------------------------------

app.get("/", (req, res) => {
  res.send("SkinCircuit backend is running ✅");
});

// ---------------- Start server -----------------------------------------------

app.listen(PORT, () => {
  console.log(`SkinCircuit backend running on port ${PORT}`);
});

