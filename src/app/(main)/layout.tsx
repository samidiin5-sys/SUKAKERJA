import AppShell from '@/components/app-shell'
import { ambilDataShell } from '@/lib/shell-data'

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const data = await ambilDataShell()
  return <AppShell data={data}>{children}</AppShell>
}
