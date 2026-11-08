const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const auth = require('../middleware/auth');

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });
    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user || !(await bcrypt.compare(String(password), user.password)))
      return res.status(401).json({ message: 'Invalid email or password' });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (e) { next(e); }
});
router.get('/profile', async (req, res, next) => {
  try { res.json((await User.findOne().select('name bio avatarUrl')) || {}); } catch (e) { next(e); }
});
router.put('/profile', auth, async (req, res, next) => {
  try {
    const { name, bio, avatarUrl } = req.body;
    res.json(await User.findByIdAndUpdate(req.user.id, { name, bio, avatarUrl }, { new: true, runValidators: true }).select('name bio avatarUrl'));
  } catch (e) { next(e); }
});
module.exports = router;
