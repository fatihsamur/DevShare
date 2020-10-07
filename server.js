const express = require("express");
const connectDB = require("./config/db");

const app = express();

// connect to database
connectDB();

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("<h1>Hello World</h1>");
});

app.listen(3000, () => console.log(`Server running on PORT: ${PORT}`));
