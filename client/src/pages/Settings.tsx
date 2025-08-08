import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/lib/store';
import { useTheme } from '@/components/ui/ThemeProvider';
import { supportedLanguages } from '@/lib/i18n';
import { dbUtils } from '@/lib/db';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Settings as SettingsIcon,
  Palette,
  Globe,
  Database,
  Download,
  Upload,
  Trash2
} from 'lucide-react';

export function Settings() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { settings, updateSettings } = useAppStore();
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [pinValue, setPinValue] = useState('');

  if (!settings) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-hierarchy-1">{t('settings.title')}</h1>
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme as any);
    updateSettings({ theme: newTheme as any });
  };

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    updateSettings({ language: lang });
  };



  const handleExportData = async () => {
    try {
      const data = await dbUtils.exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `productiflow-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: "Data exported successfully",
      });
      setExportDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export data",
        variant: "destructive",
      });
    }
  };

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      await dbUtils.importData(text);
      
      toast({
        title: "Success",
        description: "Data imported successfully",
      });
      setImportDialogOpen(false);
      
      // Refresh the page to load new data
      window.location.reload();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to import data. Please check the file format.",
        variant: "destructive",
      });
    }
  };

  const handleResetData = async () => {
    try {
      await dbUtils.resetData();
      toast({
        title: "Success",
        description: "All data has been reset",
      });
      setIsResetDialogOpen(false);
      
      // Refresh the page
      window.location.reload();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reset data",
        variant: "destructive",
      });
    }
  };

  const handlePinToggle = (enabled: boolean) => {
    if (enabled && !pinValue) {
      toast({
        title: "Error",
        description: "Please enter a PIN first",
        variant: "destructive",
      });
      return;
    }

    updateSettings({
      security: {
        ...settings.security,
        pinEnabled: enabled,
        pin: enabled ? pinValue : undefined
      }
    });

    if (enabled) {
      toast({
        title: "Success",
        description: "PIN lock enabled",
      });
    } else {
      toast({
        title: "Success",
        description: "PIN lock disabled",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-hierarchy-1">{t('settings.title')}</h1>
        <p className="text-muted-foreground">
          Customize your ProductiFlow experience
        </p>
      </div>

      {/* Appearance Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Palette className="w-5 h-5" />
            <span>{t('settings.appearance')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>{t('settings.theme')}</Label>
            <Select value={theme} onValueChange={handleThemeChange}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">{t('settings.light')}</SelectItem>
                <SelectItem value="dark">{t('settings.dark')}</SelectItem>
                <SelectItem value="system">{t('settings.system')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Language Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="w-5 h-5" />
            <span>{t('settings.language')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>{t('settings.language')}</Label>
            <Select value={i18n.language} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {supportedLanguages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.nativeName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>



      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="w-5 h-5" />
            <span>{t('settings.data')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Export Data */}
            <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center justify-center">
                  <Download className="w-4 h-4 mr-2" />
                  {t('settings.export_data')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Export Data</DialogTitle>
                  <DialogDescription>
                    Download a backup of all your tasks, goals, and settings.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex space-x-3 pt-4">
                  <Button variant="outline" onClick={() => setExportDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleExportData}>
                    Export
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Import Data */}
            <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center justify-center">
                  <Upload className="w-4 h-4 mr-2" />
                  {t('settings.import_data')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Import Data</DialogTitle>
                  <DialogDescription>
                    Upload a backup file to restore your data. This will merge with existing data.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    type="file"
                    accept=".json"
                    onChange={handleImportData}
                  />
                  <div className="flex space-x-3">
                    <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Reset Data */}
            <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" className="flex items-center justify-center">
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t('settings.reset_data')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reset All Data</DialogTitle>
                  <DialogDescription>
                    This will permanently delete all your tasks, goals, reminders, and other data. This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex space-x-3 pt-4">
                  <Button variant="outline" onClick={() => setIsResetDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleResetData}>
                    Reset All Data
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
