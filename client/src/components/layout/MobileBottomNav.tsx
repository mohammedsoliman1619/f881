import { Link, useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  Target,
  Settings
} from 'lucide-react';

const navigationItems = [
  { id: 'dashboard', icon: LayoutDashboard, href: '/', label: 'Home' },
  { id: 'tasks', icon: CheckSquare, href: '/tasks', label: 'Tasks' },
  { id: 'calendar', icon: Calendar, href: '/calendar', label: 'Calendar' },
  { id: 'goals', icon: Target, href: '/goals', label: 'Goals' },
  { id: 'settings', icon: Settings, href: '/settings', label: 'More' }
];

export function MobileBottomNav() {
  const { t } = useTranslation();
  const [location] = useLocation();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
      <div className="grid grid-cols-5 h-16">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          
          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center space-y-1 transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
