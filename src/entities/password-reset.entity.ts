import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { IsDate, IsEmail } from 'class-validator';
import { UserEntity } from './user.entity';

@Entity({
  name: 'password_resets',
})
export class PasswordResetEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @IsEmail()
  email: string;

  @Column()
  @Index()
  code: string;

  @Column({ default: true })
  @Index()
  is_valid: boolean;

  @CreateDateColumn()
  created_at: Date;

  @Column()
  @IsDate()
  @Index()
  expires_at: Date;

  @ManyToOne(() => UserEntity, (user) => user.password_resets, {
    nullable: false,
  })
  user: UserEntity;

  constructor(partial: Partial<PasswordResetEntity>) {
    Object.assign(this, partial);
  }
}
