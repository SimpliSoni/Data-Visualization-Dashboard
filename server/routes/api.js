const express = require('express');
const router = express.Router();
const Data = require('../models/Data');

// GET /api/data - Fetch data with dynamic filtering
router.get('/data', async (req, res) => {
  try {
    const { end_year, start_year, topic, sector, region, pestle, source, swot, country, city, search, limit, skip } = req.query;
    
    let query = {};
    
    if (end_year) { const year = Number(end_year); if (!isNaN(year)) query.end_year = year; }
    if (start_year) { const year = Number(start_year); if (!isNaN(year)) query.start_year = year; }
    if (topic) query.topic = topic;
    if (sector) query.sector = sector;
    if (region) query.region = region;
    if (pestle) query.pestle = pestle;
    if (source) query.source = source;
    if (swot) query.swot = swot;
    if (country) query.country = country;
    if (city) query.city = city;
    
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { title: searchRegex },
        { insight: searchRegex },
        { topic: searchRegex },
        { sector: searchRegex },
        { region: searchRegex },
        { country: searchRegex },
        { source: searchRegex }
      ];
    }
    
    let dataQuery = Data.find(query).select('-__v -createdAt -updatedAt').sort({ added: -1 });
    if (skip) dataQuery = dataQuery.skip(Number(skip));
    if (limit) dataQuery = dataQuery.limit(Number(limit));
    
    const data = await dataQuery.exec();
    res.json({ success: true, count: data.length, data });
    
  } catch (error) {
    console.error('API Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// GET /api/filters - Get unique filter values
router.get('/filters', async (req, res) => {
  try {
    const [endYears, startYears, topics, sectors, regions, pestles, sources, swots, countries, cities] = await Promise.all([
      Data.distinct('end_year'),
      Data.distinct('start_year'),
      Data.distinct('topic'),
      Data.distinct('sector'),
      Data.distinct('region'),
      Data.distinct('pestle'),
      Data.distinct('source'),
      Data.distinct('swot'),
      Data.distinct('country'),
      Data.distinct('city')
    ]);
    
    const filterAndSort = (arr, isNumeric = false) => {
      const filtered = arr.filter(val => val !== null && val !== '' && val !== undefined);
      return isNumeric ? filtered.sort((a, b) => a - b) : filtered.sort((a, b) => String(a).localeCompare(String(b)));
    };
    
    res.json({
      success: true,
      filters: {
        end_year: filterAndSort(endYears, true),
        start_year: filterAndSort(startYears, true),
        topic: filterAndSort(topics),
        sector: filterAndSort(sectors),
        region: filterAndSort(regions),
        pestle: filterAndSort(pestles),
        source: filterAndSort(sources),
        swot: filterAndSort(swots),
        country: filterAndSort(countries),
        city: filterAndSort(cities)
      }
    });
  } catch (error) {
    console.error('API Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// GET /api/stats - Get aggregated statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await Data.aggregate([
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          avgIntensity: { $avg: '$intensity' },
          avgLikelihood: { $avg: '$likelihood' },
          avgRelevance: { $avg: '$relevance' }
        }
      }
    ]);
    
    const sectorDistribution = await Data.aggregate([
      { $match: { sector: { $ne: '' } } },
      { $group: { _id: '$sector', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    const regionDistribution = await Data.aggregate([
      { $match: { region: { $ne: '' } } },
      { $group: { _id: '$region', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    res.json({ success: true, stats: stats[0] || {}, sectorDistribution, regionDistribution });
  } catch (error) {
    console.error('API Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

module.exports = router;
