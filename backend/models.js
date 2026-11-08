const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { Schema, model } = mongoose;
const fail = (m) => Object.assign(new Error(m), { status: 400 });

const userSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 8 },
  bio: { type: String, default: '' },
  avatarUrl: { type: String, default: '' },
});
userSchema.pre('save', async function (next) {
  if (this.isModified('password')) this.password = await bcrypt.hash(this.password, 10);
  next();
});

const contentSchema = new Schema({
  title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: 120 },
  description: { type: String, required: [true, 'Description is required'], maxlength: 1000 },
  category: { type: String, required: true, enum: ['Education', 'Technology', 'Entertainment', 'Lifestyle', 'Other'] },
  contentType: { type: String, required: true, enum: ['video', 'article', 'image', 'podcast'] },
  thumbnailUrl: { type: String, default: '' },
  mediaUrl: { type: String, default: '' },
  articleBody: { type: String, default: '' },
  status: { type: String, enum: ['Draft', 'Published', 'Scheduled'], default: 'Draft' },
  publishDate: Date,
  featured: { type: Boolean, default: false },
  views: { type: Number, default: 0 },
  likesCount: { type: Number, default: 0 },
}, { timestamps: true });
contentSchema.pre('validate', function (next) {
  if (this.status === 'Scheduled') {
    if (!this.publishDate) return next(fail('Scheduled content needs a publication date'));
    if ((this.isModified('publishDate') || this.isModified('status')) && this.publishDate <= new Date())
      return next(fail('Scheduled date must be in the future'));
  }
  if (this.status === 'Published' && !this.publishDate) this.publishDate = new Date();
  if (!this.mediaUrl && !this.articleBody) return next(fail('Provide a media URL or article content'));
  next();
});

const commentSchema = new Schema({
  content: { type: Schema.Types.ObjectId, ref: 'Content', required: true, index: true },
  displayName: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 40 },
  text: { type: String, required: [true, 'Comment is required'], trim: true, maxlength: 500 },
  status: { type: String, enum: ['approved', 'hidden'], default: 'approved' },
}, { timestamps: true });

const likeSchema = new Schema({
  content: { type: Schema.Types.ObjectId, ref: 'Content', required: true },
  viewerId: { type: String, required: true, minlength: 8, maxlength: 64 },
}, { timestamps: true });
likeSchema.index({ content: 1, viewerId: 1 }, { unique: true });

// Public = published, or scheduled and its time has arrived
const visible = () => ({ $or: [{ status: 'Published' }, { status: 'Scheduled', publishDate: { $lte: new Date() } }] });

module.exports = {
  User: model('User', userSchema), Content: model('Content', contentSchema),
  Comment: model('Comment', commentSchema), Like: model('Like', likeSchema), visible,
};
