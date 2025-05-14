# ComicBookUniverse


This project is designed to create an application to visualize graphs that help explore comicbook characters and their features.

## 1. Data Choice 

For this project, FiveThirtyEight Comic Characters Dataset from Kaggle has been selected from `https://www.kaggle.com/datasets`.
Both datasets provide extensive information about comic book characters from the DC Comics and Marvel Comics universes. 

Reasons for Choosing This Dataset:

- Rich Variety of Data:
The datasets combine both categorical attributes (like Eye Color, Hair Color, GSM) and numerical attributes (like Number of Appearances, First Appearance Year). This variety makes it ideal for building a multi-dimensional graph database.

- Natural Graph Structure:
Comic book characters are inherently connected to many other properties like universes, alignments, and characteristics. This made the dataset perfect for representing as a Neo4j property graph where nodes and relationships capture rich interactions.

- Data Volume and Challenge:
With over 20,000+ entries combined across DC and Marvel, the dataset was large enough to be meaningful but also required proper preprocessing, offering a real-world challenge.

- Potential for Exploration:
  a. This dataset provided many opportunities for dynamic querying like: 
  b. Finding characters sharing common features, exploring heroes/villains by universe or year, identifying diversity trends (via GSM, alignment, etc.).

As a part of this dataset, two publicly available csvs were downloaded:
`data\marvel-wikia-data.csv`
`data\dc-wikia-data.csv`

Both datasets provide extensive information about comic book characters from the DC Comics and Marvel Comics universes. Each character's data includes a variety of attributes, such as:

Name, Universe (Affiliation to either DC or Marvel), Alignment (Moral inclination - Good Characters, Bad Characters, Neutral Characters), Eye Color, Hair Color, Sex, GSM Category, Alive/Dead Status: Current status of the character, Year of First Appearance, Appearances

## 2. Process 

After downloading the two CSVs, a Python script `data\split_CSV_Files.py` is created to perform comprehensive preprocessing before loading the data into Neo4j. As a part of the script, the following flow is executed: 

  1. "Auburn Hair" incorrectly placed under the Eye Color field in dc-wikia-data.csv is replaced with "Auburn Eyes". Merging the two CSVs to create a combined dataset.
  2. A new column universe to each dataset to explicitly record the universe (either "Marvel" or "DC").
  3. The remaining data is preprocessedData
  I cleaned important text fields (name, ID, ALIGN, EYE, HAIR, SEX, GSM, ALIVE) by removing unwanted characters, commas, and whitespace stripping to maintain uniformity.
  4. Missing Eye Color entries were replaced with "Black Eyes", missing Hair Color entries were replaced with "Brown Hair", missing GSM (Gender/Sexual Minority) entries were replaced with "Heterosexual Characters", for columns like Alignment, Sex, Alive Status, and Year of First Appearance, missing values were filled with the mode (most common value) of the respective column.
  5. Each comic book character was assigned a unique character_id, Universe names were mapped to numeric universe IDs (1 for Marvel, 2 for DC).
  6. Lookup tables were created for : Universe, Characters, Alignment, Eye Color, Hair Color, Sex, GSM Category
  These lookup tables map string values to numeric IDs, allowing easier joining and relationship-building in Neo4j.
  The primary reason for creating these were to create nodes of each property and not just use a character node with all the properties. 
  If Neo4j Desktop was used, clicking on the node would provide the node details. However that would not be possible on the application screen. Creating nodes utilizing each property after splitting the database would help to visualize interlinked relationships between the nodes on the graph in the application screen. 
  7. Eight final CSV files are generated for database loading:
  Universe.csv, Characters.csv ,Alignment.csv, EyeColor.csv, HairColor.csv, Sex.csv, GSM.csv, combined_heroes.csv (which combines key features per character for bulk loading relationships)

Post this preprocessing step, a cypher file `data\load_data.cypher` is created to load the nodes and relationships in the Neo4j database.
1. Nodes are created for unique Characters, Alignment, EyeColor, HairColor, Sex, GSM values.
2. The following Relationships are created in the cypher:
    Object    Relationship    Object
    Character	BELONGS_TO		  Universe
    Universe	HAS_CHARACTER	  Character
    Character	HAS_ALIGNMENT	  Alignment
    Alignment	HAS_CHARACTER	  Character
    Character	HAS_EYE_COLOR	  EyeColor
    EyeColor	HAS_CHARACTER	  Character
    Character	HAS_HAIR_COLOR	HairColor
    HairColor	HAS_CHARACTER	  Character
    Character	HAS_SEX			    Sex
    Sex			  HAS_CHARACTER	  Character
    Character	HAS_GSM			    GSM
    GSM			  HAS_CHARACTER	  Character

Neo4j Desktop is utilized to create the application.
Project created - ComicBookCharacters

Local Database created - ComicBookCharacters , Password : student123
start the database ,neo4j database starts by default

The CSVs are placed in the import folder of the database created after starting the database.
"Reveal files in File Explorer" is clicked to load the cypher in the projects folder that opens in Ne04j desktop 
The queries are executed and the nodes and relationships created are visualized using queries.

After the data is loaded, changes are included in the following files:
  1. index.js 
    - Listens on port 3000 (`http://localhost:3000`) and serves static frontend files, uses the neo4j-driver library to connect to the Neo4j database via Bolt protocol,Defines a GET route /graph, which accepts a Cypher query passed as a URL parameter, executes the query on the database and fetches nodes and relationships, parse Results
  2. `public/index.html`
    -  Frontend code that contains the code to facilitate dropdown query , parameters and cypher entry and Run Query button
  3. `public/assets/js/graph.js` 
    - Allows the users to select queries from the dropdown or write Cypher queries, send those queries to your backend server, receive graph data from the Neo4j database, render the graph visually using D3
  4. `public/assets/css/styles.css`
    - stylesheet is edited to accomodate the changes in the application display
  5. `public/assets/img/background.jpg`
    - added as a background image

  To run the application on `http://localhost:3000/` post NodeJs installation and dependency installation using `npm install`, execute:
  `node index.js`

## 3. Volume
  Results obtained from Running the below Queries:
    a. MATCH (x) RETURN count(x) AS NumNodes;
      23345
    b. MATCH ()-[r]->() RETURN count(r) AS NumRelationships;
      279264

## 4. Variety	
	Five queries that yield interesting results in the created app :

  1. Top 10 Living Marvel Characters with More Than 1000 Appearances and Their Features :
	MATCH (c:Character)-[:BELONGS_TO]->(u:Universe)	
  WHERE u.universe_id = 1
	  AND c.alive = 'Living Characters'
	  AND c.appearances > 1000
	WITH c
	LIMIT 10
	MATCH (c)-[r]->(feature)
	RETURN c, r, feature

	2. Characters with rare eye colors :
	MATCH (c:Character)-[:HAS_EYE_COLOR]->(e:EyeColor)
	WHERE e.name IN ['Silver Eyes', 'Violet Eyes', 'Pink Eyes']
	WITH c
	LIMIT 15
	MATCH (c)-[r]->(feature)
	RETURN c, r, feature

	3. Deceased but popular DC universe characters:
	MATCH (c:Character)-[:BELONGS_TO]->(u:Universe)
	WHERE u.name = 'DC'
	  AND c.alive = 'Deceased Characters'
	  AND c.appearances >= 500
	WITH c
	LIMIT 15
	MATCH (c)-[r]->(feature)
	RETURN c, r, feature

	4. 15 Female Characters across all universes
	MATCH (c:Character)-[:HAS_SEX]->(s:Sex {name: 'Female Characters'})
	WITH c
	LIMIT 15
	MATCH (c)-[r]->(feature)
	RETURN c, r, feature

	5. Top 15 Vintage Characters (First Appearing Before 1970) Across All Universes and Their Features
	MATCH (c:Character)
	WHERE c.first_appearance_year < 1970
	WITH c
	LIMIT 15
	MATCH (c)-[r]->(feature)
	RETURN c, r, feature

## 5. Bells and Whistles

1. The application allows both custom manual cypher input along with dropdown query template selector which allows the user to enter revelvant acceptable parameters based on the queries selected. This makes the application UI user-friendly, error-proof by restricting choices to valid values, and helps turn the application into a real-time cypher playground, not just a static graph viewer.

2. When a user runs a new query, the previous graph is completely cleared before redrawing.

3. The response to the dropdown queries is not just a graph but also the relevant character nodes or features.

4. Errors have been handled with appropriate messages so that they can be rectified by the user:

	a. If the user tries to run a query without entering anything (no dropdown selection and no manual input), the app displays a clear error message "Please select a query type or enter a manual query."
	
	b. If the user fills both the manual input and selects a dropdown option at the same time, the app shows an error message "Please enter either a manual query or use the dropdown – not both."
	
	c. If a dropdown query requires a parameter (like "Marvel" or "Blue Eyes") and the user doesn't select one, the app prompts "Please enter a parameter for the selected query."
	
	d. If the manually entered Cypher query is invalid (syntax error or wrong field names), Neo4j backend catches it and returns a 500 error, which the app displays as "An error occurred while fetching data."
	
	e. If the query executes correctly but finds no matching nodes/relationships, the app displays a friendly message like "Sorry! No data available to generate graph. Please try using different values."
	
5. Every query in the dropdown list has a limit of usually 25 characters or features so that the generated graph is not too cumbersome.

6. To improve performance, Indexes are created before data load, the data is loaded in batches of 500 utilizing the CALL blocks, and MERGE is used instead of CREATE to permit idempotent and safe loading.
