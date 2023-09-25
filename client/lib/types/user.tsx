// a user's settings data
export type UserType = {
  hasSpotifyAuth: boolean;
  hasExpoPushToken: boolean;
};

// the data that the client can write to the user's settings data
export type SetUserType = {
  expoPushToken?: string;
};
