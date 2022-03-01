import {Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn} from "typeorm";
import {UserEntity} from "./user.entity";
import {IsDate} from "class-validator";

@Entity({
    name: "space_events",
})
export class SpaceEventEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    title: string;

    @Column({type: "mediumtext"})
    description: string;

    @Column({default: true})
    @Index()
    is_valid: boolean;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @Column()
    @IsDate()
    @Index()
    event_start_date: Date;

    @Column()
    @IsDate()
    @Index()
    event_end_date: Date;

    @ManyToOne(() => UserEntity, user => user.login_tokens)
    organizer: UserEntity;

    constructor(partial: Partial<SpaceEventEntity>) {
        Object.assign(this, partial);
    }
}
