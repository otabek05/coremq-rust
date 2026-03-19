export class ApiResponse<T> {
    data?: T;
    message: string;
    status_code: number;

    constructor(data: T | undefined, message: string, status_code: number) {
        this.data = data;
        this.message = message;
        this.status_code = status_code;
    }

    isError(): boolean {
        return this.status_code >= 400;
    }

    isSuccess(): boolean {
        return this.status_code < 400;
    }
}
