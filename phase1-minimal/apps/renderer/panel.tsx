import React from 'react';
import { createRoot } from 'react-dom/client';
import ChatPanel from './components/ChatPanel';

const container = document.getElementById('panel-root');
if (container) {
  const root = createRoot(container);
  root.render(<ChatPanel />);
}
