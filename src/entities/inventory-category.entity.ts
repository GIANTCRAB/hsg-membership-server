import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { InventoryItemEntity } from './inventory-item.entity';

@Entity({
  name: 'inventory_categories',
})
export class InventoryCategoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'mediumtext' })
  description: string;

  @Column({ default: true })
  @Index()
  is_valid: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(
    () => InventoryItemEntity,
    (inventory_item) => inventory_item.category,
  )
  inventory_items: InventoryItemEntity[];

  constructor(partial: Partial<InventoryCategoryEntity>) {
    Object.assign(this, partial);
  }
}
