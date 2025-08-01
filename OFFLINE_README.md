# Dicit Dictionary Extension - Offline Mode

This Chrome extension now supports offline functionality, allowing you to look up word definitions even without an internet connection.

## 🌟 Features

### Online Mode (Default)
- Fetches definitions from the Free Dictionary API
- Comprehensive definitions with examples
- Audio pronunciations available
- Automatic caching for offline access

### Offline Mode
- Uses a local dictionary database
- Works completely without internet
- Faster response times
- Privacy-focused (no external requests)
- Visual indicators showing offline status

## 🚀 Setup Instructions

### 1. Install the Extension
1. Load the extension in Chrome by going to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the extension folder

### 2. Enable Offline Mode
1. Click the extension icon in the toolbar
2. Check the "🔒 Offline mode" option in settings
3. The extension will now use only the local dictionary

### 3. Expand Offline Dictionary (Optional)

To add more words to the offline dictionary:

1. Install Node.js on your computer
2. Navigate to the extension folder in terminal
3. Run the dictionary generator:
   ```bash
   node generate-dictionary.js
   ```
4. This will fetch definitions for common words and update the local dictionary

## 📁 File Structure

```
dicit/
├── manifest.json              # Extension configuration
├── content.js                 # Main content script
├── background.js              # Background service worker
├── offline-dictionary.js      # Offline dictionary handler
├── popup.html                 # Settings popup interface
├── popup.js                   # Popup functionality
├── styles.css                 # Styling for tooltips
├── generate-dictionary.js     # Dictionary data generator
└── data/
    └── dictionary.json        # Local dictionary database
```

## 🔧 Technical Implementation

### How It Works

1. **Hybrid Approach**: The extension tries online API first, then falls back to local dictionary
2. **Caching**: Online definitions are cached locally for future offline access
3. **Settings Sync**: User preferences are synced across Chrome instances
4. **Visual Feedback**: Clear indicators show when working offline

### Offline Dictionary Format

The local dictionary uses this JSON structure:
```json
{
  "word": {
    "phonetic": "/pronunciation/",
    "phonetics": [{"audio": "", "text": "/pronunciation/"}],
    "meanings": [{
      "partOfSpeech": "noun|verb|adjective|etc",
      "definitions": [{
        "definition": "The meaning of the word",
        "example": "Example sentence using the word"
      }]
    }]
  }
}
```

## ⚙️ Customization

### Adding Custom Words

Edit `data/dictionary.json` to add your own words:

```json
{
  "myword": {
    "phonetic": "/maɪwɜːrd/",
    "meanings": [{
      "partOfSpeech": "noun",
      "definitions": [{
        "definition": "A custom definition for my word",
        "example": "This is how I use myword in a sentence."
      }]
    }]
  }
}
```

### Modifying Settings

Available settings in popup:
- ✅ Include examples in definitions
- ✅ Show pronunciation (phonetics)
- ✅ Include audio pronunciation
- 🔒 Offline mode (use local dictionary only)

## 🛠️ Troubleshooting

### Common Issues

1. **"Word not found" in offline mode**
   - The word isn't in the local dictionary
   - Generate more words using `generate-dictionary.js`
   - Manually add the word to `data/dictionary.json`

2. **Extension not working**
   - Check browser console for errors
   - Reload the extension in `chrome://extensions/`
   - Verify all files are present

3. **Settings not saving**
   - Check Chrome storage permissions
   - Try reloading the extension

### Performance Optimization

- Local dictionary loads once and stays in memory
- Definitions are cached automatically
- Tooltip positioning is optimized for performance

## 🔒 Privacy Benefits

When using offline mode:
- No external API calls
- No data sent to third parties
- Definitions processed locally
- Complete privacy protection

## 📈 Future Enhancements

Potential improvements:
- Support for multiple languages
- Larger dictionary databases
- Synonyms and antonyms
- Word etymology and origins
- Import/export dictionary data

## 📄 License

This extension is provided as-is for educational and personal use.
