import * as Joi from 'joi';

const configSchema = Joi.object({
  DB_NAME: Joi.string().required(),
  DB_PORT: Joi.number().required(),
  DB_PASSWORD: Joi.number().required(),
  DB_USERNAME: Joi.number().required(),
  DB_HOST: Joi.number().required(),
  API_BOT_TOKEN: Joi.string().required(),
});

export default configSchema;
