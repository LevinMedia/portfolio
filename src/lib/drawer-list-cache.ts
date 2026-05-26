/** In-memory cache so drawer grids skip reload when remounting after a detail view. */
export function createDrawerListCache<T>() {
  let value: T | null = null

  return {
    get(): T | null {
      return value
    },
    set(next: T): void {
      value = next
    },
    has(): boolean {
      return value !== null
    },
  }
}
