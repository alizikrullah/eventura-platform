import type {
  OrganizerTransactionActionResponse,
  OrganizerTransactionsResponse,
} from '@/types/transaction'
import { api } from '@/utils/api'
import { getApiErrorMessage } from '@/utils/apiError'

export const organizerTransactionService = {
  async getTransactions(status?: string) {
    try {
      const response = await api.get<OrganizerTransactionsResponse>('/transactions/organizer/manage', {
        params: status ? { status } : undefined,
      })
      return response.data.data
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Gagal memuat transaksi organizer'))
    }
  },
  async rejectTransaction(transactionId: number) {
    try {
      const response = await api.patch<OrganizerTransactionActionResponse>(`/transactions/${transactionId}/reject`)
      return response.data
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Gagal menolak transaksi'))
    }
  },
}