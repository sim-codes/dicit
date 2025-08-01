// Background script for Dicit Dictionary Extension
class DicitBackground {
  constructor() {
    this.init();
  }

  init() {
    // Create context menu when extension starts
    chrome.runtime.onStartup.addListener(() => {
      this.createContextMenu();
    });

    // Create context menu when extension is installed
    chrome.runtime.onInstalled.addListener(() => {
      this.createContextMenu();
    });

    // Handle context menu clicks
    chrome.contextMenus.onClicked.addListener((info, tab) => {
      this.handleContextMenuClick(info, tab);
    });
  }

  createContextMenu() {
    // Remove existing context menu items first
    chrome.contextMenus.removeAll(() => {
      try {
        // Create the main context menu item for selected text
        chrome.contextMenus.create({
          id: "dicit-define",
          title: "Define '%s'",
          contexts: ["selection"],
          documentUrlPatterns: [
            "http://*/*", 
            "https://*/*", 
            "file://*/*"
          ]
        });

        // Create a fallback menu item when no text is selected
        chrome.contextMenus.create({
          id: "dicit-define-prompt",
          title: "Define word...",
          contexts: ["page"],
          documentUrlPatterns: [
            "http://*/*", 
            "https://*/*", 
            "file://*/*"
          ]
        });

        console.log('Dicit context menu created successfully');
      } catch (error) {
        console.error('Error creating context menu:', error);
      }
    });
  }

  async handleContextMenuClick(info, tab) {
    console.log('Context menu clicked:', {
      menuItemId: info.menuItemId,
      selectionText: info.selectionText,
      pageX: info.pageX,
      pageY: info.pageY,
      tab: tab
    });
    
    let wordToDefine = ''; // Declare at function scope
    
    try {
      // Check if we have a tab object
      if (!tab) {
        console.log('No tab object provided');
        return;
      }

      // Log the full tab object to see what we're working with
      console.log('Full tab object:', tab);

      // Special handling for Chrome's PDF viewer
      if (tab.url && tab.url.includes('chrome-extension://') && tab.url.includes('pdf')) {
        console.log('Detected Chrome PDF viewer, using alternative approach');
        await this.handlePdfContextMenu(info);
        return;
      }

      // Check if tab.id exists and is a valid number
      if (typeof tab.id === 'undefined' || tab.id === null || tab.id < 0) {
        console.log('Invalid or missing tab ID:', tab.id);
        return;
      }

      // Check if the tab URL is valid for content scripts
      if (tab.url && (
        tab.url.startsWith('chrome://') || 
        tab.url.startsWith('chrome-extension://') || 
        tab.url.startsWith('moz-extension://') ||
        tab.url.startsWith('edge://') ||
        tab.url === 'about:blank' ||
        tab.url === ''
      )) {
        console.log('Cannot run on browser internal pages, URL:', tab.url);
        return;
      }

      console.log('Valid tab found with ID:', tab.id, 'URL:', tab.url);

      if (info.menuItemId === "dicit-define") {
        wordToDefine = info.selectionText?.trim();
      } else if (info.menuItemId === "dicit-define-prompt") {
        // For the prompt version, we'll still need to inject a script to show a prompt
        try {
          const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => prompt("Enter a word to define:")
          });
          wordToDefine = results[0]?.result?.trim();
        } catch (error) {
          console.error('Error showing prompt:', error);
          return;
        }
      }

      if (!wordToDefine) {
        console.log('No word to define');
        return;
      }

      console.log('Fetching definition for:', wordToDefine);

      // Fetch definition directly in background script
      const definition = await this.fetchDefinition(wordToDefine);
      console.log('Definition fetched successfully:', definition);
      
      // Inject the tooltip display script
      await this.showDefinitionTooltip(tab.id, wordToDefine, definition, info);

    } catch (error) {
      console.error('Error handling context menu click:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      // Show error tooltip only if we have a valid tab ID
      if (tab && typeof tab.id === 'number' && tab.id >= 0) {
        await this.showErrorTooltip(tab.id, wordToDefine || 'word', error.message, info);
      }
    }
  }

  async handlePdfContextMenu(info) {
    let wordToDefine = ''; // Declare at function scope
    
    try {
      if (info.menuItemId === "dicit-define") {
        wordToDefine = info.selectionText?.trim();
      } else if (info.menuItemId === "dicit-define-prompt") {
        // For PDF viewer, we'll use a simple notification or create a popup
        wordToDefine = prompt("Enter a word to define:");
      }

      if (!wordToDefine) {
        console.log('No word to define in PDF');
        return;
      }

      console.log('Fetching definition for PDF word:', wordToDefine);

      // Fetch definition
      const definition = await this.fetchDefinition(wordToDefine);
      console.log('Definition fetched for PDF:', definition);
      
      // For PDF viewer, we'll show the definition in a notification or popup
      await this.showPdfDefinition(wordToDefine, definition);

    } catch (error) {
      console.error('Error handling PDF context menu:', error);
      await this.showPdfError(wordToDefine || 'word', error.message);
    }
  }

  async showPdfDefinition(word, definition) {
    try {
      // Store the definition data for the popup to access
      await chrome.storage.local.set({
        pendingDefinition: {
          word: word,
          definition: definition
        }
      });

      // Open the extension popup
      await chrome.action.openPopup();

      console.log('PDF definition will be shown in popup');
    } catch (error) {
      console.error('Error showing PDF definition in popup:', error);
    }
  }

  async showPdfError(word, errorMessage) {
    try {
      // Store the error for the popup
      await chrome.storage.local.set({
        pendingDefinition: {
          word: word,
          definition: { meanings: [] },
          error: errorMessage
        }
      });

      // Open the extension popup
      await chrome.action.openPopup();

      console.log('PDF error will be shown in popup');
    } catch (error) {
      console.error('Error showing PDF error in popup:', error);
    }
  }

  async fetchDefinition(word) {
    try {
      // Check settings for offline mode
      const settings = await chrome.storage.sync.get({
        offlineMode: false
      });

      // If offline mode is enabled or no internet, use offline dictionary
      if (settings.offlineMode || !navigator.onLine) {
        return await this.fetchOfflineDefinition(word);
      }

      // Try online API first
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`, {
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      if (!response.ok) {
        throw new Error('Word not found online');
      }

      const data = await response.json();
      return data[0]; // Get the first result
    } catch (error) {
      console.log('Online fetch failed, trying offline dictionary:', error.message);
      // Fallback to offline dictionary
      return await this.fetchOfflineDefinition(word);
    }
  }

  async fetchOfflineDefinition(word) {
    try {
      // Load offline dictionary data
      const response = await fetch(chrome.runtime.getURL('data/dictionary.json'));
      const dictionary = await response.json();
      
      const definition = dictionary[word.toLowerCase()];
      if (!definition) {
        // Try to find similar words for suggestions
        const similarWords = Object.keys(dictionary)
          .filter(key => key.startsWith(word.substring(0, 3).toLowerCase()))
          .slice(0, 5);
        
        let errorMessage = `Word "${word}" not found in offline dictionary`;
        if (similarWords.length > 0) {
          errorMessage += `. Did you mean: ${similarWords.join(', ')}?`;
        } else {
          errorMessage += `. Available: ${Object.keys(dictionary).length} words offline.`;
        }
        
        throw new Error(errorMessage);
      }

      // Format offline definition to match API structure
      return {
        word: word,
        meanings: [{
          partOfSpeech: 'noun', // Default, could be enhanced
          definitions: [{
            definition: definition
          }]
        }],
        isOffline: true
      };
    } catch (error) {
      if (error.message.includes('not found in offline dictionary')) {
        throw error; // Re-throw our custom error
      }
      throw new Error('Offline dictionary failed to load: ' + error.message);
    }
  }

  async showDefinitionTooltip(tabId, word, definition, info) {
    try {
      // Inject CSS first
      await chrome.scripting.insertCSS({
        target: { tabId: tabId },
        files: ["styles.css"]
      });

      // Inject script to show tooltip
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: this.createTooltipScript,
        args: [word, definition, info]
      });
    } catch (error) {
      console.error('Error showing definition tooltip:', error);
    }
  }

  async showErrorTooltip(tabId, word, errorMessage, info) {
    try {
      // Inject CSS first
      await chrome.scripting.insertCSS({
        target: { tabId: tabId },
        files: ["styles.css"]
      });

      // Inject script to show error tooltip
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: this.createErrorTooltipScript,
        args: [word, errorMessage, info]
      });
    } catch (error) {
      console.error('Error showing error tooltip:', error);
    }
  }

  // Function to be injected into the page to create and show tooltip
  createTooltipScript(word, definition, info) {
    // Remove any existing tooltip
    const existingTooltip = document.getElementById('dicit-tooltip');
    if (existingTooltip) {
      existingTooltip.remove();
    }

    // Create tooltip element
    const tooltip = document.createElement('div');
    tooltip.className = 'dicit-tooltip';
    tooltip.id = 'dicit-tooltip';

    // Get audio URL
    const getAudioUrl = (data) => {
      if (data.phonetics && data.phonetics.length > 0) {
        for (const phonetic of data.phonetics) {
          if (phonetic.audio && phonetic.audio.trim() !== '') {
            return phonetic.audio;
          }
        }
      }
      return null;
    };

    const meanings = definition.meanings || [];
    const audioUrl = getAudioUrl(definition);
    
    let definitionHtml = `
      <div class="dicit-header">
        <div class="dicit-word-info">
          <strong>${word}</strong>
          ${definition.phonetic ? `<span class="dicit-phonetic">${definition.phonetic}</span>` : ''}
        </div>
        <div class="dicit-controls">
          ${audioUrl ? `<button class="dicit-audio-btn" data-audio="${audioUrl}" title="Play pronunciation">🔊</button>` : ''}
          <button class="dicit-close">&times;</button>
        </div>
      </div>
      <div class="dicit-content">
    `;

    if (meanings.length > 0) {
      meanings.slice(0, 2).forEach(meaning => {
        definitionHtml += `
          <div class="dicit-meaning">
            <span class="dicit-part-of-speech">${meaning.partOfSpeech}</span>
            <ul class="dicit-definitions">
        `;
        
        meaning.definitions.slice(0, 2).forEach(def => {
          definitionHtml += `<li>${def.definition}</li>`;
        });
        
        definitionHtml += `</ul></div>`;
      });
    }

    definitionHtml += `</div>`;
    tooltip.innerHTML = definitionHtml;

    // Position tooltip - handle cases where pageX/pageY might not be available
    let left = 50; // Default position
    let top = 50;
    
    // Try to get position from info object or use center of screen
    if (info && typeof info.pageX === 'number') {
      left = info.pageX;
      top = info.pageY + 20;
    } else {
      // Fallback to center of viewport
      left = Math.max(50, (window.innerWidth / 2) - 150);
      top = Math.max(50, (window.innerHeight / 2) - 100);
    }

    // Keep within viewport
    const tooltipWidth = 300;
    const tooltipHeight = 200;
    
    if (left + tooltipWidth > window.innerWidth) {
      left = Math.max(10, window.innerWidth - tooltipWidth - 10);
    }
    if (left < 10) {
      left = 10;
    }
    if (top + tooltipHeight > window.innerHeight) {
      top = Math.max(10, window.innerHeight - tooltipHeight - 10);
    }
    if (top < 10) {
      top = 10;
    }

    tooltip.style.position = 'fixed';
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
    tooltip.style.display = 'block';
    tooltip.style.zIndex = '999999';

    // Add to page
    document.body.appendChild(tooltip);

    // Add event listeners
    const closeBtn = tooltip.querySelector('.dicit-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        tooltip.remove();
      });
    }

    const audioBtn = tooltip.querySelector('.dicit-audio-btn');
    if (audioBtn) {
      audioBtn.addEventListener('click', () => {
        const audioUrl = audioBtn.getAttribute('data-audio');
        if (audioUrl) {
          try {
            const audio = new Audio(audioUrl);
            audio.volume = 0.7;
            audio.play().catch(console.error);
          } catch (e) {
            console.error('Error playing audio:', e);
          }
        }
      });
    }

    // Close when clicking outside
    const closeHandler = function(e) {
      if (!tooltip.contains(e.target)) {
        tooltip.remove();
        document.removeEventListener('click', closeHandler);
        document.removeEventListener('keydown', escapeHandler);
      }
    };
    
    // Close on escape
    const escapeHandler = function(e) {
      if (e.key === 'Escape') {
        tooltip.remove();
        document.removeEventListener('click', closeHandler);
        document.removeEventListener('keydown', escapeHandler);
      }
    };
    
    // Add listeners with a small delay to prevent immediate closing
    setTimeout(() => {
      document.addEventListener('click', closeHandler);
      document.addEventListener('keydown', escapeHandler);
    }, 100);
  }

  // Function to be injected for error display
  createErrorTooltipScript(word, errorMessage, info) {
    // Remove any existing tooltip
    const existingTooltip = document.getElementById('dicit-tooltip');
    if (existingTooltip) {
      existingTooltip.remove();
    }

    // Create tooltip element
    const tooltip = document.createElement('div');
    tooltip.className = 'dicit-tooltip';
    tooltip.id = 'dicit-tooltip';

    tooltip.innerHTML = `
      <div class="dicit-header">
        <div class="dicit-word-info">
          <strong>${word}</strong>
        </div>
        <div class="dicit-controls">
          <button class="dicit-close">&times;</button>
        </div>
      </div>
      <div class="dicit-content">
        <div class="dicit-error">
          ${errorMessage === 'Word not found' ? 'No definition found for this word.' : 'Failed to fetch definition.'}
        </div>
      </div>
    `;

    // Position tooltip - handle cases where pageX/pageY might not be available
    let left = 50;
    let top = 50;
    
    if (info && typeof info.pageX === 'number') {
      left = info.pageX;
      top = info.pageY + 20;
    } else {
      left = Math.max(50, (window.innerWidth / 2) - 150);
      top = Math.max(50, (window.innerHeight / 2) - 100);
    }

    const tooltipWidth = 300;
    if (left + tooltipWidth > window.innerWidth) {
      left = Math.max(10, window.innerWidth - tooltipWidth - 10);
    }
    if (left < 10) {
      left = 10;
    }
    if (top < 10) {
      top = 10;
    }

    tooltip.style.position = 'fixed';
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
    tooltip.style.display = 'block';
    tooltip.style.zIndex = '999999';

    document.body.appendChild(tooltip);

    // Add close functionality
    const closeBtn = tooltip.querySelector('.dicit-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        tooltip.remove();
      });
    }

    const closeHandler = function(e) {
      if (!tooltip.contains(e.target)) {
        tooltip.remove();
        document.removeEventListener('click', closeHandler);
        document.removeEventListener('keydown', escapeHandler);
      }
    };
    
    const escapeHandler = function(e) {
      if (e.key === 'Escape') {
        tooltip.remove();
        document.removeEventListener('click', closeHandler);
        document.removeEventListener('keydown', escapeHandler);
      }
    };
    
    setTimeout(() => {
      document.addEventListener('click', closeHandler);
      document.addEventListener('keydown', escapeHandler);
    }, 100);
  }
}

// Initialize the background script
new DicitBackground();
