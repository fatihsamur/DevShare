const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');

// @route   POST api/users
// @desc    register user
// @access  public
router.post(
  '/',
  [
    check('name', "Name can't be blank.").not().isEmpty(),
    check('email', 'Enter a valid email address').isEmail(),
    check('password', 'Password must be at least 8 characters').isLength({
      min: 8,
    }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { name, email, password } = req.body;
    try {
      // see if user exist
      let user = await User.findOne({ email });
      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'User already exist' }] });
      }
      // get user gravatar
      const avatar = gravatar.url(email, {
        s: '200',
        r: 'g',
        d: 'mp',
      });
      // create a new instance of User
      user = new User({
        name,
        email,
        avatar,
        password,
      });
      // encrypt user password
      const salt = await bcrypt.genSaltSync(10);
      user.password = await bcrypt.hash(password, salt);
      // save new user to database
      await user.save();
      // return jsonwebtoken jwt
      const payload = {
        user: {
          id: user.id,
          name: user.name,
        },
      };
      jwt.sign(
        payload,
        config.get('jwtSecretKey'),
        { expiresIn: 360000 },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      res.status(500).send('Server Error');
    }
  }
);

module.exports = router;
