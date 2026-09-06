import React, { useState, useRef, useEffect } from 'react';
import {
  Home, Users, MessageSquare, ShieldCheck, Heart,
  User, LogOut, PlusCircle, Settings, Menu, X, ChevronDown, CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';

export default function Navbar({ currentTab, setTab, onOpenAuth }) {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { id: 'listings', label: 'Housing Listings', icon: Home },
    { id: 'roommates', label: 'Find Roommates', icon: Users },
    { id: 'connections', label: 'Requests', icon: CheckCircle2, authOnly: true },
    { id: 'messages', label: 'Encrypted Chat', icon: MessageSquare, authOnly: true },
    { id: 'crypto-hub', label: 'Security & Crypto Hub', icon: ShieldCheck },
  ];

  return (
    <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & University Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setTab('home')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-sky-400 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-extrabold tracking-tight text-slate-900 flex items-center gap-1.5">
                Campus<span className="text-brand-600">Nest</span>
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-200 uppercase">
                  EduSec
                </span>
              </span>
              <p className="text-[10px] text-slate-500 font-medium leading-none">University Student Housing & Roommate Finder</p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map(item => {
              if (item.authOnly && !isAuthenticated) return null;
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
                  {item.label}
                </button>
              );
            })}

            {isAdmin && (
              <button
                onClick={() => setTab('admin')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition ${
                  currentTab === 'admin'
                    ? 'bg-purple-50 text-purple-700 shadow-sm border border-purple-200'
                    : 'text-purple-600 hover:bg-purple-50/70'
                }`}
              >
                <Settings className="w-4 h-4 text-purple-600" />
                Admin Panel
              </button>
            )}
          </div>

          {/* Right Action Area */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => setTab('create-listing')}
                  className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 transition shadow-sm shadow-brand-600/20"
                >
                  <PlusCircle className="w-4 h-4" />
                  Post Listing
                </button>

                <NotificationDropdown />

                {/* User Menu */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition border border-slate-200/80"
                  >
                    <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-bold font-mono">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <span className="hidden lg:block text-xs font-bold text-slate-800 max-w-[100px] truncate">
                      {user?.name}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white shadow-xl ring-1 ring-black/5 z-50 overflow-hidden border border-slate-100 py-1.5 divide-y divide-slate-100">
                      <div className="px-4 py-2.5">
                        <p className="text-xs font-bold text-slate-900">{user?.name}</p>
                        <p className="text-[11px] text-slate-500 font-mono truncate">{user?.department}</p>
                        <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {user?.role} (2FA Verified)
                        </span>
                      </div>

                      <div className="py-1">
                        <button
                          onClick={() => { setTab('profile'); setUserMenuOpen(false); }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-brand-600 transition"
                        >
                          <User className="w-4 h-4 text-slate-400" />
                          My Student Profile
                        </button>
                        <button
                          onClick={() => { setTab('favourites'); setUserMenuOpen(false); }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-brand-600 transition"
                        >
                          <Heart className="w-4 h-4 text-slate-400" />
                          Saved Listings
                        </button>
                        <button
                          onClick={() => { setTab('create-listing'); setUserMenuOpen(false); }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-brand-600 transition"
                        >
                          <PlusCircle className="w-4 h-4 text-slate-400" />
                          Create Housing Listing
                        </button>
                      </div>

                      <div className="py-1">
                        <button
                          onClick={() => { logout(); setUserMenuOpen(false); setTab('home'); }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
                        >
                          <LogOut className="w-4 h-4 text-rose-500" />
                          Secure Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                >
                  Log In
                </button>
                <button
                  onClick={() => onOpenAuth('register')}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 transition shadow-sm shadow-brand-600/20"
                >
                  Sign Up (.edu)
                </button>
              </div>
            )}

            {/* Mobile menu hamburger */}
            <div className="flex md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg">
          {navItems.map(item => {
            if (item.authOnly && !isAuthenticated) return null;
            return (
              <button
                key={item.id}
                onClick={() => { setTab(item.id); setMobileMenuOpen(false); }}
                className={`w-full text-left px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 ${
                  currentTab === item.id ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
          {isAdmin && (
            <button
              onClick={() => { setTab('admin'); setMobileMenuOpen(false); }}
              className="w-full text-left px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 text-purple-700 bg-purple-50"
            >
              <Settings className="w-4 h-4" />
              Admin Panel
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
