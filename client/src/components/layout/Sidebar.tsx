import { Link, useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  Target,
  Bell,
  BarChart3,
  Settings,
  Zap,
  User
} from 'lucide-react';

const navigationItems = [
  { id: 'dashboard', icon: LayoutDashboard, href: '/' },
  { id: 'tasks', icon: CheckSquare, href: '/tasks' },
  { id: 'calendar', icon: Calendar, href: '/calendar' },
  { id: 'goals', icon: Target, href: '/goals' },
  { id: 'reminders', icon: Bell, href: '/reminders' },
  { id: 'analytics', icon: BarChart3, href: '/analytics' }
];

export function Sidebar() {
  const { t } = useTranslation();
  const [location] = useLocation();
  const { tasks } = useAppStore();
  
  const todayTasksCount = tasks.filter(task => 
    !task.completed && 
    task.dueDate && 
    new Date(task.dueDate).toDateString() === new Date().toDateString()
  ).length;

  return (
    <aside className="hidden lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0 bg-sidebar border-r border-sidebar-border">
      <div className="flex flex-col flex-1 min-h-0">
        {/* Logo/Brand */}
        <div className="flex items-center h-16 px-6 border-b border-sidebar-border">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold text-sidebar-foreground">ProductiFlow</span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-lg group transition-colors",
                  isActive
                    ? "text-sidebar-primary bg-sidebar-accent"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
              >
                <Icon className="w-5 h-5 mr-3" />
                <span>{t(`navigation.${item.id}`)}</span>
                {item.id === 'tasks' && todayTasksCount > 0 && (
                  <span className="ml-auto text-xs bg-sidebar-accent text-sidebar-accent-foreground px-2 py-1 rounded-full">
                    {todayTasksCount}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Divider */}
          <div className="border-t border-sidebar-border my-4"></div>
          
          <Link
            href="/settings"
            className={cn(
              "flex items-center px-3 py-2 text-sm font-medium rounded-lg group transition-colors",
              location === '/settings'
                ? "text-sidebar-primary bg-sidebar-accent"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50"
            )}
          >
            <Settings className="w-5 h-5 mr-3" />
            <span>{t('navigation.settings')}</span>
          </Link>
        </nav>


      </div>
    </aside>
  );
}
