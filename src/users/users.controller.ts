import {
  Controller,
  Get,
  Param,
  UseInterceptors,
  ClassSerializerInterceptor,
  UseGuards,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiBasicAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { User } from './entities/user.entity';
import { FindUsersDto } from './dto/find-users.dto';
import { Users } from './models/users.model';
import { AdminAuthGuard } from 'src/auth/admin-auth.guard';

@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(AdminAuthGuard)
@ApiBasicAuth()
@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOkResponse({ type: User })
  async findAll(@Query() dto: FindUsersDto): Promise<Users> {
    return await this.usersService.findAll(dto);
  }

  @Get(':id')
  @ApiOkResponse({ type: User })
  findOne(@Param('id') id: number): Promise<User> {
    return this.usersService.findOne(id);
  }
}
