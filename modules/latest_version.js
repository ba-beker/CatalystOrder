const mongoose = require('mongoose');

const latestVersionSchema = mongoose.Schema({
	version: {
	  type: String,
	  required: true,
	},
  });
  const LatestVersion = mongoose.model('Latest_version', latestVersionSchema);
  module.exports = LatestVersion;