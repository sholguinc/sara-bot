import { Action, Ctx, Wizard, WizardStep } from 'nestjs-telegraf';
import { Markup, Scenes } from 'telegraf';

import { BaseTelegram } from '../../telegram/base.telegram';
import { FilesService } from '../services/files.service';
import { ExpensesService } from '../../cash/services/expenses.service';

import { File } from '../entities/file.entity';
import { Expense } from '../../cash/entities/expense.entity';

import { chunkArray, escapeMessage, localString } from 'src/utils';
import { PAGE_LIMIT } from '../../config/constants';
import { pageButtons } from '../../cash/utils';

interface Files {
  items: File[];
  total: number;
}

interface Content {
  file: File;
  expenses: Expense[];
  total: number;
  offset: number;
}

interface State {
  files: Files;
  content: Content;
}

// Scene
@Wizard('filesWizardScene')
export class FilesScene {
  private state: State;

  constructor(
    private readonly baseTelegram: BaseTelegram,
    private readonly filesService: FilesService,
    private readonly expensesService: ExpensesService,
  ) {}

  // -> User enter to scene

  @WizardStep(1)
  async initFiles(@Ctx() ctx: Scenes.WizardContext) {
    // Init
    this.state = ctx.wizard.state as State;
    this.state.files = {} as Files;
    this.state.content = { offset: 0 } as Content;

    const confirmButton = Markup.button.callback('✅ Confirm', 'getFiles');
    const cancelButton = Markup.button.callback('❌ Cancel', 'cancel');
    const keyboard = Markup.inlineKeyboard([[confirmButton, cancelButton]]);

    await ctx.replyWithMarkdownV2('View last uploaded files?', keyboard);
  }

  @Action('getFiles')
  async getFiles(@Ctx() ctx) {
    await ctx.editMessageText('Loading...');
    try {
      const { files, total } = await this.filesService.findAll();

      if (total == 0) {
        await ctx.editMessageText('There are no recent files');
        ctx.scene.leave();
      } else {
        this.state.files.items = files;
        this.state.files.total = total;

        ctx.wizard.next();
        ctx.wizard.steps[ctx.wizard.cursor](ctx);
      }
    } catch {
      this.baseTelegram.errorMessage(ctx);
      ctx.scene.leave();
    }
  }

  @WizardStep(2)
  async viewFiles(@Ctx() ctx: Scenes.WizardContext) {
    if (!ctx.message) {
      // process message
      const filesMessage = this.getFilesMessage(this.state.files.items);
      const escapedMessage = escapeMessage(filesMessage);
      const buttons = this.filesButtons(this.state.files.total);

      // send message
      await ctx.editMessageText(escapedMessage, {
        parse_mode: 'MarkdownV2',
        reply_markup: {
          inline_keyboard: buttons,
        },
      });
    }
  }

  @Action(/file:.+/)
  async selectFile(@Ctx() ctx) {
    const [, fileIndex] = ctx.callbackQuery['data'].split(':');
    this.state.content.file = this.state.files.items[fileIndex];

    await ctx.editMessageText('Loading...');

    ctx.wizard.next();
    ctx.wizard.steps[ctx.wizard.cursor](ctx);
  }

  @WizardStep(3)
  async fileInfo(@Ctx() ctx) {
    try {
      const file = this.state.content.file;
      const { expenses, total } = await this.expensesService.findByFile(file);

      if (total == 0) {
        await this.noExpenses(ctx, file);
        ctx.scene.leave();
      } else if (total <= PAGE_LIMIT) {
        this.state.content.total = total;
        await this.returnExpenses(ctx, expenses, this.state.content);
        ctx.scene.leave();
      } else {
        this.state.content.expenses = expenses;
        this.state.content.total = total;

        ctx.wizard.next();
        ctx.wizard.steps[ctx.wizard.cursor](ctx);
      }
    } catch {
      this.baseTelegram.errorMessage(ctx);
      ctx.scene.leave();
    }
  }

  // -> Enter to pagination

  @WizardStep(4)
  async pagination(@Ctx() ctx: Scenes.WizardContext) {
    try {
      if (!ctx.message) {
        // content
        const content = this.state.content;

        // data
        const pageData = this.getPageData(content);

        // process message
        const header = this.fileHeader(content.file);
        const dataMessage = this.getContentMessage(pageData, content);
        const contentMessage = header + '\n\n' + dataMessage;
        const escapedMessage = escapeMessage(contentMessage);
        const buttons = pageButtons();

        // send message
        await ctx.editMessageText(escapedMessage, {
          parse_mode: 'MarkdownV2',
          reply_markup: {
            inline_keyboard: buttons,
          },
        });
      }
    } catch {
      this.baseTelegram.errorMessage(ctx);
      ctx.scene.leave();
    }
  }

  // Pagination actions
  @Action('prevPage')
  async prevPage(@Ctx() ctx) {
    let offset = this.state.content.offset;

    offset -= PAGE_LIMIT;

    if (0 <= offset) {
      this.state.content.offset = offset;

      ctx.wizard.selectStep(3);
      ctx.wizard.steps[ctx.wizard.cursor](ctx);
    }
  }

  @Action('nextPage')
  async nextPage(@Ctx() ctx) {
    let offset = this.state.content.offset;

    offset += PAGE_LIMIT;

    if (offset < this.state.content.total) {
      this.state.content.offset = offset;

      ctx.wizard.selectStep(3);
      ctx.wizard.steps[ctx.wizard.cursor](ctx);
    }
  }

  @Action('finishPage')
  async cancelPage(@Ctx() ctx: Scenes.WizardContext) {
    ctx.editMessageText('Finished');
    ctx.scene.leave();
  }

  // No expenses function
  async noExpenses(ctx, file: File) {
    // Message
    const header = this.fileHeader(file);
    const message = header + '\n\n' + 'There are no expenses';

    // Send Message
    const escapedMessage = escapeMessage(message);
    await ctx.editMessageText(escapedMessage, {
      parse_mode: 'MarkdownV2',
    });
  }

  // return expenses
  async returnExpenses(ctx, expenses: Expense[], content: Content) {
    // Message
    const header = this.fileHeader(content.file);
    const dataMessage = this.getContentMessage(expenses, content);
    const contentMessage = header + '\n\n' + dataMessage;
    const escapedMessage = escapeMessage(contentMessage);

    // Send Message
    await ctx.editMessageText(escapedMessage, {
      parse_mode: 'MarkdownV2',
    });
  }

  getFilesMessage(files: File[]) {
    const header = '_*Recently uploaded files:*_';

    const items = files.map((file, index) => {
      // Information
      const date = localString(file.date);
      const total = Number(file.total).toFixed(2);
      const name = file.name;
      const number = index + 1;

      return (
        number + '. ' + name + ' -> ' + date + ' - ' + 'total: S/.' + total
      );
    });

    return header + '\n\n' + items.join('\n');
  }

  getContentMessage(expenses: Expense[], content: Content) {
    // Page info
    const offset = content.offset;
    const total = content.total;
    const lowerLimit = Math.max(offset + 1, 1);
    const upperLimit = Math.min(offset + PAGE_LIMIT, total);
    const page = `${lowerLimit}-${upperLimit} of ${total}`;

    const subtitle = `_*File content (${page}):*_`;

    const items = expenses.map((expense) => {
      // Information
      const amount = Number(expense.amount).toFixed(2);
      const concept = expense.concept;

      return '-> ' + concept + ': S/.' + amount;
    });

    return subtitle + '\n' + items.join('\n');
  }

  filesButtons(length: number) {
    const array = [...Array(length).keys()];

    const buttonArray = array.map((index) => {
      const number = index + 1;
      return Markup.button.callback(number.toString(), `file:${index}`);
    });

    const buttons = chunkArray(buttonArray, 5) as any[];

    const cancelButton = Markup.button.callback('❌ Cancel', 'cancel');

    buttons.push([cancelButton]);
    return buttons;
  }

  fileHeader(file: File) {
    const title = `_*File Info:*_`;

    const name = '- name: ' + file.name;
    const date = '- date: ' + localString(file.date);
    const total = '- total: - S/.' + file.total;

    const fileInfo = name + '\n' + date + '\n' + total;

    return title + '\n' + fileInfo;
  }

  // get Data
  getPageData(content: Content): Expense[] {
    return content.expenses.slice(content.offset, content.offset + PAGE_LIMIT);
  }

  // Cancel Action
  @Action('cancel')
  async cancel(@Ctx() ctx: Scenes.WizardContext) {
    this.baseTelegram.cancelOperation(ctx);
  }
}
