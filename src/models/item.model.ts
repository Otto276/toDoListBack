import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IItem extends Document {
  name: string;
  description?: string;
  imageId?: Types.ObjectId;
  audioId?: Types.ObjectId;
  completed?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const itemSchema = new Schema<IItem>(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: false,
    },
    imageId: {
      type: Schema.Types.ObjectId,
      ref: 'uploads.files',
      required: false,
    },
    audioId: {
      type: Schema.Types.ObjectId,
      ref: 'uploads.files',
      required: false,
    },
    completed: { type: Boolean, default: false } 
  },
  { timestamps: true }
);

export const ItemModel = mongoose.model<IItem>('Item', itemSchema);
