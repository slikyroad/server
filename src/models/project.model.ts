import { Stage, Status } from 'src/dtos';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('project')
export class DBProject {
  @PrimaryGeneratedColumn()
  id?: number;
  @Column()
  wallet: string;
  @Column()
  hash: string;
  @Column()
  signature: string;
  @Column('blob')
  nfts: string; // json string of nfts array
  @Column()
  status: Status;
  @Column()
  stage: Stage;
  @Column()
  statusMessage: string;
  @Column()
  price: number;
  @Column()
  colllection?: string;
  @Column('blob')
  project?: string; // json string of project
}
