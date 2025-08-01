// Offline Dictionary Module
class OfflineDictionary {
  constructor() {
    this.dictionary = new Map();
    this.isLoaded = false;
    this.loadingPromise = null;
  }

  async loadDictionary() {
    if (this.isLoaded) return;
    
    // Prevent multiple simultaneous loads
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    this.loadingPromise = this._loadDictionaryData();
    return this.loadingPromise;
  }

  async _loadDictionaryData() {
    try {
      // Load dictionary from local JSON file
      const response = await fetch(chrome.runtime.getURL('data/dictionary.json'));
      if (!response.ok) {
        throw new Error(`Failed to load dictionary: ${response.status} ${response.statusText}`);
      }
      
      const dictionaryData = await response.json();
      
      // Populate the Map for fast lookups
      Object.entries(dictionaryData).forEach(([word, definition]) => {
        this.dictionary.set(word.toLowerCase(), definition);
      });
      
      this.isLoaded = true;
      console.log(`Offline dictionary loaded with ${this.dictionary.size} words`);
    } catch (error) {
      console.error('Failed to load offline dictionary:', error);
      throw error;
    }
  }

  getDefinition(word) {
    const normalizedWord = word.toLowerCase().trim();
    return this.dictionary.get(normalizedWord) || null;
  }

  hasWord(word) {
    const normalizedWord = word.toLowerCase().trim();
    return this.dictionary.has(normalizedWord);
  }

  // Get word count for display purposes
  getWordCount() {
    return this.dictionary.size;
  }

  // Search for words that start with a prefix (for suggestions)
  searchByPrefix(prefix, limit = 10) {
    const normalizedPrefix = prefix.toLowerCase().trim();
    const results = [];
    
    for (const [word] of this.dictionary) {
      if (word.startsWith(normalizedPrefix)) {
        results.push(word);
        if (results.length >= limit) break;
      }
    }
    
    return results;
  }

  // Convert offline dictionary format to match online API structure
  formatDefinition(word, offlineData) {
    if (!offlineData) return null;

    // Handle the simple string format from your dictionary.json
    if (typeof offlineData === 'string') {
      // Try to detect part of speech from the definition
      let partOfSpeech = 'unknown';
      const definition = offlineData.toLowerCase();
      
      if (definition.includes('(n.)') || definition.includes('(noun)') || 
          definition.includes('a genus') || definition.includes('a species') ||
          definition.includes('a kind of') || definition.includes('a type of')) {
        partOfSpeech = 'noun';
      } else if (definition.includes('(v.)') || definition.includes('(verb)') ||
                 definition.includes('to ') || offlineData.startsWith('To ')) {
        partOfSpeech = 'verb';
      } else if (definition.includes('(adj.)') || definition.includes('(adjective)') ||
                 definition.includes('having') || definition.includes('being')) {
        partOfSpeech = 'adjective';
      } else if (definition.includes('(adv.)') || definition.includes('(adverb)') ||
                 word.endsWith('ly')) {
        partOfSpeech = 'adverb';
      }

      return {
        word: word,
        phonetic: '',
        phonetics: [],
        meanings: [{
          partOfSpeech: partOfSpeech,
          definitions: [{
            definition: offlineData,
            example: ''
          }]
        }],
        isOffline: true
      };
    }

    // Handle more complex format if available (for future compatibility)
    return {
      word: word,
      phonetic: offlineData.phonetic || '',
      phonetics: offlineData.phonetics || [],
      meanings: offlineData.meanings || [{
        partOfSpeech: offlineData.partOfSpeech || 'unknown',
        definitions: [{
          definition: offlineData.definition || offlineData,
          example: offlineData.example || ''
        }]
      }],
      isOffline: true
    };
  }

  // Check if the browser is online
  isOnline() {
    return navigator.onLine;
  }

  // Get all words (for testing/debugging)
  getAllWords() {
    return Array.from(this.dictionary.keys()).sort();
  }

  // Search for words containing a substring
  searchBySubstring(substring, limit = 10) {
    const normalizedSubstring = substring.toLowerCase().trim();
    const results = [];
    
    for (const [word] of this.dictionary) {
      if (word.includes(normalizedSubstring)) {
        results.push(word);
        if (results.length >= limit) break;
      }
    }
    
    return results;
  }
}

// Export for use in content script
window.OfflineDictionary = OfflineDictionary;
