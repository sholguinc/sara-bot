import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FilesService } from './files.service';
import { FilesTelegram } from './files.telegram';
import { FileScene } from './scenes/file.scene';
import { File } from './entities/file.entity';

import { CashModule } from '../cash/cash.module';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
  imports: [TypeOrmModule.forFeature([File]), TelegramModule, CashModule],
  providers: [FilesService, FilesTelegram, FileScene],
})
export class FilesModule {}
