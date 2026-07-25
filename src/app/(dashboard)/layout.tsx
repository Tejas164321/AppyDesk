import { AuthGuard } from "@/features/auth/auth-guard";
import { CapsuleNav } from "@/components/ui/capsule-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col bg-[var(--bg)]">
        <CapsuleNav />
        <main className="flex-1 pt-24 pb-16 px-4 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
