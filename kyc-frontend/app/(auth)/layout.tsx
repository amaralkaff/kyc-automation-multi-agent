export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth pages don't use the sidebar layout
  return <>{children}</>;
}
