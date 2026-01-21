## ADDED Requirements

### Requirement: Modular Shared Utilities

Shared UI logic MUST be centralized to ensure consistency.

#### Scenario: Theme Application

- **Given** a user changes the theme in options
- **When** the popup is opened
- **Then** it should use the shared `applyTheme` logic from `utils.js` to ensure visual consistency.
