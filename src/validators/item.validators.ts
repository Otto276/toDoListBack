import Joi from 'joi';

export const createItemSchema = Joi.object({
  name: Joi.string().min(1).required(),
  description: Joi.string().optional(),
  completed: Joi.boolean().optional(),
  image: Joi.any().meta({ swaggerType: 'file' }).optional(),
  audio: Joi.any().meta({ swaggerType: 'file' }).optional()
});

export const updateItemSchema = Joi.object({
  name: Joi.string().min(1).optional(),
  description: Joi.string().optional(),
  completed: Joi.boolean().optional(),
  image: Joi.any().meta({ swaggerType: 'file' }).optional(),
  audio: Joi.any().meta({ swaggerType: 'file' }).optional()
});
