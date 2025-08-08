import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { MobileBottomNav } from './MobileBottomNav';
import { QuickAddModal } from '@/components/modals/QuickAddModal';
import { useTranslation } from 'react-i18next';

interface AppLayoutProps {
  children: React.ReactNode;
  title: string;
}

export function AppLayout({ children, title }: AppLayoutProps) {
  const { t } = useTranslation();
  const { initializeApp, isLoading } = useAppStore();

  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">{t('status.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <MobileBottomNav />
      
      {/* Main Content Area */}
      <main className="flex-1 lg:pl-72">
        <TopBar title={title} />
        
        {/* Page Content */}
        <div className="p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8 h-[calc(100vh-4rem)] overflow-y-auto">
          {children}
        </div>
      </main>

      <QuickAddModal />
    </div>
  );
}
