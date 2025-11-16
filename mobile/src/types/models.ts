export interface User {
    id: string;
    email: string;
    fullName: string;
    googleId?: string;
    pictureUrl?: string;
    defaultCurrency?: string;
    isAdmin?: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface List {
    id: string;
    name: string;
    adminId: string;
    inviteCode: string;
    createdAt: string;
    updatedAt: string;
}

export enum MemberStatus {
    Pending = 'pending',
    Active = 'active',
}

export interface ListMember {
    id: string;
    listId: string;
    userId?: string;
    email: string;
    splitPercentage: number;
    isValidator: boolean;
    status: MemberStatus;
    joinedAt?: string;
    createdAt: string;
    user?: User;
}

export enum ExpenseStatus {
    Draft = 'draft',
    Submitted = 'submitted',
    Validated = 'validated',
    Rejected = 'rejected',
}

export interface Expense {
    id: string;
    listId: string;
    authorId: string;
    title: string;
    amount: number;
    currency: string;
    expenseDate: string;
    notes?: string;
    receiptUrl?: string;
    status: ExpenseStatus;
    serverTimestamp: string;
    paidByMemberId?: string | null;
    insertedAt: string;
    createdAt: string;
    updatedAt: string;
    author?: User;
    paidByMember?: ListMember;
    validations?: ExpenseValidation[];
    splits?: ExpenseSplit[];
}

export enum ValidationStatus {
    Validated = 'validated',
    Rejected = 'rejected',
}

export interface ExpenseValidation {
    id: string;
    expenseId: string;
    validatorId: string;
    status: ValidationStatus;
    notes?: string;
    validatedAt: string;
    validator?: User;
}

export interface ExpenseSplit {
    id: string;
    expenseId: string;
    memberId: string;
    amount: number;
    percentage: number;
    member?: ListMember;
}

export enum ReimbursementStatus {
    Pending = 'pending',
    Completed = 'completed',
}

export interface Reimbursement {
    id: string;
    listId: string;
    fromUserId: string;
    toUserId: string;
    amount: number;
    currency: string;
    status: ReimbursementStatus;
    completedAt?: string;
    serverTimestamp: string;
    createdAt: string;
    fromUser?: User;
    toUser?: User;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user: User;
}

export interface LoginRequest {
    googleIdToken: string;
}

export interface LoginResponse {
    user: User;
    tokens: AuthTokens;
}

export interface ApiError {
    message: string;
    statusCode: number;
    details?: any;
}
