import { MigrationInterface, QueryRunner } from "typeorm";

export class init1673545931037 implements MigrationInterface {
    name = 'init1673545931037'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "expenses" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "concept" character varying(50) NOT NULL,
                "amount" numeric(10, 2) NOT NULL,
                "transaction_date" character varying(50) NOT NULL,
                "timestamp" bigint NOT NULL,
                CONSTRAINT "PK_94c3ceb17e3140abc9282c20610" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_8c75f893af1229bc740c84a713" ON "expenses" ("timestamp")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."users_role_enum" AS ENUM('member', 'admin')
        `);
        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "username" character varying(10) NOT NULL,
                "role" "public"."users_role_enum" NOT NULL DEFAULT 'member',
                "active" boolean NOT NULL,
                CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"),
                CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_fe0bb3f6520ee0469504521e71" ON "users" ("username")
        `);
        await queryRunner.query(`
            CREATE TABLE "incomes" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "concept" character varying(50) NOT NULL,
                "amount" numeric(10, 2) NOT NULL,
                "transaction_date" character varying(50) NOT NULL,
                "timestamp" bigint NOT NULL,
                "user_id" uuid,
                CONSTRAINT "PK_d737b3d0314c1f0da5461a55e5e" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_fa59545742fdb9417e596124f7" ON "incomes" ("timestamp")
        `);
        await queryRunner.query(`
            ALTER TABLE "incomes"
            ADD CONSTRAINT "FK_400664fad260d8fa50ecb78ffe6" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "incomes" DROP CONSTRAINT "FK_400664fad260d8fa50ecb78ffe6"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_fa59545742fdb9417e596124f7"
        `);
        await queryRunner.query(`
            DROP TABLE "incomes"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_fe0bb3f6520ee0469504521e71"
        `);
        await queryRunner.query(`
            DROP TABLE "users"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."users_role_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_8c75f893af1229bc740c84a713"
        `);
        await queryRunner.query(`
            DROP TABLE "expenses"
        `);
    }

}
