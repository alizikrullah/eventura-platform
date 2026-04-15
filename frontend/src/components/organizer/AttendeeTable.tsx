import { ChevronLeft, ChevronRight, Ticket, Users } from 'lucide-react'
import type { OrganizerAttendeeItem } from '@/types/organizerDashboard'

interface AttendeeTableProps {
  items: OrganizerAttendeeItem[]
  page: number
  totalPages: number
  total: number
  onPreviousPage: () => void
  onNextPage: () => void
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount)

const formatDateTime = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export default function AttendeeTable({
  items,
  page,
  totalPages,
  total,
  onPreviousPage,
  onNextPage,
}: AttendeeTableProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Attendees</h3>
          <p className="text-sm text-gray-500 mt-1">Daftar pembeli tiket dari transaksi yang sudah dibayar</p>
        </div>
        <div className="text-sm text-gray-400">{total.toLocaleString('id-ID')} data</div>
      </div>

      {items.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Users className="w-7 h-7 text-gray-300" />
          </div>
          <h4 className="text-base font-semibold text-gray-800">Belum ada attendee</h4>
          <p className="text-sm text-gray-400 mt-1">Data attendee akan muncul setelah transaksi event organizer dibayar.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Attendee</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Event</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Invoice</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Ticket Qty</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Paid</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Paid At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => (
                  <tr key={item.transactionId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{item.attendeeName}</div>
                      <div className="text-xs text-gray-400 mt-1">Buyer transaction #{item.transactionId}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{item.eventName}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{item.invoiceNumber}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 text-primary-900 px-3 py-1 text-xs font-semibold">
                        <Ticket className="w-3.5 h-3.5" />
                        {item.ticketQuantity.toLocaleString('id-ID')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{formatCurrency(item.totalPricePaid)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatDateTime(item.paidAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-4">
            <p className="text-sm text-gray-400">Halaman {page} dari {totalPages}</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onPreviousPage}
                disabled={page <= 1}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                Prev
              </button>
              <button
                type="button"
                onClick={onNextPage}
                disabled={page >= totalPages}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}