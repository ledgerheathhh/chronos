# Tasks: Optimize Core Architecture

- [ ] **Phase 1: Foundation & Utils**
  - [ ] Create `utils/utils.js` with shared logic.
  - [ ] Update `manifest.json` to support modules in background and action.
- [ ] **Phase 2: Background Optimization**
  - [ ] Refactor `background.js` to use `import` from `utils.js`.
  - [ ] Implement `chrome.idle` integration.
  - [ ] Implement `isDirty` flag for optimized persistence.
- [ ] **Phase 3: UI Layer Refactor**
  - [ ] Refactor `popup/popup.js` to use `import` from `utils.js`.
  - [ ] Refactor `options/options.js` to use `import` from `utils.js`.
  - [ ] Verify message passing between modules.
- [ ] **Phase 4: Validation & Cleanup**
  - [ ] Perform manual verification of tracking, idle detection, and persistence.
  - [ ] Remove redundant code from scripts.
