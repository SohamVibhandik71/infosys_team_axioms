import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout.jsx';
import { ProtectedRoute } from '../components/layout/ProtectedRoute.jsx';

import { LoginPage } from '../pages/LoginPage.jsx';
import { RegisterPage } from '../pages/RegisterPage.jsx';
import { DashboardPage } from '../pages/DashboardPage.jsx';
import { MeetingsListPage } from '../pages/MeetingsListPage.jsx';
import { CreateMeetingPage } from '../pages/CreateMeetingPage.jsx';
import { MeetingWorkspacePage } from '../pages/MeetingWorkspacePage.jsx';
import { MeetingComparisonPage } from '../pages/MeetingComparisonPage.jsx';
import { AskMyMeetingsPage } from '../pages/AskMyMeetingsPage.jsx';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected App Routes */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/meetings" element={<MeetingsListPage />} />
        <Route path="/meetings/new" element={<CreateMeetingPage />} />
        <Route path="/meetings/compare" element={<MeetingComparisonPage />} />
        <Route path="/meetings/ask" element={<AskMyMeetingsPage />} />
        <Route path="/meetings/:meetingId" element={<MeetingWorkspacePage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRoutes;
