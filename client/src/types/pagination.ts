export type Pagination<T> = {
    content: T[];
    page: number;
    size: number;
    total_elements: number;
    total_pages: number;
};
