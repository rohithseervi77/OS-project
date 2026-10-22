'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Cpu, Terminal, Activity } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { label: 'CONTROL ROOM', href: '/scheduler' },
    { label: 'PROCESS MONITOR', href: '/processes' },
    { label: 'BURST LAB', href: '/predictions' },
    { label: 'BENCHMARKS', href: '/analytics' },
    { label: 'ALGORITHM LAB', href: '/algorithms' },
    { label: 'RESEARCH MODE', href: '/research' },
    { label: 'SETTINGS', href: '/settings' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#21262d] bg-[#0d0f12]/95 backdrop-blur-sm">
      <div className="mx-auto flex h-13 max-w-7xl items-center justify-between px-3 sm:px-6">
        {/* Brand / Compact Technical Wordmark */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="h-6 w-6 rounded-none bg-[#161b22] border border-[#30363d] flex items-center justify-center font-mono font-black text-amber-500 text-xs tracking-tighter group-hover:border-amber-500/60 transition-colors">
            K
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-mono font-bold text-xs tracking-wider text-[#f3f4f6]">
                KERNEL<span className="text-amber-500">//</span>LAB
              </span>
              <span className="text-[9px] font-mono px-1 py-0.2 bg-[#161b22] text-[#8b949e] border border-[#30363d]">
                OS//SIM
              </span>
            </div>
            <span className="text-[9px] font-mono text-[#6e7681] tracking-widest uppercase mt-0.5">
              INTERACTIVE OPERATING SYSTEMS SIMULATOR
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden lg:flex items-center space-x-1 font-mono text-[11px]">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href === '/scheduler' && pathname === '/simulation');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-2.5 py-1 transition-colors border ${
                  isActive
                    ? 'bg-[#161b22] text-amber-400 border-amber-500/50 font-semibold'
                    : 'text-[#8b949e] border-transparent hover:text-[#f3f4f6] hover:bg-[#13171d]'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Status Indicator */}
        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="flex items-center gap-2 px-2 py-0.5 bg-[#161b22] border border-[#30363d]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] text-[#c9d1d9] tracking-wider uppercase font-semibold">
              ● SYSTEM ONLINE
            </span>
          </div>
        </div>
      </div>

      {/* Mobile / Tablet nav row */}
      <div className="lg:hidden flex items-center overflow-x-auto border-t border-[#21262d] px-2 py-1 gap-1 font-mono text-[10px] bg-[#0a0c0e]">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href === '/scheduler' && pathname === '/simulation');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-2 py-0.5 whitespace-nowrap border ${
                isActive
                  ? 'bg-[#161b22] text-amber-400 border-amber-500/50 font-semibold'
                  : 'text-[#8b949e] border-transparent hover:text-[#f3f4f6]'
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
