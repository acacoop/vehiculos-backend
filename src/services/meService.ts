import { getUserById } from './usersService';
import { User } from '../interfaces/user';

export const getCurrentUser = async (id: string): Promise<User | null> => {
  return await getUserById(id);
};
