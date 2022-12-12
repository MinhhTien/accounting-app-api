// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();
import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: ['./**/*.entity.ts'],
  synchronize: false,
  migrations: ['src/database/migrations/*{.ts,.js}'],
  migrationsRun: true,
  ...(process.env.DB_SSL === 'true'
    ? {
        ssl: true,
        extra: {
          ssl: {
            rejectUnauthorized: false,
          },
        },
      }
    : {}),
});
AppDataSource.initialize()
  .then(() => console.log('Database connection established'))
  .catch((error) => {
    console.error('Error during Data Source initialization', error);
  });
