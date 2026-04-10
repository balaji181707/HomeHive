const router = require('express').Router();
const { getDriver } = require('../config/neo4j');

// GET /api/admin/graph
// Returns live nodes and relationships for D3.js visualization
// Unprotected for now so we can visualize our dev environment!
router.get('/graph', async (req, res) => {
  const driver = getDriver();
  const session = driver.session();
  try {
    // Cypher query to pull everything and all links
    const result = await session.run(`
      MATCH (n)
      OPTIONAL MATCH (n)-[r]->(m)
      RETURN n, r, m
      LIMIT 150
    `);
    
    const nodesMap = new Map();
    const links = [];

    // Parse the data into force-simulation compliant arrays
    result.records.forEach(row => {
      const n = row.get('n');
      if (n) {
        if (!nodesMap.has(n.elementId)) {
          nodesMap.set(n.elementId, { 
            id: n.elementId, 
            label: n.labels[0], 
            // Prefer names, fallback to emails or limited text blurbs
            name: n.properties.name || n.properties.email || (n.properties.text ? n.properties.text.substring(0,12) + '...' : n.labels[0])
          });
        }
      }

      const m = row.get('m');
      if (m) {
        if (!nodesMap.has(m.elementId)) {
          nodesMap.set(m.elementId, { 
            id: m.elementId, 
            label: m.labels[0], 
            name: m.properties.name || m.properties.email || (m.properties.text ? m.properties.text.substring(0,12) + '...' : m.labels[0])
          });
        }
      }

      const r = row.get('r');
      if (r) {
        links.push({
          source: n.elementId,
          target: m.elementId,
          label: r.type
        });
      }
    });

    res.json({ nodes: Array.from(nodesMap.values()), links });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch graph data' });
  } finally {
    await session.close();
  }
});

module.exports = router;
