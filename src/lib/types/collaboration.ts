export interface UserProfile {
  name: string;
  color: string;
}

export interface ActiveUserProfile extends UserProfile {
  userId: number;
}
