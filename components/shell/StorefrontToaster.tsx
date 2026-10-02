'use client';

import { Toaster } from 'sonner';

/**
 * The single toast container for the storefront (mounted in app/providers.tsx).
 * Admin pages keep their own <Toaster /> from components/ui/sonner.
 */
export function StorefrontToaster() {
  return (
    <Toaster
      theme="dark"
      position="bottom-right"
      toastOptions={{
        unstyled: false,
        classNames: {
          toast:
            '!rounded-none !border !border-samara-line !bg-samara-ink !text-samara-ivory !font-sans !shadow-none',
          title: '!text-[0.8125rem] !font-medium !tracking-wide',
          description: '!text-samara-mute',
          success: '[&_[data-icon]]:!text-samara-gold',
          error: '[&_[data-icon]]:!text-[#D9806B]',
          actionButton: '!rounded-none !bg-samara-gold !text-samara-cream-ink',
          cancelButton: '!rounded-none !bg-samara-char !text-samara-mute',
        },
      }}
    />
  );
}
