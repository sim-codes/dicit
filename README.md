# Dicit - Dictionary Chrome Extension

A simple and elegant Chrome extension that provides instant word definitions when you highlight text on any webpage, including PDF files.

## Features

- 📚 **Instant Definitions**: Highlight any word to see its definition in a popup tooltip
- 🖱️ **Right-Click Context Menu**: Right-click on selected text or anywhere on the page to define words
- 📄 **PDF Support**: Works in PDF files and all web content through context menu
- 🔍 **Free Dictionary API**: Uses the free Dictionary API for accurate definitions
- 🎨 **Clean Interface**: Beautiful, non-intrusive tooltip design
- ⚡ **Fast & Lightweight**: Minimal impact on page performance
- 🌐 **Works Everywhere**: Compatible with all websites and PDF files

## How to Use

### Method 1: Text Selection (Traditional)
1. **Highlight any word** on a webpage by selecting it with your mouse
2. **View the definition** that appears in a tooltip below the selected text
3. **Close the tooltip** by clicking the × button or clicking elsewhere on the page

### Method 2: Right-Click Context Menu (Works in PDFs)
1. **Select any word** and right-click to see "Define 'word'" in the context menu
2. **Click "Define word"** to see the definition in a tooltip
3. **Or right-click anywhere** and select "Define word..." to enter a word manually

The context menu method is especially useful for:
- PDF files where text selection might not trigger tooltips
- Pages with complex layouts
- When you want to look up a word without selecting it first

## Installation

### Install from Chrome Web Store (Recommended)
*[This would be the link once published]*

### Manual Installation (Developer Mode)

1. **Download or Clone** this repository to your computer
2. **Open Chrome** and navigate to `chrome://extensions/`
3. **Enable Developer Mode** by clicking the toggle in the top-right corner
4. **Click "Load unpacked"** and select the `dicit` folder
5. **Pin the extension** by clicking the puzzle piece icon in the toolbar and pinning Dicit

## Icons

The extension currently uses placeholder icons. To add proper PNG icons:

1. Create or find 16x16, 48x48, and 128x128 pixel PNG icons
2. Save them as `icon16.png`, `icon48.png`, and `icon128.png` in the `icons/` folder
3. Reload the extension in Chrome

You can use the provided SVG template in `icons/icon.svg` as a starting point.

## Technical Details

### Files Structure
```
dicit/
├── manifest.json          # Extension configuration
├── content.js            # Main functionality script
├── styles.css            # Tooltip styling
├── popup.html            # Extension popup page
├── icons/                # Extension icons
│   ├── icon.svg          # SVG template
│   ├── icon16.png        # (To be added)
│   ├── icon48.png        # (To be added)
│   └── icon128.png       # (To be added)
└── README.md             # This file
```

### API Used
- **Dictionary API**: https://api.dictionaryapi.dev/
- **Free and Open Source**: No API key required

### Permissions
- `activeTab`: To access the current webpage content
- `storage`: To store user preferences (future feature)
- `https://api.dictionaryapi.dev/*`: To fetch word definitions

## Customization

### Styling
You can customize the appearance by editing `styles.css`. The main classes are:
- `.dicit-tooltip`: Main tooltip container
- `.dicit-header`: Tooltip header with word and close button
- `.dicit-content`: Definition content area

### Functionality
Modify `content.js` to:
- Change the word selection behavior
- Add more definition sources
- Implement additional features like pronunciation, synonyms, etc.

## Contributing

Feel free to submit issues, fork the repository, and create pull requests for any improvements.

## License

This project is open source and available under the [MIT License](LICENSE).

## Changelog

### Version 1.0
- Initial release
- Basic word definition lookup
- Clean tooltip interface
- Support for all websites
