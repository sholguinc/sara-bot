import * as Joi from 'joi';

const configSchema = Joi.object({
  DB_NAME: Joi.string().required(),
  DB_PORT: Joi.number().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_USERNAME: Joi.string().required(),
  DB_HOST: Joi.string().required(),
  APP_PORT: Joi.number().optional(),
  TZ: Joi.string().optional(),
  API_BOT_TOKEN: Joi.string().required(),
  ADMIN_USER_ID: Joi.string().required(),
  SECURITY_PASSWORD: Joi.number().required(),
});

export default configSchema;
