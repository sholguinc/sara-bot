import { registerAs } from '@nestjs/config';

export default registerAs('config', () => {
  return {
    database: {
      name: process.env.DB_NAME,
      port: process.env.DB_PORT,
      password: process.env.DB_PASSWORD,
      user: process.env.DB_USERNAME,
      host: process.env.DB_HOST,
    },
    app: {
      appPort: process.env.APP_PORT,
      timezone: process.env.TZ,
    },
    telegram: {
      apiBotToken: process.env.API_BOT_TOKEN,
      adminUserId: process.env.ADMIN_USER_ID,
      securityPassword: process.env.SECURITY_PASSWORD,
    },
  };
});
