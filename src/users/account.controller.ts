import {
  Get,
  Patch,
  Body,
  Delete,
  ClassSerializerInterceptor,
  Controller,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiNotAcceptableResponse,
  ApiBasicAuth,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { UserAuthGuard } from 'src/auth/user-auth.guard';
import {
  E_TRANSACTION_NOT_FOUND,
  E_UNAUTHORIZED_ACCESS_TO_RESOURCE,
  E_PASSWORD_INCORRECT,
} from 'src/common/exception';
import { TransactionsService } from 'src/transactions/transactions.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(UserAuthGuard)
@ApiTags('account')
@ApiBasicAuth()
@Controller('account')
export class AccountController {
  constructor(
    private readonly usersService: UsersService,
    private readonly transactionsService: TransactionsService,
  ) {}
  @Get()
  @ApiOkResponse({ type: User })
  findOne(@CurrentUser() currentUser): Promise<User> {
    return this.usersService.findOne(currentUser.id);
  }
  @Get('balance')
  @ApiOkResponse()
  @ApiNotFoundResponse({ description: E_TRANSACTION_NOT_FOUND })
  @ApiUnauthorizedResponse({ description: E_UNAUTHORIZED_ACCESS_TO_RESOURCE })
  getAccountBalance(@CurrentUser() currentUser): Promise<number> {
    return this.transactionsService.getAccountBalance(currentUser.id);
  }
  @Patch('update-profile')
  @ApiOkResponse({ type: User })
  update(@Body() dto: UpdateUserDto, @CurrentUser() currentUser) {
    return this.usersService.update(currentUser.id, dto);
  }
  @Patch('update-password')
  @ApiOkResponse()
  @ApiNotAcceptableResponse({ description: E_PASSWORD_INCORRECT })
  updatePassword(
    @Body('currentPassword') currentPassword: string,
    @Body('newPassword') newPassword: string,
    @CurrentUser() currentUser,
  ) {
    return this.usersService.updatePassword(
      currentPassword,
      newPassword,
      currentUser,
    );
  }
  @Delete()
  @ApiOkResponse()
  async remove(@Body('password') password, @CurrentUser() currentUser) {
    await this.usersService.verifyPassword(currentUser.id, password);
    return this.usersService.remove(+currentUser.id);
  }
}
