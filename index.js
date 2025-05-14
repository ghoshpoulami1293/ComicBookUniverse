const express = require('express');
const neo4j = require('neo4j-driver');
const path = require('path');

const app = express();
const port = 3000;

// Connect to Neo4j Database
const driver = neo4j.driver(
  'bolt://localhost:7687',
  neo4j.auth.basic('neo4j', 'student123')
);

const session = driver.session({ database: 'neo4j' });
app.use(express.static(path.join(__dirname, 'public')));

// Graph endpoint
app.get('/graph', async (req, res) => {
  try {
    const query = req.query.cypher;

    if (!query) {
      return res.status(400).json({ error: 'Missing Cypher query' });
    }

    const result = await session.run(query);

    const nodesMap = new Map();
    const links = [];

    result.records.forEach(record => {
      record.keys.forEach(key => {
        const obj = record.get(key);
        const identity = obj?.identity?.toString();

        if (obj?.constructor?.name === 'Node') {
          if (!nodesMap.has(identity)) {
            nodesMap.set(identity, {
              id: identity,
              label: obj.labels.join(' '),
              properties: obj.properties
            });
          }
        } else if (obj?.constructor?.name === 'Relationship') {
          links.push({
            source: obj.start.toString(),
            target: obj.end.toString(),
            type: obj.type
          });
        }
      });
    });

    const nodes = Array.from(nodesMap.values());

    res.json({ nodes, links });

  } catch (error) {
    console.error('Error fetching graph data:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});