import BlogHeader from '@/components/BlogHeader';
import BlogFooter from '@/components/BlogFooter';

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
      <BlogHeader />
      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-6">{children}</main>
      <BlogFooter />
    </div>
  );
}
