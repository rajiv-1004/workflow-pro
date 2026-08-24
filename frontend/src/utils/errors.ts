import axios, { AxiosError } from 'axios';
import { APIErrorResponse } from '../types/api';

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<APIErrorResponse>;
    const responseData = axiosError.response?.data;

    if (responseData) {
      // 1. Custom app exception handler format: { error: { message: "...", type: "..." } }
      if (responseData.error?.message) {
        return responseData.error.message;
      }

      // 2. FastAPI validation error format: { detail: [ { loc: [...], msg: "..." } ] }
      if (Array.isArray(responseData.detail) && responseData.detail.length > 0) {
        const first = responseData.detail[0];
        const field = first.loc ? first.loc[first.loc.length - 1] : '';
        return field ? `${String(field)}: ${first.msg}` : (first.msg || 'Validation failed.');
      }

      // 3. String detail: { detail: "Not found" }
      if (typeof responseData.detail === 'string') {
        return responseData.detail;
      }
    }

    // HTTP Status Fallbacks
    switch (axiosError.response?.status) {
      case 400:
        return 'Bad request. Please check your inputs.';
      case 401:
        return 'Incorrect email or password. Please try again.';
      case 403:
        return 'Access denied. You do not have permission for this action.';
      case 404:
        return 'Requested resource was not found.';
      case 409:
        return 'A conflict occurred. The resource might already exist.';
      case 422:
        return 'Validation error. Please verify all required fields.';
      case 500:
        return 'Internal server error. Please try again later.';
      default:
        if (axiosError.message === 'Network Error') {
          return 'Network error. Cannot reach backend server.';
        }
        return axiosError.message || 'An unexpected error occurred.';
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred.';
}

export const extractErrorMessage = getErrorMessage;

