import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class AddRestaurantReviews1715280000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'restaurant_reviews',
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
            name: 'restaurant_id',
            type: 'uuid',
          },
          {
            name: 'rating',
            type: 'int',
          },
          {
            name: 'comment',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'visitDate',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'photos',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'verifiedVisit',
            type: 'boolean',
            default: false,
          },
          {
            name: 'helpfulCount',
            type: 'int',
            default: 0,
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

    // Create indexes
    await queryRunner.createIndex(
      'restaurant_reviews',
      new TableIndex({
        name: 'IDX_restaurant_reviews_user_id',
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createIndex(
      'restaurant_reviews',
      new TableIndex({
        name: 'IDX_restaurant_reviews_restaurant_id',
        columnNames: ['restaurant_id'],
      }),
    );

    await queryRunner.createIndex(
      'restaurant_reviews',
      new TableIndex({
        name: 'IDX_restaurant_reviews_rating',
        columnNames: ['rating'],
      }),
    );

    await queryRunner.createIndex(
      'restaurant_reviews',
      new TableIndex({
        name: 'IDX_restaurant_reviews_visit_date',
        columnNames: ['visitDate'],
      }),
    );

    // Create foreign keys
    await queryRunner.createForeignKey(
      'restaurant_reviews',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'restaurant_reviews',
      new TableForeignKey({
        columnNames: ['restaurant_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'restaurants',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('restaurant_reviews');
  }
}
