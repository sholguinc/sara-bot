import { Action, Ctx, Wizard, WizardStep } from 'nestjs-telegraf';
import { Markup, Scenes } from 'telegraf';

import { BaseTelegram } from '../../telegram/base.telegram';
import { FilesService } from '../files.service';

export interface File {
  info: object;
  source: string;
}

interface State {
  file: File;
}

// Scene
@Wizard('fileWizardScene')
export class FileScene {
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

    await ctx.replyWithMarkdownV2('Upload the excel file');
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

      ctx.wizard.next();
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
        '🔁 Verify Data',
        'verifyData',
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
  @Action('verifyData')
  async verifyData(@Ctx() ctx: Scenes.WizardContext) {
    await ctx.editMessageText('Verifying...');

    try {
      // State
      const state = ctx.wizard.state as State;

      // Verify Data
      await this.filesService.verifyData(state.file);

      // Confirm Upload
      const confirmButton = Markup.button.callback('⬆️ Send', 'sendData');
      const cancelButton = Markup.button.callback('❌ Cancel', 'cancel');

      await ctx.editMessageText(
        'Verified data. Want to send it?',
        Markup.inlineKeyboard([[confirmButton], [cancelButton]]),
      );

      ctx.wizard.next();
    } catch {
      this.baseTelegram.errorMessage(ctx, 'Data is not valid');
      ctx.scene.leave();
    }
  }

  // Confirm Action
  @Action('sendData')
  async sendData(@Ctx() ctx: Scenes.WizardContext) {
    await ctx.editMessageText('Sending...');

    // Updating
    try {
      // Send
      const state = ctx.wizard.state as State;
      await this.filesService.sendData(state.file);

      // Message
      this.baseTelegram.completedMessage(ctx);
    } catch {
      this.baseTelegram.errorMessage(ctx, 'There was a sending error');
    } finally {
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
