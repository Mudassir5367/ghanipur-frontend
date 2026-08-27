import Link from 'next/link';
import { RedirectIfAuthed } from '@/components/auth/RedirectIfAuthed';
import { BrandMark } from '@/components/ui/BrandMark';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <header className="mx-auto w-full max-w-6xl px-6 py-5">
        <Link href="/"><BrandMark /></Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          <RedirectIfAuthed>{children}</RedirectIfAuthed>
        </div>
      </main>
    </div>
  );
}
