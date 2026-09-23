import { AppRouter } from './routes/AppRouter';
import { ConfirmDialogProvider } from './components/ui/ConfirmDialog';
import { PWAInstallPrompt } from './components/public/PWAInstallPrompt';
import { CookieConsentBanner } from './components/public/CookieConsentBanner';
import { FloatingChatbot } from './components/public/FloatingChatbot';

function App() {
  return (
    <ConfirmDialogProvider>
      <AppRouter />
      <PWAInstallPrompt />
      <CookieConsentBanner />
      <FloatingChatbot />
    </ConfirmDialogProvider>
  );
}

export default App;
