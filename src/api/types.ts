export type ApiError = {
  code: string;
  message: string;
  details?: unknown;
};

export type ApiResponse<T> = {
  data?: T;
  error?: ApiError;
  meta?: unknown;
};

export type RequestUser = {
  id: bigint;
  email: string;
};
