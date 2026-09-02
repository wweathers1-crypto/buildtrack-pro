import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppShell from './layouts/AppShell';
import DashboardPage from './pages/DashboardPage';
import JobsListPage from './pages/jobs/JobsListPage';
import JobDetailPage from './pages/jobs/JobDetailPage';
import NewJobPage from './pages/jobs/NewJobPage';
import GetPaidPage from './pages/get-paid/GetPaidPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="jobs" element={<JobsListPage />} />
          <Route path="jobs/new" element={<NewJobPage />} />
          <Route path="jobs/:jobId" element={<JobDetailPage />} />
          <Route path="get-paid" element={<GetPaidPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
