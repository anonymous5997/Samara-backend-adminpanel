import { LegalLayout } from '@/components/content/LegalLayout';

export default function Terms() {
  return (
    <LegalLayout
      eyebrow="Legal"
      title="Terms of"
      accent="Service"
      sections={[
        {
          id: 'terms',
          body: (
            <p>
              By using Samara, you agree to our terms regarding purchases,
              accounts, and acceptable use of the platform.
            </p>
          ),
        },
      ]}
    />
  );
}
