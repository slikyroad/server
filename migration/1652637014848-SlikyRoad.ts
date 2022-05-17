import {MigrationInterface, QueryRunner} from "typeorm";

export class SlikyRoad1652637014848 implements MigrationInterface {
    name = 'SlikyRoad1652637014848'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`project\` (\`id\` int NOT NULL AUTO_INCREMENT, \`wallet\` varchar(255) NOT NULL, \`hash\` varchar(255) NOT NULL, \`signature\` varchar(255) NOT NULL, \`nfts\` varchar(255) NOT NULL, \`status\` int NOT NULL, \`stage\` int NOT NULL, \`statusMessage\` varchar(255) NOT NULL, \`price\` int NOT NULL, \`colllection\` varchar(255) NOT NULL, \`project\` varchar(255) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`project\``);
    }

}
