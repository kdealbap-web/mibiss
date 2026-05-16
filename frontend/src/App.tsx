import { AppRouter } from './router';
import { FlowDrawerProvider } from './context/FlowDrawer';

export function App() {
  return (
    <FlowDrawerProvider>
      <AppRouter />
    </FlowDrawerProvider>
  );
}
