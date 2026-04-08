import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1715141234567 implements MigrationInterface {
  name = 'InitialSchema1715141234567';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create roles table
    await queryRunner.query(`
      CREATE TABLE "roles" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" varchar NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_roles_name" UNIQUE ("name")
      )
    `);

    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "email" varchar NOT NULL,
        "password_hash" varchar NOT NULL,
        "full_name" varchar NOT NULL,
        "bio" varchar,
        "profile_picture_url" varchar,
        "role_id" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "FK_users_role" FOREIGN KEY ("role_id") REFERENCES "roles" ("id")
      )
    `);

    // Create jwt_secrets table
    await queryRunner.query(`
      CREATE TABLE "jwt_secrets" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "secret" varchar NOT NULL,
        "version" integer NOT NULL DEFAULT 1,
        "active" boolean NOT NULL DEFAULT true,
        "expires_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // Insert default roles
    await queryRunner.query(`
      INSERT INTO "roles" ("name") VALUES
      ('USER'),
      ('RESTAURANT'),
      ('ADMIN')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "jwt_secrets"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "roles"`);
  }
}
