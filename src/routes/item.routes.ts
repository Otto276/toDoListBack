import { ServerRoute } from '@hapi/hapi';
import { ItemModel } from '../models/item.model';
import { createItemSchema, updateItemSchema } from '../validators/item.validators';
import mongoose from 'mongoose';
import { GridFSBucket, ObjectId } from 'mongodb';
import { Readable } from 'stream';

// Función para subir archivo a GridFS
async function uploadFileToGridFS(fileStream: Readable, filename: string): Promise<ObjectId> {
  const db = mongoose.connection.db;

  if (!db) {
    throw new Error('Database connection not initialized');
  }

  const bucket = new GridFSBucket(db, { bucketName: 'uploads' });

  return new Promise<ObjectId>((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(filename);
    fileStream.pipe(uploadStream);

    uploadStream.on('finish', () => resolve(uploadStream.id as ObjectId));
    uploadStream.on('error', (err) => reject(err));
  });
}

export const itemRoutes: ServerRoute[] = [
  {
    method: 'GET',
    path: '/items',
    handler: async (request, h) => {
      try {
        const items = await ItemModel.find();
        return h.response(items).code(200);
      } catch (error) {
        console.error('Error fetching items:', error);
        return h.response({ error: 'Error fetching items' }).code(500);
      }
    }
  },
  {
    method: 'GET',
    path: '/files/{id}',
    handler: async (request, h) => {
      try {
        const db = mongoose.connection.db;
        if (!db) throw new Error('DB no conectado');

        const bucket = new GridFSBucket(db, { bucketName: 'uploads' });
        const fileId = new mongoose.Types.ObjectId(request.params.id);

        const downloadStream = bucket.openDownloadStream(fileId);

        return h
          .response(downloadStream)
          .type('application/octet-stream')
          .header('Content-Disposition', 'inline');
      } catch (error) {
        return h.response({ error: 'Archivo no encontrado' }).code(404);
      }
    }
  },
  {
    method: 'POST',
    path: '/items',
    options: {
      payload: {
        output: 'stream',
        parse: true,
        multipart: true,
        maxBytes: 10 * 1024 * 1024, // 10 MB
      },
      validate: {
        payload: createItemSchema,
        failAction: (request, h, err) => {
          const message = err?.message || 'Error de validación';
          return h.response({ error: message }).code(400).takeover();
        }
      }
    },
    handler: async (request, h) => {
      const payload = request.payload as any;

      const newItem: any = {
        name: payload.name,
        description: payload.description
      };

      try {
        // Si viene archivo image, se sube a GridFS
        if (payload.image && payload.image._readableState) {
          const imageId = await uploadFileToGridFS(payload.image, payload.image.hapi.filename);
          newItem.imageId = imageId;
        }

        // Si viene archivo audio, se sube a GridFS
        if (payload.audio && payload.audio._readableState) {
          const audioId = await uploadFileToGridFS(payload.audio, payload.audio.hapi.filename);
          newItem.audioId = audioId;
        }

        const createdItem = await ItemModel.create(newItem);
        return h.response(createdItem).code(201);
      } catch (err) {
        console.error('Error al subir archivos:', err);
        return h.response({ error: 'Error al guardar archivos' }).code(500);
      }
    }
  },
  {
    method: 'PUT',
    path: '/items/{id}',
    options: {
      payload: {
        output: 'stream',
        parse: true,
        multipart: true,
        maxBytes: 10 * 1024 * 1024,
      },
      validate: {
        payload: updateItemSchema,
        failAction: (request, h, err) => {
          return h.response({ error: err?.message }).code(400).takeover();
        }
      }
    },
    handler: async (request, h) => {
      const { id } = request.params;
      const payload = request.payload as any;

      const updateData: any = {
        name: payload.name,
        description: payload.description,
        completed: payload.completed === true || payload.completed === 'true'
      };

      try {
        if (payload.image && payload.image._readableState) {
          const imageId = await uploadFileToGridFS(payload.image, payload.image.hapi.filename);
          updateData.imageId = imageId;
        }

        if (payload.audio && payload.audio._readableState) {
          const audioId = await uploadFileToGridFS(payload.audio, payload.audio.hapi.filename);
          updateData.audioId = audioId;
        }
      } catch (err) {
        console.error('Error al subir archivos en PUT:', err);
        return h.response({ error: 'Error al guardar archivos' }).code(500);
      }

      const updated = await ItemModel.findByIdAndUpdate(id, updateData, { new: true });
      if (!updated) {
        return h.response({ error: 'Item not found' }).code(404);
      }

      return updated;
    }
  },
  {
    method: 'DELETE',
    path: '/items/{id}',
    handler: async (request, h) => {
      const { id } = request.params;
      const deleted = await ItemModel.findByIdAndDelete(id);
      if (!deleted) {
        return h.response({ error: 'Item not found' }).code(404);
      }
      return h.response().code(204);
    }
  }
];
