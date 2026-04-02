export interface AuthUser {
    token: string;
    email: string;
    name: string;
    roles: string[];
}

export interface LoginRequest {
    email: string;
    password: string;
}
