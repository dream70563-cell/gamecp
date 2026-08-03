import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function MainLayout({ children, status, sendPower }) {
  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 antialiased overflow-hidden selection:bg-blue-600/30 selection:text-blue-200">
      <Sidebar status={status} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header status={status} sendPower={sendPower} />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
