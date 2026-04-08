import { MigrationInterface, QueryRunner, Table, Index, ForeignKey } from 'typeorm';

export class AddFollowsTable1715141234568 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'follows',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'follower_id',
            type: 'uuid',
          },
          {
            name: 'following_id',
            type: 'uuid',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
    );

    // Foreign keys
    await queryRunner.createForeignKey(
      'follows',
      'follower_id',
      'users',
      'id',
      { onDelete: 'CASCADE' },
    );

    await queryRunner.createForeignKey(
      'follows',
      'following_id',
      'users',
      'id',
      { onDelete: 'CASCADE' },
    );

    // Unique constraint on (follower_id, following_id)
    await queryRunner.createIndex(
      'follows',
      new Table({
        name: 'unique_follow',
        columnNames: ['follower_id', 'following_id'],
        isUnique: true,
      }),
    );

    // Index for faster queries
    await queryRunner.createIndex(
      'follows',
      new Table({
        name: 'idx_follower_id',
        columnNames: ['follower_id'],
      }),
    );

    await queryRunner.createIndex(
      'follows',
      new Table({
        name: 'idx_following_id',
        columnNames: ['following_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('follows');
  }
}
