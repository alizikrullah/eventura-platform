import { useEffect, useState } from 'react'
import { Loader2, XCircle } from 'lucide-react'
import { organizerTransactionService } from '@/services/organizerTransactionService'
import type { OrganizerTransactionItem, OrganizerTransactionStatus } from '@/types/transaction'

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount)

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

const getStatusBadge = (status: OrganizerTransactionStatus) => {
  const badges = {
    waiting_payment: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-green-100 text-green-800',
    canceled: 'bg-red-100 text-red-800',
    expired: 'bg-gray-100 text-gray-700',
  }
  const labels = {
    waiting_payment: 'Waiting Midtrans',
    paid: 'Paid',
    canceled: 'Canceled',
    expired: 'Expired',
  }

  return {
    className: badges[status],
    label: labels[status],
  }
}

export default function TransactionsManagementPage() {
  const [transactions, setTransactions] = useState<OrganizerTransactionItem[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [pageLoadingId, setPageLoadingId] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const loadTransactions = async (status?: string) => {
    setLoading(true)
    setErrorMessage('')

    try {
      const data = await organizerTransactionService.getTransactions(status)
      setTransactions(data.transactions)
    } catch (error) {
      setTransactions([])
      setErrorMessage(error instanceof Error ? error.message : 'Gagal memuat transaksi organizer')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTransactions(statusFilter || undefined)
  }, [statusFilter])

  const handleReject = async (transactionId: number) => {
    const confirmed = window.confirm('Batalkan transaksi ini? Action ini hanya valid sebelum Midtrans mengonfirmasi pembayaran. Seats, points, coupon, dan voucher akan direstore jika terpakai.')
    if (!confirmed) return

    setPageLoadingId(transactionId)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const result = await organizerTransactionService.rejectTransaction(transactionId)
      setSuccessMessage(result.message)
      await loadTransactions(statusFilter || undefined)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Gagal menolak transaksi')
    } finally {
      setPageLoadingId(null)
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-4 mb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transaction Management</h1>
          <p className="mt-2 text-gray-500">Pantau status transaksi Midtrans dan batalkan transaksi yang masih menunggu pembayaran bila diperlukan.</p>
        </div>

        <label className="flex flex-col gap-1 text-sm text-gray-600 md:min-w-[200px]">
          Filter status
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-200"
          >
            <option value="">Semua status</option>
            <option value="waiting_payment">Waiting Midtrans</option>
            <option value="paid">Paid</option>
            <option value="canceled">Canceled</option>
            <option value="expired">Expired</option>
          </select>
        </label>
      </div>

      {successMessage ? (
        <div className="px-4 py-3 mb-4 text-sm text-green-700 border border-green-100 rounded-2xl bg-green-50">{successMessage}</div>
      ) : null}

      {errorMessage ? (
        <div className="px-4 py-3 mb-4 text-sm text-red-700 border border-red-100 rounded-2xl bg-red-50">{errorMessage}</div>
      ) : null}

      {loading ? (
        <div className="flex items-center justify-center px-6 py-20 bg-white border border-gray-100 shadow-sm rounded-2xl">
          <Loader2 className="w-8 h-8 text-primary-900 animate-spin" />
        </div>
      ) : transactions.length === 0 ? (
        <div className="px-6 py-16 text-center bg-white border border-gray-100 shadow-sm rounded-2xl">
          <h2 className="text-lg font-bold text-gray-800">Belum ada transaksi</h2>
          <p className="mt-2 text-sm text-gray-500">Transaksi organizer akan muncul di sini setelah customer checkout event Anda.</p>
        </div>
      ) : (
        <div className="overflow-hidden bg-white border border-gray-100 shadow-sm rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px]">
              <thead className="border-b border-gray-100 bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase">Transaction</th>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase">Customer</th>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase">Event</th>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase">Amount</th>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map((transaction) => {
                  const statusBadge = getStatusBadge(transaction.status)
                  const isProcessing = pageLoadingId === transaction.id

                  return (
                    <tr key={transaction.id} className="transition-colors hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">{transaction.invoice_number}</div>
                        <div className="text-xs text-gray-400">{formatDate(transaction.paid_at ?? transaction.created_at)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{transaction.customer.name}</div>
                        <div className="text-xs text-gray-400">{transaction.customer.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{transaction.event.name}</div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900 whitespace-nowrap">
                        {formatCurrency(transaction.final_price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${statusBadge.className}`}>
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {transaction.status === 'waiting_payment' ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleReject(transaction.id)}
                                disabled={isProcessing}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                Cancel Before Payment
                              </button>
                            </>
                          ) : (
                            <span className="text-xs font-medium text-gray-400">No action available</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}