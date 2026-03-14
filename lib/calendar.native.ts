/**
 * Native implementation for calendar module.
 * Uses react-native-calendar-events for iOS/Android Apple Calendar sync.
 */

import RNCalendarEvents from 'react-native-calendar-events';

export async function requestCalendarPermissions() {
  try {
    const status = await RNCalendarEvents.requestPermissions();
    return status === 'authorized';
  } catch (error) {
    console.error('Error requesting calendar permissions:', error);
    return false;
  }
}

export async function createProjectCalendarEvent(
  title: string,
  startDate: string,
  endDate: string,
  notes: string = ''
) {
  try {
    const hasPermission = await requestCalendarPermissions();
    if (!hasPermission) return null;

    const eventId = await RNCalendarEvents.saveEvent(title, {
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      notes: notes,
      alarms: [{ date: -60 }], // 1 hour before
    });

    return eventId;
  } catch (error) {
    console.error('Error creating calendar event:', error);
    return null;
  }
}

export async function updateProjectCalendarEvent(
  eventId: string,
  title: string,
  startDate: string,
  endDate: string,
  notes: string = ''
) {
  try {
    const hasPermission = await requestCalendarPermissions();
    if (!hasPermission) return null;

    const updatedEventId = await RNCalendarEvents.saveEvent(title, {
      id: eventId,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      notes: notes,
    });

    return updatedEventId;
  } catch (error) {
    console.error('Error updating calendar event:', error);
    return null;
  }
}
