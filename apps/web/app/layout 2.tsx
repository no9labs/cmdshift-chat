import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CmdShift Chat",
  description: "AI chat platform with unlimited conversations",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <style
          dangerouslySetInnerHTML={{
            __html: `
              :root {
                ${geistSans.variable}: ${geistSans.style.fontFamily};
                ${geistMono.variable}: ${geistMono.style.fontFamily};
              }
            `,
          }}
        />
        <div className="min-h-screen flex flex-col">
          <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center justify-between">
              <Link href="/" className="font-bold text-lg">
                CmdShift
              </Link>
              <nav className="flex items-center gap-4">
                {user ? (
                  <>
                    <span className="text-sm text-muted-foreground">{user.email}</span>
                    <form action="/auth/signout" method="post">
                      <button className="text-sm font-medium hover:underline">
                        Sign out
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="text-sm font-medium hover:underline">
                      Sign in
                    </Link>
                    <Link href="/signup" className="text-sm font-medium bg-primary text-primary-foreground px-3 py-1 rounded-md hover:bg-primary/90">
                      Sign up
                    </Link>
                  </>
                )}
              </nav>
            </div>
          </header>
          <main className="flex-1">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}