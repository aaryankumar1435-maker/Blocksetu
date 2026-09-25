import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { Dashboard } from './pages/Dashboard'
import { BlockPlanPage } from './pages/BlockPlan/BlockPlanPage'
import { SectionViewPage } from './pages/SectionView/SectionViewPage'
import { BacklogPage } from './pages/Backlog/BacklogPage'
import { PlanControlsPage } from './pages/PlanControls/PlanControlsPage'
import { ApprovalPage } from './pages/Approval/ApprovalPage'
import { TaskDrawerProvider } from './context/TaskDrawerContext'
import { DataProvider } from './context/DataContext'

export default function App() {
  return (
    <DataProvider>
      <TaskDrawerProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppShell />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/plan" element={<BlockPlanPage />} />
              <Route path="/sections" element={<SectionViewPage />} />
              <Route path="/backlog" element={<BacklogPage />} />
              <Route path="/controls" element={<PlanControlsPage />} />
              <Route path="/approval" element={<ApprovalPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TaskDrawerProvider>
    </DataProvider>
  )
}
