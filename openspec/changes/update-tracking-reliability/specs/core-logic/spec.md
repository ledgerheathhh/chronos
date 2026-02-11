## MODIFIED Requirements
### Requirement: Accurate Time Tracking with Idle Detection

Tracking MUST pause when the user is idle or the system is locked, and resume with the currently active tab context.

#### Scenario: User leaves computer

- **Given** the extension is tracking an active tab
- **When** the system state changes to 'idle'
- **Then** the extension should record the time spent until that moment and stop tracking.
- **When** the state changes back to 'active'
- **Then** it should resume tracking from the current time using the active tab's current URL and domain.

## ADDED Requirements
### Requirement: Local Day Aggregation

Daily aggregation MUST use the user's local date boundaries.

#### Scenario: Local midnight rollover

- **Given** the user browses across local midnight
- **When** tracking continues into the next local day
- **Then** time before midnight is recorded under the previous local date and time after midnight is recorded under the new local date.
