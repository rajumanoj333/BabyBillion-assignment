// projects/filter-lib/src/lib/filter/options.service.ts
/**
 * MockOptionsService
 *
 * Simulates an async paginated options endpoint.
 * - search: string
 * - page: 1-based page number
 *
 * Each page returns `pageSize` items, and total simulated items will be `totalItems`.
 *
 * This is intentionally simple — replace with HTTP calls to your backend later.
 */

export interface OptionItem {
  label: string;
  value: string;
}

export interface PageResult {
  items: OptionItem[];
  page: number;
  totalPages: number;
  totalItems: number;
}

export class MockOptionsService {
  private pageSize = 6;
  private totalItems = 30;

  // Simulate namespaced data per filterName for deterministic results
  private createAllItems(filterName: string): OptionItem[] {
    const list: OptionItem[] = [];
    for (let i = 1; i <= this.totalItems; i++) {
      list.push({
        label: `${filterName} option ${i}`,
        value: `${filterName}-opt-${i}`
      });
    }
    return list;
  }

  async search(filterName: string, search: string | undefined, page = 1, delayMs = 400): Promise<PageResult> {
    // Simulate network latency
    await new Promise(res => setTimeout(res, delayMs));

    const all = this.createAllItems(filterName);

    // Basic search: case-insensitive substring match
    const filtered = (search && search.trim().length > 0)
      ? all.filter(i => i.label.toLowerCase().includes(search.trim().toLowerCase()))
      : all;

    const totalItems = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / this.pageSize));
    const p = Math.max(1, Math.min(page, totalPages));
    const start = (p - 1) * this.pageSize;
    const items = filtered.slice(start, start + this.pageSize);

    return { items, page: p, totalPages, totalItems };
  }
}
