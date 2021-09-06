const mongoose = require('mongoose');

var counterSchema = mongoose.Schema({
  "_id": String,
  "sequence_value": Number
});

module.exports = mongoose.model('counters', counterSchema);