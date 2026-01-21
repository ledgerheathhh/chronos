## ADDED Requirements

### Requirement: Efficient Data Persistence

The extension MUST minimize unnecessary storage writes.

#### Scenario: Periodic saving

- **Given** tracking is active but no data has changed in the last 10 seconds
- **When** the periodic save interval fires
- **Then** no write operation to `chrome.storage.local` should be performed.
