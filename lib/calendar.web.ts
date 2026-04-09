/**
 * Web stub: react-native-calendar-events is native-only.
 */

export async function requestCalendarPermissions() {
  return false;
}

export async function createDeviceCalendarEvent(
  _title: string,
  _startDate: string,
  _endDate: string,
  _notes: string = ''
) {
  return null;
}

export const createProjectCalendarEvent = createDeviceCalendarEvent;

export async function updateDeviceCalendarEvent(
  _eventId: string,
  _title: string,
  _startDate: string,
  _endDate: string,
  _notes: string = ''
) {
  return null;
}

export const updateProjectCalendarEvent = updateDeviceCalendarEvent;

export async function removeDeviceCalendarEvent(_eventId: string): Promise<boolean> {
  return false;
}
