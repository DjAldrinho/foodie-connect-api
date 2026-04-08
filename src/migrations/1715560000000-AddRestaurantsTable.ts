import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class AddRestaurantsTable1715560000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'restaurants',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'name',
            type: 'varchar',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'cuisineType',
            type: 'text',
            isArray: true,
            default: "'{}'",
          },
          {
            name: 'priceRange',
            type: 'enum',
            enum: ['1', '2', '3', '4'], // BUDGET, MODERATE, EXPENSIVE, LUXURY
            default: "'2'",
          },
          {
            name: 'address',
            type: 'jsonb',
            default: "'{}'",
          },
          {
            name: 'hours',
            type: 'jsonb',
            default: "'[]'",
          },
          {
            name: 'amenities',
            type: 'text',
            isArray: true,
            default: "'{}'",
          },
          {
            name: 'capacity',
            type: 'int',
            default: 0,
          },
          {
            name: 'phone',
            type: 'varchar',
            default: "'+598'",
          },
          {
            name: 'website',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'photos',
            type: 'text',
            isArray: true,
            default: "'{}'",
          },
          {
            name: 'verified',
            type: 'boolean',
            default: false,
          },
          {
            name: 'active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
    );

    // Foreign key to users table
    await queryRunner.createForeignKey(
      'restaurants',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    // Index for user_id (owner lookups)
    await queryRunner.createIndex(
      'restaurants',
      new TableIndex({
        name: 'idx_restaurants_user_id',
        columnNames: ['user_id'],
      }),
    );

    // Index for verified status (filter by verified)
    await queryRunner.createIndex(
      'restaurants',
      new TableIndex({
        name: 'idx_restaurants_verified',
        columnNames: ['verified'],
      }),
    );

    // Index for price range (filter by price)
    await queryRunner.createIndex(
      'restaurants',
      new TableIndex({
        name: 'idx_restaurants_price_range',
        columnNames: ['priceRange'],
      }),
    );

    // GIN index for cuisineType array (array operations)
    await queryRunner.createIndex(
      'restaurants',
      new TableIndex({
        name: 'idx_restaurants_cuisine_type',
        columnNames: ['cuisineType'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('restaurants');
  }
}
