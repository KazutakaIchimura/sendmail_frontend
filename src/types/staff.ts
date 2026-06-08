export type Role = 'ADMIN' | 'STAFF';

export type Staff = {
  id: number;
  name: string;
  email: string;
  role: Role;
  roleId: number;
  isActive: boolean;
  forcePasswordChange: boolean;
  createdAt: string;
};

export type RoleOption = {
  id: number;
  name: Role;
};
