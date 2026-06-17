'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { useUIStore } from '@/stores/ui.store';
import { useNotificationStore } from '@/stores/notification.store';
import { socket } from '@/lib/socket';
import {
  LayoutDashboard,
  Video,
  MessageSquare,
  PenTool,
  Folder,
  Bell,
  User,
  Settings,
  History,
  LogOut,
  Menu,
  X,
  Compass
} from 'lucide-react';
import Logo from '../landing/Logo';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, fetchUser, logout } = useAuthStore();
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useUIStore();
  const { unreadCount, fetchNotifications, addNotification } = useNotificationStore();

  const [mounted, setMounted] = useState(false);
  const touchStartX = useRef<number>(0);
  const touchCurrentX = useRef<number>(0);

  // Set mounted state and default mobile sidebar to closed
  useEffect(() => {
    setMounted(true);
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, [setSidebarOpen]);

  // Lock body scroll when sidebar is open on mobile
  useEffect(() => {
    const updateScrollLock = () => {
      if (sidebarOpen && typeof window !== 'undefined' && window.innerWidth < 768) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    };

    updateScrollLock();
    window.addEventListener('resize', updateScrollLock);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('resize', updateScrollLock);
    };
  }, [sidebarOpen]);

  // Handle Escape key to close menu on mobile
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && sidebarOpen) {
        if (typeof window !== 'undefined' && window.innerWidth < 768) {
          setSidebarOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [sidebarOpen, setSidebarOpen]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchCurrentX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchCurrentX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const deltaX = touchCurrentX.current - touchStartX.current;
    // Swipe left (negative deltaX) to close the left sidebar drawer
    if (deltaX < -60) {
      setSidebarOpen(false);
    }
  };

  const handleNavItemClick = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      fetchUser();
    }
  }, [isAuthenticated, fetchUser]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Handle socket connections upon user authentication
  useEffect(() => {
    if (user) {
      if (!socket.connected) {
        socket.connect();
      }
      
      const userId = user._id;
      // Join private user notifications channel
      socket.emit('user:active', { userId });

      const handleNewNotification = (noti: any) => {
        addNotification(noti);
      };

      socket.on('notification:new', handleNewNotification);

      return () => {
        socket.off('notification:new', handleNewNotification);
      };
    }
  }, [user, addNotification]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated, fetchNotifications]);

  const handleLogout = async () => {
    try {
      socket.disconnect();
      await logout();
      router.push('/');
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-bg-base text-text-primary flex flex-col items-center justify-center">
        <div className="h-10 w-10 border-4 border-accent-primary border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-sm text-text-secondary tracking-widest uppercase">Loading SyncSpace...</p>
      </div>
    );
  }

  const isInMeeting = pathname.startsWith('/meeting/');

  const menuItems = [
    { name: 'Home', icon: <Compass size={18} />, href: '/' },
    { name: 'Dashboard', icon: <LayoutDashboard size={18} />, href: '/dashboard' },
    { name: 'Meetings', icon: <Video size={18} />, href: '/meetings' },
    ...(isInMeeting
      ? [{ name: 'Return to Meeting', icon: <Video size={18} />, href: pathname }]
      : []),
    { name: 'Channels & Chat', icon: <MessageSquare size={18} />, href: '/chat' },
    { name: 'Whiteboard', icon: <PenTool size={18} />, href: '/whiteboard' },
    { name: 'Shared Files', icon: <Folder size={18} />, href: '/files' },
    { name: 'Notifications', icon: <Bell size={18} />, href: '/notifications', badge: unreadCount },
    { name: 'Profile', icon: <User size={18} />, href: '/profile' },
    { name: 'History Logs', icon: <History size={18} />, href: '/history' },
    { name: 'Settings', icon: <Settings size={18} />, href: '/settings' },
  ];

  return (
    <div className="min-h-screen bg-bg-base text-text-primary flex overflow-x-hidden">
      {/* Blurred Backdrop for Mobile Drawer */}
      {mounted && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        id="mobile-sidebar"
        aria-label="Sidebar Navigation"
        className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-border-subtle bg-bg-surface/90 backdrop-blur-lg transform ${
          mounted ? 'transition-transform duration-300' : ''
        } ${
          !mounted
            ? '-translate-x-full md:translate-x-0 pointer-events-none md:pointer-events-auto'
            : sidebarOpen
            ? 'translate-x-0 pointer-events-auto'
            : '-translate-x-full md:-translate-x-64 pointer-events-none'
        }`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-border-subtle">
          <Link href="/dashboard" className="flex items-center" onClick={handleNavItemClick}>
            <Logo size={28} />
          </Link>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-text-secondary hover:text-white p-2 -mr-2 rounded-lg hover:bg-bg-elevated transition-colors cursor-pointer"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-4rem-5rem)]">
          {menuItems.map((item) => {
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={handleNavItemClick}
                className={`flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-medium transition duration-200 ${
                  active
                    ? 'bg-accent-primary/10 border border-accent-primary/30 text-accent-cyan'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span>{item.name}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="h-5 min-w-5 px-1.5 flex items-center justify-center rounded-full bg-accent-primary text-[10px] font-bold text-white shadow-glow-sm">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        {/* User Card & Logout at the bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border-subtle bg-bg-surface/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-full bg-accent-purple/10 flex items-center justify-center text-accent-purple font-bold text-sm border border-accent-purple/35 overflow-hidden">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.displayName} className="h-full w-full object-cover" />
                ) : (
                  user.displayName.charAt(0).toUpperCase()
                )}
              </div>
              <div className="text-left leading-none">
                <p className="text-sm font-semibold text-text-primary max-w-[120px] truncate">{user.displayName}</p>
                <span className="text-[10px] text-text-secondary lowercase">@{user.username}</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-text-secondary hover:text-semantic-error p-2 rounded-xl hover:bg-bg-elevated transition duration-200"
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Panel Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 min-h-screen transition-all duration-300 ${sidebarOpen ? 'pl-0 md:pl-64' : 'pl-0'}`}>
        {/* Header bar */}
        <header className="h-16 border-b border-border-subtle bg-bg-surface/50 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={toggleSidebar}
              className="text-text-secondary hover:text-white p-2 rounded-lg hover:bg-bg-elevated transition-colors cursor-pointer"
              aria-label="Open menu"
              aria-expanded={sidebarOpen}
              aria-controls="mobile-sidebar"
            >
              <Menu size={20} />
            </button>
            <h2 className="text-lg font-semibold tracking-wide text-text-primary capitalize">
              {pathname.split('/').pop() || 'Workspace'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-text-secondary border border-border-subtle px-3 py-1.5 rounded-full bg-bg-elevated/40">
              <div className="h-1.5 w-1.5 rounded-full bg-status-online" />
              <span>Service Connected</span>
            </div>
          </div>
        </header>

        {/* Content viewport */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
