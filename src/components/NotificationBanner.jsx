import React, { useEffect, useState } from 'react';
import { API_ROOT_URL } from '../utils/apiService';

function NotificationBanner() {
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    let dismissed = false;
    const show = (next) => {
      if (!dismissed && next?.message) setNotification(next);
    };

    fetch(`${API_ROOT_URL}/api/notifications/recent`)
      .then((response) => response.ok ? response.json() : null)
      .then((data) => show(data?.notifications?.at(-1)))
      .catch(() => {});

    const stream = new EventSource(`${API_ROOT_URL}/api/notifications/stream`);
    stream.addEventListener('notification', (event) => {
      try {
        show(JSON.parse(event.data));
      } catch {
        // Ignore malformed events and keep the existing notification visible.
      }
    });

    return () => {
      dismissed = true;
      stream.close();
    };
  }, []);

  if (!notification) return null;

  return (
    <div className="bg-[#0F172A] text-white px-4 py-3 shadow-md relative z-50 border-b border-[#FFB5B5]/30 animate-fade-in">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 bg-[#FFB5B5] text-[#0F172A] text-[10px] font-black uppercase tracking-wider rounded-full shrink-0">
            {notification.title || 'Update'}
          </span>
          <p className="text-xs sm:text-sm font-semibold text-white/90">
            {notification.message}
          </p>
        </div>

        <button
          onClick={() => setNotification(null)}
          aria-label="Dismiss notification"
          className="text-white/60 hover:text-white text-xs font-bold px-2 py-1 rounded-md transition-colors shrink-0"
        >
          ✕ Dismiss
        </button>
      </div>
    </div>
  );
}

export default NotificationBanner;
