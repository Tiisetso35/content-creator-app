const router = require('express').Router();
const mongoose = require('mongoose');
const { Content, Comment, visible } = require('../models');
const auth = require('../middleware/auth');

router.post('/', async (req, res, next) => {
  try {
    const { contentId, displayName, text } = req.body;
    if (!mongoose.isValidObjectId(contentId)) return res.status(400).json({ message: 'Valid contentId is required' });
    if (!(await Content.exists({ $and: [{ _id: contentId }, visible()] }))) return res.status(404).json({ message: 'Content not found' });
    res.status(201).json(await Comment.create({ content: contentId, displayName, text }));
  } catch (e) { next(e); }
});
// Creator: all comments for moderation
router.get('/', auth, async (req, res, next) => {
  try { res.json(await Comment.find().populate('content', 'title').sort({ createdAt: -1 })); } catch (e) { next(e); }
});
// Public: approved comments for one content item
router.get('/:contentId', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.contentId)) return res.status(400).json({ message: 'Invalid id' });
    res.json(await Comment.find({ content: req.params.contentId, status: 'approved' }).sort({ createdAt: -1 }));
  } catch (e) { next(e); }
});
router.patch('/:id/status', auth, async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['approved', 'hidden'].includes(status)) return res.status(400).json({ message: 'Status must be approved or hidden' });
    const c = await Comment.findByIdAndUpdate(req.params.id, { status }, { new: true });
    c ? res.json(c) : res.status(404).json({ message: 'Comment not found' });
  } catch (e) { next(e); }
});
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const c = await Comment.findByIdAndDelete(req.params.id);
    c ? res.json({ message: 'Deleted' }) : res.status(404).json({ message: 'Comment not found' });
  } catch (e) { next(e); }
});
module.exports = router;
