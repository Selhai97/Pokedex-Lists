// Function to load Pokemon data from JSON file
async function loadPokemonData() {
    try {
        const response = await fetch('pokemonData.json');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error loading Pokemon data:', error);
    }
}

// Function to load saved Pokedexes from IndexedDB
async function loadSavedPokedexesFromIndexedDB() {
    try {
        const db = await openDatabase();
        const transaction = db.transaction(['pokedexes'], 'readonly');
        const store = transaction.objectStore('pokedexes');
        
        const savedPokedexes = [];
        const request = store.openCursor();

        return new Promise((resolve, reject) => {
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    savedPokedexes.push(cursor.value);
                    cursor.continue();
                } else {
                    console.log('Saved Pokedexes loaded from IndexedDB:', savedPokedexes);
                    resolve(savedPokedexes);
                }
            };

            request.onerror = () => {
                reject('Error loading saved Pokedexes from IndexedDB');
            };
        });
    } catch (error) {
        console.error('Error loading saved Pokedexes from IndexedDB:', error);
        return []; // Return an empty array if there's an error
    }
}

// Function to display the selected Pokedex
async function displaySelectedPokedex() {
    const pokedexSelect = document.getElementById('pokedexSelect');
    const selectedPokedexName = pokedexSelect.value;

    // Update the title of the displayed Pokedex
    document.getElementById('pokedexTitle').textContent = selectedPokedexName;

    try {
        // Load saved Pokedexes
        const savedPokedexes = await loadSavedPokedexesFromIndexedDB();
        
        // Ensure savedPokedexes is an array
        if (Array.isArray(savedPokedexes)) {
            // Find the selected Pokedex
            const selectedPokedex = savedPokedexes.find(pokedex => pokedex.name === selectedPokedexName);
            if (selectedPokedex) {
                displayPokedexData(selectedPokedex.data);
            } else {
                console.error('Error: Selected Pokedex not found.');
            }
        } else {
            console.error('Error: Saved Pokedexes is not an array.');
        }
    } catch (error) {
        console.error('Error displaying selected Pokedex:', error);
    }
}


// Function to load saved Pokedexes from IndexedDB and populate the dropdown menu
async function loadSavedPokedexesFromIndexedDBAndDisplay() {
    try {
        const savedPokedexes = await loadSavedPokedexesFromIndexedDB();
        console.log('Saved Pokedexes:', savedPokedexes);
        displayPokedexOptions(savedPokedexes);

        // Select the first Pokedex by default
        if (savedPokedexes.length > 0) {
            const defaultPokedexName = savedPokedexes[0].name;
            document.getElementById('pokedexSelect').value = defaultPokedexName;
            await displaySelectedPokedex(defaultPokedexName);
        }
    } catch (error) {
        console.error('Error loading saved Pokedexes and displaying:', error);
    }
}

// Load saved Pokedexes and display the default one when the page loads
loadSavedPokedexesFromIndexedDBAndDisplay();

// Function to create a Pokedex option in the dropdown menu
function createPokedexOption(pokedexName) {
    const pokedexSelect = document.getElementById('pokedexSelect');
    if (pokedexSelect) {
        const option = document.createElement('option');
        option.text = pokedexName;
        pokedexSelect.add(option);
    } else {
        console.error('Error: Pokedex select element not found.');
    }
}

// Function to display Pokedex options in the dropdown menu
function displayPokedexOptions(pokedexes) {
    const pokedexSelect = document.getElementById('pokedexSelect');
    if (pokedexSelect) {
        if (Array.isArray(pokedexes)) {
            pokedexSelect.innerHTML = ''; // Clear existing options
            pokedexes.forEach(pokedex => {
                const option = document.createElement('option');
                option.text = pokedex.name;
                pokedexSelect.add(option);
            });
        } else {
            console.error('Error: Saved Pokedexes is not an array.');
        }
    } else {
        console.error('Error: Pokedex select element not found.');
    }
}

// Function to create a Pokemon card
function createPokemonCard(parent, pokemonName, pokemonData) {
    // Create a new Pokemon card element
    console.log("Type of data: " + typeof(pokemonData));

    const pokemonCard = document.createElement('div');
    const cleanedPokemonName = pokemonName.replace(/['\s:.]/g, '')
    pokemonCard.classList.add('pokemon-card');
    pokemonCard.id = `pokemon-card-${cleanedPokemonName.toLowerCase()}`; // Set ID for later reference

    // Create card content
    pokemonCard.innerHTML = `
        <img src="${pokemonData.image.thumbnail}" alt="${pokemonName}">
        <h2>${pokemonName}</h2>
        <p>ID: #${pokemonData.id}</p>
        <p>Type: ${pokemonData.type.join(' / ')}</p>
    `;

    pokemonCard.addEventListener('click', async function() {
        this.classList.toggle('clicked');
        try {
            const savedPokedexes = await loadSavedPokedexesFromIndexedDB();
            console.log('type: ' + typeof savedPokedexes);
            if (Array.isArray(savedPokedexes)) {
                const selectedPokedexName = document.getElementById('pokedexSelect').value;
                const selectedPokedex = savedPokedexes.find(pokedex => pokedex.name === selectedPokedexName);
                console.log('selectedPokedex:', selectedPokedex);
                if (selectedPokedex) {
                    console.log('selectedPokedex.data:', selectedPokedex.data);
                    console.log('pokemonName:', pokemonName);
                    if (selectedPokedex.data[pokemonName]) {
                        selectedPokedex.data[pokemonName].caught = !selectedPokedex.data[pokemonName].caught;
                        localStorage.setItem('pokedexes', JSON.stringify(savedPokedexes));
                        updateCaughtState(selectedPokedexName, pokemonName, selectedPokedex.data[pokemonName].caught);
                    } else {
                        console.error('Error: Pokemon data not found in the selected Pokedex.');
                    }
                } else {
                    console.error('Error: Selected Pokedex not found.');
                }
            } else {
                console.error('Error: Saved Pokedexes is not an array.');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    });
    
    // Append the Pokemon card to the parent element
    parent.appendChild(pokemonCard);
}

// Function to display Pokedex data
function displayPokedexData(data) {
    // Clear the existing Pokemon cards
    const pokedexSection = document.getElementById('pokedex');
    pokedexSection.innerHTML = '';
    
    // Loop through each Pokemon in the data and create a card for each one
    Object.keys(data).forEach(pokemonName => {
        createPokemonCard(pokedexSection, pokemonName, data[pokemonName]);
    });
}

function applyCaughtState(data) {
    const pokedexSection = document.getElementById('pokedex');
    Object.keys(data).forEach(pokemonName => {
        const cleanedPokemonName = pokemonName.replace(/['\s:.]/g, '')
        const pokemonCard = pokedexSection.querySelector(`#pokemon-card-${cleanedPokemonName.toLowerCase()}`);
        console.log('caught status: ' + data[pokemonName].caught)
        if (pokemonCard) {
            if (data[pokemonName].caught) {
                pokemonCard.classList.add('clicked');
            } else {
                pokemonCard.classList.remove('clicked');
            }
        }
    });
}

// Function to display the selected Pokedex
async function displaySelectedPokedex() {
    const pokedexSelect = document.getElementById('pokedexSelect');
    const selectedPokedexName = pokedexSelect.value;

    // Update the title of the displayed Pokedex
    document.getElementById('pokedexTitle').textContent = selectedPokedexName;
    console.log('pokedex name: ' + selectedPokedexName)

    try {
        // Load saved Pokedexes
        const savedPokedexes = await loadSavedPokedexesFromIndexedDB();
        
        // Ensure savedPokedexes is an array
        if (Array.isArray(savedPokedexes)) {
            // Find the selected Pokedex
            const selectedPokedex = savedPokedexes.find(pokedex => pokedex.name === selectedPokedexName);
            if (selectedPokedex) {
                displayPokedexData(selectedPokedex.data);
                applyCaughtState(selectedPokedex.data)
            } else {
                console.error('Error: Selected Pokedex not found.');
            }
        } else {
            console.error('Error: Saved Pokedexes is not an array.');
        }
    } catch (error) {
        console.error('Error displaying selected Pokedex:', error);
    }
}

// Function to create a new Pokedex
async function createNewPokedex(pokedexName, pokemonData) {
    try {
        // Ensure pokemonData is an array
        if (Array.isArray(pokemonData)) {
            // Create a new Pokedex option in the dropdown menu
            createPokedexOption(pokedexName);
    
            // Initialize the caught state for each Pokémon in the new Pokedex
            const initializedPokemonData = pokemonData.map(pokemon => ({
                ...pokemon,
                caught: false // Set caught state to false for each Pokémon
            }));

            // Save the new Pokedex in IndexedDB
            await savePokedex(pokedexName, initializedPokemonData);
    
            // Display the newly created Pokedex
            await displaySelectedPokedex();
        } else {
            console.error('Error: Pokemon data is not in the expected format.');
        }
    } catch (error) {
        console.error('Error creating new Pokedex:', error);
    }
}

async function deletePokedex() {
    const pokedexName = document.getElementById('pokedexSelect').value;
    if (pokedexName) {
        // Delete the Pokedex from IndexedDB
        await deletePokedexFromIndexedDB(pokedexName);

        // Remove the Pokedex option from the dropdown menu
        const pokedexSelect = document.getElementById('pokedexSelect');
        const selectedIndex = pokedexSelect.selectedIndex;
        if (selectedIndex !== -1) {
            pokedexSelect.remove(selectedIndex);
        }

        // Clear the display area
        document.getElementById('pokedexTitle').textContent = '';
        document.getElementById('pokedex').innerHTML = '';
    }
}

// Event listener for delete button
document.getElementById('deleteButton').addEventListener('click', deletePokedex);

// Event listener for dropdown menu change
pokedexSelect.addEventListener('change', displaySelectedPokedex);

// Event listener for create button
document.getElementById('createButton').addEventListener('click', async function() {
    const pokedexNameInput = document.getElementById('pokedexNameInput');
    const pokedexName = pokedexNameInput.value.trim();
    if (pokedexName === '') {
        alert('Please enter a name for the Pokedex.');
        return;
    }

    // Load Pokemon data from JSON file
    const pokemonData = await loadPokemonData();
    if (pokemonData) {
        // Create a new Pokedex
        await createNewPokedex(pokedexName, pokemonData);
    } else {
        console.error('Error: Pokemon data not found.');
    }

    // Clear the input field
    pokedexNameInput.value = '';
});

