const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const Post = require('../../models/Post');
const Profile = require('../../models/Profile');
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');

// @route   POST api/posts
// @desc    create new post
// @access  private
router.post(
  '/',
  [auth, check('text', 'Text is required').not().isEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select('-password');
      const newPost = {
        user: req.user.id,
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
      };

      const post = new Post(newPost);
      await post.save();
      res.json(post);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   GET api/posts
// @desc    get all posts
// @access  private
router.get('/', auth, async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 });
    res.json(posts);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   GET api/posts/:post_id
// @desc    get post by id
// @access  private
router.get('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }
    res.json(post);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Post not found' });
    }
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   DELETE api/posts/:post_id
// @desc    delete post by id
// @access  private
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }
    // check if delete req is from post owner
    if (post.user.toString() === req.user.id) {
      console.log('sildim');
      await Post.findByIdAndDelete(req.params.id);
    } else {
      return res.status(401).json({ msg: 'Unauthorized action' });
    }
    res.json({ msg: 'Post deleted' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Post not found' });
    }
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   PUT api/posts/like/:id
// @desc    like a post
// @access  private
router.put('/like/:id', auth, async (req, res) => {
  const post = await Post.findById(req.params.id);
  let indexOfLike = -1;
  let isLiked = false;
  for (let i = 0; i < post.likes.length; i++) {
    if (req.user.id === post.likes[i].id) {
      indexOfLike = i;
      break;
    }
  }
  if (indexOfLike !== -1) {
    isLiked = true;
  }

  try {
    if (!isLiked) {
      post.likes.unshift(req.user.id);
      await post.save();
    } else {
      return res.status(404).json({ msg: 'You liked before' });
    }
    res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   PUT api/posts/unlike/:id
// @desc    unlike a post
// @access  private
router.put('/unlike/:id', auth, async (req, res) => {
  const unlike = req.user.id;
  console.log(`unlike from ${req.user.id}`);

  const post = await Post.findById(req.params.id);
  console.log(post.likes);

  res.json(post);
  try {
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

//
module.exports = router;
