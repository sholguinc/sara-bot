import { MigrationInterface, QueryRunner } from "typeorm";

export class files1676311661353 implements MigrationInterface {
    name = 'files1676311661353'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "files" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(30) NOT NULL,
                "date" character varying(50) NOT NULL,
                "timestamp" bigint NOT NULL,
                "total" numeric(10, 2) NOT NULL,
                CONSTRAINT "PK_6c16b9093a142e0e7613b04a3d9" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_e41cec8b2b4310e4bc82619ec6" ON "files" ("timestamp")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "public"."IDX_e41cec8b2b4310e4bc82619ec6"
        `);
        await queryRunner.query(`
            DROP TABLE "files"
        `);
    }

}
