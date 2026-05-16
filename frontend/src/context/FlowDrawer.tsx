import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { Drawer } from '../components/ui/Drawer';
import { FlowReportar } from '../components/flows/FlowReportar';
import { FlowTestimonio } from '../components/flows/FlowTestimonio';
import { FlowApadrinar } from '../components/flows/FlowApadrinar';
import { FlowIngresar } from '../components/flows/FlowIngresar';

export type FlowName = 'reportar' | 'testimonio' | 'apadrinar' | 'ingresar';

export interface FlowMeta {
  casoId?: string;
  casoFolio?: string;
  casoTitulo?: string;
  capituloId?: string;
  capituloSlug?: string;
  barrioId?: number;
  /** Pre-llena el campo email en FlowIngresar paso 1. */
  prefillEmail?: string;
}

interface FlowDrawerContextValue {
  activeFlow: FlowName | null;
  meta: FlowMeta;
  openFlow: (name: FlowName, meta?: FlowMeta) => void;
  closeFlow: () => void;
}

const FlowDrawerContext = createContext<FlowDrawerContextValue | null>(null);

export function useFlowDrawer(): FlowDrawerContextValue {
  const ctx = useContext(FlowDrawerContext);
  if (!ctx) {
    throw new Error('useFlowDrawer debe usarse dentro de <FlowDrawerProvider>');
  }
  return ctx;
}

export function FlowDrawerProvider({ children }: { children: ReactNode }) {
  const [activeFlow, setActiveFlow] = useState<FlowName | null>(null);
  const [meta, setMeta] = useState<FlowMeta>({});

  const openFlow = useCallback((name: FlowName, m: FlowMeta = {}) => {
    setActiveFlow(name);
    setMeta(m);
  }, []);

  const closeFlow = useCallback(() => {
    setActiveFlow(null);
    setMeta({});
  }, []);

  const value = useMemo(
    () => ({ activeFlow, meta, openFlow, closeFlow }),
    [activeFlow, meta, openFlow, closeFlow],
  );

  const flowLabel: Record<FlowName, string> = {
    reportar: 'Reportar caso',
    testimonio: 'Sumar testimonio',
    apadrinar: 'Apadrinar causa',
    ingresar: 'Ingresar a BISS',
  };

  return (
    <FlowDrawerContext.Provider value={value}>
      {children}
      <Drawer
        open={activeFlow !== null}
        onClose={closeFlow}
        ariaLabel={activeFlow ? flowLabel[activeFlow] : undefined}
      >
        {activeFlow === 'reportar' && <FlowReportar />}
        {activeFlow === 'testimonio' && <FlowTestimonio />}
        {activeFlow === 'apadrinar' && <FlowApadrinar />}
        {activeFlow === 'ingresar' && <FlowIngresar />}
      </Drawer>
    </FlowDrawerContext.Provider>
  );
}
