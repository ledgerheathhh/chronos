# Change: Update Tracking Reliability

## Why
Current tracking can drift across local day boundaries, and MV3 background suspension risks losing periodic persistence and resuming with stale tab context.

## What Changes
- Use local date boundaries for daily aggregation.
- Persist data via MV3-friendly alarms instead of unreliable intervals.
- Refresh active tab context when resuming from idle.
- Prune per-domain daily history to a fixed retention window to limit storage growth.

## Impact
- Affected specs: core-logic, data-persistence
- Affected code: background.js, utils/utils.js
