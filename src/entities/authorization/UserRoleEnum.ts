export enum UserRoleEnum {
  USER = "user",
  ADMIN = "admin",
}

export const USER_ROLES_WEIGHT: Record<UserRoleEnum, number> = {
  [UserRoleEnum.USER]: 1,
  [UserRoleEnum.ADMIN]: 2,
};
