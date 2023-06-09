const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const catSchema = new Schema(
  {
    name: { type: String, required: true },
    //slug
    description: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Category', catSchema);
