## ADDED Requirements

### Requirement: Accurate Time Tracking with Idle Detection

Tracking MUST pause when the user is idle or the system is locked.

#### Scenario: User leaves computer

- **Given** the extension is tracking an active tab
- **When** the system state changes to 'idle'
- **Then** the extension should record the time spent until that moment and stop tracking.
- **When** the state changes back to 'active'
- **Then** it should resume tracking from the current time.
