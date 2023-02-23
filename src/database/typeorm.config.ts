  import {
  TypeOrmModuleAsyncOptions,
  TypeOrmModuleOptions,
} from '@nestjs/typeorm';
import { ConfigType } from '@nestjs/config';

import config from '../config/config';

export const typeOrmAsyncConfig: TypeOrmModuleAsyncOptions = {
  inject: [config.KEY],
  useFactory: async (
    configService: ConfigType<typeof config>,
  ): Promise<TypeOrmModuleOptions> => {
    const { user, name, port, password, host } = configService.database;
    return {
      type: 'postgres',
      host,
      port: +port,
      username: user,
      password,
      database: name,
      synchronize: false, //false in migrations
      autoLoadEntities: true,
      ssl: true,
    };
  },
};
