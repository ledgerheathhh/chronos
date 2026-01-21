# Project Context

## Purpose

Chronos is a Chrome browser extension that tracks and records the time users spend on different websites. It provides detailed browsing statistics (daily, weekly, monthly, all-time) to help users understand their online time allocation and browsing habits.

## Tech Stack

- **Platform**: Chrome Extension (Manifest V3)
- **Languages**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **APIs**: Chrome Extensions API (tabs, storage, windows, runtime)
- **Storage**: Chrome Local Storage API (in-memory cache with periodic persistence)
- **Build**: No build step required (vanilla JS with ES modules)

## Project Conventions

### Code Style

- **Functions**: camelCase naming (e.g., `extractDomain`, `formatTime`, `showCurrentSiteInfo`)
- **Variables**: camelCase for variables, UPPER_CASE for constants
- **Comments**: Single-line comments with `//` for inline explanations
- **Formatting**: 2-space indentation, semicolons at end of statements
- **Error Handling**: Try-catch blocks with `console.error` logging
- **DOM Queries**: `document.getElementById()` and `document.querySelectorAll()`
- **Event Listeners**: Attached via `addEventListener()` in DOMContentLoaded

### Architecture Patterns

- **Background Service Worker**: Persistent state management and tab activity monitoring (`background.js`)
- **Popup UI**: Lightweight display of current stats and top sites (`popup/`)
- **Options Page**: Settings and data management (`options/`)
- **Message Passing**: Chrome runtime messaging between background worker and UI pages
- **In-Memory Caching**: Background script maintains `timeDataCache` object, persisted every 10 seconds
- **CSS Variables**: Theme system using CSS custom properties (`:root` and `.dark-theme`)

### Testing Strategy

- **Manual Testing**: Load unpacked extension in Chrome developer mode
- **Browser Testing**: Test across tab switches, window focus changes, and browser restart
- **No Automated Tests**: Currently no test framework in use

### Git Workflow

- **Branching**: Feature branches for new development
- **Commits**: Descriptive commit messages
- **Ignores**: `.DS_Store` files excluded via `.gitignore`

## Domain Context

- **Time Tracking**: Records timestamps when tabs become active, calculates duration when switching away
- **Domain Extraction**: Uses URL API to extract `hostname` from full URLs
- **Daily Aggregation**: Time data stored by date (YYYY-MM-DD format) for historical filtering
- **Visit Counting**: Increments visit count when domain becomes active (new tab or navigation)
- **Focus Awareness**: Pauses tracking when browser window loses focus

## Important Constraints

- **Manifest V3**: Must use service worker (not persistent background pages)
- **Chrome Only**: Uses Chrome-specific APIs, not cross-browser compatible
- **Local Storage Limits**: Chrome storage.local has ~5MB limit per extension
- **Privacy**: All data stays local; no external server communication
- **Permissions**: Requires `storage`, `tabs`, and `activeTab` permissions

## External Dependencies

- **Font Awesome**: Icon library loaded via CDN for UI icons
- **Google Fonts**: System font stack as fallback (no external font dependencies)
- **No NPM Packages**: node_modules exists but extension runs without build step
