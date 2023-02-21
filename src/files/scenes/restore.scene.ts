import { Action, Ctx, Wizard, WizardStep } from 'nestjs-telegraf';
import { Markup, Scenes } from 'telegraf';

import { BaseTelegram } from '../../telegram/base.telegram';
import { FilesService } from '../services/files.service';
import { RestoreService } from '../services/restore.service';

import { RestoreIncomeDto } from '../../cash/dto/restore.dto';
import { RestoreExpenseDto } from '../../cash/dto/restore.dto';

import { File } from './upload.scene';

interface State {
  file: File;
  incomes: RestoreIncomeDto[];
  expenses: RestoreExpenseDto[];
}

// Scene
@Wizard('restoreWizardScene')
export class RestoreScene {
  private state: State;

  constructor(
    private readonly baseTelegram: BaseTelegram,
    private readonly filesService: FilesService,
    private readonly restoreService: RestoreService,
  ) {}

  // -> User enter to scene

  @WizardStep(1)
  async confirmRestore(@Ctx() ctx: Scenes.WizardContext) {
    // Init
    this.state = ctx.wizard.state as State;
    this.state.file = {} as File;

    const confirmButton = Markup.button.callback(
      '✅ Confirm',
      'getFileMessage',
    );
    const cancelButton = Markup.button.callback('❌ Cancel', 'cancel');
    const keyboard = Markup.inlineKeyboard([[confirmButton, cancelButton]]);

    await ctx.replyWithMarkdownV2('Are you sure to restore data?', keyboard);
  }

  @Action('getFileMessage')
  async getFileMessage(@Ctx() ctx) {
    await ctx.editMessageText('Upload the csv file');
    ctx.wizard.next();
  }

  // -> User upload excel file

  @WizardStep(2)
  async getFile(@Ctx() ctx: Scenes.WizardContext) {
    if ('document' in ctx.message) {
      // File Info
      const fileInformation = ctx.message.document;

      // File Name
      const name = this.filesService.getFileName(fileInformation.file_name);

      // State
      this.state.file.info = fileInformation;
      this.state.file.source = name;

      // Message
      const loadButton = Markup.button.callback('⏩ Load File', 'loadFile');
      const cancelButton = Markup.button.callback('❌ Cancel', 'cancel');

      await ctx.replyWithMarkdownV2(
        'File detected',
        Markup.inlineKeyboard([[loadButton], [cancelButton]]),
      );
    } else {
      await ctx.reply('Error: File not found');
      ctx.scene.leave();
    }
  }

  // Loading
  @Action('loadFile')
  async loadFile(@Ctx() ctx: Scenes.WizardContext) {
    await ctx.editMessageText('Loading...');

    try {
      const file = this.state.file;

      // Verify file type
      await this.filesService.verifyFileType(file);

      // Download file
      await this.filesService.downloadFile(ctx, file);

      // Verify download

      // Verify Buttons
      const verifyButton = Markup.button.callback(
        '🔁 Process Data',
        'processData',
      );
      const cancelButton = Markup.button.callback('❌ Cancel', 'cancel');

      await ctx.editMessageText(
        'File loaded',
        Markup.inlineKeyboard([[verifyButton], [cancelButton]]),
      );

      ctx.wizard.next();
    } catch {
      this.baseTelegram.errorMessage(ctx, 'Failed load');
      ctx.scene.leave();
    }
  }

  // Verifying
  @Action('processData')
  async verifyData(@Ctx() ctx: Scenes.WizardContext) {
    ctx.editMessageText('Processing...');

    // Process Data
    const data = this.filesService.parseData(ctx, this.state.file);
    const { incomes, expenses } = this.restoreService.splitData(data);

    const incomeErrors = this.filesService.verifyData(
      RestoreIncomeDto,
      incomes,
    );
    const expenseErrors = this.filesService.verifyData(
      RestoreExpenseDto,
      expenses,
    );

    const noErrors = incomeErrors.length == 0 && expenseErrors.length == 0;

    if (noErrors) {
      // Save data
      this.state.incomes = incomes as RestoreIncomeDto[];
      this.state.expenses = expenses as RestoreExpenseDto[];

      // Confirm Upload
      const confirmButton = Markup.button.callback('⬆ Send', 'sendData');
      const cancelButton = Markup.button.callback('❌ Cancel', 'cancel');

      setTimeout(() => {
        ctx.editMessageText(
          'Processed data. Are you sure to restore them? ',
          Markup.inlineKeyboard([[confirmButton], [cancelButton]]),
        );
      }, 1000);

      ctx.wizard.next();
    } else {
      const firstIncomeErrors = incomeErrors.slice(0, 5);
      const incomeErrorsMessage =
        incomeErrors.length == 0
          ? ''
          : `\n\nSome income errors:\n ${firstIncomeErrors.join('\n')}`;

      const firstExpenseErrors = expenseErrors.slice(0, 5);
      const expenseErrorsMessage =
        expenseErrors.length == 0
          ? ''
          : `\n\nSome expense errors:\n ${firstExpenseErrors.join('\n')}`;

      const message =
        'Following data are not valid:' +
        incomeErrorsMessage +
        expenseErrorsMessage;

      this.baseTelegram.errorMessage(ctx, message);
      ctx.scene.leave();
    }
  }

  // Confirm Action
  @Action('sendData')
  async sendData(@Ctx() ctx: Scenes.WizardContext) {
    await ctx.editMessageText('Sending...');

    // Updating
    try {
      // Send Data
      await this.restoreService.restoreIncomes(this.state.incomes);
      await this.restoreService.restoreExpenses(this.state.expenses);

      // Message
      this.baseTelegram.completedMessage(ctx);
    } catch (e) {
      console.log(e);
      this.baseTelegram.errorMessage(ctx, 'There was a sending error');
    } finally {
      // Delete csv file
      this.filesService.deleteFile();

      // Finish Scene
      ctx.scene.leave();
    }
  }

  // Cancel Action
  @Action('cancel')
  async cancel(@Ctx() ctx: Scenes.WizardContext) {
    this.baseTelegram.cancelOperation(ctx);
  }
}
