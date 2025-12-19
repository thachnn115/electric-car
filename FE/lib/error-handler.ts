export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return "Đã xảy ra lỗi không xác định"
}

export function handleApiError(error: unknown, defaultMessage: string): Error {
  const message = getErrorMessage(error)
  return new Error(message || defaultMessage)
}
