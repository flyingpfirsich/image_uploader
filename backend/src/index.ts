import app from './app.js';
import { config } from './config.js';

// Initialize database (imports trigger creation)
import './db/index.js';

app.listen(config.port, '0.0.0.0', () => {
  console.log(`
╔═══════════════════════════════════════╗
║         druzi server running          ║
╠═══════════════════════════════════════╣
║  Port: ${String(config.port).padEnd(29)}║
║  Uploads: ${config.uploadsDir.slice(-26).padEnd(26)}║
╚═══════════════════════════════════════╝
  `);
});


