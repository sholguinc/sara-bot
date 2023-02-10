import { Injectable } from '@nestjs/common';
import { Scenes } from 'telegraf';

import { CreateFileDto } from './dto/create-file.dto';
import { File } from './scenes/file.scene';

import { getHyphenDate, downloadFile } from 'src/utils';

@Injectable()
export class FilesService {
  create(createFileDto: CreateFileDto) {
    return 'This action adds a new file';
  }

  async getFileName(originalName: string) {
    const words = originalName.split('.');
    words[0] = words[0] + '-' + getHyphenDate();
    return words.join('.');
  }

  async verifyFileType(file: File) {
    // data
    const fileName = file.info['file_name'];
    const arr = fileName.split('.');
    const extension = arr[arr.length - 1];

    const allowedExtensions = ['xls', 'xlsx', 'csv'];

    const allowed = allowedExtensions.includes(extension);

    if (!allowed) {
      throw new Error('Invalid file extension');
    }
  }

  async downloadFile(ctx: Scenes.WizardContext, file: File) {
    // File id
    const fileId = file.info['file_id'];

    // Link Download
    const objectLink = await ctx.telegram.getFileLink(fileId);
    const url = objectLink.href;

    // File Name
    const fileName = file.source;

    // Download
    await downloadFile(fileName, url);
  }

  async verifyData(file: File) {}

  async sendData(file: File) {}
}
