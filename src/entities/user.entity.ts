import {Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn} from "typeorm";
import {Exclude} from "class-transformer";
import {LoginTokenEntity} from "./login-token.entity";
import {SpaceEventEntity} from "./space-event.entity";

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
    @Index()
    is_admin: boolean;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @OneToMany(() => LoginTokenEntity, login_token => login_token.user)
    login_tokens: LoginTokenEntity[];

    @OneToMany(() => SpaceEventEntity, space_event => space_event.organizer)
    organized_space_events: SpaceEventEntity[];

    constructor(partial: Partial<UserEntity>) {
        Object.assign(this, partial);
    }
}
