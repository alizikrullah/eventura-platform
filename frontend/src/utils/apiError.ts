import axios from 'axios'

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data as { error?: string; message?: string } | undefined

    if (responseData?.error) {
      return responseData.error
    }

    if (responseData?.message) {
      return responseData.message
    }
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}