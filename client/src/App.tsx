import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { I18nextProvider } from 'react-i18next';
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import { SyncManager } from "@/components/sync/SyncManager";
import { AppLayout } from "@/components/layout/AppLayout";
import i18n from "@/lib/i18n";

// Pages
import { Dashboard } from "@/pages/Dashboard";
import { Tasks } from "@/pages/Tasks";
import { Calendar } from "@/pages/Calendar";
import { Goals } from "@/pages/Goals";
import { Reminders } from "@/pages/Reminders";
import { Analytics } from "@/pages/Analytics";
import { Settings } from "@/pages/Settings";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => (
        <AppLayout title="Dashboard">
          <Dashboard />
        </AppLayout>
      )} />
      <Route path="/tasks" component={() => (
        <AppLayout title="Tasks">
          <Tasks />
        </AppLayout>
      )} />
      <Route path="/calendar" component={() => (
        <AppLayout title="Calendar">
          <Calendar />
        </AppLayout>
      )} />
      <Route path="/goals" component={() => (
        <AppLayout title="Goals">
          <Goals />
        </AppLayout>
      )} />
      <Route path="/reminders" component={() => (
        <AppLayout title="Reminders">
          <Reminders />
        </AppLayout>
      )} />
      <Route path="/analytics" component={() => (
        <AppLayout title="Analytics">
          <Analytics />
        </AppLayout>
      )} />
      <Route path="/settings" component={() => (
        <AppLayout title="Settings">
          <Settings />
        </AppLayout>
      )} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <ThemeProvider defaultTheme="system" storageKey="productiflow-theme">
          <TooltipProvider>
            <SyncManager />
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </I18nextProvider>
    </QueryClientProvider>
  );
}

export default App;
