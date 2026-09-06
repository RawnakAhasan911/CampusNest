import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck, UserPlus, CheckCircle, XCircle, MessageSquare, Home } from 'lucide-react';
import { api } from '../services/api';

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function loadNotifications() {
    try {
      const res = await api.getNotifications();
      if (res.success) {
        setNotifications(res.notifications || []);
        const unread = res.notifications.filter(n => !n.read).length;
        setUnreadCount(unread);
      }
    } catch (e) {
      // Ignore if unauthenticated
    }
  }

  async function handleMarkRead(id) {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {}
  }

  async function handleMarkAllRead() {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (e) {}
  }

  function getIcon(type) {
    switch (type) {
      case 'REQUEST_RECEIVED': return <UserPlus className="w-4 h-4 text-sky-600" />;
      case 'REQUEST_ACCEPTED': return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      case 'REQUEST_DECLINED': return <XCircle className="w-4 h-4 text-rose-600" />;
      case 'NEW_MESSAGE': return <MessageSquare className="w-4 h-4 text-indigo-600" />;
      case 'HOUSING_MATCH': return <Home className="w-4 h-4 text-amber-600" />;
      default: return <Bell className="w-4 h-4 text-slate-500" />;
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition focus:outline-none"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 z-50 overflow-hidden border border-slate-100">
          <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700">
                  {unreadCount} new
                </span>
              )}
            </div>
            {notifications.length > 0 && unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-brand-600 hover:text-brand-800 font-semibold flex items-center gap-1 transition"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-400">
                <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                No notifications yet
              </div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif._id}
                  onClick={() => handleMarkRead(notif._id)}
                  className={`p-4 flex items-start gap-3 transition cursor-pointer hover:bg-slate-50 ${
                    !notif.read ? 'bg-sky-50/40' : 'bg-white'
                  }`}
                >
                  <div className="p-2 rounded-xl bg-white shadow-sm border border-slate-100 mt-0.5">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 leading-snug">{notif.title}</p>
                    <p className="text-xs text-slate-600 mt-0.5 break-words line-clamp-2">
                      {notif.message}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1 font-mono">
                      {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • RSA Decrypted
                    </p>
                  </div>
                  {!notif.read && (
                    <span className="w-2 h-2 rounded-full bg-brand-500 self-center" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
