export type RequestStatus = 'init' | 'loading' | 'loaded' | 'error';

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

export type RequestTypeWithPendingReload<T, U> =
  | RequestType<T>
  | {
      status: 'pending_reload';
      data: T;
      reloadData: U;
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
