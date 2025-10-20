// import {
//   Entity,
//   PrimaryGeneratedColumn,
//   Column,
//   OneToOne,
//   JoinColumn,
//   OneToMany,
// } from 'typeorm';
// import { User } from '../user/user.entity';
// import { CartItem } from './cart_item.entity';

// @Entity('shopping_carts')
// export class ShoppingCart {
//   @PrimaryGeneratedColumn()
//   id!: number;

//   @Column({ type: 'char', unique: true })
//   uuid!: string;

//   @OneToOne(() => User, (user) => user.cart, { onDelete: 'CASCADE' })
//   @JoinColumn({ name: 'user_id' }) // FK ở bảng cart
//   user!: User;

//   @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
//   created_at!: Date;

//   @Column({
//     type: 'timestamp',
//     default: () => 'CURRENT_TIMESTAMP',
//     onUpdate: 'CURRENT_TIMESTAMP',
//   })
//   updated_at!: Date;

//   @OneToMany(() => CartItem, (cartItem) => cartItem.cart, {
//     cascade: true,
//   })
//   items!: CartItem[];
// }
