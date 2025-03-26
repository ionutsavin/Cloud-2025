const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const verifyToken = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", (req, res) => res.redirect("/login"));
router.get("/login", (req, res) => res.render("login"));
router.get("/register", (req, res) => res.render("register"));
router.get("/logout", (req, res) => { res.clearCookie("token"); res.redirect("/login"); });
router.get("/dashboard", verifyToken, (req, res) => res.render("dashboard", { username: req.user.username }));

router.post("/register", async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
        await pool.query("INSERT INTO users (username, password) VALUES ($1, $2)", [username, hashedPassword]);
        console.log("User registered");
        res.redirect("/login");
    } catch (err) {
        console.log(err);
        res.status(500).send("Registration failed");
    }
});

router.post("/login", async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
        if (result.rows.length === 0){
            console.log("User not found");
            return res.status(401).send("Authentication failed");
        }

        const user = result.rows[0];
        if (!(await bcrypt.compare(password, user.password))) {
            console.log("Wrong password");
            return res.status(401).send("Wrong password");
        }
        console.log("User logged in");
        const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: "1h" });
        res.cookie("token", token, { httpOnly: true, secure: false, sameSite: "Strict" });
        res.redirect("/dashboard");
    } catch (err) {
        console.log(err);
        res.status(500).send("Server error");
    }
});

module.exports = router;
