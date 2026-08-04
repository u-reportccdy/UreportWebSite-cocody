import { AppRouter } from './routes/AppRouter';
import { ConfirmDialogProvider } from './components/ui/ConfirmDialog';
import { PWAInstallPrompt } from './components/public/PWAInstallPrompt';

function App() {
  return (
    <ConfirmDialogProvider>
      <AppRouter />
      <PWAInstallPrompt />
    </ConfirmDialogProvider>
  );
}

export default App;
