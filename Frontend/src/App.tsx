
import { Routes, Route } from 'react-router-dom';
import LoginRegister from './LoginRegister';
import ChatScreen from './ChatScreen';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginRegister />} />
      <Route path="/chat" element={<ChatScreen />} />
    </Routes>
  );
}

export default App;
