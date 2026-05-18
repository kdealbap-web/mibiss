import { AppRouter } from './router';
import { FlowDrawerProvider } from './context/FlowDrawer';
import { useTrackPageview } from './hooks/useTrackPageview';

function PageviewTracker() {
  useTrackPageview();
  return null;
}

export function App() {
  return (
    <FlowDrawerProvider>
      <PageviewTracker />
      <AppRouter />
    </FlowDrawerProvider>
  );
}
