import { Injectable } from '@nestjs/common';
import { CreateFileDto } from './dto/create-file.dto';

import { File } from './scenes/file.scene';

@Injectable()
export class FilesService {
  create(createFileDto: CreateFileDto) {
    return 'This action adds a new file';
  }

  async verifyFile(file: File) {}

  async verifyData(file: File) {}

  async sendData(file: File) {}
}
