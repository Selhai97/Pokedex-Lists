// Function to open IndexedDB database
function openDatabase() {
    let db;
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('pokedexes', 1);

        request.onerror = () => {
            reject('Error opening database');
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            resolve(request.result);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            db.createObjectStore("pokedexes", { keyPath: "name" });
        };
    });
}

// Function to get saved Pokedexes directly from IndexedDB
async function getSavedPokedexes() {
    try {
        // Open IndexedDB database
        const db = await openDatabase();
        const transaction = db.transaction(['pokedexes'], 'readonly');
        const store = transaction.objectStore('pokedexes');

        const savedPokedexes = [];
        const request = store.getAll(); // Retrieve all objects from the object store

        return new Promise((resolve, reject) => {
            request.onsuccess = (event) => {
                const result = event.target.result;
                if (result && result.length > 0) {
                    savedPokedexes.push(...result);
                    resolve(savedPokedexes);
                } else {
                    console.log('No saved Pokedexes found.');
                    resolve(savedPokedexes); // Resolve with an empty array if no data found
                }
            };

            request.onerror = (event) => {
                console.error('Error getting saved Pokedexes:', event.target.error);
                reject(event.target.error); // Reject with the error
            };
        });
    } catch (error) {
        console.error('Error getting saved Pokedexes:', error);
        return []; // Return an empty array in case of error
    }
}

// Usage example:
async function displaySavedPokedexes() {
    const savedPokedexes = await getSavedPokedexes();
    console.log('Saved Pokedexes:', savedPokedexes);
    // Further processing or display of saved Pokedexes
}

// Function to save the Pokedex data to IndexedDB
async function savePokedex(pokedexName, pokemonData) {
    try {
        // Open IndexedDB database
        const db = await openDatabase();
        const transaction = db.transaction(['pokedexes'], 'readwrite');
        const store = transaction.objectStore('pokedexes');
        
        // Ensure pokemonData is in the expected format
        if (Array.isArray(pokemonData)) {
            // Create an object to store in the database
            const pokedexObject = { name: pokedexName, data: {} };
            pokemonData.forEach(pokemon => {
                // Include caught state in each Pokemon object
                pokedexObject.data[pokemon.name.english] = { ...pokemon, caught: false }; // Store each Pokemon object by its name
            });

            // Save the updated Pokedex object to IndexedDB
            const request = store.add(pokedexObject);
            request.onsuccess = () => {
                console.log('Pokedex saved to IndexedDB:', pokedexName);
            };
            request.onerror = (event) => {
                console.error('Error saving Pokedex:', event.target.error);
            };
        } else {
            console.error('Error: Pokemon data is not in the expected format.');
        }
    } catch (error) {
        console.error('Error saving Pokedex to IndexedDB:', error);
    }
}

async function updateCaughtState(selectedPokedexName, pokemonName, isCaught) {
    try {
        // Open IndexedDB database
        const db = await openDatabase();
        const transaction = db.transaction(['pokedexes'], 'readwrite');
        const store = transaction.objectStore('pokedexes');

        // Retrieve the selected Pokedex from IndexedDB
        const request = store.get(selectedPokedexName);

        request.onsuccess = (event) => {
            const selectedPokedex = event.target.result;
            if (selectedPokedex) {
                // Check if the Pokemon exists in the selected Pokedex
                if (selectedPokedex.data.hasOwnProperty(pokemonName)) {
                    // Update the caught state of the Pokemon
                    selectedPokedex.data[pokemonName].caught = isCaught;

                    // Save the updated selected Pokedex back to IndexedDB
                    store.put(selectedPokedex);
                } else {
                    console.error('Error: Pokemon not found in the selected Pokedex.');
                }
            } else {
                console.error('Error: Selected Pokedex not found.');
            }
        };
    } catch (error) {
        console.error('Error updating caught state:', error);
    }
}


// Function to delete a Pokedex from IndexedDB
async function deletePokedexFromIndexedDB(pokedexName) {
    const db = await openDatabase();
    const transaction = db.transaction(['pokedexes'], 'readwrite');
    const store = transaction.objectStore('pokedexes');
    store.delete(pokedexName);
}

// Function to clear all Pokedex data from IndexedDB
async function clearAllPokedexesFromIndexedDB() {
    const db = await openDatabase();
    const transaction = db.transaction(['pokedexes'], 'readwrite');
    const store = transaction.objectStore('pokedexes');
    store.clear();
}
