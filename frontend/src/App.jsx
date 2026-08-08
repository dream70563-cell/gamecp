import { useState } from 'react';
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
import { WorldChatPage } from './pages/WorldChatPage';
import { LoginPage } from './pages/LoginPage';
import { sendServerAction } from './services/api';

export default function App() {
  const {
    status,
    logs,
    worldChat,
    sendCommand,
    sendWorldChat,
    sendPower,
    clearLogs,
    clearWorldChat,
  } = useWebSocket();
  const navigate = useNavigate();

    const [authenticated, setAuthenticated] = useState(
      localStorage.getItem('gamecp_auth') === 'true'
    );


  const handleSendAction = async (action, extraData) => {
    try {
      await sendServerAction(action, extraData);
    } catch (e) {
      alert(`Action error: ${e.message}`);
    }
  };

  if (!authenticated) {
    return (
      <LoginPage
        onLogin={() => {
          localStorage.setItem('gamecp_auth', 'true');
          setAuthenticated(true);
        }}
      />
    );
  }

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
              status={status} 
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
        <Route
            path="/chat"
            element={
              <WorldChatPage
                worldChat={worldChat}
                clearWorldChat={clearWorldChat}
                sendWorldChat={sendWorldChat}
                status={status}
              />
            }
          />
          <Route path="/actions" element={<ActionsPage />} />
      </Routes>
    </MainLayout>
  );
}
