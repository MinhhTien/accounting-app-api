import { NotAcceptableException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { E_INCORRECT_EMAIL_OR_PASSWORD } from 'src/common/exception';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}
  getAccessToken(user: User): string {
    return this.jwtService.sign({ sub: user.id, username: user.email });
  }
  async signUp(createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    return {
      accessToken: this.getAccessToken(user),
      user,
    };
  }
  async login(loginDto: LoginDto) {
    const user = await this.usersService.findOneByField(
      loginDto.email,
      'email',
    );
    if (!user) throw new NotAcceptableException(E_INCORRECT_EMAIL_OR_PASSWORD);

    // Check password
    if (!(await bcrypt.compare(loginDto.password, user.password)))
      throw new NotAcceptableException(E_INCORRECT_EMAIL_OR_PASSWORD);

    // Return the user and the access token
    return {
      accessToken: this.getAccessToken(user),
      user,
    };
  }
}
