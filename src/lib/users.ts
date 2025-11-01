import { User } from './auth';
import bcrypt from 'bcrypt';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function authenticateUser(
  email: string,
  password: string
): Promise<User | null> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase().trim()))
    .limit(1);
  
  if (result.length === 0) {
    return null;
  }
  
  const user = result[0];
  const isValid = await bcrypt.compare(password, user.password);
  
  if (!isValid) {
    return null;
  }
  
  // Return user without password
  return {
    id: user.id.toString(),
    email: user.email,
    name: user.name,
    role: user.role as User['role'],
  };
}

export async function getAllUsers(): Promise<User[]> {
  const result = await db.select().from(users);
  return result.map((user) => ({
    id: user.id.toString(),
    email: user.email,
    name: user.name,
    role: user.role as User['role'],
  }));
}

export async function getUserById(id: string): Promise<User | null> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, parseInt(id)))
    .limit(1);
  
  if (result.length === 0) {
    return null;
  }
  
  const user = result[0];
  return {
    id: user.id.toString(),
    email: user.email,
    name: user.name,
    role: user.role as User['role'],
  };
}