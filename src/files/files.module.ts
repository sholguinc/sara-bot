import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FilesService } from './services/files.service';
import { RestoreService } from './services/restore.service';

import { UploadScene } from './scenes/upload.scene';
import { FilesScene } from './scenes/files.scene';
import { DataScene } from './scenes/data.scene';
import { RestoreScene } from './scenes/restore.scene';
import { File } from './entities/file.entity';

import { CashModule } from '../cash/cash.module';
import { TelegramModule } from '../telegram/telegram.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([File]),
    TelegramModule,
    CashModule,
    UsersModule,
  ],
  providers: [
    FilesService,
    RestoreService,
    UploadScene,
    FilesScene,
    DataScene,
    RestoreScene,
  ],
})
export class FilesModule {}
