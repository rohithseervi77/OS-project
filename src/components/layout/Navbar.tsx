'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Terminal,
  Activity,
  Cpu,
  Layers,
  TrendingUp,
  BarChart2,
  BookOpen,
  Sliders
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { label: 'SIMULATOR', href: '/scheduler' },
    { label: 'PROCESSES', href: '/processes' },
    { label: 'PREDICTIONS', href: '/predictions' },
    { label: 'ANALYTICS', href: '/analytics' },
    { label: 'ALGORITHMS', href: '/algorithms' },
    { label: 'SETTINGS', href: '/settings' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#1c202a] bg-[#0c0e13]/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-3 sm:px-6">
        {/* Brand / Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="h-7 w-7 rounded bg-[#161a23] border border-[#262c3b] flex items-center justify-center font-mono font-black text-amber-500 text-xs tracking-tighter group-hover:border-amber-500/50 transition-colors">
            KL
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-mono font-bold text-sm tracking-wider text-white">
                KERNEL<span className="text-amber-500">//</span>LAB
              </span>
              <span className="text-[9px] font-mono font-semibold px-1 py-0.2 rounded bg-[#171a22] text-[#8e99b0] border border-[#242938]">
                v1.0
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#636d85] tracking-widest uppercase mt-0.5">
              OS SIMULATOR
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center space-x-0.5 font-mono text-xs">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href === '/scheduler' && pathname === '/simulation');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-sm transition-colors border ${
                  isActive
                    ? 'bg-[#181d28] text-amber-400 border-amber-500/40 font-semibold'
                    : 'text-[#8e99b0] border-transparent hover:text-white hover:bg-[#141720]'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Status Indicator */}
        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-[#12151c] border border-[#1e2330]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] text-[#a4b1cd] tracking-wide">
              SYSTEM ONLINE
            </span>
          </div>
        </div>
      </div>

      {/* Mobile nav row */}
      <div className="md:hidden flex items-center overflow-x-auto border-t border-[#181b24] px-2 py-1 gap-1 font-mono text-[11px] bg-[#090b0f]">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href === '/scheduler' && pathname === '/simulation');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-2 py-1 whitespace-nowrap rounded-sm ${
                isActive
                  ? 'bg-[#181d28] text-amber-400 font-semibold'
                  : 'text-[#8e99b0] hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
