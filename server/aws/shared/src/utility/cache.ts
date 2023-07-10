import NodeCache from "node-cache";

const localCache = new NodeCache();

// locally cache the results of a function
export function cachedFunction<T extends (...args: any[]) => any>(f: T): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const key = `${f.name}_${JSON.stringify(args)}`;

    const cachedValue = localCache.get<ReturnType<T>>(key);
    if (cachedValue !== undefined) {
      return cachedValue;
    }

    const value = await f(...args);
    localCache.set(key, value);
    return value;
  }) as T;
}