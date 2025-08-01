// Content script for dictionary extension
class DicitDictionary {
  constructor() {
    this.tooltip = null;
    this.isVisible = false;
    this.currentWord = '';
    this.settings = {
      includeExamples: true,
      showPhonetics: true,
      includeAudio: true
    };
    this.init();
  }    async init() {
        // Load user settings
        await this.loadSettings();
        
        // Listen for text selection
        document.addEventListener('mouseup', this.handleSelection.bind(this));
        document.addEventListener('keyup', this.handleSelection.bind(this));

        // Hide tooltip when clicking elsewhere (but not on the tooltip itself)
        document.addEventListener('click', (event) => {
            if (this.tooltip && this.isVisible && !this.tooltip.contains(event.target)) {
                this.hideTooltip();
            }
        });

        // Hide tooltip when scrolling
        document.addEventListener('scroll', this.hideTooltip.bind(this));
        
        // Hide tooltip when pressing escape
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.hideTooltip();
            }
        });

        // Listen for messages from background script (context menu)
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleMessage(message, sender, sendResponse);
            return true; // Keep message channel open for async response
        });

        console.log('Dicit Dictionary extension loaded'); // Debug log
    }

  async loadSettings() {
    try {
      const settings = await chrome.storage.sync.get({
        includeExamples: true,
        showPhonetics: true,
        includeAudio: true
      });
      this.settings = settings;
      console.log('Settings loaded:', this.settings);
    } catch (error) {
      console.log('Could not load settings, using defaults:', error);
      // Use default settings if storage is not available
    }
  }

  async handleMessage(message, sender, sendResponse) {
    try {
      if (message.action === "showDefinition" && message.word) {
        // Show definition for the word from context menu
        const word = message.word.trim();
        if (word) {
          // Create a simulated event for positioning the tooltip
          const fakeEvent = {
            clientX: message.clickInfo?.pageX || window.innerWidth / 2,
            clientY: message.clickInfo?.pageY || window.innerHeight / 2
          };
          
          this.currentWord = word.toLowerCase();
          await this.showTooltipForWord(fakeEvent, word);
          sendResponse({success: true});
        }
      } else if (message.action === "promptForWord") {
        // Show prompt to get word from user
        const word = prompt("Enter a word to define:");
        if (word && word.trim()) {
          const fakeEvent = {
            clientX: message.clickInfo?.pageX || window.innerWidth / 2,
            clientY: message.clickInfo?.pageY || window.innerHeight / 2
          };
          
          this.currentWord = word.trim().toLowerCase();
          await this.showTooltipForWord(fakeEvent, word.trim());
          sendResponse({success: true});
        } else {
          sendResponse({success: false, error: "No word provided"});
        }
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({success: false, error: error.message});
    }
  }    handleSelection(event) {
        // Small delay to ensure selection is complete
        setTimeout(() => {
            const selection = window.getSelection();
            const selectedText = selection.toString().trim();

            console.log('Selection detected:', selectedText); // Debug log

            if (selectedText && selectedText.length > 0 && selectedText.length < 50) {
                // Check if it's a single word (allow letters, numbers, hyphens, apostrophes)
                const word = selectedText.replace(/[^a-zA-Z0-9'-]/g, '');
                if (word && word.length > 1 && !selectedText.includes(' ')) {
                    this.currentWord = word.toLowerCase();
                    console.log('Showing tooltip for word:', this.currentWord); // Debug log
                    this.showTooltip(event, selectedText);
                } else {
                    this.hideTooltip();
                }
            } else {
                this.hideTooltip();
            }
        }, 100);
    }

    async showTooltip(event, selectedText) {
        try {
            // Reload settings to get latest user preferences
            await this.loadSettings();
            
            // Get the position for the tooltip
            const selection = window.getSelection();
            if (selection.rangeCount === 0) return;
            
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();

            // Create or update tooltip
            if (!this.tooltip) {
                this.createTooltip();
            }

            // Calculate position with viewport bounds checking
            let left = rect.left + window.scrollX;
            let top = rect.bottom + window.scrollY + 10;

            // Ensure tooltip stays within viewport
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            if (left + 300 > viewportWidth) {
                left = viewportWidth - 310;
            }
            if (left < 10) {
                left = 10;
            }

            // Position the tooltip
            this.tooltip.style.left = `${left}px`;
            this.tooltip.style.top = `${top}px`;

            // Show loading state
            this.tooltip.innerHTML = `
        <div class="dicit-header">
          <div class="dicit-word-info">
            <strong>${selectedText}</strong>
          </div>
          <div class="dicit-controls">
            <button class="dicit-close">&times;</button>
          </div>
        </div>
        <div class="dicit-content">
          <div class="dicit-loading">Loading definition...</div>
        </div>
      `;

            this.tooltip.style.display = 'block';
            this.isVisible = true;

            // Add close button functionality
            const closeBtn = this.tooltip.querySelector('.dicit-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.hideTooltip();
                });
            }

            // Fetch definition
            console.log('Fetching definition for:', this.currentWord); // Debug log
            const definition = await this.fetchDefinition(this.currentWord);
            this.displayDefinition(selectedText, definition);
        } catch (error) {
            console.error('Error showing tooltip:', error); // Debug log
            this.displayError(selectedText, error.message);
        }
    }

    async showTooltipForWord(event, word) {
        try {
            // Reload settings to get latest user preferences
            await this.loadSettings();
            
            // Create or update tooltip
            if (!this.tooltip) {
                this.createTooltip();
            }

            // Calculate position based on event or center of screen
            let left = event.clientX || window.innerWidth / 2;
            let top = event.clientY || window.innerHeight / 2;

            // Add some offset from cursor/click position
            top += 20;

            // Ensure tooltip stays within viewport
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            if (left + 300 > viewportWidth) {
                left = viewportWidth - 310;
            }
            if (left < 10) {
                left = 10;
            }
            if (top + 200 > viewportHeight) {
                top = event.clientY - 220; // Show above cursor instead
            }

            // Position the tooltip
            this.tooltip.style.left = `${left}px`;
            this.tooltip.style.top = `${top}px`;

            // Show loading state
            this.tooltip.innerHTML = `
                <div class="dicit-header">
                    <div class="dicit-word-info">
                        <strong>${word}</strong>
                    </div>
                    <div class="dicit-controls">
                        <button class="dicit-close">&times;</button>
                    </div>
                </div>
                <div class="dicit-content">
                    <div class="dicit-loading">Loading definition...</div>
                </div>
            `;

            this.tooltip.style.display = 'block';
            this.isVisible = true;

            // Add close button functionality
            const closeBtn = this.tooltip.querySelector('.dicit-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.hideTooltip();
                });
            }

            // Fetch definition
            console.log('Fetching definition for context menu word:', this.currentWord); // Debug log
            const definition = await this.fetchDefinition(this.currentWord);
            this.displayDefinition(word, definition);
        } catch (error) {
            console.error('Error showing tooltip for context menu word:', error); // Debug log
            this.displayError(word, error.message);
        }
    }

  createTooltip() {
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'dicit-tooltip';
    this.tooltip.id = 'dicit-tooltip';
    
    // Prevent clicks inside tooltip from bubbling up
    this.tooltip.addEventListener('click', (e) => {
      e.stopPropagation();
    });
    
    document.body.appendChild(this.tooltip);
  }    async fetchDefinition(word) {
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);

        if (!response.ok) {
            throw new Error('Word not found');
        }

        const data = await response.json();
        return data[0]; // Get the first result
    }

  displayDefinition(selectedText, data) {
    if (!this.tooltip) return;

    const meanings = data.meanings || [];
    const audioUrl = this.getAudioUrl(data);
    
    let definitionHtml = `
      <div class="dicit-header">
        <div class="dicit-word-info">
          <strong>${selectedText}</strong>
          ${this.settings.showPhonetics && data.phonetic ? `<span class="dicit-phonetic">${data.phonetic}</span>` : ''}
        </div>
        <div class="dicit-controls">
          ${this.settings.includeAudio && audioUrl ? `<button class="dicit-audio-btn" data-audio="${audioUrl}" title="Play pronunciation">🔊</button>` : ''}
          <button class="dicit-copy-btn" title="Copy definitions to clipboard">📋</button>
          <button class="dicit-close">&times;</button>
        </div>
      </div>
      <div class="dicit-content">
    `;

    if (meanings.length > 0) {
      // Show first 2 meanings to keep tooltip compact
      meanings.slice(0, 2).forEach(meaning => {
        definitionHtml += `
          <div class="dicit-meaning">
            <span class="dicit-part-of-speech">${meaning.partOfSpeech}</span>
            <ul class="dicit-definitions">
        `;

        // Show first 2 definitions for each part of speech
        meaning.definitions.slice(0, 2).forEach(def => {
          definitionHtml += `<li class="dicit-definition-item">
                        <div class="dicit-definition-text">${def.definition}</div>`;
          
          // Include example if enabled and available
          if (this.settings.includeExamples && def.example) {
            definitionHtml += `<div class="dicit-example">
                            <em>Example: "${def.example}"</em>
                        </div>`;
          }
          
          definitionHtml += `</li>`;
        });

        definitionHtml += `</ul></div>`;
      });
    } else {
      definitionHtml += '<div class="dicit-no-definition">No definition found</div>';
    }

    definitionHtml += '</div>';

    this.tooltip.innerHTML = definitionHtml;

    // Re-add close button functionality
    const closeBtn = this.tooltip.querySelector('.dicit-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.hideTooltip();
      });
    }

    // Add audio button functionality
    if (this.settings.includeAudio && audioUrl) {
      const audioBtn = this.tooltip.querySelector('.dicit-audio-btn');
      if (audioBtn) {
        audioBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          e.preventDefault();
          this.playAudio(audioUrl);
        });
      }
    }

    // Add copy button functionality
    const copyBtn = this.tooltip.querySelector('.dicit-copy-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        this.copyDefinitionsToClipboard(selectedText, data);
      });
    }
  }

  getAudioUrl(data) {
    // Try to find audio URL from phonetics array
    if (data.phonetics && data.phonetics.length > 0) {
      for (const phonetic of data.phonetics) {
        if (phonetic.audio && phonetic.audio.trim() !== '') {
          return phonetic.audio;
        }
      }
    }
    return null;
  }

  playAudio(audioUrl) {
    try {
      const audio = new Audio(audioUrl);
      audio.volume = 0.7;
      audio.play().catch(error => {
        console.error('Error playing audio:', error);
      });
    } catch (error) {
      console.error('Error creating audio:', error);
    }
  }

  async copyDefinitionsToClipboard(word, data) {
    try {
      let textToCopy = `${word}\n`;
      
      // Add phonetic if available
      if (this.settings.showPhonetics && data.phonetic) {
        textToCopy += `Pronunciation: ${data.phonetic}\n`;
      }
      
      textToCopy += '\n';
      
      // Add meanings and definitions
      const meanings = data.meanings || [];
      meanings.slice(0, 2).forEach((meaning, meaningIndex) => {
        textToCopy += `${meaningIndex + 1}. ${meaning.partOfSpeech}\n`;
        
        meaning.definitions.slice(0, 2).forEach((def, defIndex) => {
          textToCopy += `   ${String.fromCharCode(97 + defIndex)}. ${def.definition}\n`;
          
          // Add example if enabled and available
          if (this.settings.includeExamples && def.example) {
            textToCopy += `      Example: "${def.example}"\n`;
          }
        });
        
        textToCopy += '\n';
      });
      
      // Copy to clipboard
      await navigator.clipboard.writeText(textToCopy);
      
      // Show feedback
      this.showCopyFeedback();
      
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      // Fallback for older browsers
      this.fallbackCopyToClipboard(textToCopy);
    }
  }

  showCopyFeedback() {
    const copyBtn = this.tooltip.querySelector('.dicit-copy-btn');
    if (copyBtn) {
      const originalText = copyBtn.innerHTML;
      copyBtn.innerHTML = '✅';
      copyBtn.style.background = '#27ae60';
      
      setTimeout(() => {
        copyBtn.innerHTML = originalText;
        copyBtn.style.background = '#3498db';
      }, 1000);
    }
  }

  fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
      document.execCommand('copy');
      this.showCopyFeedback();
    } catch (error) {
      console.error('Fallback copy failed:', error);
    }
    
    document.body.removeChild(textArea);
  }

  displayError(selectedText, errorMessage) {
    if (!this.tooltip) return;

    this.tooltip.innerHTML = `
      <div class="dicit-header">
        <div class="dicit-word-info">
          <strong>${selectedText}</strong>
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

    // Re-add close button functionality
    const closeBtn = this.tooltip.querySelector('.dicit-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.hideTooltip();
      });
    }
  }

  hideTooltip() {
    if (this.tooltip && this.isVisible) {
      this.tooltip.style.display = 'none';
      this.isVisible = false;
    }
  }
}

// Initialize the dictionary when the page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new DicitDictionary();
    });
} else {
    new DicitDictionary();
}
