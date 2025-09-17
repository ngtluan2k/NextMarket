import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Generated } from 'typeorm';
import { Role } from '../role/role.entity';
import { Permission } from '../permission/permission.entity';


@Entity('role_permissions')
export class RolePermission {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  @Generated('uuid')
  uuid!: string;

  @ManyToOne(() => Role, role => role.rolePermissions)
  @JoinColumn({ name: 'role_id' })
  role!: Role;

  @ManyToOne(() => Permission, permission => permission.rolePermissions)
  @JoinColumn({ name: 'permission_id' })
  permission!: Permission;
}
