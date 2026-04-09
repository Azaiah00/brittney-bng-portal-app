/**
 * Native: device calendar (Apple Calendar on iOS, default calendar on Android) via react-native-calendar-events.
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

/** Create an event on the device calendar. Returns native event id, or null on failure. */
export async function createDeviceCalendarEvent(
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
      notes,
      alarms: [{ date: -60 }],
    });

    return eventId;
  } catch (error) {
    console.error('Error creating calendar event:', error);
    return null;
  }
}

/** @deprecated Use createDeviceCalendarEvent */
export const createProjectCalendarEvent = createDeviceCalendarEvent;

export async function updateDeviceCalendarEvent(
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
      notes,
    });

    return updatedEventId;
  } catch (error) {
    console.error('Error updating calendar event:', error);
    return null;
  }
}

/** @deprecated Use updateDeviceCalendarEvent */
export const updateProjectCalendarEvent = updateDeviceCalendarEvent;

export async function removeDeviceCalendarEvent(eventId: string): Promise<boolean> {
  try {
    const ok = await requestCalendarPermissions();
    if (!ok) return false;
    await RNCalendarEvents.removeEvent(eventId);
    return true;
  } catch (error) {
    console.error('Error removing calendar event:', error);
    return false;
  }
}
