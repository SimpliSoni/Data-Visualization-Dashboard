const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const Data = require('./models/Data');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/visualization_dashboard';

const jsonPathServer = path.join(__dirname, 'jsondata.json');
const jsonPathParent = path.join(__dirname, '..', 'jsondata.json');
const JSON_PATH = fs.existsSync(jsonPathServer) ? jsonPathServer : jsonPathParent;

const toNumberOrNull = (value) => {
  if (value === "" || value === undefined || value === null) return null;
  const num = Number(value);
  return isNaN(num) ? null : num;
};

const cleanRecord = (item) => ({
  end_year: toNumberOrNull(item.end_year),
  start_year: toNumberOrNull(item.start_year),
  intensity: toNumberOrNull(item.intensity),
  likelihood: toNumberOrNull(item.likelihood),
  relevance: toNumberOrNull(item.relevance),
  impact: toNumberOrNull(item.impact),
  sector: String(item.sector || ''),
  topic: String(item.topic || ''),
  insight: String(item.insight || ''),
  url: String(item.url || ''),
  region: String(item.region || ''),
  country: String(item.country || ''),
  city: String(item.city || ''),
  pestle: String(item.pestle || ''),
  source: String(item.source || ''),
  swot: String(item.swot || ''),
  title: String(item.title || ''),
  added: String(item.added || ''),
  published: String(item.published || '')
});

const seedDatabase = async () => {
  console.log('\n🌱 Starting Database Seed...\n');
  
  try {
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected:', MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
    
    if (!fs.existsSync(JSON_PATH)) {
      throw new Error(`JSON file not found: ${JSON_PATH}`);
    }
    
    const rawData = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));
    console.log(`📂 Loaded ${rawData.length} records`);
    
    const cleanedData = rawData.map(cleanRecord);
    
    await Data.deleteMany({});
    console.log('🗑️  Cleared existing data');
    
    const BATCH_SIZE = 1000;
    for (let i = 0; i < cleanedData.length; i += BATCH_SIZE) {
      const batch = cleanedData.slice(i, i + BATCH_SIZE);
      await Data.insertMany(batch, { ordered: false });
      console.log(`📥 Inserted ${Math.min(i + BATCH_SIZE, cleanedData.length)}/${cleanedData.length}`);
    }
    
    const total = await Data.countDocuments();
    console.log(`\n✅ Seeded ${total} records successfully!\n`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

seedDatabase();
