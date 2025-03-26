const express = require("express");
const router = express.Router();
const axios = require("axios");

// Proxy route to fetch news articles from News API
router.get("/cybercrime-news", async (req, res) => {
  try {
    const newsApiKey = process.env.NEWS_API_KEY;
    if (!newsApiKey) {
      return res
        .status(500)
        .json({ message: "News API key is not configured" });
    }

    const response = await axios.get(
      `https://newsapi.org/v2/everything?q=cybercrime&apiKey=${newsApiKey}`
    );

    res.json(response.data);
  } catch (err) {
    console.error("Error fetching news articles:", err.message);
    res.status(500).json({
      message: "Error fetching news articles",
      error: err.message,
    });
  }
});

module.exports = router;
