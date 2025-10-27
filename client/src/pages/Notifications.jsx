import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { ArrowLeft, Bell, Check, X, AlertCircle, Trophy, Star, MessageCircle } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

const Notifications = () => {
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!token) return;
      
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/api/notifications`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setNotifications(res.data.notifications || []);
      } catch (err) {
        setError('Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [token]);

  const markAsRead = async (id) => {
    try {
      await axios.put(
        `${API_BASE}/api/notifications/${id}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === id ? { ...notif, read: true } : notif
        )
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await axios.delete(
        `${API_BASE}/api/notifications/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications(prev => prev.filter(notif => notif._id !== id));
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put(
        `${API_BASE}/api/notifications/read-all`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      );
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'battle':
        return <Trophy className="w-5 h-5 text-yellow-400" />;
      case 'pokemon':
        return <Star className="w-5 h-5 text-blue-400" />;
      case 'message':
        return <MessageCircle className="w-5 h-5 text-green-400" />;
      case 'system':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Bell className="w-5 h-5 text-gray-400" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'battle':
        return 'border-yellow-400/30 bg-yellow-400/10';
      case 'pokemon':
        return 'border-blue-400/30 bg-blue-400/10';
      case 'message':
        return 'border-green-400/30 bg-green-400/10';
      case 'system':
        return 'border-red-400/30 bg-red-400/10';
      default:
        return 'border-gray-400/30 bg-gray-400/10';
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notif.read;
    if (filter === 'read') return notif.read;
    return notif.type === filter;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative min-h-screen bg-black p-6 md:p-16" style={{
      backgroundImage: `linear-gradient(#0a0a0a 1px, transparent 1px),
                        linear-gradient(90deg, #0a0a0a 1px, transparent 1px)`,
      backgroundSize: '32px 32px',
      backgroundColor: '#000'
    }}>
      {/* Subtle Animated Background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-20 h-20 bg-yellow-400" style={{
          clipPath: 'polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)',
          filter: 'blur(20px)'
        }}></div>
        <div className="absolute bottom-20 right-20 w-16 h-16 bg-blue-400" style={{
          clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
          filter: 'blur(20px)'
        }}></div>
      </div>

      {/* Back button */}
      <button
        onClick={() => navigate('/dashboard')}
        className="absolute top-6 left-6 p-3 md:p-4 bg-gray-900 border-2 border-yellow-400 text-yellow-400 hover:border-green-400 transition-all"
        style={{ fontFamily: 'monospace' }}
      >
        <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" strokeWidth={3} />
      </button>

      {/* Header */}
      <div className="text-center mb-8">
        <h1
          className="text-4xl md:text-6xl font-black text-yellow-400 mb-4 leading-tight"
          style={{ fontFamily: 'monospace', textShadow: '3px 3px 0 #dc2626, 5px 5px 0 #000' }}
        >
          NOTIFICATIONS
        </h1>
        {unreadCount > 0 && (
          <p className="text-green-400 text-lg font-bold" style={{ fontFamily: 'monospace' }}>
            &gt; {unreadCount} UNREAD{unreadCount !== 1 ? 'S' : ''}
          </p>
        )}
      </div>

      {/* Controls */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex flex-wrap justify-between items-center gap-4 bg-gray-900 border-2 border-gray-700 p-4">
          <div className="flex gap-2 items-center">
            <label className="text-yellow-400 font-bold" style={{ fontFamily: 'monospace' }}>FILTER:</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-1 bg-black text-yellow-400 border-2 border-yellow-400 font-bold"
              style={{ fontFamily: 'monospace' }}
            >
              <option value="all">ALL</option>
              <option value="unread">UNREAD</option>
              <option value="read">READ</option>
              <option value="battle">BATTLE</option>
              <option value="pokemon">POKEMON</option>
              <option value="message">MESSAGES</option>
              <option value="system">SYSTEM</option>
            </select>
          </div>
          
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-black font-bold hover:bg-green-400 border-2 border-green-700"
              style={{ fontFamily: 'monospace', boxShadow: '0 4px 0 #166534' }}
            >
              <Check className="w-4 h-4" strokeWidth={3} />
              MARK ALL READ
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-w-4xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-xl md:text-2xl text-yellow-400 font-bold animate-pulse" style={{ fontFamily: 'monospace' }}>
              LOADING...
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-xl md:text-2xl text-red-400 font-bold bg-red-900 border-4 border-red-500 px-6 py-4 text-center" style={{ fontFamily: 'monospace' }}>
              ⚠ {error}
            </div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Bell className="w-16 h-16 text-gray-600 mx-auto mb-4" strokeWidth={2} />
              <div className="text-xl md:text-2xl text-gray-400 font-bold" style={{ fontFamily: 'monospace' }}>
                NO NOTIFICATIONS
              </div>
              <p className="text-green-400 mt-2 font-bold" style={{ fontFamily: 'monospace' }}>
                {filter === 'all' 
                  ? "ALL CAUGHT UP!"
                  : `NO ${filter.toUpperCase()} NOTIFICATIONS`
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <div
                key={notification._id}
                className={`bg-gray-900 p-6 border-2 transition-all hover:scale-105 ${
                  notification.read 
                    ? 'border-gray-700 opacity-60' 
                    : 'border-yellow-400'
                }`}
                style={{ fontFamily: 'monospace' }}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className={`text-lg font-bold mb-2 ${
                          notification.read ? 'text-yellow-300' : 'text-yellow-400'
                        }`}>
                          {notification.title}
                        </h3>
                        <p className="text-yellow-200 mb-3 leading-relaxed">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-yellow-300">
                          <span className="capitalize">{notification.type}</span>
                          <span>•</span>
                          <span>{new Date(notification.createdAt).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>{new Date(notification.createdAt).toLocaleTimeString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification._id)}
                            className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-400 transition-colors"
                            title="Mark as read"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification._id)}
                          className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-400 transition-colors"
                          title="Delete notification"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
