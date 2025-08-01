// Popup script for settings management and definition display
document.addEventListener('DOMContentLoaded', async () => {
  // Check if we should show a definition (from context menu or other source)
  const definitionData = await chrome.storage.local.get('pendingDefinition');

  if (definitionData.pendingDefinition) {
    // Clear the pending definition and show it
    await chrome.storage.local.remove('pendingDefinition');
    const data = definitionData.pendingDefinition;
    if (data.error) {
      showDefinitionError(data.word, data.error);
    } else {
      showDefinition(data.word, data.definition);
    }
  } else {
    // Show normal popup content
    showMainContent();
  }

  // Load saved settings
  const settings = await chrome.storage.sync.get({
    includeExamples: true,
    showPhonetics: true,
    includeAudio: true,
    offlineMode: false
  });

  // Set checkbox states
  document.getElementById('includeExamples').checked = settings.includeExamples;
  document.getElementById('showPhonetics').checked = settings.showPhonetics;
  document.getElementById('includeAudio').checked = settings.includeAudio;
  document.getElementById('offlineMode').checked = settings.offlineMode;

  // Add event listeners for settings
  document.getElementById('includeExamples').addEventListener('change', (e) => {
    chrome.storage.sync.set({ includeExamples: e.target.checked });
  });

  document.getElementById('showPhonetics').addEventListener('change', (e) => {
    chrome.storage.sync.set({ showPhonetics: e.target.checked });
  });

  document.getElementById('includeAudio').addEventListener('change', (e) => {
    chrome.storage.sync.set({ includeAudio: e.target.checked });
  });

  document.getElementById('offlineMode').addEventListener('change', (e) => {
    chrome.storage.sync.set({ offlineMode: e.target.checked });
  });

  // Add back button listener
  document.getElementById('backBtn').addEventListener('click', () => {
    showMainContent();
  });
});

function showMainContent() {
  document.getElementById('mainContent').style.display = 'block';
  document.getElementById('definitionContainer').classList.remove('visible');
}

function showDefinition(word, definition) {
  document.getElementById('mainContent').style.display = 'none';
  document.getElementById('definitionContainer').classList.add('visible');

  const content = document.getElementById('definitionContent');
  content.innerHTML = createDefinitionHTML(word, definition);

  // Add event listeners for audio and close buttons
  addDefinitionEventListeners();
}

function showDefinitionError(word, errorMessage) {
  document.getElementById('mainContent').style.display = 'none';
  document.getElementById('definitionContainer').classList.add('visible');

  // Determine if this is an offline error and add appropriate badge
  const isOfflineError = errorMessage.includes('offline dictionary') || !navigator.onLine;
  let sourceIndicator = '';
  if (isOfflineError) {
    if (!navigator.onLine) {
      sourceIndicator = '<span class="offline-badge">🔒 NO INTERNET</span>';
    } else {
      sourceIndicator = '<span class="offline-badge">📚 OFFLINE</span>';
    }
  }

  const content = document.getElementById('definitionContent');
  content.innerHTML = `
    <div class="definition-header">
      <div class="word-info">
        <h2 class="word-title">${word}</h2>
        ${sourceIndicator}
      </div>
    </div>
    <div class="error">
      ${errorMessage}
    </div>
  `;
}

function createDefinitionHTML(word, definition) {
  const meanings = definition.meanings || [];
  const audioUrl = getAudioUrl(definition);
  
  // Determine if this is an offline definition and add appropriate badge
  const isOfflineDefinition = definition.isOffline || !navigator.onLine;
  let sourceIndicator = '';
  if (definition.isOffline) {
    sourceIndicator = '<span class="offline-badge">📚 OFFLINE</span>';
  } else if (!navigator.onLine) {
    sourceIndicator = '<span class="offline-badge">🔒 NO INTERNET</span>';
  }

  let html = `
    <div class="definition-header">
      <div class="word-info">
        <h2 class="word-title">${word}</h2>
        ${sourceIndicator}
        ${definition.phonetic ? `<div class="phonetic">${definition.phonetic}</div>` : ''}
      </div>
      <div>
        ${audioUrl && navigator.onLine ? `<button class="audio-btn" data-audio="${audioUrl}">🔊 Play</button>` : ''}
      </div>
    </div>
  `;

  if (meanings.length > 0) {
    meanings.forEach(meaning => {
      html += `
        <div class="meaning">
      `;
      
      // Only show part-of-speech if not from offline dictionary
      if (!definition.isOffline && meaning.partOfSpeech) {
        html += `<div class="part-of-speech">${meaning.partOfSpeech}</div>`;
      }
      
      html += `<ol class="definitions-list">`;

      meaning.definitions.forEach(def => {
        html += `<li>${def.definition}`;
        if (def.example) {
          html += `<div class="example">"${def.example}"</div>`;
        }
        html += `</li>`;
      });

      html += `</ol></div>`;
    });
  } else {
    html += `<div class="error">No definitions found for this word.</div>`;
  }

  return html;
}

function getAudioUrl(data) {
  if (data.phonetics && data.phonetics.length > 0) {
    for (const phonetic of data.phonetics) {
      if (phonetic.audio && phonetic.audio.trim() !== '') {
        return phonetic.audio;
      }
    }
  }
  return null;
}

function addDefinitionEventListeners() {
  // Audio button listener
  const audioBtn = document.querySelector('.audio-btn');
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
}
