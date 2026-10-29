import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:8000';

export function usePetNotifications() {
  const [data, setData] = useState({
    today: new Date().toISOString().split('T')[0],
    counts: {
      overdue: 0,
      today: 0,
      upcoming_week: 0,
      total_vet_alerts: 0,
      active_meals: 0,
      total_active_alerts: 0,
    },
    vet_reminders: [],
    meal_reminders: [],
  });

  const [loading, setLoading] = useState(false);
  const [permission, setPermission] = useState(
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'unsupported'
  );

  // Track marked-as-fed meals for today in localStorage
  const todayKey = `nutripet_fed_${new Date().toISOString().split('T')[0]}`;
  const [fedMap, setFedMap] = useState(() => {
    try {
      const stored = localStorage.getItem(todayKey);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const notifiedThisSession = useRef(new Set());

  // Fetch latest notifications from backend summary endpoint
  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/pets/notifications/summary`);
      setData(res.data);
    } catch (err) {
      console.warn('Could not fetch notification summary from API, falling back to local state:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Request browser desktop notification permissions
  const requestDesktopPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert('Desktop notifications are not supported on this browser.');
      return 'unsupported';
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === 'granted') {
        new Notification('🐾 NutriPet Notifications Enabled', {
          body: 'You will now receive desktop alerts for pet meal times and clinical appointments.',
          icon: 'https://cdn-icons-png.flaticon.com/512/616/616408.png',
        });
      }
      return result;
    } catch (err) {
      console.error('Error requesting notification permission:', err);
      return 'denied';
    }
  };

  // Trigger browser notification
  const sendDesktopNotification = useCallback((title, body, tag = null) => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: 'https://cdn-icons-png.flaticon.com/512/616/616408.png',
          tag: tag || `${title}-${Date.now()}`,
        });
      } catch (err) {
        console.warn('Failed to dispatch notification:', err);
      }
    }
  }, []);

  // Live test notification
  const testNotification = () => {
    if (permission !== 'granted') {
      requestDesktopPermission().then((res) => {
        if (res === 'granted') {
          sendDesktopNotification('🐾 NutriPet Alert Test', 'Success! Meal and vet notifications are actively connected.');
        }
      });
    } else {
      sendDesktopNotification('🐾 NutriPet Alert Test', 'Success! Meal and vet notifications are actively connected.');
    }
  };

  // Toggle meal as fed for today
  const toggleMealFed = (dietId) => {
    setFedMap((prev) => {
      const next = { ...prev, [dietId]: !prev[dietId] };
      try {
        localStorage.setItem(todayKey, JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  const isMealFed = (dietId) => !!fedMap[dietId];

  // Real-time interval monitor (every 45s)
  useEffect(() => {
    const checkSchedule = () => {
      if (permission !== 'granted') return;

      const now = new Date();
      const hours24 = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const current24 = `${hours24}:${minutes}`;

      // 12-hour format e.g. "08:00 AM", "8:00 AM"
      const hours12 = now.getHours() % 12 || 12;
      const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
      const current12Standard = `${String(hours12).padStart(2, '0')}:${minutes} ${ampm}`;
      const current12Short = `${hours12}:${minutes} ${ampm}`;

      // 1. Check Meal Schedules
      data.meal_reminders.forEach((meal) => {
        if (isMealFed(meal.diet_id)) return;
        const sched = meal.schedule_time || '';
        
        const matchesTime =
          sched.includes(current24) ||
          sched.toUpperCase().includes(current12Standard) ||
          sched.toUpperCase().includes(current12Short);

        const sessionKey = `meal-${meal.diet_id}-${current24}`;
        if (matchesTime && !notifiedThisSession.current.has(sessionKey)) {
          notifiedThisSession.current.add(sessionKey);
          sendDesktopNotification(
            `🥩 Meal Time for ${meal.pet_name}!`,
            `Time to feed: ${meal.diet_name} (${meal.meals_per_day} meals/day target).`,
            sessionKey
          );
        }
      });

      // 2. Check Vet Visits due today (alert once per day)
      data.vet_reminders.forEach((vet) => {
        if (vet.status === 'today') {
          const sessionKey = `vet-today-${vet.visit_id}`;
          if (!notifiedThisSession.current.has(sessionKey)) {
            notifiedThisSession.current.add(sessionKey);
            sendDesktopNotification(
              `🩺 Vet Appointment Today: ${vet.pet_name}`,
              `${vet.reason} at ${vet.clinic_name || 'Clinic'}.`,
              sessionKey
            );
          }
        }
      });
    };

    checkSchedule();
    const interval = setInterval(checkSchedule, 45000);
    return () => clearInterval(interval);
  }, [data, permission, fedMap, sendDesktopNotification]);

  return {
    ...data,
    loading,
    permission,
    requestDesktopPermission,
    sendDesktopNotification,
    testNotification,
    toggleMealFed,
    isMealFed,
    refreshNotifications: fetchSummary,
  };
}
