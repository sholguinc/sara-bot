import { Injectable } from '@nestjs/common';
import { Scenes } from 'telegraf';
import { readFileSync } from 'fs';
import { parse } from 'papaparse';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

import { BaseTelegram } from '../../telegram/base.telegram';
import { ExpensesService } from '../../cash/services/expenses.service';

import { File } from '../scenes/upload.scene';
import { File as FileEntity } from '../entities/file.entity';

import { CreateFileDto } from '../dto/create-file.dto';
import { CreateExpenseDto } from '../../cash/dto/expense.dto';

import { PAGE_LIMIT } from '../../config/constants';
import { currentTime, deleteFile, downloadFile, getTimestamp } from 'src/utils';

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

  async createFiles(createFiles: CreateFileDto[]) {
    const files = this.fileRepository.create(createFiles);
    await this.fileRepository.save(files);
    return files;
  }

  async createFileFromTelegram(file: File) {
    return await this.createFile({
      name: file.source,
      total: file.total,
    });
  }

  async findAll() {
    const [files, total] = await this.fileRepository.findAndCount({
      take: PAGE_LIMIT,
      skip: 0,
      order: {
        timestamp: 'DESC',
      },
    });

    return { files, total };
  }

  async findByName(name: string) {
    return await this.fileRepository.findOneBy({ name });
  }

  getFileName(originalName: string) {
    const datetime = currentTime();
    const words = originalName.split('.');
    words[0] = words[0] + '-' + getTimestamp(datetime);
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

  verifyData(schema, data: any[]): string[] {
    // error
    const errors = [];

    data.forEach((row) => {
      const toValidate = plainToInstance(schema, row);

      // Validate
      const rowErrors = validateSync(toValidate);

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

  async sendData(data: CreateExpenseDto[], file: FileEntity) {
    // Create expenses
    await this.expensesService.createExpenses(data, file);
  }

  deleteFile() {
    deleteFile();
  }
}
