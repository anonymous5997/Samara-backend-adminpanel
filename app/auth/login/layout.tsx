// app/auth/layout.tsx

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-samara-black lg:min-h-[calc(100svh-var(--sm-header-h))]">
      {children}
    </div>
  );
}
