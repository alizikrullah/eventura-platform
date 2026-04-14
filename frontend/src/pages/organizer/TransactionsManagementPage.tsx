import { CheckCircle, XCircle, Eye, Filter } from 'lucide-react';

export default function TransactionsManagementPage() {
  // Placeholder data - nanti diganti dengan real data dari API
  const transactions = [
    { id: 1, customer: 'John Doe', event: 'Music Festival 2026', amount: 'Rp 300.000', status: 'waiting_confirmation', date: '2026-04-13' },
    { id: 2, customer: 'Jane Smith', event: 'Tech Conference 2026', amount: 'Rp 500.000', status: 'waiting_confirmation', date: '2026-04-12' },
    { id: 3, customer: 'Bob Johnson', event: 'Rock Concert 2026', amount: 'Rp 150.000', status: 'done', date: '2026-04-11' },
  ];

  const getStatusBadge = (status: string) => {
    const badges = {
      waiting_confirmation: 'bg-yellow-100 text-yellow-800',
      done: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    const labels = {
      waiting_confirmation: 'Pending',
      done: 'Confirmed',
      rejected: 'Rejected',
    };
    return { class: badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800', label: labels[status as keyof typeof labels] || status };
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transaction Management</h1>
          <p className="text-gray-500 mt-2">Approve atau reject transaksi pembeli</p>
        </div>
        <button className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
          <Filter className="w-4 h-4" />
          Filter
        </button>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Transaction</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Event</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.map((transaction) => {
                const statusBadge = getStatusBadge(transaction.status);
                return (
                  <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">#{transaction.id}</div>
                      <div className="text-xs text-gray-400">{transaction.date}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{transaction.customer}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{transaction.event}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">{transaction.amount}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge.class}`}>
                        {statusBadge.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title="View Details">
                          <Eye className="w-4 h-4 text-gray-600" />
                        </button>
                        {transaction.status === 'waiting_confirmation' && (
                          <>
                            <button className="p-1.5 hover:bg-green-50 rounded-lg transition-colors" title="Approve">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            </button>
                            <button className="p-1.5 hover:bg-red-50 rounded-lg transition-colors" title="Reject">
                              <XCircle className="w-4 h-4 text-red-600" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Placeholder Note */}
      <div className="mt-6 bg-blue-50 border border-blue-100 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Ini halaman placeholder. Nanti akan diintegrasikan dengan real API untuk approve/reject transaksi, view payment proof, dan send email notifications.
        </p>
      </div>
    </div>
  );
}