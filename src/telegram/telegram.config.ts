import {
  TelegrafModuleOptions,
  TelegrafModuleAsyncOptions,
} from 'nestjs-telegraf';
import { ConfigType } from '@nestjs/config';
import { session } from 'telegraf';
import { AuthMiddleware } from '../auth/auth.middleware';

import config from '../config/config';

export const telegramAsyncConfig: TelegrafModuleAsyncOptions = {
  inject: [config.KEY],
  useFactory: async (
    configService: ConfigType<typeof config>,
  ): Promise<TelegrafModuleOptions> => {
    const { apiBotToken } = configService.telegram;
    return {
      token: apiBotToken,
      middlewares: [AuthMiddleware, session()],
    };
  },
};
