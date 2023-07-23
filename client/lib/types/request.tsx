export type RequestType<T> =
  | {
      status: 'init';
    }
  | {
      status: 'loading';
    }
  | {
      status: 'loaded';
      data: T;
    }
  | {
      status: 'error';
      error: string;
    };

export type RequestTypeWithPartial<T> =
  | {
      status: 'init';
      data: T;
    }
  | {
      status: 'loading';
      data: T;
    }
  | {
      status: 'loaded';
      data: T;
    }
  | {
      status: 'error';
      data: T;
      error: string;
    };
