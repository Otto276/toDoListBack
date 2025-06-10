import Hapi from '@hapi/hapi';
import mongoose from 'mongoose';

import { itemRoutes } from './routes/item.routes';

const init = async () => {
  await mongoose.connect('mongodb://localhost:27017/todolist');

  if (!mongoose.connection.db) {
    throw new Error('La base de datos aún no está conectada.');
  }

  const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: 'uploads',
  });

  const server = Hapi.server({
    port: 3000,
    host: 'localhost',
    routes: {
      cors: {
        origin: ['http://localhost:4200'],
        additionalHeaders: ['cache-control', 'x-requested-with', 'authorization', 'content-type'],
      },
    },
  });

  server.route(itemRoutes);

  await server.start();
  console.log(`Servidor corriendo en: ${server.info.uri}`);
};

process.on('unhandledRejection', (err) => {
  console.error(err);
  process.exit(1);
});

init();
