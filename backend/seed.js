require('dotenv').config();
const mongoose = require('mongoose');
const { User, Content } = require('./models');
(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  if (!(await User.findOne({ email: process.env.SEED_EMAIL?.toLowerCase() }))) {
    await User.create({ name: process.env.SEED_NAME, email: process.env.SEED_EMAIL, password: process.env.SEED_PASSWORD, bio: 'Welcome to my channel! Edit this intro from the dashboard.' });
    console.log('Creator account created');
  }
  if (!(await Content.countDocuments())) {
    await Content.insertMany([
      { title: 'Getting Started with React', description: 'A beginner-friendly intro.', category: 'Education', contentType: 'video', mediaUrl: 'https://youtube.com', status: 'Published', publishDate: new Date(), featured: true },
      { title: 'Top 5 Dev Tools', description: 'Tools I use daily.', category: 'Technology', contentType: 'article', articleBody: 'Sample article text...', status: 'Published', publishDate: new Date() },
      { title: 'Unfinished Idea', description: 'Still a draft.', category: 'Lifestyle', contentType: 'podcast', mediaUrl: 'https://example.com', status: 'Draft' },
    ]);
    console.log('Sample content added');
  }
  process.exit(0);
})().catch((e) => { console.error(e.message); process.exit(1); });
