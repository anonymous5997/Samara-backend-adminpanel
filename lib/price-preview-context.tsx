'use client';
import { createContext, useContext, useState } from 'react';

type PreviewState = {
  currency?: string;
};

const PricePreviewContext = createContext<{
  preview: PreviewState;
  setPreview: (p: PreviewState) => void;
}>({
  preview: {},
  setPreview: () => {},
});

export function PricePreviewProvider({ children }: { children: React.ReactNode }) {
  const [preview, setPreview] = useState<PreviewState>({});
  return (
    <PricePreviewContext.Provider value={{ preview, setPreview }}>
      {children}
    </PricePreviewContext.Provider>
  );
}

export function usePricePreview() {
  return useContext(PricePreviewContext);
}
