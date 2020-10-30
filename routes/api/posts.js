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

/* Change the for loop with proper Array methods */
/* Add an extra error option for post not exist situation */
// @route   PUT api/posts/like/:id
// @desc    like a post
// @access  private
router.put('/like/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    let indexOfLike = -1;
    let isLiked = false;
    for (let i = 0; i < post.likes.length; i++) {
      if (req.user.id === post.likes[i].user.toString()) {
        indexOfLike = i;
        break;
      }
    }
    if (indexOfLike !== -1) {
      isLiked = true;
    }
    if (!isLiked) {
      post.likes.unshift({ user: req.user.id });
      await post.save();
    } else {
      return res.status(400).json({ msg: 'You liked before' });
    }
    res.json(post.likes);
  } catch (err) {
    /* add an extra error for the situation that there is no post exist */
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   PUT api/posts/unlike/:id
// @desc    unlike a post
// @access  private
router.put('/unlike/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    // check if user liked the post
    let indexOfLike = -1;
    let isLiked = false;
    for (let i = 0; i < post.likes.length; i++) {
      if (req.user.id === post.likes[i].user.toString()) {
        indexOfLike = i;
        break;
      }
    }
    if (indexOfLike !== -1) {
      isLiked = true;
    }
    if (isLiked) {
      post.likes.splice(indexOfLike, 1);
      await post.save();
    } else {
      return res.status(404).json({ msg: 'Did not liked before' });
    }
    res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   PUT api/posts/comment/:id
// @desc    comment on a post
// @access  private
router.put(
  '/comment/:id',
  [auth, check('text', 'Text is required').not().isEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const post = await Post.findById(req.params.id);
      const user = await User.findById(req.user.id);

      const comment = {
        user: user.id,
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
      };
      post.comments.unshift(comment);
      await post.save();
      res.json(post.comments);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ msg: 'Server Error' });
    }
  }
);

// @route   PUT api/posts/uncomment/:post_id/:comment_id
// @desc    delete a comment from post
// @access  private
router.put('/uncomment/:post_id/:com_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.post_id);
    const comment = req.params.com_id;
    let indexOfCom = -1;
    let fromComArr = null;
    // find the matching comment from comment list
    for (let i = 0; i < post.comments.length; i++) {
      if (post.comments[i].id.toString() === comment) {
        indexOfCom = i;
        fromComArr = post.comments[i];
        break;
      }
    }

    // check if comment not exist
    if (indexOfCom === -1) {
      return res.status(404).json({ msg: 'Comment not found' });
    }

    const postOwner = post.user.toString();
    const commentOwner = fromComArr.user.toString();

    // post owner and comment owner can delete post
    if (req.user.id === postOwner || req.user.id === commentOwner) {
      post.comments.splice(indexOfCom, 1);
    } else {
      return res.status(401).json({ msh: 'Unauthorized action' });
    }
    await post.save();
    res.json(post.comments);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

//
module.exports = router;
