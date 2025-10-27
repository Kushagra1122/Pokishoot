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
    <div className="relative min-h-screen bg-gradient-to-br from-blue-900 via-purple-800 to-blue-800 p-6 md:p-16">
      {/* Back button */}
      <button
        onClick={() => navigate('/dashboard')}
        className="absolute top-6 left-6 p-3 md:p-4 rounded-full bg-yellow-400 text-blue-900 hover:bg-yellow-300 shadow-md transition-shadow"
      >
        <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
      </button>

      {/* Header */}
      <div className="text-center mb-8">
        <h1
          className="text-3xl md:text-5xl font-extrabold text-yellow-400 mb-4 drop-shadow-lg"
          style={{ fontFamily: 'Press Start 2P, cursive' }}
        >
          Notifications
        </h1>
        {unreadCount > 0 && (
          <p className="text-yellow-200 text-lg">
            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Controls */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex flex-wrap justify-between items-center gap-4 bg-blue-900/30 rounded-lg p-4">
          <div className="flex gap-2">
            <label className="text-yellow-200 font-bold">Filter:</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-1 bg-blue-900 text-yellow-200 border border-yellow-400 rounded"
            >
              <option value="all">All</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
              <option value="battle">Battle</option>
              <option value="pokemon">Pokémon</option>
              <option value="message">Messages</option>
              <option value="system">System</option>
            </select>
          </div>
          
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white font-bold rounded-lg hover:bg-green-400"
            >
              <Check className="w-4 h-4" />
              Mark All Read
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-w-4xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-xl md:text-2xl text-yellow-400 font-bold animate-pulse">
              Loading notifications...
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-xl md:text-2xl text-red-400 font-bold bg-red-900/30 px-6 py-4 rounded-xl text-center">
              {error}
            </div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <div className="text-xl md:text-2xl text-gray-300 font-bold">
                No notifications found
              </div>
              <p className="text-yellow-200 mt-2">
                {filter === 'all' 
                  ? "You're all caught up!" 
                  : `No ${filter} notifications`
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <div
                key={notification._id}
                className={`bg-gradient-to-r from-blue-800/70 to-purple-900/70 backdrop-blur-sm rounded-xl p-6 shadow-2xl border-2 transition-all hover:scale-105 ${
                  notification.read 
                    ? 'border-yellow-400/30 opacity-75' 
                    : 'border-yellow-400 shadow-yellow-400/30'
                } ${getNotificationColor(notification.type)}`}
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
