import { MigrationInterface, QueryRunner } from "typeorm";

export class length1677213654406 implements MigrationInterface {
    name = 'length1677213654406'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "files" DROP CONSTRAINT "UQ_332d10755187ac3c580e21fbc02"
        `);
        await queryRunner.query(`
            ALTER TABLE "files" DROP COLUMN "name"
        `);
        await queryRunner.query(`
            ALTER TABLE "files"
            ADD "name" character varying(50) NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "files"
            ADD CONSTRAINT "UQ_332d10755187ac3c580e21fbc02" UNIQUE ("name")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "files" DROP CONSTRAINT "UQ_332d10755187ac3c580e21fbc02"
        `);
        await queryRunner.query(`
            ALTER TABLE "files" DROP COLUMN "name"
        `);
        await queryRunner.query(`
            ALTER TABLE "files"
            ADD "name" character varying(30) NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "files"
            ADD CONSTRAINT "UQ_332d10755187ac3c580e21fbc02" UNIQUE ("name")
        `);
    }

}
