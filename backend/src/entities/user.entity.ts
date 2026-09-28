import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from "typeorm";
import { Note } from "./note.entity";

export enum Role {
  USER = "USER",
  ADMIN = "ADMIN",
}

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Index({ unique: true })
  @Column()
  email: string;

  @Column()
  password: string;

  @Column({ type: "enum", enum: Role, default: Role.USER })
  role: Role;

  @Column({ default: false })
  isBanned: boolean;

  @Column({ default: false })
  isEmailVerified: boolean;

  @Index({ unique: true, where: '"emailVerifyToken" IS NOT NULL' })
  @Column({ type: "varchar", nullable: true })
  emailVerifyToken: string | null;

  @Column({ type: "timestamptz", nullable: true })
  emailVerifyExpires: Date | null;

  @Index({ unique: true, where: '"resetPasswordToken" IS NOT NULL' })
  @Column({ type: "varchar", nullable: true })
  resetPasswordToken: string | null;

  @Column({ type: "timestamptz", nullable: true })
  resetPasswordExpires: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Note, (note) => note.author)
  notes: Note[];
}
