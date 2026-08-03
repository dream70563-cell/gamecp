import { Routes, Route, useNavigate } from 'react-router-dom';
import { useWebSocket } from './hooks/useWebSocket';
import { MainLayout } from './components/layout/MainLayout';
import { DashboardPage } from './pages/DashboardPage';
import { ConsolePage } from './pages/ConsolePage';
import { PlayersPage } from './pages/PlayersPage';
import { WorldsPage } from './pages/WorldsPage';
import { FilesPage } from './pages/FilesPage';
import { SettingsPage } from './pages/SettingsPage';
import { ActionsPage } from './pages/ActionsPage';
import { sendServerAction } from './services/api';

export default function App() {
  const { status, logs, sendCommand, sendPower, clearLogs } = useWebSocket();
  const navigate = useNavigate();

  const handleSendAction = async (action, extraData) => {
    try {
      await sendServerAction(action, extraData);
    } catch (e) {
      alert(`Action error: ${e.message}`);
    }
  };

  return (
    <MainLayout status={status} sendPower={sendPower}>
      <Routes>
        <Route 
          path="/" 
          element={
            <DashboardPage 
              status={status} 
              sendPower={sendPower} 
              sendAction={handleSendAction}
              logs={logs}
              onNavigateConsole={() => navigate('/console')}
            />
          } 
        />
        <Route 
          path="/console" 
          element={
            <ConsolePage 
              logs={logs} 
              sendCommand={sendCommand} 
              clearLogs={clearLogs} 
            />
          } 
        />
        <Route 
          path="/players" 
          element={
            <PlayersPage 
              status={status} 
              sendAction={handleSendAction} 
            />
          } 
        />
        <Route path="/worlds" element={<WorldsPage />} />
        <Route path="/files" element={<FilesPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/actions" element={<ActionsPage />} />
      </Routes>
    </MainLayout>
  );
}
