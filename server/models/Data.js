const mongoose = require('mongoose');

const DataSchema = new mongoose.Schema({
  end_year: { type: Number, default: null, index: true },
  start_year: { type: Number, default: null, index: true },
  intensity: { type: Number, default: null },
  likelihood: { type: Number, default: null },
  relevance: { type: Number, default: null },
  impact: { type: Number, default: null },
  sector: { type: String, default: '', index: true },
  topic: { type: String, default: '', index: true },
  region: { type: String, default: '', index: true },
  country: { type: String, default: '', index: true },
  city: { type: String, default: '', index: true },
  pestle: { type: String, default: '', index: true },
  source: { type: String, default: '', index: true },
  swot: { type: String, default: '', index: true },
  insight: { type: String, default: '' },
  title: { type: String, default: '' },
  url: { type: String, default: '' },
  added: { type: String, default: '' },
  published: { type: String, default: '' }
}, {
  timestamps: true,
  collection: 'insights'
});

DataSchema.index({ sector: 1, region: 1, pestle: 1 });
DataSchema.index({ topic: 1, source: 1 });

module.exports = mongoose.model('Data', DataSchema);
