self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  // Browsers use the OS default sound for Web Push; custom audio is not supported here.
  event.waitUntil(self.registration.showNotification(data.title || 'Kobo Circle', { body: data.body || '', icon: '/icons/icon-192.svg', data: { url: data.url || '/feed' } }));
});
self.addEventListener('notificationclick', (event) => { event.notification.close(); event.waitUntil(clients.openWindow(event.notification.data.url)); });
