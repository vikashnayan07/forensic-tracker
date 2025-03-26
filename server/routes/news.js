const express = require("express");
const router = express.Router();
const axios = require("axios");

// Proxy route to fetch news articles from GNews API
router.get("/cybercrime-news", async (req, res) => {
  try {
    const gnewsApiKey = process.env.GNEWS_API_KEY;
    console.log(
      "GNews API Key (first 5 chars):",
      gnewsApiKey ? gnewsApiKey.substring(0, 5) + "..." : "undefined"
    );

    if (!gnewsApiKey) {
      return res
        .status(500)
        .json({ message: "GNews API key is not configured" });
    }

    const response = await axios.get(
      `https://gnews.io/api/v4/search?q=cybercrime&lang=en&max=30&apikey=${gnewsApiKey}`
    );

    res.json(response.data);
  } catch (err) {
    console.error("Error fetching news articles:", err.message);
    if (err.response) {
      console.error("GNews API response status:", err.response.status);
      console.error("GNews API response data:", err.response.data);
    }
    res.status(500).json({
      message: "Error fetching news articles",
      error: err.message,
    });
  }
});

module.exports = router;
