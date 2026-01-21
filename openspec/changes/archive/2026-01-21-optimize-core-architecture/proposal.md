# Proposal: Optimize Core Architecture and Refactor UI Layer

## Summary

Refactor the Chronos extension to improve code modularity, accuracy of time tracking, and data persistence efficiency. This involves introducing ES modules, implementing idle detection, and centralizing shared utilities.

## Why

- **Code Duplication**: Shared logic like domain extraction and time formatting is duplicated across `background.js`, `popup.js`, and `options.js`.
- **Inefficient Storage**: Data is saved to `chrome.storage` every 10 seconds regardless of whether it has changed.
- **Accuracy Issues**: Tracking continues even when the user is idle (e.g., computer left on but not in use).
- **Maintenance**: The current monolith scripts are harder to test and maintain.

## What Changes

- Centralize shared utilities into a new `utils/` module.
- Transition the project to use ES modules for better organization.
- Implement `chrome.idle` API to pause tracking when the system is idle.
- Optimize persistence with a "dirty" flag mechanism.
- Remove external CDN dependency for Font Awesome (optional but recommended for reliability).

## Risks

- **Manifest V3 Compatibility**: Ensuring module imports work correctly in service workers.
- **Data Migration**: Ensuring existing user data is preserved after refactoring.
