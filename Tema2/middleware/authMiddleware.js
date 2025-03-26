const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
    const token = req.cookies.token;
    if (!token){
        console.log("No token");
        return res.redirect("/login");
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            console.log("Invalid token");
            return res.redirect("/login");
        }
        req.user = decoded;
        next();
    });
};

module.exports = verifyToken;
