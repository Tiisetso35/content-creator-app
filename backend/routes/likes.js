const router = require('express').Router();
const mongoose = require('mongoose');
const { Content, Like, visible } = require('../models');

// Toggle like. viewerId is a random id the browser stores (no viewer login needed)
router.post('/', async (req, res, next) => {
  try {
    const { contentId, viewerId } = req.body;
    if (!mongoose.isValidObjectId(contentId) || !viewerId || String(viewerId).length < 8)
      return res.status(400).json({ message: 'contentId and viewerId are required' });
    if (!(await Content.exists({ $and: [{ _id: contentId }, visible()] }))) return res.status(404).json({ message: 'Content not found' });
    const existing = await Like.findOneAndDelete({ content: contentId, viewerId });
    let liked = false;
    if (!existing) { try { await Like.create({ content: contentId, viewerId }); liked = true; } catch (e) { if (e.code !== 11000) throw e; liked = true; } }
    const c = await Content.findByIdAndUpdate(contentId, { $inc: { likesCount: existing ? -1 : liked ? 1 : 0 } }, { new: true });
    res.status(liked ? 201 : 200).json({ liked, likesCount: Math.max(c.likesCount, 0) });
  } catch (e) { next(e); }
});
router.get('/:contentId', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.contentId)) return res.status(400).json({ message: 'Invalid id' });
    const liked = req.query.viewerId ? !!(await Like.exists({ content: req.params.contentId, viewerId: req.query.viewerId })) : false;
    res.json({ liked });
  } catch (e) { next(e); }
});
module.exports = router;
