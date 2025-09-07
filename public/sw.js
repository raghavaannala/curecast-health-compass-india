// Service Worker for Vaccination Reminder Notifications
const CACHE_NAME = 'vaccination-reminders-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/favicon.png',
  '/badge.png'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

// Background sync for vaccination reminders
self.addEventListener('sync', (event) => {
  if (event.tag === 'vaccination-reminder-sync') {
    event.waitUntil(syncVaccinationReminders());
  }
});

// Push notifications for vaccination reminders
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Vaccination reminder notification',
    icon: '/favicon.png',
    badge: '/badge.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'mark-complete',
        title: 'Mark Complete',
        icon: '/icons/complete.png'
      },
      {
        action: 'snooze',
        title: 'Snooze 1hr',
        icon: '/icons/snooze.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('💉 Vaccination Reminder', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'mark-complete') {
    // Handle mark complete action
    event.waitUntil(
      clients.openWindow('/vaccination-dashboard?action=complete&id=' + event.notification.data.primaryKey)
    );
  } else if (event.action === 'snooze') {
    // Handle snooze action
    event.waitUntil(
      clients.openWindow('/vaccination-dashboard?action=snooze&id=' + event.notification.data.primaryKey)
    );
  } else {
    // Default action - open dashboard
    event.waitUntil(
      clients.openWindow('/vaccination-dashboard')
    );
  }
});

// Sync vaccination reminders in background
async function syncVaccinationReminders() {
  try {
    // Check for due reminders
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 5);

    // Get reminders from IndexedDB or localStorage
    const reminders = JSON.parse(localStorage.getItem('vaccination_reminders') || '[]');
    
    // Find due reminders
    const dueReminders = reminders.filter(reminder => {
      if (reminder.status !== 'pending') return false;
      
      const reminderDate = reminder.scheduledDate;
      const reminderTime = reminder.scheduledTime;
      
      // Check if reminder is due today and time has passed
      if (reminderDate === today && reminderTime <= currentTime) {
        return true;
      }
      
      // Check if reminder is overdue
      if (reminderDate < today) {
        return true;
      }
      
      return false;
    });

    // Send notifications for due reminders
    for (const reminder of dueReminders) {
      const isOverdue = reminder.scheduledDate < today;
      const title = isOverdue ? '⚠️ Overdue Vaccination' : '💉 Vaccination Reminder';
      const body = isOverdue 
        ? `${reminder.name} was due on ${new Date(reminder.scheduledDate).toLocaleDateString()}`
        : `${reminder.name} is scheduled for today at ${reminder.scheduledTime}`;

      await self.registration.showNotification(title, {
        body,
        icon: '/favicon.png',
        badge: '/badge.png',
        tag: reminder.id,
        requireInteraction: reminder.priority === 'critical',
        data: { reminderId: reminder.id, isOverdue }
      });
    }

  } catch (error) {
    console.error('Error syncing vaccination reminders:', error);
  }
}

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'vaccination-reminder-check') {
    event.waitUntil(syncVaccinationReminders());
  }
});

// Message handling from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'SCHEDULE_NOTIFICATION') {
    const { reminder, delay } = event.data;
    
    // Schedule notification
    setTimeout(() => {
      self.registration.showNotification('💉 Vaccination Reminder', {
        body: `${reminder.name} is scheduled for ${reminder.scheduledTime}`,
        icon: '/favicon.png',
        badge: '/badge.png',
        tag: reminder.id,
        data: { reminderId: reminder.id }
      });
    }, delay);
  }
});
