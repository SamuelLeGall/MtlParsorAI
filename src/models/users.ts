export type UserRole = "ADMINISTRATOR" | "GUEST";
export interface UserDB {
  id: string;
  username: string;
  passwordHash: string;
  active: boolean;
  created: Date | string;
  lastConnexion?: Date;
  roles: UserRole[];
}
