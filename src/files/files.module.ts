import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FilesService } from './files.service';
import { UploadScene } from './scenes/upload.scene';
import { FilesScene } from './scenes/files.scene';
import { File } from './entities/file.entity';

import { CashModule } from '../cash/cash.module';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
  imports: [TypeOrmModule.forFeature([File]), TelegramModule, CashModule],
  providers: [FilesService, UploadScene, FilesScene],
})
export class FilesModule {}
