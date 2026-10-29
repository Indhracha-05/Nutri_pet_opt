/**
 * Utility functions to export vet visit reminders to Google Calendar and .ics iCalendar format
 */

export function openGoogleCalendarLink({
  petName,
  reason,
  date,
  clinicName,
  veterinarian,
  notes,
}) {
  if (!date) return;
  // Clean date YYYY-MM-DD to YYYYMMDD
  const cleanDate = date.replace(/-/g, '');
  const title = encodeURIComponent(`🐾 Vet Visit: ${petName || 'Pet'} — ${reason || 'Checkup'}`);
  const details = encodeURIComponent(
    `Pet: ${petName || 'Pet'}\n` +
    `Reason: ${reason || 'Veterinary Clinical Checkup'}\n` +
    `Clinic: ${clinicName || 'Veterinary Hospital'}\n` +
    `Doctor: ${veterinarian || 'Veterinarian'}\n` +
    (notes ? `Clinical Notes: ${notes}\n` : '') +
    `\nCreated by NutriPet Veterinary Care System`
  );
  const location = encodeURIComponent(clinicName || 'Veterinary Clinic');

  // Google Calendar Template URL: all-day event
  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${cleanDate}/${cleanDate}&details=${details}&location=${location}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

export function downloadIcsFile({
  petName,
  reason,
  date,
  clinicName,
  veterinarian,
  notes,
}) {
  if (!date) return;
  const cleanDate = date.replace(/-/g, '');
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const uid = `nutripet-visit-${cleanDate}-${Math.random().toString(36).substr(2, 9)}@nutripet.local`;

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//NutriPet Opto//Pet Clinical Care//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART;VALUE=DATE:${cleanDate}`,
    `DTEND;VALUE=DATE:${cleanDate}`,
    `SUMMARY:🐾 Vet Visit: ${petName || 'Pet'} — ${reason || 'Checkup'}`,
    `DESCRIPTION:Pet: ${petName || 'Pet'}\\nReason: ${reason || 'Veterinary Care'}\\nClinic: ${clinicName || 'Clinic'}\\nVeterinarian: ${veterinarian || 'N/A'}${notes ? '\\nNotes: ' + notes : ''}`,
    `LOCATION:${clinicName || 'Veterinary Clinic'}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    `DESCRIPTION:Reminder: Tomorrow is ${petName}'s vet appointment`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', `${(petName || 'pet').toLowerCase()}_vet_visit_${date}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
