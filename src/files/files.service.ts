import { Injectable } from '@nestjs/common';
import { Scenes } from 'telegraf';
import { readFileSync } from 'fs';
import { parse } from 'papaparse';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { BaseTelegram } from '../telegram/base.telegram';
import { ExpensesService } from '../cash/services/expenses.service';

import { File } from './scenes/file.scene';
import { File as FileEntity } from './entities/file.entity';
import { CreateFileDto } from './dto/create-file.dto';
import { CreateExpenseDto, validateExpense } from '../cash/dto/expense.dto';

import { getHyphenDate, downloadFile, deleteFile } from 'src/utils';

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(FileEntity)
    private readonly fileRepository: Repository<FileEntity>,
    private readonly baseTelegram: BaseTelegram,
    private readonly expensesService: ExpensesService,
  ) {}

  async createFile(createFileDto: CreateFileDto) {
    const file = this.fileRepository.create(createFileDto);
    await this.fileRepository.save(file);
    return file;
  }

  async createFileFromTelegram(file: File) {
    await this.createFile({
      name: file.source,
      total: file.total,
    });
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
      // Validate
      const rowErrors = validateExpense(row);

      if (rowErrors.length > 0) {
        errors.push(JSON.stringify(row));
      }
    });

    return errors;
  }

  getTotal(data: CreateExpenseDto[]) {
    const initialValue = 0;
    return data.reduce((total, currentValue) => {
      return total + currentValue.amount;
    }, initialValue);
  }

  async sendData(data: CreateExpenseDto[]) {
    // Create expenses
    await this.expensesService.createExpenses(data);
  }

  deleteFile() {
    deleteFile();
  }
}
