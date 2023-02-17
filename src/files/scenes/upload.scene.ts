import { Action, Ctx, Wizard, WizardStep } from 'nestjs-telegraf';
import { Markup, Scenes } from 'telegraf';

import { BaseTelegram } from '../../telegram/base.telegram';
import { CreateExpenseDto } from '../../cash/dto/expense.dto';
import { FilesService } from '../files.service';

export interface File {
  info: object;
  source: string;
  total: number;
}

interface State {
  file: File;
  data: CreateExpenseDto[];
}

// Scene
@Wizard('uploadWizardScene')
export class UploadScene {
  private state: State;

  constructor(
    private readonly baseTelegram: BaseTelegram,
    private readonly filesService: FilesService,
  ) {}

  // -> User enter to scene

  @WizardStep(1)
  async initFileSend(@Ctx() ctx: Scenes.WizardContext) {
    // Init
    this.state = ctx.wizard.state as State;
    this.state.file = {} as File;

    await ctx.replyWithMarkdownV2('Upload the csv file');
    ctx.wizard.next();
  }

  // -> User upload excel file

  @WizardStep(2)
  async getFile(@Ctx() ctx: Scenes.WizardContext) {
    if ('document' in ctx.message) {
      // File Info
      const fileInfo = ctx.message.document;

      // File Name
      const name = await this.filesService.getFileName(fileInfo.file_name);

      // State
      this.state.file.info = fileInfo;
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
      // Verify file type
      await this.filesService.verifyFileType(this.state.file);

      // Download file
      await this.filesService.downloadFile(ctx, this.state.file);

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
    await ctx.editMessageText('Processing...');

    // Process Data
    const data = this.filesService.parseData(ctx, this.state.file);
    const errors = this.filesService.verifyData(ctx, data);

    if (errors.length == 0) {
      // Save data
      this.state.data = data;

      // Confirm Upload
      const confirmButton = Markup.button.callback('⬆ Send', 'sendData');
      const cancelButton = Markup.button.callback('❌ Cancel', 'cancel');

      await ctx.editMessageText(
        'Processed data. Want to send it?',
        Markup.inlineKeyboard([[confirmButton], [cancelButton]]),
      );

      ctx.wizard.next();
    } else {
      const errorMessage =
        'Following data are not valid:\n' + '\n' + errors.join('\n');

      this.baseTelegram.errorMessage(ctx, errorMessage);
      ctx.scene.leave();
    }
  }

  // Confirm Action
  @Action('sendData')
  async sendData(@Ctx() ctx: Scenes.WizardContext) {
    await ctx.editMessageText('Sending...');

    // Updating
    try {
      // Get total
      this.state.file.total = this.filesService.getTotal(this.state.data);

      // Create file
      const file = await this.filesService.createFileFromTelegram(
        this.state.file,
      );

      // Send Data
      await this.filesService.sendData(this.state.data, file);

      // Message
      this.baseTelegram.completedMessage(ctx);
    } catch {
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
