import ReactDOM from 'react-dom/client';
import { Buffer } from 'buffer';
import JunkPusherGame from '../components/junk-pusher/JunkPusherGame';
import { RadbroGameShell } from './RadbroGameShell';
import { enableRadbroRuntime, type RadbroGameMetadata } from './bridge';
import '../index.css';

const metadata: RadbroGameMetadata = {
  game: 'sweetardio-coinpusher',
  title: 'Sweetardio Coinpusher',
  objective: 'Drop coins onto the moving shelf and push as many as possible over the edge.',
  hint: 'Aim behind crowded clusters and use Bump when the shelf is packed.',
  controls: ['click the machine to drop', 'Drop button adds a random coin', 'Bump shakes the shelf'],
  viewport: { width: 1280, height: 720, minHeight: 560, maxHeight: 900 },
};

enableRadbroRuntime(metadata.game);
window.Buffer = window.Buffer ?? Buffer;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <RadbroGameShell metadata={metadata}>
    <JunkPusherGame />
  </RadbroGameShell>,
);
