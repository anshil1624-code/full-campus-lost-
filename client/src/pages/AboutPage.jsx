import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Search, HelpCircle, MapPin, Clock, Phone, Server, Database, Cloud, RefreshCw, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

const AboutPage = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      
      {/* Header Banner */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-xs font-bold text-blue-700">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          Campus Community Belongings Recovery Portal
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          About the Lost & Found Service
        </h1>
        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
          A modern, full-stack college web application designed to connect students who have lost their belongings with finders and campus administration safely and efficiently.
        </p>
      </div>

      {/* 3-Step Workflow */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-lg">
            1
          </div>
          <h3 className="font-bold text-slate-900 text-base">Report Immediately</h3>
          <p className="text-slate-500 text-xs leading-relaxed">
            Report lost belongings or submit found items in under a minute. Automatic unique Report IDs (e.g. <span className="font-mono text-slate-700 font-semibold">LF-2026-1001</span>) are generated for easy tracking.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
            2
          </div>
          <h3 className="font-bold text-slate-900 text-base">Search & Filter</h3>
          <p className="text-slate-500 text-xs leading-relaxed">
            Students can browse listings filtered by item type, category, status, and campus location. Real-time search instantly queries our persistent database.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg">
            3
          </div>
          <h3 className="font-bold text-slate-900 text-base">Claim & Recover</h3>
          <p className="text-slate-500 text-xs leading-relaxed">
            Initiate a verified claim with proof of ownership. The system transitions the status to <span className="font-semibold text-amber-600">Claim Pending</span> and guides handover at campus safety desks.
          </p>
        </div>
      </div>

      {/* Campus Physical Centers */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-8 rounded-3xl shadow-xl space-y-6">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight">Campus Recovery Desks & Physical Drop-Offs</h2>
          <p className="text-slate-300 text-xs sm:text-sm mt-1">
            Valuable items like laptops, wallets, IDs, and car keys should be turned in to verified campus authorities:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10 space-y-2">
            <div className="flex items-center gap-2 font-bold text-blue-300">
              <MapPin className="w-4 h-4" />
              Central Campus Security HQ
            </div>
            <p className="text-slate-300">Student Center, Ground Floor Room 104</p>
            <div className="flex items-center gap-1.5 text-slate-400">
              <Clock className="w-3.5 h-3.5" /> Open 24/7
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10 space-y-2">
            <div className="flex items-center gap-2 font-bold text-blue-300">
              <MapPin className="w-4 h-4" />
              University Library Helpdesk
            </div>
            <p className="text-slate-300">Main Circulation Desk, 1st Floor</p>
            <div className="flex items-center gap-1.5 text-slate-400">
              <Clock className="w-3.5 h-3.5" /> 8:00 AM – 10:00 PM Mon-Sat
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10 space-y-2">
            <div className="flex items-center gap-2 font-bold text-blue-300">
              <MapPin className="w-4 h-4" />
              Athletic & Recreation Complex
            </div>
            <p className="text-slate-300">Gymnasium Equipment Front Desk</p>
            <div className="flex items-center gap-1.5 text-slate-400">
              <Clock className="w-3.5 h-3.5" /> 6:00 AM – 9:00 PM Daily
            </div>
          </div>
        </div>
      </div>

      {/* Cloud-Ready Architecture Overview */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-6">
        <div>
          <span className="text-xs uppercase tracking-wider font-extrabold text-blue-600">Technical Overview</span>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">Dual-Mode Cloud-Ready Architecture</h2>
          <p className="text-slate-500 text-sm mt-1">
            Engineered to operate seamlessly offline with SQLite in local development, with turnkey migration to Managed PostgreSQL in production.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <Database className="w-4 h-4 text-emerald-600" />
              Local Mode (Zero-Config)
            </div>
            <ul className="text-xs text-slate-600 space-y-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Persistent SQLite database stored in <code className="bg-white px-1.5 py-0.5 rounded border">database/lost_and_found.sqlite</code>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                No cloud credentials, API tokens, or paid subscriptions needed to run
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Automatic database initialization and 8 fictional seed items on startup
              </li>
            </ul>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <Cloud className="w-4 h-4 text-blue-600" />
              Cloud Mode (Enterprise Ready)
            </div>
            <ul className="text-xs text-slate-600 space-y-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                Pluggable database repository supporting Managed PostgreSQL (RDS / Supabase / Neon)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                Docker & Docker Compose containerization with persistent volumes
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                Automatic SQLite fallback if cloud database connection is unavailable
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-2 flex items-center gap-4">
          <Link
            to="/browse"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5"
          >
            Browse Listings <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            to="/post-lost"
            className="px-5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition-all"
          >
            Report a Lost Item
          </Link>
        </div>
      </div>

    </div>
  );
};

export default AboutPage;
