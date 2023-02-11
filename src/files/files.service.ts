import { Injectable } from '@nestjs/common';
import { Scenes } from 'telegraf';
import { readFileSync } from 'fs';
import { parse } from 'papaparse';
import { validateSync } from 'class-validator';
import { plainToInstance } from 'class-transformer';

import { BaseTelegram } from '../telegram/base.telegram';

import { CreateFileDto } from './dto/create-file.dto';
import { CreateExpenseDto } from '../cash/dto/expense.dto';
import { File } from './scenes/file.scene';

import { getHyphenDate, downloadFile } from 'src/utils';

@Injectable()
export class FilesService {
  constructor(private readonly baseTelegram: BaseTelegram) {}

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

    const allowedExtensions = ['csv'];

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

  parseData(ctx: Scenes.WizardContext, file: File) {
    try {
      // File
      const csvFile = readFileSync(`./static/${file.source}`);

      // Data
      const csvData = csvFile.toString();
      const csvParsed = [];

      // Parsing
      parse(csvData, {
        header: true,
        skipEmptyLines: 'greedy',
        delimiter: ',',
        dynamicTyping: true,
        step: (result) => {
          // Data
          const row = result.data;

          // Remove Blank Columns
          delete row[''];

          // Save
          csvParsed.push(row);
        },
      });

      return csvParsed;
    } catch {
      this.baseTelegram.errorMessage(ctx, 'Data is not valid');
      ctx.scene.leave();
    }
  }

  verifyData(ctx: Scenes.WizardContext, data: any[]): string[] {
    // error
    const errors = [];

    data.forEach((row) => {
      // Instance
      const toValidate = plainToInstance(CreateExpenseDto, row);
      const rowErrors = validateSync(toValidate);

      if (rowErrors.length > 0) {
        errors.push(JSON.stringify(row));
      }
    });

    return errors;
  }

  async sendData(data: CreateExpenseDto[]) {
    
  }
}
