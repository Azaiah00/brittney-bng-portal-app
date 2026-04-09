/**
 * TypeScript resolves this file for `import './calendar'`.
 * Metro still prefers `calendar.native.ts` (iOS/Android) and `calendar.web.ts` (web) at bundle time.
 */
export {
  requestCalendarPermissions,
  createDeviceCalendarEvent,
  createProjectCalendarEvent,
  updateDeviceCalendarEvent,
  updateProjectCalendarEvent,
  removeDeviceCalendarEvent,
} from './calendar.web';
