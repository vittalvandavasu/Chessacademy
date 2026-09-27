import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

// Self-bootstrap with tsx loader if executed directly via `node server.ts`
if (!process.env.__TSX_BOOTSTRAPPED__ && !process.execArgv.some(arg => arg.includes('tsx'))) {
  process.env.__TSX_BOOTSTRAPPED__ = 'true';
  const child = spawn(process.execPath, ['--import', 'tsx', fileURLToPath(import.meta.url), ...process.argv.slice(2)], {
    stdio: 'inherit',
    env: process.env,
  });
  child.on('exit', (code, signal) => {
    if (signal) process.kill(process.pid, signal);
    process.exit(code ?? 0);
  });
} else {
  const [
    { default: express },
    { default: path },
    { default: fs },
    { createExpressApp },
    { seedDatabase },
  ] = await Promise.all([
    import('express'),
    import('path'),
    import('fs'),
    import('./src/server/app'),
    import('./src/server/db/seed'),
  ]);

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const isProduction = process.env.NODE_ENV === 'production';
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  async function startServer() {
    const app = createExpressApp();

    // Auto-seed database if needed on startup
    try {
      await seedDatabase();
    } catch (err) {
      console.warn('Initial seed completed or already up to date:', err);
    }

    if (!isProduction) {
      // Vite Dev Middleware Mode
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });

      app.use(vite.middlewares);

      app.use('*', async (req, res, next) => {
        const url = req.originalUrl;
        try {
          let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
          template = await vite.transformIndexHtml(url, template);
          res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
        } catch (e: any) {
          vite.ssrFixStacktrace(e);
          next(e);
        }
      });
    } else {
      // Production Static Serving
      const distPath = path.resolve(__dirname, 'dist');
      app.use(express.static(distPath));

      app.use('*', (_req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[ChessCadet] Full-stack application running at http://0.0.0.0:${PORT}`);
    });
  }

  startServer().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

