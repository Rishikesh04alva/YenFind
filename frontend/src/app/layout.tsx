import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import EduAuthModal from '../components/EduAuthModal';
import MatchToast from '../components/MatchToast';
import CookieConsentModal from '../components/CookieConsentModal';

export const metadata: Metadata = {
  title: 'Yenfind | Yenepoya Campus Lost & Found',
  description:
    'Yenfind - Interactive Yenepoya Campus Lost & Found Hub with real-time match alerts and EXIF privacy sanitization. Made by Rishikesh.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 min-h-screen flex flex-col antialiased selection:bg-sky-500 selection:text-white">
        <AuthProvider>
          <CookieConsentModal />
          <MatchToast />
          <EduAuthModal />
          <div className="flex-1 flex flex-col">{children}</div>
          <footer className="border-t border-slate-200 bg-white py-6 mt-16 text-center text-xs text-slate-500">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                <span>Yenfind Security Guard: All image uploads automatically scrubbed of EXIF GPS metadata.</span>
              </p>
              <p className="text-slate-500 font-medium">
                Yenfind • <span className="font-bold text-indigo-600">Made by Rishikesh</span>
              </p>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
