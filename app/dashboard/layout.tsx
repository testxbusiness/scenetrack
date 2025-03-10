// app/dashboard/layout.tsx
import { ReactNode } from 'react';
import Sidebar from '@/components/Sidebar';

interface LayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: LayoutProps) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{ width: '250px', borderRight: '1px solid #ccc' }}>
        <Sidebar />
      </aside>
      <main style={{ flex: 1, padding: '1rem' }}>
        {children}
      </main>
    </div>
  );
}
