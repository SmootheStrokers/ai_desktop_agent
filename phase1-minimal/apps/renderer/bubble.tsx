import React from 'react';
import { createRoot } from 'react-dom/client';
import Bubble from './components/Bubble';

const container = document.getElementById('bubble-root');
if (container) {
  const root = createRoot(container);
  root.render(<Bubble />);
}
