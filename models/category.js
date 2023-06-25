const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const catSchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true },
    description: { type: String, required: true },
    imageUrl: { type: String, required: false },
    imageId: { type: String, required: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Category', catSchema);
