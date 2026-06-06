import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { PATHS } from './paths';

// Layouts and Pages routing config
import { PublicLayout } from '../layouts/PublicLayout';
import { AdminLayout } from '../layouts/AdminLayout';
import { SuperAdminLayout } from '../layouts/SuperAdminLayout';

import { Home } from '../pages/public/Home';
import { Articles as PublicArticles } from '../pages/public/Articles';
import { Events as PublicEvents } from '../pages/public/Events';
import { Gallery as PublicGallery } from '../pages/public/Gallery';
import { About } from '../pages/public/About';
import { ArticleDetail } from '../pages/public/ArticleDetail';
import { EventDetail } from '../pages/public/EventDetail';
import { CotisationPayment } from '../pages/public/CotisationPayment';
import { MemberProfile } from '../pages/public/MemberProfile';
import { EventCheckIn } from '../pages/public/EventCheckIn';

// Pages Admin
import { Dashboard } from '../pages/admin/Dashboard';
import { Articles as AdminArticles } from '../pages/admin/Articles';
import { Events as AdminEvents } from '../pages/admin/Events';
import { Inscriptions as AdminInscriptions } from '../pages/admin/Inscriptions';
import { MemberSearch } from '../pages/admin/MemberSearch';
import { Team } from '../pages/admin/Team';
import { Stats } from '../pages/admin/Stats';
import { Gallery as AdminGallery } from '../pages/admin/Gallery';
import { Partners as AdminPartners } from '../pages/admin/Partners';
import { Testimonials as AdminTestimonials } from '../pages/admin/Testimonials';
import { Newsletter as AdminNewsletter } from '../pages/admin/Newsletter';
import { Settings as AdminSettings } from '../pages/admin/Settings';
import { Logistics } from '../pages/admin/Logistics';
import { Tasks } from '../pages/admin/Tasks';
import { Reports } from '../pages/admin/Reports';

import { Login as AdminLogin } from '../pages/admin/Login';
import { AdminGuard } from './AdminGuard';
import { SuperAdminGuard } from './SuperAdminGuard';
import { SuperAdmin } from '../pages/admin/SuperAdmin';
import { SuperAdminLogin } from '../pages/admin/SuperAdminLogin';

const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: PATHS.PUBLIC.ARTICLES, element: <PublicArticles /> },
      { path: PATHS.PUBLIC.EVENTS, element: <PublicEvents /> },
      { path: PATHS.PUBLIC.GALLERY, element: <PublicGallery /> },
      { path: PATHS.PUBLIC.CONTRIBUTION_PAYMENT, element: <CotisationPayment /> },
      { path: PATHS.PUBLIC.MEMBER_PROFILE, element: <MemberProfile /> },
      { path: PATHS.PUBLIC.ABOUT, element: <About /> },
      { path: '/articles/:id', element: <ArticleDetail /> },
      { path: '/events/:id', element: <EventDetail /> },
      { path: '/events/:id/checkin', element: <EventCheckIn /> },
    ]
  },
  {
    path: '/superadmin',
    element: <SuperAdminGuard />,
    children: [
      {
        element: <SuperAdminLayout />,
        children: [{ index: true, element: <SuperAdmin /> }],
      },
    ],
  },
  {
    path: '/superadmin/login',
    element: <SuperAdminLogin />
  },
  {
    path: '/admin/login',
    element: <AdminLogin />
  },
  {
    path: '/admin',
    element: <AdminGuard />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: <Dashboard /> },
          { path: PATHS.ADMIN.ARTICLES, element: <AdminArticles /> },
          { path: PATHS.ADMIN.EVENTS, element: <AdminEvents /> },
          { path: PATHS.ADMIN.INSCRIPTIONS, element: <AdminInscriptions /> },
          { path: PATHS.ADMIN.MEMBER_SEARCH, element: <MemberSearch /> },
          { path: PATHS.ADMIN.TEAM, element: <Team /> },
          { path: PATHS.ADMIN.STATS, element: <Stats /> },
          { path: PATHS.ADMIN.GALLERY, element: <AdminGallery /> },
          { path: PATHS.ADMIN.PARTNERS, element: <AdminPartners /> },
          { path: PATHS.ADMIN.TESTIMONIALS, element: <AdminTestimonials /> },
          { path: PATHS.ADMIN.NEWSLETTER, element: <AdminNewsletter /> },
          { path: PATHS.ADMIN.SETTINGS, element: <AdminSettings /> },
          { path: PATHS.ADMIN.LOGISTICS, element: <Logistics /> },
          { path: PATHS.ADMIN.TASKS, element: <Tasks /> },
          { path: PATHS.ADMIN.REPORTS, element: <Reports /> },
        ]
      }
    ]
  },
  {
    path: '*',
    element: <Navigate to="/" replace />
  }
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
