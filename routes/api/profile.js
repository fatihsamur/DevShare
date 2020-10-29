const express = require('express');
const Profile = require('../../models/Profile');
const User = require('../../models/User');
const Post = require('../../models/Post');
const router = express.Router();
const got = require('got');
const config = require('config');
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');

// @route   GET api/profile/me
// @desc    Get curent users profile
// @access  private
router.get('/me', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id,
    }).populate('user', ['name', 'avatar']);
    // check if profile exist
    if (!profile) {
      return res.status(400).json({ msg: 'No profile for this user' });
    }
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    POST api/profile
// @desc     create/update profile
// @access   private
router.post(
  '/',
  [
    auth,
    [
      check('status', 'Status is required').not().isEmpty(),
      check('skills', 'Skills is required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      company,
      website,
      location,
      status,
      skills,
      bio,
      githubUsername,
      youtube,
      twitter,
      facebook,
      linkedin,
      instagram,
    } = req.body;

    // create profile fields & social object
    const profileFields = {};

    profileFields.user = req.user.id;

    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (status) profileFields.status = status;
    if (bio) profileFields.bio = bio;
    if (githubUsername) profileFields.githubUsername = githubUsername;
    if (skills) {
      profileFields.skills = skills.split(',').map((skill) => skill.trim());
    }
    profileFields.social = {};
    if (youtube) profileFields.social.youtube = youtube;
    if (twitter) profileFields.social.twitter = twitter;
    if (facebook) profileFields.social.facebook = facebook;
    if (linkedin) profileFields.social.linkedin = linkedin;
    if (instagram) profileFields.social.instagram = instagram;

    try {
      // if profile exist => update profil
      let profile = await Profile.findOne({ user: req.user.id });
      if (profile) {
        // update
        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        );
        return res.json(profile);
      }
      // else create Profile
      profile = new Profile(profileFields);
      await profile.save();

      return res.status(200).json(profile);
    } catch (err) {
      console.log(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   GET api/profile
// @desc    get all profiles
// @access  public
router.get('/', async (req, res) => {
  try {
    const profiles = await Profile.find().populate('user', ['name', 'avatar']);
    res.json(profiles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/profile/user/:user_id
// @desc    get profile by user_id
// @access  public
router.get('/user/:user_id', async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.user_id,
    }).populate('user', ['name', 'avatar']);
    if (!profile) {
      return res.status(400).json({ msg: 'Profile can not found' });
    }
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ msg: 'Profile can not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   GET api/profile
// @desc    DELETE user
// @access  private
router.delete('/', auth, async (req, res) => {
  try {
    // delete posts //
    await Post.deleteMany({ user: req.user.id });
    // delete profile
    await Profile.findOneAndDelete({ user: req.user.id });
    // delete user
    await User.findOneAndDelete({ _id: req.user.id });
    res.json({ msg: 'user deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// PUT api/profile/experience
// @desc add profile experience
// @access private
router.put(
  '/experience',
  [
    auth,
    [check('title', 'Title is required').not().isEmpty()],
    [check('company', 'Company is required').not().isEmpty()],
    [check('from', 'Beginning date is required').not().isEmpty()],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    //
    const {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    } = req.body;
    //
    const newExperience = {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    };
    //
    try {
      let profile = await Profile.findOne({ user: req.user.id });
      profile.experience.push(newExperience);
      await profile.save();
      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ msg: 'Server Error' });
    }

    //
  }
);

// DELETE api/profile/experience/:experience_id
// @desc add profile experience
// @access private
router.delete('/experience/:experience_id', auth, async (req, res) => {
  try {
    let profile = await Profile.findOne({ user: req.user.id });
    const newExp = profile.experience.filter((exp) => {
      return exp._id.toString() !== req.params.experience_id;
    });
    profile.experience = newExp;
    await profile.save();
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// PUT api/profile/education
// @desc add profile education
// @access private
router.put(
  '/education',
  [
    auth,
    [check('school', 'School is required').not().isEmpty()],
    [check('degree', 'Degree is required').not().isEmpty()],
    [check('fieldOfStudy', 'Fields of study is required').not().isEmpty()],
    [check('from', 'From is required').not().isEmpty()],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    //
    const {
      school,
      degree,
      fieldOfStudy,
      from,
      to,
      current,
      description,
    } = req.body;

    const newEducation = {
      school,
      degree,
      fieldOfStudy,
      from,
      to,
      current,
      description,
    };

    try {
      let profile = await Profile.findOne({ user: req.user.id });
      profile.education.push(newEducation);
      await profile.save();
      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ msg: 'Server Error' });
    }
  }
);

// DELETE api/profile/education/:education
// @desc add profile education
// @access private
router.delete('/education/:education_id', auth, async (req, res) => {
  try {
    let profile = await Profile.findOne({ user: req.user.id });
    const newEducation = profile.education.filter((edu) => {
      return edu._id.toString() !== req.params.education_id;
    });
    profile.education = newEducation;
    await profile.save();
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/profile/github/:username
// @desc    get github repo of user
// @access  public
/*  */
/* Status errorlarında BUG var */
/*  */
router.get('/github/:username', async (req, res) => {
  try {
    const userName = req.params.username;
    const cId = config.get('githubClientID');
    const secret = config.get('githubClientSecret');
    const URI = `https://api.github.com/users/${userName}/repos?per_page=5&sort=created:asc&client_id=${cId}&client_secret=${secret}`;
    const response = await got(URI, { responseType: 'json' });
    res.send(response.body);
  } catch (err) {
    console.error(err.message);
    res.status(404).json({ msg: 'No github profile for this user' });
  }
});
//
module.exports = router;
