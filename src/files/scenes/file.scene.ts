import { Action, Ctx, Wizard, WizardStep } from 'nestjs-telegraf';
import { Markup, Scenes } from 'telegraf';

import { BaseTelegram } from '../../telegram/base.telegram';
import { FilesService } from '../files.service';

export interface File {
  info;
  source;
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
    this.state = ctx.wizard.state as State;

    await ctx.replyWithMarkdownV2('Upload the excel file');
    ctx.wizard.next();
  }

  // -> User upload excel file

  @WizardStep(2)
  async getFile(@Ctx() ctx: Scenes.WizardContext) {
    if ('document' in ctx.message) {
      // File Info
      const fileInfo = ctx.message.document;
      const fileId = fileInfo.file_id;

      // File
      const file = await ctx.telegram.getFile(fileId);

      // State
      this.state.file.info = fileInfo;
      this.state.file.source = file;

      const verifyButton = Markup.button.callback(
        '🔁 Verify Data',
        'verifyData',
      );
      const cancelButton = Markup.button.callback('❌ Cancel', 'cancel');

      await ctx.replyWithMarkdownV2(
        'File detected',
        Markup.inlineKeyboard([[verifyButton], [cancelButton]]),
      );

      ctx.wizard.next();
    }
  }

  // Verifying
  @Action('verifyData')
  async verifyData(@Ctx() ctx: Scenes.WizardContext) {
    await ctx.editMessageText('Verifying...');

    try {
      // State
      const state = ctx.wizard.state as State;

      // Verify File
      await this.filesService.verifyFile(state.file);
      // Verify Data
      await this.filesService.verifyData(state.file);

      // Confirm Upload
      const confirmButton = Markup.button.callback('✅ Confirm', 'sendData');
      const cancelButton = Markup.button.callback('❌ Cancel', 'cancel');

      await ctx.editMessageText(
        'Verified file. Want to send data?',
        Markup.inlineKeyboard([[confirmButton], [cancelButton]]),
      );

      ctx.wizard.next();
    } catch {
      this.baseTelegram.errorMessage(ctx);
      ctx.scene.leave();
    }
  }

  // Confirm Action
  @Action('sendData')
  async sendData(@Ctx() ctx: Scenes.WizardContext) {
    await ctx.editMessageText('Loading...');

    // Updating
    try {
      // Send
      const state = ctx.wizard.state as State;
      await this.filesService.sendData(state.file);

      // Message
      this.baseTelegram.completedMessage(ctx);
    } catch {
      this.baseTelegram.errorMessage(ctx);
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
