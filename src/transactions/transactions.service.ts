import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  E_TRANSACTION_NOT_FOUND,
  E_UNAUTHORIZED_ACCESS_TO_RESOURCE,
  E_USER_NOT_FOUND,
} from 'src/common/exception';
import { ResultsMetadata } from 'src/common/models/results-metadata.model';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { FindTransactionsDto } from './dto/find-transactions.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { Transaction } from './entities/transaction.entity';
import { TransactionCategoryEnum } from './enums/transaction-category.enum';
import { TransactionTypeEnum } from './enums/transaction-type.enum';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
  ) {}
  async create(dto: CreateTransactionDto, currentUser: User) {
    // Save & return the new transaction
    const transaction = await this.transactionsRepository.save({
      ...dto,
      user: currentUser,
      type: [
        TransactionCategoryEnum.revenue,
        TransactionCategoryEnum.grant,
        TransactionCategoryEnum.loanPayment,
        TransactionCategoryEnum.debt,
      ].includes(dto.category)
        ? TransactionTypeEnum.credit
        : TransactionTypeEnum.debit,
      reason: dto.reason || null,
      date: dto.date || new Date(),
    });
    delete transaction.user;
    return transaction;
  }

  async findAll(
    { offset = 0, limit = 12, sortField, sortOrder }: FindTransactionsDto,
    currentUser: User,
  ): Promise<{ data: Transaction[]; meta: ResultsMetadata }> {
    // Fetching
    const [data, count] = await this.transactionsRepository.findAndCount({
      where: { userId: currentUser.id },
      order: {
        [sortField || 'createdAt']: (sortOrder || 'desc').toUpperCase(),
      },
      skip: offset,
      take: limit,
    });

    // Returning
    return {
      data,
      meta: {
        total: count,
        offset: offset,
        limit: limit,
      },
    };
  }

  async findOne(id: number, currentUser: User): Promise<Transaction> {
    const transaction = await this.findOneByField(id);
    if (!transaction) throw new NotFoundException(E_TRANSACTION_NOT_FOUND);
    if (transaction.userId != currentUser.id)
      throw new UnauthorizedException(E_UNAUTHORIZED_ACCESS_TO_RESOURCE);
    return transaction;
  }

  async findOneByField(
    fieldValue: number | string,
    fieldName = 'id',
  ): Promise<Transaction> {
    // relations => in case e need to load some transaction relations
    return await this.transactionsRepository.findOne({
      where: { [fieldName]: fieldValue },
    });
  }

  async getAccountBalance(userId: number): Promise<number> {
    // relations => in case e need to load some transaction relations
    const { balance } = await this.transactionsRepository
      .createQueryBuilder('item')
      .select(
        "SUM(CASE item.type WHEN 'credit' THEN item.amount ELSE item.amount* -1 END)",
        'balance',
      )
      .where({ userId })
      .getRawOne();
    return balance;
  }

  async update(
    id: number,
    dto: UpdateTransactionDto,
    currentUser: User,
  ): Promise<Transaction> {
    // Check if transaction exists
    const transaction = await this.findOneByField(id);
    if (!transaction) throw new NotFoundException(E_TRANSACTION_NOT_FOUND);

    if (transaction.userId != currentUser.id)
      throw new UnauthorizedException(E_UNAUTHORIZED_ACCESS_TO_RESOURCE);

    // Update and return transaction
    Object.assign(transaction, {
      ...dto,
      type: [
        TransactionCategoryEnum.revenue,
        TransactionCategoryEnum.grant,
        TransactionCategoryEnum.loanPayment,
        TransactionCategoryEnum.debt,
      ].includes(dto.category || transaction.category)
        ? TransactionTypeEnum.credit
        : TransactionTypeEnum.debit,
      reason: dto.reason || transaction.reason,
      date: dto.date || transaction.date,
    });
    await this.transactionsRepository.save(transaction);
    return transaction;
  }

  async remove(id: number, currentUser: User): Promise<Transaction> {
    // Check if transaction exists
    const transaction = await this.findOneByField(id);
    if (!transaction) throw new NotFoundException(E_USER_NOT_FOUND);

    if (transaction.userId != currentUser.id)
      throw new UnauthorizedException(E_UNAUTHORIZED_ACCESS_TO_RESOURCE);

    // Remove and return transaction
    await this.transactionsRepository.delete(id);
    return transaction;
  }
}
