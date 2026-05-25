import { getServerSession } from 'next-auth';
import { authOptions, ADMIN_EMAIL } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import Sidebar from '@/components/admin/Sidebar';
import TopBar from '@/components/admin/TopBar';
import { Toaster } from 'react-hot-toast';

export const metadata = {
  title: 'DevBlog Admin - Headless CMS',
  description: 'Manage blog posts, media assets, curation feeds, settings, and analytics.',
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  
  // Inspect header to determine if we are rendering the login page
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '';
  const isLoginPage = pathname === '/admin/login';

  // Session guard for all admin pages except the login page
  if (!isLoginPage) {
    if (!session || session.user?.email !== ADMIN_EMAIL) {
      redirect('/admin/login');
    }
  }

  // If rendering the login page, bypass layout chrome
  if (isLoginPage) {
    return (
      <div className="bg-slate-50 text-slate-900 min-h-screen font-sans antialiased overflow-hidden ambient-bg-light relative flex items-center justify-center">
        {/* 3D/4D/7D Ambient Glowing Blobs */}
        <div className="absolute top-[5%] left-[10%] w-[400px] h-[400px] bg-violet-400/10 rounded-full blur-[100px] pointer-events-none animate-pulse" style={{ animationDuration: '9s' }} />
        <div className="absolute bottom-[10%] right-[10%] w-[450px] h-[450px] bg-emerald-400/8 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '13s' }} />
        
        <div className="relative z-10 w-full flex items-center justify-center">
          {children}
        </div>
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#ffffff',
              color: '#0f172a',
              border: '1px solid rgba(0, 0, 0, 0.06)',
              fontFamily: 'var(--font-outfit), sans-serif',
              borderRadius: '12px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
            },
          }}
        />
      </div>
    );
  }

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen font-sans antialiased flex overflow-hidden ambient-bg-light relative">
      
      {/* 3D/4D/7D Ambient Glowing Blobs for background depth */}
      <div className="absolute top-[10%] left-[20%] w-[350px] h-[350px] bg-violet-400/10 rounded-full blur-[100px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-[15%] right-[15%] w-[400px] h-[400px] bg-emerald-400/8 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '12s' }} />
      <div className="absolute top-[40%] right-[30%] w-[300px] h-[300px] bg-amber-400/8 rounded-full blur-[90px] pointer-events-none animate-pulse" style={{ animationDuration: '10s' }} />
      
      {/* 260px wide Fixed Left Navigation */}
      <div className="relative z-10 flex shrink-0">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
        {/* Sticky Top Bar (Breadcrumbs, Search, Actions) */}
        <TopBar />

        {/* Scrollable Viewport Container */}
        <main className="flex-grow overflow-y-auto px-8 py-6 custom-scrollbar">
          {children}
        </main>
      </div>

      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#ffffff',
            color: '#0f172a',
            border: '1px solid rgba(0, 0, 0, 0.06)',
            fontFamily: 'var(--font-outfit), sans-serif',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
          },
        }}
      />
    </div>
  );
}
