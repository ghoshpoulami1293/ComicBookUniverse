// 1. Delete all nodes and relationships
MATCH (n)
DETACH DELETE n;

// 2. Drop existing indexes if any
DROP INDEX character_id_index IF EXISTS;
DROP INDEX universe_id_index IF EXISTS;
DROP INDEX alignment_id_index IF EXISTS;
DROP INDEX eye_color_id_index IF EXISTS;
DROP INDEX hair_color_id_index IF EXISTS;
DROP INDEX sex_id_index IF EXISTS;
DROP INDEX gsm_id_index IF EXISTS;
DROP INDEX year_index IF EXISTS;

// 3. Create new indexes
CREATE INDEX character_id_index IF NOT EXISTS FOR (c:Character) ON (c.character_id);
CREATE INDEX universe_id_index IF NOT EXISTS FOR (u:Universe) ON (u.universe_id);
CREATE INDEX alignment_id_index IF NOT EXISTS FOR (a:Alignment) ON (a.alignment_id);
CREATE INDEX eye_color_id_index IF NOT EXISTS FOR (e:EyeColor) ON (e.eye_color_id);
CREATE INDEX hair_color_id_index IF NOT EXISTS FOR (h:HairColor) ON (h.hair_color_id);
CREATE INDEX sex_id_index IF NOT EXISTS FOR (s:Sex) ON (s.sex_id);
CREATE INDEX gsm_id_index IF NOT EXISTS FOR (g:GSM) ON (g.gsm_id);

// 4. Load Universe Nodes
CALL {
  WITH 500 AS batchSize
  LOAD CSV WITH HEADERS FROM 'file:///Universe.csv' AS row
  WITH row
  MERGE (u:Universe {universe_id: toInteger(row.universe_id)})
  SET u.name = row.name
}

// 5. Load Alignment Nodes
CALL {
  WITH 500 AS batchSize
  LOAD CSV WITH HEADERS FROM 'file:///Alignment.csv' AS row
  WITH row
  MERGE (a:Alignment {alignment_id: toInteger(row.alignment_id)})
  SET a.name = row.align_name
}

// 6. Load EyeColor Nodes
CALL {
  WITH 500 AS batchSize
  LOAD CSV WITH HEADERS FROM 'file:///EyeColor.csv' AS row
  WITH row
  MERGE (e:EyeColor {eye_color_id: toInteger(row.eye_color_id)})
  SET e.name = row.eye_name
}

// 7. Load HairColor Nodes
CALL {
  WITH 500 AS batchSize
  LOAD CSV WITH HEADERS FROM 'file:///HairColor.csv' AS row
  WITH row
  MERGE (h:HairColor {hair_color_id: toInteger(row.hair_color_id)})
  SET h.name = row.hair_name
}

// 8. Load Sex Nodes
CALL {
  WITH 500 AS batchSize
  LOAD CSV WITH HEADERS FROM 'file:///Sex.csv' AS row
  WITH row
  MERGE (s:Sex {sex_id: toInteger(row.sex_id)})
  SET s.name = row.sex_name
}

// 9. Load GSM Nodes
CALL {
  WITH 500 AS batchSize
  LOAD CSV WITH HEADERS FROM 'file:///GSM.csv' AS row
  WITH row
  MERGE (g:GSM {gsm_id: toInteger(row.gsm_id)})
  SET g.name = row.gsm_name
}

// 11. Load Character Nodes
CALL {
  WITH 500 AS batchSize
  LOAD CSV WITH HEADERS FROM 'file:///Characters.csv' AS row
  WITH row
  MERGE (c:Character {character_id: toInteger(row.character_id)})
  SET c.name = row.name,
      c.alive = row.alive,
      c.appearances = toInteger(row.appearances),
      c.first_appearance_year = toInteger(row.first_appearance_year)
}

// 12. Create Relationships Character <-> Universe
CALL {
  WITH 500 AS batchSize
  LOAD CSV WITH HEADERS FROM 'file:///Characters.csv' AS row
  WITH row
  MATCH (c:Character {character_id: toInteger(row.character_id)})
  MATCH (u:Universe {universe_id: toInteger(row.universe_id)})
  MERGE (c)-[:BELONGS_TO]->(u)
  MERGE (u)-[:HAS_CHARACTER]->(c)
}

// 13. Create Relationships Character <-> Features
CALL {
  WITH 500 AS batchSize
  LOAD CSV WITH HEADERS FROM 'file:///combined_heroes.csv' AS row
  WITH row
  MATCH (c:Character {character_id: toInteger(row.character_id)})
  
  // Alignment
  MATCH (a:Alignment {alignment_id: toInteger(row.alignment_id)})
  MERGE (c)-[:HAS_ALIGNMENT]->(a)
  MERGE (a)-[:HAS_CHARACTER]->(c)
  WITH c, row
  
  // Eye Color
  MATCH (e:EyeColor {eye_color_id: toInteger(row.eye_color_id)})
  MERGE (c)-[:HAS_EYE_COLOR]->(e)
  MERGE (e)-[:HAS_CHARACTER]->(c)
  WITH c, row
  
  // Hair Color
  MATCH (h:HairColor {hair_color_id: toInteger(row.hair_color_id)})
  MERGE (c)-[:HAS_HAIR_COLOR]->(h)
  MERGE (h)-[:HAS_CHARACTER]->(c)
  WITH c, row
  
  // Sex
  MATCH (s:Sex {sex_id: toInteger(row.sex_id)})
  MERGE (c)-[:HAS_SEX]->(s)
  MERGE (s)-[:HAS_CHARACTER]->(c)
  WITH c, row
  
  // GSM
  MATCH (g:GSM {gsm_id: toInteger(row.gsm_id)})
  MERGE (c)-[:HAS_GSM]->(g)
  MERGE (g)-[:HAS_CHARACTER]->(c)
}