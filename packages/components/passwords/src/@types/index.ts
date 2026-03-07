export type PasswordEntity = {
    url: string;
    userName: string;
    password: string[];
};

export type PasswordWriteResult = {
    inserted: boolean;
    updated: boolean;
    skipped: boolean;
    data: PasswordEntity;
};
