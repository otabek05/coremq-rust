export type User = {
    username: string;
    password_hash: string;
    role: string;
};

export type CreateUserRequest = {
    username: string;
    password_hash: string;
    role: string;
};
