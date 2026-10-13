const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;

// Middleware
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Set EJS as templating engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Load data
const plantsData = JSON.parse(fs.readFileSync("./data/plants.json", "utf8"));
const reviewsPath = "./data/reviews.json";
let reviewsData = JSON.parse(fs.readFileSync(reviewsPath, "utf8"));

// Helper: save reviews
function saveReviews() {
  fs.writeFileSync(reviewsPath, JSON.stringify(reviewsData, null, 2));
}

// Helper: get reviews for a plant
function getReviewsForPlant(plantId) {
  return reviewsData.reviews.filter((r) => r.plantId === plantId);
}

// Helper: calculate average rating
function getAverageRating(plantId) {
  const reviews = getReviewsForPlant(plantId);
  if (reviews.length === 0) return null;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return (sum / reviews.length).toFixed(1);
}

// ---------- ROUTES ----------

// Home
app.get("/", (req, res) => {
  const featured = plantsData.plants.filter((p) => p.featured === true);
  res.render("index", { featured, getAverageRating });
});

// Shop
app.get("/shop", (req, res) => {
  res.render("shop", { plants: plantsData.plants, getAverageRating });
});

// Product Detail
app.get("/product/:id", (req, res) => {
  const plant = plantsData.plants.find((p) => p.id === parseInt(req.params.id));
  if (!plant) return res.status(404).send("Plant not found");

  const related = plantsData.plants
    .filter((p) => p.category === plant.category && p.id !== plant.id)
    .slice(0, 3);

  const reviews = getReviewsForPlant(plant.id);
  const avgRating = getAverageRating(plant.id);
  const reviewCount = reviews.length;

  res.render("product", {
    plant,
    related,
    reviews,
    avgRating,
    reviewCount,
    getAverageRating,
  });
});

// Add Review (POST)
app.post("/product/:id/review", (req, res) => {
  const plantId = parseInt(req.params.id);
  const { name, rating, comment } = req.body;

  if (!name || !rating || !comment) {
    return res.redirect(`/product/${plantId}#reviews`);
  }

  const newReview = {
    id: reviewsData.reviews.length + 1,
    plantId,
    name: name.trim(),
    rating: parseInt(rating),
    comment: comment.trim(),
    date: new Date().toISOString().split("T")[0],
  };

  reviewsData.reviews.push(newReview);
  saveReviews();

  res.redirect(`/product/${plantId}#reviews`);
});

// Cart, Checkout, About, Contact
app.get("/cart", (req, res) => res.render("cart"));
app.get("/checkout", (req, res) => res.render("checkout"));
app.get("/about", (req, res) => res.render("about"));
app.get("/contact", (req, res) => res.render("contact"));

// API
app.get("/api/plants", (req, res) => {
  res.json(plantsData.plants);
});

// Start
app.listen(PORT, () => {
  console.log(`🌿 Bloom Plant Nursery running at http://localhost:${PORT}`);
});
