# Chronos - Website Usage Time Tracker

## Overview
Chronos is a Chrome extension that tracks and records the time you spend on different websites. It provides detailed statistics about your browsing habits, helping you understand how you allocate your time online.

## Features
- **Real-time Tracking**: Automatically tracks the time spent on each website while you browse
- **Detailed Statistics**: View your browsing time by day, week, month, or all-time
- **Current Site Information**: Instantly see how much time you've spent on the current website
- **Top Sites Ranking**: Displays your most visited websites ranked by usage time
- **Data Management**: Export, import, or clear your browsing data
- **User-friendly Interface**: Clean and intuitive design for easy navigation

## Installation
1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" by toggling the switch in the top right corner
4. Click "Load unpacked" and select the Chronos directory
5. The Chronos icon should now appear in your browser toolbar

## Usage

### Viewing Current Site Statistics
- Click on the Chronos icon in your browser toolbar
- The popup will display information about the current website:
  - Domain name
  - Time spent today
  - Total time spent
  - Number of visits

### Viewing Top Sites
- Click on the Chronos icon in your browser toolbar
- Scroll down to see your top sites ranked by usage time
- Use the filter buttons to view statistics for today, this week, this month, or all time

### Customizing Settings
1. Right-click on the Chronos icon and select "Options" or click the settings icon in the popup
2. In the settings page, you can:
   - Clear all recorded data
   - Export your data as a JSON file
   - Import previously exported data
   - Customize time display format

## How It Works
Chronos uses Chrome's extension API to monitor active tabs and track the time spent on each domain. The extension:

- Records when you activate or switch tabs
- Tracks when you navigate to different URLs within the same tab
- Monitors browser focus to pause tracking when you're not actively using Chrome
- Stores data locally in your browser using Chrome's storage API
- Updates statistics every 30 seconds to ensure accurate time tracking

## Technical Implementation
- **Background Service Worker**: Continuously runs in the background to track tab activity and record time data
- **Chrome Storage API**: Stores browsing data locally in your browser
- **Tab Events API**: Monitors tab switching, updating, and activation
- **Window Focus Events**: Detects when the browser gains or loses focus
- **Data Visualization**: Presents statistics in an easy-to-understand format

## Privacy
All data is stored locally on your device. Chronos does not send any data to external servers or track your browsing history for any purpose other than displaying statistics to you.

## License
This project is open source and available for personal and educational use.

## Contributing
Contributions are welcome! Feel free to submit issues or pull requests to help improve Chronos.