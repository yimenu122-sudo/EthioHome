import React from 'react';
import { NavLink } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';

interface SidebarItem {
  icon: LucideIcon;
  label: string;
  path: string;
}

export const Sidebar: React.FC<{ items: SidebarItem[]; roleName: string }> = ({ items, roleName }) => {
  return (
    <aside className="w-64 bg-surface border-r border-border h-screen sticky top-0 flex flex-col p-6">
      <div className="mb-10">
        <h1 className="text-2xl font-black text-primary flex items-center gap-2 mb-1">
          <span>🏠</span> EthioHome
        </h1>
        <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 bg-primary/10 text-primary rounded-full">
          {roleName}
        </span>
      </div>

      <nav className="flex-1 flex flex-col gap-1.5">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all
              ${isActive 
                ? 'bg-primary text-white shadow-lg shadow-primary/25' 
                : 'text-text-muted hover:bg-background hover:text-text'}
            `}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};
