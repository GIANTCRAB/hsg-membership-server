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
import { InventoryCategoryEntity } from './inventory-category.entity';

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

  @ManyToOne(() => UserEntity, (user) => user.donated_inventory_items, {
    nullable: true,
  })
  maintained_by: UserEntity;

  @ManyToOne(() => UserEntity, (user) => user.created_inventory_items, {
    nullable: true,
  })
  created_by: UserEntity;

  @ManyToOne(
    () => InventoryCategoryEntity,
    (category) => category.inventory_items,
    {
      nullable: true,
    },
  )
  category: InventoryCategoryEntity;

  @ManyToOne(() => PhotoEntity, { nullable: true })
  photo: PhotoEntity;

  constructor(partial: Partial<InventoryItemEntity>) {
    Object.assign(this, partial);
  }
}
