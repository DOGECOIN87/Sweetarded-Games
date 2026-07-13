import ReactDOM from 'react-dom/client';
import { Buffer } from 'buffer';
import SkillGame from '../components/slots/SkillGame';
import { RadbroGameShell } from './RadbroGameShell';
import { enableRadbroRuntime, gameAsset, type RadbroGameMetadata } from './bridge';
import '../index.css';

const metadata: RadbroGameMetadata = {
  game: 'sweetardio-slots',
  title: 'Sweetardio Slots',
  objective: 'Place the wild tile to complete the best matching line and build your score.',
  hint: 'Preview a level before playing, then place the wild where it completes a line.',
  controls: ['click Play to spin', 'click a cell to place WILD', 'click levels to change wager'],
  viewport: { width: 1280, height: 800, minHeight: 620, maxHeight: 900 },
};

enableRadbroRuntime(metadata.game);
window.Buffer = window.Buffer ?? Buffer;
document.documentElement.style.setProperty('--sweetardio-games-bg', `url("${gameAsset('games-bg.png')}")`);
document.documentElement.style.setProperty('--sweetardio-logo-bg', `url("${gameAsset('sweetardios-logo.svg')}")`);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <RadbroGameShell metadata={metadata}>
    <div className="h-full overflow-auto bg-gradient-to-b from-gray-900 via-gray-800 to-black">
      <SkillGame />
    </div>
  </RadbroGameShell>,
);
