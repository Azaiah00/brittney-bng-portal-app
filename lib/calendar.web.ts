/**
 * Web stub for calendar module.
 * react-native-calendar-events is native-only and has no web build.
 * This file is used when bundling for web to avoid Metro resolution errors.
 */

export async function requestCalendarPermissions() {
  return false;
}

export async function createProjectCalendarEvent(
  _title: string,
  _startDate: string,
  _endDate: string,
  _notes: string = ''
) {
  return null;
}

export async function updateProjectCalendarEvent(
  _eventId: string,
  _title: string,
  _startDate: string,
  _endDate: string,
  _notes: string = ''
) {
  return null;
}
