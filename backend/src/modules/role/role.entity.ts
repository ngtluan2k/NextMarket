import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { UserRole } from '../user-role/user-role.entity';
import { RolePermission } from '../role-permission/role-permission.entity';
import { Generated } from 'typeorm';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  @Generated('uuid') // ✅ Tự generate uuid
  uuid!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  description!: string;

  @Column()
  created_at!: Date;

  @OneToMany(() => UserRole, (ur) => ur.role)
  userRoles!: UserRole[];

  @OneToMany(() => RolePermission, (rp) => rp.role, { cascade: true })
  rolePermissions!: RolePermission[];
}
