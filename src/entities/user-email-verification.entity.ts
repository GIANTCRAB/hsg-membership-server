import {Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn} from "typeorm";
import {UserEntity} from "./user.entity";
import {IsDate, IsEmail} from "class-validator";

@Entity({
    name: "user_email_verifications",
})
export class UserEmailVerificationEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    @IsEmail()
    email: string;

    @Column()
    @Index()
    code: string;

    @Column({default: false})
    @Index()
    is_verified: boolean;

    @Column({default: true})
    @Index()
    is_valid: boolean;

    @CreateDateColumn()
    created_at: Date;

    @Column()
    @IsDate()
    @Index()
    expires_at: Date;

    @ManyToOne(() => UserEntity, user => user.user_email_verifications, {nullable: false})
    user: UserEntity;

    constructor(partial: Partial<UserEmailVerificationEntity>) {
        Object.assign(this, partial);
    }
}
