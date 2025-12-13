// components/AutoCurrencyClient.tsx
'use client';

import React, { useEffect } from 'react';
import { useAutoCurrency } from '@/hooks/useAutoCurrency';

/**
 * Small client-only component that runs the auto-currency detection hook.
 * It renders nothing (returns null) — it only triggers the hook on the client.
 */
export default function AutoCurrencyClient(): null {
  useAutoCurrency();
  return null;
}
