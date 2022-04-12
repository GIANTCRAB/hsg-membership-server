import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { PhotoEntity } from './photo.entity';
import { IsDate } from 'class-validator';

@Entity({
  name: 'inventory_items',
})
export class InventoryItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'mediumtext' })
  description: string;

  @Column({ default: 1, type: 'smallint' })
  item_count: number;

  @Column({ default: true })
  @Index()
  is_valid: boolean;

  @Column({ default: true })
  @Index()
  is_in_space: boolean;

  @Column({ default: true })
  @Index()
  is_working: boolean;

  @Column({ type: 'mediumtext', nullable: true })
  not_working_description: string;

  @Column({ nullable: true })
  @IsDate()
  not_working_start_date: Date;

  @Column({ default: false })
  @Index()
  is_in_ohp_process: boolean;

  @Column({ default: false })
  @Index()
  is_ohp: boolean;

  @Column({ nullable: true })
  @IsDate()
  ohp_start_date: Date;

  @Column({ nullable: true })
  @IsDate()
  ohp_end_date: Date;

  @Column({ nullable: true })
  @IsDate()
  ohp_disposed_date: Date;

  @Column({ nullable: true })
  @IsDate()
  ohp_claimed_date: Date;

  @ManyToOne(() => UserEntity, (user) => user.claimed_inventory_items, {
    nullable: true,
  })
  ohp_claimed_by: UserEntity;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => UserEntity, (user) => user.owned_inventory_items, {
    nullable: true,
  })
  owned_by: UserEntity;

  @ManyToOne(() => UserEntity, (user) => user.donated_inventory_items, {
    nullable: true,
  })
  donated_by: UserEntity;

  @ManyToOne(() => PhotoEntity, { nullable: true })
  photo: PhotoEntity;

  constructor(partial: Partial<InventoryItemEntity>) {
    Object.assign(this, partial);
  }
}
