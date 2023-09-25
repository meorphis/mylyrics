import {AnyAction, Dispatch, MiddlewareAPI} from '@reduxjs/toolkit';
import {RootState} from '..';

export const logTimingMiddleware =
  (_: MiddlewareAPI<Dispatch<AnyAction>, RootState>) =>
  (next: Dispatch<AnyAction>) =>
  (action: AnyAction) => {
    const start = performance.now();
    const result = next(action);
    const end = performance.now();
    console.log(`${action.type} took ${end - start} ms`);
    return result;
  };
