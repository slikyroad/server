import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('user-collection')
export class UserCollection {
  @PrimaryGeneratedColumn()
  id?: number;
  @Column()
  wallet: string;
  @Column()
  collection: string;
  @Column()
  tokenId: number;
}
