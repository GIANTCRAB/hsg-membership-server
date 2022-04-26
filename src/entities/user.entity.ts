import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { LoginTokenEntity } from './login-token.entity';
import { SpaceEventEntity } from './space-event.entity';
import { IsEmail } from 'class-validator';
import { UserEmailVerificationEntity } from './user-email-verification.entity';
import { PhotoEntity } from './photo.entity';
import { InventoryItemEntity } from './inventory-item.entity';

@Entity({
  name: 'users',
})
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @IsEmail()
  @Column({ unique: true, select: false })
  email: string;

  @Exclude()
  @Column({ select: false })
  hashed_password: string;

  @Column()
  first_name: string;

  @Column()
  last_name: string;

  @Column({ default: false })
  @Index()
  is_admin: boolean;

  @Column({ default: false })
  @Index()
  is_verified: boolean;

  @Column({ default: false })
  @Index()
  is_member: boolean;

  @Column({ default: false })
  @Index()
  is_banned: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(
    () => UserEmailVerificationEntity,
    (user_email_verification) => user_email_verification.user,
  )
  user_email_verifications: UserEmailVerificationEntity[];

  @OneToMany(() => LoginTokenEntity, (login_token) => login_token.user)
  login_tokens: LoginTokenEntity[];

  @OneToMany(() => SpaceEventEntity, (space_event) => space_event.organizer)
  organized_space_events: SpaceEventEntity[];

  @OneToMany(() => SpaceEventEntity, (space_event) => space_event.host)
  hosted_space_events: SpaceEventEntity[];

  @OneToMany(
    () => InventoryItemEntity,
    (inventory_item) => inventory_item.ohp_claimed_by,
  )
  claimed_inventory_items: InventoryItemEntity[];

  @OneToMany(
    () => InventoryItemEntity,
    (inventory_item) => inventory_item.owned_by,
  )
  owned_inventory_items: InventoryItemEntity[];

  @OneToMany(
    () => InventoryItemEntity,
    (inventory_item) => inventory_item.donated_by,
  )
  donated_inventory_items: InventoryItemEntity[];

  @OneToMany(
    () => InventoryItemEntity,
    (inventory_item) => inventory_item.maintained_by,
  )
  maintained_inventory_items: InventoryItemEntity[];

  @OneToMany(
    () => InventoryItemEntity,
    (inventory_item) => inventory_item.created_by,
  )
  created_inventory_items: InventoryItemEntity[];

  @OneToMany(() => PhotoEntity, (photo) => photo.uploaded_by)
  photos: PhotoEntity[];

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }
}
