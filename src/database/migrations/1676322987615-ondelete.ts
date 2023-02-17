import { MigrationInterface, QueryRunner } from "typeorm";

export class ondelete1676322987615 implements MigrationInterface {
    name = 'ondelete1676322987615'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "incomes" DROP CONSTRAINT "FK_400664fad260d8fa50ecb78ffe6"
        `);
        await queryRunner.query(`
            ALTER TABLE "expenses"
            ADD "file_id" uuid
        `);
        await queryRunner.query(`
            ALTER TABLE "incomes"
            ALTER COLUMN "user_id"
            SET NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "expenses"
            ADD CONSTRAINT "FK_ac5edcba7a90d751d83db6bfc31" FOREIGN KEY ("file_id") REFERENCES "files"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "incomes"
            ADD CONSTRAINT "FK_400664fad260d8fa50ecb78ffe6" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "incomes" DROP CONSTRAINT "FK_400664fad260d8fa50ecb78ffe6"
        `);
        await queryRunner.query(`
            ALTER TABLE "expenses" DROP CONSTRAINT "FK_ac5edcba7a90d751d83db6bfc31"
        `);
        await queryRunner.query(`
            ALTER TABLE "incomes"
            ALTER COLUMN "user_id" DROP NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "expenses" DROP COLUMN "file_id"
        `);
        await queryRunner.query(`
            ALTER TABLE "incomes"
            ADD CONSTRAINT "FK_400664fad260d8fa50ecb78ffe6" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }

}
