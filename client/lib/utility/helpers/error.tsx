// converts an error of an unknown type to a string
export const errorToString = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
};
