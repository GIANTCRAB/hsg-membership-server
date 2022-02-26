import {Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn} from "typeorm";
import {UserEntity} from "./user.entity";
import {IsDate} from "class-validator";

@Entity({
    name: "login_tokens",
})
export class LoginTokenEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({unique: true})
    value: string;

    @Column({default: true})
    @Index()
    is_valid: boolean;

    @CreateDateColumn()
    created_at: Date;

    @Column()
    @IsDate()
    @Index()
    expires_at: Date;

    @ManyToOne(() => UserEntity, user => user.login_tokens)
    user: UserEntity;

    constructor(partial: Partial<LoginTokenEntity>) {
        Object.assign(this, partial);
    }
}
