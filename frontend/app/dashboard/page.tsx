import { UserButton } from "@clerk/nextjs";

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-8 text-foreground">
      <div className="mx-auto flex max-w-5xl items-center justify-between border-b pb-5">
        <div>
          <h1 className="font-bold text-2xl tracking-wide">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to Sutra AI</p>
        </div>
        <UserButton />
      </div>
    </main>
  );
}
