import {Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn} from "typeorm";
import {Exclude} from "class-transformer";
import {LoginTokenEntity} from "./login-token.entity";

@Entity({
    name: "users",
})
export class UserEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({unique: true})
    email: string;

    @Exclude()
    @Column()
    hashed_password: string;

    @Column()
    first_name: string;

    @Column()
    last_name: string;

    @Column({default: false})
    is_admin: boolean;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @OneToMany(() => LoginTokenEntity, login_token => login_token.user)
    login_tokens: LoginTokenEntity[];

    constructor(partial: Partial<UserEntity>) {
        Object.assign(this, partial);
    }
}
