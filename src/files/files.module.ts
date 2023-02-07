import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { FilesTelegram } from './files.telegram';

import { TelegramModule } from '../telegram/telegram.module';
import { FileScene } from './scenes/file.scene';

@Module({
  imports: [TelegramModule],
  providers: [FilesService, FilesTelegram, FileScene],
})
export class FilesModule {}
