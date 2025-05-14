// Query Templates
const queryTemplates = {
  "Top 25 Characters and their Features by Universe": `
    MATCH (c:Character)-[:BELONGS_TO]->(u:Universe {name: '$PARAM'})
    WITH c
    LIMIT 25
    MATCH (c)-[r]->(n)
    RETURN c, r, n
  `,
  "Top 25 Characters and their Features by Eye Color": `
    MATCH (c:Character)-[:HAS_EYE_COLOR]->(e:EyeColor {name: '$PARAM'})
    WITH c
    LIMIT 25
    MATCH (c)-[r]->(n)
    RETURN c, r, n    
  `,
  "Top 25 Characters and their Features by Hair Color": `
    MATCH (c:Character)-[:HAS_HAIR_COLOR]->(h:HairColor {name: '$PARAM'})
    WITH c
    LIMIT 25
    MATCH (c)-[r]->(n)
    RETURN c, r, n
    `,
  "Top 25 Characters and their Features by Sex": `
    MATCH (c:Character)-[:HAS_SEX]->(s:Sex {name: '$PARAM'})
    WITH c
    LIMIT 25
    MATCH (c)-[r]->(n)
    RETURN c, r, n    
  `,
  "Top 25 Characters sharing Same GSM Category": `
    MATCH (g:GSM {name: '$PARAM'})<- [r:HAS_GSM] - (c:Character)
    RETURN c, r, g
    LIMIT 25
  `,
  "Top 25 Characters and their Features First Appearing in a Year": `
    MATCH (c:Character) WHERE c.first_appearance_year = toInteger('$PARAM')
    WITH c
    LIMIT 25
    MATCH (c)-[r]->(n)
    RETURN c, r, n
    
  `,
  "Discover 25 Alive Characters sharing Same Alignment": `
    MATCH (c:Character {alive: 'Living Characters'})-[r:HAS_ALIGNMENT]->(a:Alignment {name: '$PARAM'})
    RETURN c, r, a
    LIMIT 25
  `,
  "Top 25 Characters by Universe": `
    MATCH (u:Universe {name: '$PARAM'})
    WITH u
    MATCH (c:Character)-[r:BELONGS_TO]->(u)
    RETURN c, r, u
    LIMIT 25
  `,
  "Discover features of a Comic Book Character": `
    MATCH (c:Character {name: '$PARAM'})-[r]->(feature)
    RETURN c, r, feature
    LIMIT 25
  `
};

// Acceptable Parameters for the queries
const acceptableParams = {
  "Top 25 Characters and their Features by Universe": ["Marvel", "DC"],
  "Top 25 Characters by Universe": ["Marvel", "DC"],
  "Top 25 Characters and their Features by Eye Color": ["Amber Eyes", "Auburn Eyes", "Black Eyeballs", "Black Eyes", "Blue Eyes", "Brown Eyes", "Compound Eyes", "Gold Eyes", "Green Eyes", "Grey Eyes", "Hazel Eyes", "Magenta Eyes", "Multiple Eyes", "No Eyes", "One Eye", "Orange Eyes", "Photocellular Eyes", "Pink Eyes", "Purple Eyes", "Red Eyes", "Silver Eyes", "Variable Eyes", "Violet Eyes", "White Eyes", "Yellow Eyeballs", "Yellow Eyes"],
  "Top 25 Characters and their Features by Hair Color": ["Auburn Hair", "Bald", "Black Hair", "Blond Hair", "Blue Hair", "Bronze Hair", "Brown Hair", "Dyed Hair", "Gold Hair", "Green Hair", "Grey Hair", "Light Brown Hair", "Magenta Hair", "No Hair", "Orange Hair", "Orange-brown Hair", "Pink Hair", "Platinum Blond Hair", "Purple Hair", "Red Hair", "Reddish Blond Hair", "Reddish Brown Hair", "Silver Hair", "Strawberry Blond Hair", "Variable Hair", "Violet Hair", "White Hair", "Yellow Hair"],
  "Top 25 Characters and their Features by Sex": ["Agender Characters", "Female Characters", "Genderfluid Characters", "Genderless Characters", "Male Characters", "Transgender Characters"],
  "Top 25 Characters sharing Same GSM Category": ["Bisexual Characters", "Genderfluid Characters", "Heterosexual Characters", "Homosexual Characters", "Pansexual Characters", "Transgender Characters", "Transvestites"],
  "Discover 25 Alive Characters sharing Same Alignment": ["Good Characters", "Bad Characters", "Neutral Characters", "Reformed Criminals"],
  "Top 25 Characters and their Features First Appearing in a Year": [],
  "Discover features of a Comic Book Character": []
};

// Event Listener to update Parameter input dynamically
document.querySelector('#query-dropdown').addEventListener('change', () => {
  const paramContainer = document.getElementById('parameter-container');
  paramContainer.innerHTML = '';

  const selectedQuery = document.getElementById('query-dropdown').value;

  if (acceptableParams[selectedQuery] && acceptableParams[selectedQuery].length > 0) {
    const select = document.createElement('select');
    select.id = 'parameter-input';
    acceptableParams[selectedQuery].forEach(optionVal => {
      const option = document.createElement('option');
      option.value = optionVal;
      option.textContent = optionVal;
      select.appendChild(option);
    });
    paramContainer.appendChild(select);
  } else {
    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'parameter-input';
    input.placeholder = 'Enter Parameter';
    input.style.marginLeft = '10px';
    paramContainer.appendChild(input);
  }
});

// Event Listener to Run Query
document.querySelector('#run-query-btn').addEventListener('click', () => {
  const dropdownValue = document.querySelector('#query-dropdown')?.value || '';
  const parameterValue = document.querySelector('#parameter-input')?.value.trim() || '';
  const manualQuery = document.querySelector('#manual-query-input')?.value.trim() || '';
  const infoMessage = document.querySelector('#info-message');
  const queryTitle = document.querySelector('#query-title');
  const characterList = document.querySelector('#character-list');
  const svg = d3.select('svg');

  if (infoMessage) infoMessage.textContent = '';
  if (queryTitle) queryTitle.textContent = '';
  if (characterList) characterList.innerHTML = '';
  svg.selectAll('*').remove();

  let finalQuery = '';

  if (manualQuery && dropdownValue) {
    if (infoMessage) infoMessage.textContent = 'Please enter either a manual query or use the dropdown - not both.';
    return;
  }

  if (manualQuery) {
    finalQuery = manualQuery;
  } else if (dropdownValue) {
    if (!parameterValue) {
      if (infoMessage) infoMessage.textContent = 'Please enter a parameter for the selected query.';
      return;
    }
    if (queryTemplates[dropdownValue]) {
      finalQuery = queryTemplates[dropdownValue].replace('$PARAM', parameterValue);
    } else {
      if (infoMessage) infoMessage.textContent = 'Selected query type is not available. Please try again.';
      return;
    }
  } else {
    if (infoMessage) infoMessage.textContent = 'Please select a query type or enter a manual query.';
    return;
  }

  fetch(`/graph?cypher=${encodeURIComponent(finalQuery)}`)
    .then(res => res.json())
    .then(data => {
      if (!data.nodes.length) {
        if (infoMessage) infoMessage.textContent = 'Sorry! No data available to generate graph. Please try using different values.';
        return;
      }

      // Organize the response based on query type
      let characterNames = '';
      let featureNames = '';

      if (dropdownValue.includes("Discover features of a Comic Book Character")) {
        // List features, not characters
        const param = document.querySelector('#parameter-input')?.value.trim() || '';
        if (queryTitle) queryTitle.textContent = `Features of ${param}`;

        featureNames = data.nodes
          .filter(node => node.label !== 'Character') 
          .map(node => node.properties?.name?.replace(/"/g, ''))
          .filter(name => name)
          .join(', ');

        if (characterList) characterList.textContent = featureNames;
      }
      else {
        // For other cases, display character names only
        characterNames = data.nodes
          .filter(node => node.label === 'Character')
          .map(node => node.properties?.name?.replace(/"/g, ''))
          .filter(name => name)
          .join(', ');

        if (dropdownValue.includes("Top 25 Characters and their Features First Appearing in a Year")) {
          const param = document.querySelector('#parameter-input')?.value.trim() || '';
          if (queryTitle) queryTitle.textContent = `Top 25 Characters and their Features First Appearing in ${param}`;
        }
        else if (dropdownValue.includes("Discover 25 Alive Characters sharing Same Alignment")) {
          if (queryTitle) queryTitle.textContent = `25 Alive Characters sharing Same Alignment`;
        }
        else if (manualQuery) {
          if (queryTitle) queryTitle.textContent = `Result:`;
        }
        else {
          if (queryTitle) queryTitle.textContent = `${dropdownValue}`;
        }

        if (characterList) characterList.textContent = characterNames;
      }

      // D3 Graph Drawing
      const width = window.innerWidth;
      const height = window.innerHeight * 0.7;

      const zoom = d3.zoom().on('zoom', (event) => {
        svg.select('g').attr('transform', event.transform);
      });

      svg.call(zoom).append('g');
      const container = svg.select('g');

      const simulation = d3.forceSimulation(data.nodes)
        .force('link', d3.forceLink(data.links).id(d => d.id).distance(180))
        .force('charge', d3.forceManyBody().strength(-600))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collide', d3.forceCollide(60));

      const link = container.append('g')
        .selectAll('line')
        .data(data.links)
        .join('line')
        .attr('stroke-width', 2)
        .attr('stroke', '#999');

      const node = container.append('g')
        .selectAll('circle')
        .data(data.nodes)
        .join('circle')
        .attr('r', d => d.label === 'Character' ? 25 : 15)
        .attr('class', d => d.label)  
        .call(drag(simulation));

      const label = container.append('g')
        .selectAll('text')
        .data(data.nodes)
        .join('text')
        .text(d => d.properties?.name?.substring(0, 15) || d.label)
        .attr('dx', 20)
        .attr('dy', '.35em')
        .append('title')
        .text(d => d.properties?.name || d.label);

      simulation.on('tick', () => {
        link
          .attr('x1', d => d.source.x)
          .attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x)
          .attr('y2', d => d.target.y);

        node
          .attr('cx', d => d.x)
          .attr('cy', d => d.y);

        container.selectAll('text')
          .attr('x', d => d.x)
          .attr('y', d => d.y);
      });

      function drag(simulation) {
        return d3.drag()
          .on('start', event => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
          })
          .on('drag', event => {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
          })
          .on('end', event => {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
          });
      }
    })
    .catch(error => {
      console.error('Error fetching graph:', error);
      if (infoMessage) infoMessage.textContent = 'An error occurred while fetching data.';
    });
});
