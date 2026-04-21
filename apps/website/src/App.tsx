import { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';

const AppsShowcasePage = lazy(() => import('./pages/AppsShowcasePage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const NovelDetailPage = lazy(() => import('./pages/NovelDetailPage'));
const NovelsPage = lazy(() => import('./pages/NovelsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const WritingPage = lazy(() => import('./pages/WritingPage'));

function RouteSkeleton() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#030712_0%,#08111f_100%)] pt-28">
      <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="glass-card rounded-[32px] p-8 sm:p-10">
          <div className="h-4 w-28 rounded-full bg-sky-200/20" />
          <div className="mt-5 h-10 w-2/3 rounded-full bg-slate-700/60" />
          <div className="mt-4 h-4 w-full rounded-full bg-slate-800/80" />
          <div className="mt-3 h-4 w-5/6 rounded-full bg-slate-800/80" />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-[24px] border border-white/70 bg-white/80 p-6 shadow-sm">
                <div className="h-5 w-24 rounded-full bg-sky-200/20" />
                <div className="mt-4 h-6 w-3/4 rounded-full bg-slate-700/60" />
                <div className="mt-3 h-4 w-full rounded-full bg-slate-800/80" />
                <div className="mt-2 h-4 w-4/5 rounded-full bg-slate-800/80" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Suspense fallback={<RouteSkeleton />}>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/home/" element={<HomePage />} />
            <Route path="/showcase" element={<AppsShowcasePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/novels" element={<NovelsPage />} />
            <Route path="/novels/:id" element={<NovelDetailPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/writing" element={<WritingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
