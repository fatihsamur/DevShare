const express = require("express");

const app = express();

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("<h1>Hello World</h1>");
});

app.listen(3000, () => console.log(`Server running on PORT: ${PORT}`));
