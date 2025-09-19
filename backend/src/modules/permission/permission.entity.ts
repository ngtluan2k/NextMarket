import { Entity, PrimaryGeneratedColumn, Column, OneToMany, Generated } from 'typeorm';
import { RolePermission } from '../role-permission/role-permission.entity';


@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  @Generated('uuid')
  uuid!: string;

  @Column()
  code!: string;

  @Column({ nullable: true })
  description!: string;

  @OneToMany(() => RolePermission, rp => rp.permission)
  rolePermissions!: RolePermission[];
}
