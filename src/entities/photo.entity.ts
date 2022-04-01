import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';

@Entity({
  name: 'photos',
})
export class PhotoEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 127 })
  filename: string;

  @Column()
  title: string;

  @Column({ length: 31 })
  mime_type: string;

  @Column({ default: true })
  @Index()
  is_valid: boolean;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => UserEntity, (uploaded_by) => uploaded_by.photos, {
    nullable: true,
  })
  uploaded_by: UserEntity;

  constructor(partial: Partial<PhotoEntity>) {
    Object.assign(this, partial);
  }
}
