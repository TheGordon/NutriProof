# Fact Checker AI Chrome Extension

A Chrome extension that allows users to fact-check selected text using GPT-4o and Wolfram Alpha.

## Features

- **Context Menu Integration**: Right-click on selected text and choose "Fact-Check with AI"
- **AI-Powered Fact Checking**: Uses GPT-4o to identify claims and Wolfram Alpha to verify them
- **Clean Result Display**: Shows verification results in a simple, organized popup
- **Detailed Information**: Expand each claim to see the Wolfram Alpha query and response

## Installation

### Local Development Installation

1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in the top-right corner)
4. Click "Load unpacked" and select the `chrome-extension` directory
5. The extension should now be installed and visible in your Chrome toolbar

### Backend Setup

This extension requires the backend API to be running. Make sure to:

1. Install and run the backend server (see main project README)
2. Ensure the backend server is running on `http://localhost:5000`

## Usage

1. Navigate to any webpage
2. Select text containing factual claims
3. Right-click and select "Fact-Check with AI" from the context menu
4. A popup will appear with the fact-checking results
5. Click on "Details" to see the full Wolfram Alpha query and response

## Configuration

By default, the extension communicates with a local backend at `http://localhost:5000`. If you need to change this:

1. Edit the `API_URL` in `js/background.js`
2. Update the `host_permissions` in `manifest.json` if needed

## Development

### Project Structure

- `manifest.json`: Extension configuration
- `js/background.js`: Background script for context menu and API communication
- `js/content.js`: Content script for page interaction
- `js/popup.js`: Script for the popup UI
- `popup.html`: HTML for the popup UI
- `css/popup.css`: Styles for the popup UI
- `images/`: Extension icons

### Customizing the Extension

- **Icons**: Replace the icon files in the `images` directory
- **Styles**: Modify `css/popup.css` to change the appearance
- **Behavior**: Edit the JavaScript files to change functionality

## Permissions

This extension requires the following permissions:

- `contextMenus`: To add the right-click menu option
- `activeTab`: To access the current tab
- `scripting`: To interact with the page content
- `storage`: To store and retrieve fact-checking results
- `http://localhost:5000/*`: To communicate with the backend API 