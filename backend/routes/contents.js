const router = require('express').Router();
const { Content, Comment, Like, visible } = require('../models');
const auth = require('../middleware/auth');
const FIELDS = ['title', 'description', 'category', 'contentType', 'thumbnailUrl', 'mediaUrl', 'articleBody', 'status', 'publishDate', 'featured'];
const pick = (b) => { const o = {}; FIELDS.forEach((f) => { if (b[f] !== undefined) o[f] = b[f] === '' && f === 'publishDate' ? undefined : b[f]; }); return o; };
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const notFound = (res) => res.status(404).json({ message: 'Content not found' });

// Public: published content, with search + category filter
router.get('/', async (req, res, next) => {
  try {
    const { q, category, featured } = req.query;
    const and = [visible()];
    if (category) and.push({ category });
    if (featured === 'true') and.push({ featured: true });
    if (q) { const r = new RegExp(esc(String(q)), 'i'); and.push({ $or: [{ title: r }, { description: r }] }); }
    res.json(await Content.find({ $and: and }).select('-articleBody').sort({ publishDate: -1 }));
  } catch (e) { next(e); }
});
// Creator only: everything, including drafts and scheduled
router.get('/manage/all', auth, async (req, res, next) => {
  try { res.json(await Content.find().sort({ createdAt: -1 })); } catch (e) { next(e); }
});
router.get('/manage/:id', auth, async (req, res, next) => {
  try { const c = await Content.findById(req.params.id); c ? res.json(c) : notFound(res); } catch (e) { next(e); }
});
// Public: one item (counts a view)
router.get('/:id', async (req, res, next) => {
  try {
    const c = await Content.findOneAndUpdate({ $and: [{ _id: req.params.id }, visible()] }, { $inc: { views: 1 } }, { new: true });
    c ? res.json(c) : notFound(res);
  } catch (e) { next(e); }
});
router.post('/', auth, async (req, res, next) => {
  try { res.status(201).json(await Content.create(pick(req.body))); } catch (e) { next(e); }
});
router.put('/:id', auth, async (req, res, next) => {
  try {
    const c = await Content.findById(req.params.id);
    if (!c) return notFound(res);
    c.set(pick(req.body));
    res.json(await c.save());
  } catch (e) { next(e); }
});
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const c = await Content.findByIdAndDelete(req.params.id);
    if (!c) return notFound(res);
    await Promise.all([Comment.deleteMany({ content: c._id }), Like.deleteMany({ content: c._id })]);
    res.json({ message: 'Deleted' });
  } catch (e) { next(e); }
});
module.exports = router;
