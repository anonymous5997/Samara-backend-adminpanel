import { LegalLayout } from '@/components/content/LegalLayout';

export default function PrivacyPolicy() {
  return (
    <LegalLayout
      eyebrow="Legal"
      title="Privacy"
      accent="Policy"
      sections={[
        {
          id: 'privacy',
          body: (
            <>
              <p>
                Samara respects your privacy. This policy explains how we collect,
                use, and protect your information when you use our website and services.
              </p>

              <p>
                We use authentication providers such as Google and Facebook for sign-in,
                and store user profile and order-related data securely.
              </p>

              <p>
                Contact us at{' '}
                <a
                  href="mailto:support@samaracreations.com"
                  className="text-samara-gold-deep underline decoration-samara-gold/50 underline-offset-4 transition-colors hover:text-samara-cream-ink"
                >
                  support@samaracreations.com
                </a>{' '}
                for privacy-related questions.
              </p>
            </>
          ),
        },
      ]}
    />
  );
}
