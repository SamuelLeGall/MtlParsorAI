export interface UserDB {
  id: string;
  username: string;
  passwordHash: string;
  active: boolean;
  created: Date | string;
  lastConnexion?: Date;
}
