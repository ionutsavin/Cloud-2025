require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const authRoutes = require("./routes/authRoutes");
const authorRoutes = require("./routes/authorRoutes");

const app = express();
app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

app.use("/", authRoutes);
app.use("/authors", authorRoutes);

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
