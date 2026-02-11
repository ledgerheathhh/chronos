## MODIFIED Requirements
### Requirement: Efficient Data Persistence

The extension MUST minimize unnecessary storage writes and use MV3-friendly periodic persistence.

#### Scenario: Periodic saving

- **Given** tracking is active but no data has changed in the last save interval
- **When** the periodic persistence trigger fires
- **Then** no write operation to `chrome.storage.local` should be performed.

#### Scenario: MV3-friendly persistence

- **Given** the extension is running in Manifest V3
- **When** periodic persistence is scheduled
- **Then** it should use `chrome.alarms` or an equivalent MV3-compatible trigger.

## ADDED Requirements
### Requirement: Daily History Retention

The extension MUST prune per-domain daily history beyond a fixed retention window.

#### Scenario: Retention window exceeded

- **Given** a domain has daily records older than the retention window
- **When** data is persisted
- **Then** records older than the retention window are removed before saving.
