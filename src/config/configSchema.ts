import * as Joi from 'joi';

const configSchema = Joi.object({
  DB_NAME: Joi.string().required(),
  DB_PORT: Joi.number().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_USERNAME: Joi.string().required(),
  DB_HOST: Joi.string().required(),
  API_BOT_TOKEN: Joi.string().required(),
});

export default configSchema;
