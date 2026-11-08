const router = require('express').Router();
const { Content, Comment } = require('../models');
const auth = require('../middleware/auth');
router.get('/stats', auth, async (req, res, next) => {
  try {
    const [total, published, drafts, scheduled, comments, sums, popular] = await Promise.all([
      Content.countDocuments(), Content.countDocuments({ status: 'Published' }),
      Content.countDocuments({ status: 'Draft' }), Content.countDocuments({ status: 'Scheduled' }),
      Comment.countDocuments(),
      Content.aggregate([{ $group: { _id: null, views: { $sum: '$views' }, likes: { $sum: '$likesCount' } } }]),
      Content.find().sort({ views: -1 }).limit(5).select('title views likesCount'),
    ]);
    res.json({ total, published, drafts, scheduled, comments, totalViews: sums[0]?.views || 0, totalLikes: sums[0]?.likes || 0, popular });
  } catch (e) { next(e); }
});
module.exports = router;
