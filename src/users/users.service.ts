import {
  Injectable,
  NotAcceptableException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  E_USER_NOT_FOUND,
  E_PASSWORD_INCORRECT,
  E_USER_EMAIL_TAKEN,
} from 'src/common/exception';
import { Raw, Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import bcrypt from 'bcrypt';
import { PASSWORD_HASH_SALT } from 'src/common/constants';
import { ResultsMetadata } from 'src/common/models/results-metadata.model';
import { FindUsersDto } from './dto/find-users.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}
  async updateLastSeenAt(user: User): Promise<User> {
    user.lastSeenAt = new Date();
    await this.usersRepository.save(user);
    return user;
  }
  async verifyPassword(id: number, password: string) {
    const user = await this.findOneByField(id);
    if (!user) throw new NotFoundException(E_USER_NOT_FOUND);
    if (!(await bcrypt.compare(password, user.password)))
      throw new NotAcceptableException(E_PASSWORD_INCORRECT);
  }
  async create(dto: CreateUserDto) {
    // Check if there is a user with the same email
    const existingUser = await this.usersRepository.findOne({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new NotAcceptableException(E_USER_EMAIL_TAKEN);
    }

    // Hashing the password: So that they are protected from whoever can access the database.
    const hashedPassword = await bcrypt.hash(dto.password, PASSWORD_HASH_SALT);

    // Save & return the new user
    return this.usersRepository.save({ ...dto, password: hashedPassword });
  }

  async findAll({
    offset = 0,
    limit = 12,
    sortField,
    sortOrder,
    email,
    searchQuery,
  }: FindUsersDto = {}): Promise<{ data: User[]; meta: ResultsMetadata }> {
    // Filtering
    const where: any = {};
    if (email) {
      where.email = email;
    }
    if (searchQuery) {
      where.firstName = Raw(
        (alias) => `CONCAT(firstName," ",lastName) LIKE :name`,
        { name: '%' + searchQuery + '%' },
      );
    }

    // Fetching
    const [data, count] = await this.usersRepository.findAndCount({
      where,
      order: {
        [sortField || 'createdAt']: (sortOrder || 'desc').toUpperCase(),
      },
      skip: offset,
      take: limit || null,
    });

    // Returning
    return {
      data,
      meta: {
        total: count,
        offset: offset,
        limit: limit || null,
      },
    };
  }

  async findOne(id: number): Promise<User> {
    return await this.usersRepository.findOne({ where: { id } });
  }
  async findOneByField(
    fieldValue: number | string,
    // eslint-disable-next-line @typescript-eslint/no-inferrable-types
    fieldName: string = 'id',
  ): Promise<User> {
    // relations => in case e need to load some user relations
    return await this.usersRepository.findOne({
      where: { [fieldName]: fieldValue },
    });
  }

  async update(id: number, dto: UpdateUserDto): Promise<User> {
    // Check if there is a user with the same email
    if (typeof dto.email != 'undefined') {
      const existingUser = await this.usersRepository.findOne({
        where: { email: dto.email },
      });
      if (existingUser) {
        throw new UnauthorizedException(E_USER_EMAIL_TAKEN);
      }
    }

    // Check if user exists
    const user = await this.findOneByField(id);
    if (!user) throw new NotFoundException(E_USER_NOT_FOUND);

    // Update and return user
    Object.assign(user, { ...dto });
    await this.usersRepository.save(user);
    return user;
  }
  async updatePassword(
    currentPassword: string,
    newPassword: string,
    currentUser: User,
  ): Promise<void> {
    // Checking the current password
    if (!(await bcrypt.compare(currentPassword, currentUser.password)))
      throw new NotAcceptableException(E_PASSWORD_INCORRECT);

    // Hashing password
    const hashedPassword = await bcrypt.hash(newPassword, PASSWORD_HASH_SALT);

    // Update user password
    Object.assign(currentUser, { password: hashedPassword });
    await this.usersRepository.save(currentUser);
  }
  async remove(id: number): Promise<User> {
    // Check if user exists
    const user = await this.findOneByField(id);
    if (!user) throw new NotFoundException(E_USER_NOT_FOUND);

    // Remove and return user
    await this.usersRepository.delete(id);
    return user;
  }
}
