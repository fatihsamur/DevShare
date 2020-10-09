const express = require("express");
const router = express.Router();
const User = require("../../models/User");
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const config = require("config");
const auth = require("../../middleware/auth");
const { check, validationResult } = require("express-validator");


// @route   get api/auth
// @desc    test route
// @access  public

router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
    
  } catch (err) {
    console.error(err.message);
    res.status(500).json({msg:"Server Error"});
  }
});

// @route   post api/auth
// @desc    authenticate user & get token
// @access  public

router.post(
  "/",
  [
    check("email", "Enter a valid email address").isEmail(),
    check("password", "Password is required").exists()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // see if user exist
      let user = await User.findOne({ email });
      if (!user) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Invalid Credentials" }] });
      };

      // Check if password matched
      const isMatch = await bcrypt.compare(password, user.password);
      if(!isMatch){
        return res
          .status(400)
          .json({ errors: [{ msg: "Invalid Credentials" }] });
      };
      
      // return jsonwebtoken jwt
      const payload = {
        user: {
          id: user.id,
          name: user.name
        }
      };

      jwt.sign(
        payload,
        config.get('jwtSecretKey'),
        {expiresIn:360000}, 
        (err, token) => {
          if(err) throw err;
          res.json({token});
      });

    } catch (err) {
      console.log(err.message);
      res.status(500).send("Server Error");
    }
  }
);

module.exports = router;
