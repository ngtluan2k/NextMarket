import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { Conversation } from './conversation.entity';

export enum SenderType {
  USER = 'user',
  STORE = 'store',
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
}

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Conversation, (conversation) => conversation.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversation_id' })
  conversation!: Conversation;

  @Column()
  sender_id?: number;  // ID thực tế của user hoặc store

  @Column({ type: 'enum', enum: SenderType })
  sender_type?: SenderType;

  @Column({ type: 'enum', enum: MessageType, default: MessageType.TEXT })
  message_type?: MessageType;

  @Column({ type: 'text', nullable: true })
  content?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  media_url?: string;

  @Column({ type: 'boolean', default: false })
  is_read?: boolean;

  @CreateDateColumn({ type: 'datetime' })
  created_at?: Date;
}
