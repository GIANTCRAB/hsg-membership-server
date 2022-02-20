import {Column, Entity, PrimaryGeneratedColumn} from "typeorm";
import {Exclude} from "class-transformer";

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
    hashedPassword: string;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @Column({default: false})
    isAdmin: boolean;

    constructor(partial: Partial<UserEntity>) {
        Object.assign(this, partial);
    }
}
