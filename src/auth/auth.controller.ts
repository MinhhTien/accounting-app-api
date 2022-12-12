import { Body, Post } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiNotAcceptableResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import {
  E_INCORRECT_EMAIL_OR_PASSWORD,
  E_USER_EMAIL_TAKEN,
} from 'src/common/exception';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { User } from 'src/users/entities/user.entity';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Connection } from './models/connection.model';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOkResponse({ type: Connection })
  @ApiNotAcceptableResponse({ description: E_INCORRECT_EMAIL_OR_PASSWORD })
  async login(@Body() loginDto: LoginDto): Promise<Connection> {
    return this.authService.login(loginDto);
  }
  @Post('signup')
  @ApiCreatedResponse({ type: User })
  @ApiNotAcceptableResponse({ description: E_USER_EMAIL_TAKEN })
  async signUp(@Body() createUserDto: CreateUserDto): Promise<Connection> {
    return this.authService.signUp(createUserDto);
  }
}
