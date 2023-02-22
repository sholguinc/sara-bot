import { MigrationInterface, QueryRunner } from "typeorm";

export class changes1676927976395 implements MigrationInterface {
    name = 'changes1676927976395'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "files"
            ADD CONSTRAINT "UQ_332d10755187ac3c580e21fbc02" UNIQUE ("name")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "files" DROP CONSTRAINT "UQ_332d10755187ac3c580e21fbc02"
        `);
    }

}
