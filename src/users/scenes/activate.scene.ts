import { Action, Ctx, Wizard, WizardStep } from 'nestjs-telegraf';
import { Markup, Scenes } from 'telegraf';

import { BaseTelegram } from '../../telegram/base.telegram';
import { UpdateUserDto } from '../dto/update-user.dto';

import { User } from '../entities/user.entity';
import { UsersService } from '../users.service';
import { chunkArray, escapeMessage } from '../../utils';

interface State {
  users: User[];
  user: User;
  active: boolean;
  updatedUser: User;
}

// Scene
@Wizard('activateWizardScene')
export class ActivateScene {
  private state: State;

  constructor(
    private readonly baseTelegram: BaseTelegram,
    private readonly usersService: UsersService,
  ) {}

  // -> User enter to scene

  @WizardStep(1)
  async initActivate(@Ctx() ctx: Scenes.WizardContext) {
    // Init
    this.state = ctx.wizard.state as State;

    const confirmButton = Markup.button.callback('✅ Confirm', 'showUsers');
    const cancelButton = Markup.button.callback('❌ Cancel', 'cancel');
    const keyboard = Markup.inlineKeyboard([[confirmButton, cancelButton]]);

    await ctx.replyWithMarkdownV2(
      'Show all users to activate/deactivate them?',
      keyboard,
    );
  }

  @Action('showUsers')
  async showUsers(@Ctx() ctx) {
    this.state.user = {} as User;
    this.state.updatedUser = {} as User;
    await ctx.editMessageText('Loading...');

    ctx.wizard.next();
    ctx.wizard.steps[ctx.wizard.cursor](ctx);
  }

  @WizardStep(2)
  async getUser(@Ctx() ctx) {
    try {
      const { users, total } = await this.usersService.findAll();

      if (total == 0) {
        await ctx.editMessageText('There are no users');
        ctx.scene.leave();
      } else {
        this.state.users = users;

        ctx.wizard.next();
        ctx.wizard.steps[ctx.wizard.cursor](ctx);
      }
    } catch {
      this.baseTelegram.errorMessage(ctx);
      ctx.scene.leave();
    }
  }

  @WizardStep(3)
  async viewUsers(@Ctx() ctx: Scenes.WizardContext) {
    if (!ctx.message) {
      // process message
      const message = 'Select user to configure:';

      const buttonArray = this.state.users.map((user) => {
        const name = user.username;
        return Markup.button.callback(name, `selectUser:${name}`);
      });

      const buttons = chunkArray(buttonArray, 2);

      const cancelButton = Markup.button.callback('❌ Cancel', 'cancel');
      buttons.push([cancelButton]);

      // send message
      await ctx.editMessageText(message, {
        parse_mode: 'MarkdownV2',
        reply_markup: {
          inline_keyboard: buttons,
        },
      });
    }
  }

  @Action(/selectUser:.+/)
  async selectUser(@Ctx() ctx) {
    try {
      // Username
      const [, username] = ctx.callbackQuery['data'].split(':');
      this.state.user = await this.usersService.findOneByName(username);

      ctx.wizard.next();
      ctx.wizard.steps[ctx.wizard.cursor](ctx);
    } catch {
      this.baseTelegram.errorMessage(ctx);
      ctx.scene.leave();
    }
  }

  @WizardStep(4)
  async viewUserInfo(@Ctx() ctx: Scenes.WizardContext) {
    if (!ctx.message) {
      // process message
      const userHeader = this.userHeader(this.state.user);
      const escapedMessage = escapeMessage(userHeader);
      const buttons = this.activeButtons(this.state.user);

      // send message
      await ctx.editMessageText(escapedMessage, {
        parse_mode: 'MarkdownV2',
        reply_markup: {
          inline_keyboard: buttons,
        },
      });
    }
  }

  @Action(/active:.+/)
  async confirm(@Ctx() ctx) {
    const [, activeString] = ctx.callbackQuery['data'].split(':');
    const active = JSON.parse(activeString) as boolean;
    this.state.active = active;

    const confirmButton = Markup.button.callback('✅ Confirm', 'updateUser');
    const cancelButton = Markup.button.callback('❌ Cancel', 'cancel');
    const keyboard = [[confirmButton, cancelButton]];

    const activeText = active ? 'activate' : 'deactivate';
    const message = `Are you sure ${activeText} to user?`;

    await ctx.editMessageText(message, {
      parse_mode: 'MarkdownV2',
      reply_markup: {
        inline_keyboard: keyboard,
      },
    });
  }

  @Action('updateUser')
  async updateUser(@Ctx() ctx) {
    try {
      const active = this.state.active;
      const userId = this.state.user.id;
      const updateUserDto = { active } as UpdateUserDto;

      this.state.updatedUser = await this.usersService.update(
        userId,
        updateUserDto,
      );

      ctx.wizard.next();
      ctx.wizard.steps[ctx.wizard.cursor](ctx);
    } catch {
      this.baseTelegram.errorMessage(ctx);
      ctx.scene.leave();
    }
  }

  @WizardStep(5)
  async viewUserNewInfo(@Ctx() ctx: Scenes.WizardContext) {
    if (!ctx.message) {
      // process message
      const userHeader = this.userHeader(this.state.updatedUser);
      const escapedMessage = escapeMessage(userHeader);
      const exitButton = Markup.button.callback('Finish', 'finish');
      const retryButton = Markup.button.callback('🔁 Again', 'again');

      // send message
      await ctx.editMessageText(escapedMessage, {
        parse_mode: 'MarkdownV2',
        reply_markup: {
          inline_keyboard: [[exitButton, retryButton]],
        },
      });
    }
  }

  userHeader(user: User) {
    const title = `_*User Info:*_`;

    const name = '- name: ' + user.username;
    const role = '- role: ' + user.role;
    const active = '- active: ' + user.active;

    const userInfo = name + '\n' + role + '\n' + active;

    return title + '\n' + userInfo;
  }

  activeButtons(user: User) {
    const active = user.active;

    let button;
    if (active) {
      button = Markup.button.callback('Deactivate', 'active:false');
    } else {
      button = Markup.button.callback('Activate', 'active:true');
    }

    const cancelButton = Markup.button.callback('❌ Cancel', 'cancel');
    return [[button, cancelButton]];
  }

  // Finish Action
  @Action('finish')
  async finish(@Ctx() ctx: Scenes.WizardContext) {
    ctx.editMessageText('Operation finished');
    ctx.scene.leave();
  }

  // Again Action
  @Action('again')
  async Again(@Ctx() ctx) {
    ctx.wizard.selectStep(2);
    ctx.wizard.steps[ctx.wizard.cursor](ctx);
  }

  // Cancel Action
  @Action('cancel')
  async cancel(@Ctx() ctx: Scenes.WizardContext) {
    this.baseTelegram.cancelOperation(ctx);
  }
}
