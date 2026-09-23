import { AppRouter } from './routes/AppRouter';
import { ConfirmDialogProvider } from './components/ui/ConfirmDialog';
import { PWAInstallPrompt } from './components/public/PWAInstallPrompt';
import { CookieConsentBanner } from './components/public/CookieConsentBanner';

function App() {
  return (
    <ConfirmDialogProvider>
      <AppRouter />
      <PWAInstallPrompt />
      <CookieConsentBanner />
    </ConfirmDialogProvider>
  );
}

export default App;
