const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");

// @route   post api/users
// @desc    register user
// @access  public

router.post(
  "/",
  [
    check("name", "Name can't be blank.").not().isEmpty(),
    check("email", "Enter a valid email address").isEmail(),
    check("password", "Password must be at least 8 characters").isLength({
      min: 8,
    }),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    res.send("user route");
  }
);

module.exports = router;
