export type UserType = {
  hasSpotifyAuth: boolean;
  hasExpoPushToken: boolean;
};

export type SetUserType = {
  expoPushToken?: string;
};
