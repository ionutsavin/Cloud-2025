const express = require("express");
const pool = require("../config/db");
const verifyToken = require("../middleware/authMiddleware");
const axios = require("axios");
const { GoogleGenAI } = require("@google/genai");

const router = express.Router();
const NYT_BOOKS_API_KEY = process.env.NYT_BOOKS_API_KEY;
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

router.get("/", verifyToken, async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM authors");
        res.render("authors", { authors: result.rows });
    } catch (error) {
        console.log(error);
        res.status(500).send("Server error");
    }
});

router.post("/", verifyToken, async (req, res) => {
    const { name } = req.body;
    try {
        const result = await pool.query("SELECT * FROM authors WHERE name = $1", [name]);
        if (result.rows.length > 0){
            console.log("Author already exists");
            return res.status(409).send("Author already exists");
        } 
        await pool.query("INSERT INTO authors (name) VALUES ($1)", [name]);
        console.log("Author added");
        res.redirect("/authors");
    } catch (error) {
        console.log(error);
        res.status(500).send("Error adding author");
    }
});

router.post("/delete/:id", verifyToken, async (req, res) => {
    try {
        await pool.query("DELETE FROM authors WHERE id = $1", [req.params.id]);
        console.log("Author deleted");
        res.redirect("/authors");
    } catch (error) {
        console.log(error);
        res.status(500).send("Error deleting author");
    }
});

router.post("/edit/:id", verifyToken, async (req, res) => {
    const { name } = req.body;
    try {
        const result = await pool.query("SELECT * FROM authors WHERE name = $1", [name]);
        if (result.rows.length > 0){
            console.log("Author already exists");
            return res.status(409).send("Author already exists");
        } 
        await pool.query("UPDATE authors SET name = $1 WHERE id = $2", [name, req.params.id]);
        console.log("Author updated");
        res.redirect("/authors");
    } catch (error) {
        res.status(500).send("Error updating author");
    }
});

router.get("/:name", verifyToken, async (req, res) => {
    try {
        const authorName = encodeURIComponent(req.params.name);
        const apiUrl = `https://api.nytimes.com/svc/books/v3/reviews.json?author=${authorName}&api-key=${NYT_BOOKS_API_KEY}`;
        const response = await axios.get(apiUrl);

        const books = response.data.results.map(book => ({
            title: book.book_title
        }));

        console.log(`Fetched ${books.length} books for author: ${req.params.name}`);
        res.render("author_books", { 
            author: req.params.name, 
            books: books
        });
    } catch (error) {
        console.error("Error fetching books:", error);
        res.status(500).send("Error fetching books from NYT Books API");
    }
});

router.get("/info/:name", verifyToken, async (req, res) => {
    const authorName = req.params.name;

    try {
        prompt = `Please provide a concise biography of ${authorName} in plain, straightforward language, no markdown or HTML.`;
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: prompt,
        });
        const authorInfo = response.text;
        console.log('Info object:', { biography: authorInfo });

        res.render("author_info", { 
            author: authorName, 
            info: { biography: authorInfo },
        });

    } catch (error) {
        console.error("Error fetching general info:", error.response ? error.response.data : error.message);
        res.status(500).send("Error fetching general info from Gemini API");
    }
});

module.exports = router;
