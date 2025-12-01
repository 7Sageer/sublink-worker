import { createApp } from '../app/createApp.jsx';
import { createNodeRuntime } from '../runtime/node.js';
import { startNodeHttpServer } from './nodeHttpServer.js';

const runtime = createNodeRuntime(process.env);
const app = createApp(runtime);
const port = Number(process.env.PORT || 8787);

startNodeHttpServer(app, { port, logger: runtime.logger });
