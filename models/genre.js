const mongoose = require('mongoose');

const { Schema } = mongoose;

const GenreSchema = new Schema({
  name: {
    type: String,
    validate: {
      validator: function (v) {
        return v.length > 3 && v.length < 100;
      },
      message: 'The length of the name should be over 3 and below 100.',
    },
  },
});

GenreSchema.virtual('url').get(function () {
  return `/catalog/genre/${this._id}`;
});

module.exports = mongoose.model('Genre', GenreSchema);
