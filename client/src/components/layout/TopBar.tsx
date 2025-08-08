import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/lib/store';
import { useTheme } from '@/components/ui/ThemeProvider';
import { formatDate } from '@/utils/dateUtils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Menu,
  Plus,
  Globe,
  Sun,
  Moon
} from 'lucide-react';
import { supportedLanguages } from '@/lib/i18n';

interface TopBarProps {
  title: string;
}

export function TopBar({ title }: TopBarProps) {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { setQuickAddOpen, setMobileMenuOpen } = useAppStore();

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <header className="bg-background border-b border-border h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
      <div className="flex items-center space-x-4">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden p-2"
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu className="w-5 h-5" />
        </Button>
        
        <div className="hidden sm:block">
          <h1 className="text-hierarchy-1 text-foreground">{title}</h1>
          <p className="text-hierarchy-small text-muted-foreground">
            {formatDate(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {/* Quick Add Button */}
        <Button
          size="sm"
          className="hidden sm:flex items-center"
          onClick={() => setQuickAddOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          <span>{t('actions.quick_add')}</span>
        </Button>



        {/* Language Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="p-2">
              <Globe className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {supportedLanguages.map((lang) => (
              <DropdownMenuItem
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={lang.code === i18n.language ? 'bg-accent' : ''}
              >
                {lang.nativeName}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme Toggle */}
        <Button variant="ghost" size="sm" className="p-2" onClick={toggleTheme}>
          <Sun className="w-5 h-5 dark:hidden" />
          <Moon className="w-5 h-5 hidden dark:block" />
        </Button>


      </div>
    </header>
  );
}
