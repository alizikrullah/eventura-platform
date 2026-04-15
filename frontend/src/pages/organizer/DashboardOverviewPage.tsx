import { useEffect, useMemo, useState } from 'react'
import {
  Calendar,
  DollarSign,
  Loader2,
  Search,
  Ticket,
  TrendingUp,
  Users,
} from 'lucide-react'
import AttendeeTable from '@/components/organizer/AttendeeTable'
import DashboardStatCard from '@/components/organizer/DashboardStatCard'
import TrendChartCard from '@/components/organizer/TrendChartCard'
import { organizerDashboardService } from '@/services/organizerDashboardService'
import type {
  OrganizerAttendeeItem,
  OrganizerChartPeriod,
  OrganizerChartsResponse,
  OrganizerDashboardSummary,
} from '@/types/organizerDashboard'

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount)

const currentDate = new Date()
const defaultYear = currentDate.getFullYear()
const defaultMonth = currentDate.getMonth() + 1
const defaultDay = currentDate.getDate()

const initialSummary: OrganizerDashboardSummary = {
  totalEvents: 0,
  activeEvents: 0,
  totalPaidTransactions: 0,
  totalRevenue: 0,
  totalAttendees: 0,
}

export default function DashboardOverviewPage() {
  const [summary, setSummary] = useState<OrganizerDashboardSummary>(initialSummary)
  const [summaryError, setSummaryError] = useState('')
  const [summaryLoading, setSummaryLoading] = useState(true)

  const [period, setPeriod] = useState<OrganizerChartPeriod>('month')
  const [year, setYear] = useState(defaultYear)
  const [month, setMonth] = useState(defaultMonth)
  const [day, setDay] = useState(defaultDay)
  const [charts, setCharts] = useState<OrganizerChartsResponse['data'] | null>(null)
  const [chartError, setChartError] = useState('')
  const [chartLoading, setChartLoading] = useState(true)

  const [attendees, setAttendees] = useState<OrganizerAttendeeItem[]>([])
  const [attendeePage, setAttendeePage] = useState(1)
  const [attendeeTotalPages, setAttendeeTotalPages] = useState(1)
  const [attendeeTotal, setAttendeeTotal] = useState(0)
  const [attendeeEventId, setAttendeeEventId] = useState<number | undefined>()
  const [attendeeSearchInput, setAttendeeSearchInput] = useState('')
  const [attendeeSearch, setAttendeeSearch] = useState('')
  const [attendeeEventOptions, setAttendeeEventOptions] = useState<Array<{ id: number; name: string }>>([])
  const [attendeeLoading, setAttendeeLoading] = useState(true)
  const [attendeeError, setAttendeeError] = useState('')

  const yearOptions = useMemo(
    () => Array.from({ length: 5 }, (_, index) => defaultYear - index),
    [],
  )

  const dayOptions = useMemo(() => {
    const daysInMonth = new Date(year, month, 0).getDate()
    return Array.from({ length: daysInMonth }, (_, index) => index + 1)
  }, [year, month])

  useEffect(() => {
    if (day > dayOptions.length) {
      setDay(dayOptions.length)
    }
  }, [day, dayOptions])

  useEffect(() => {
    const loadSummary = async () => {
      setSummaryLoading(true)
      setSummaryError('')

      try {
        const data = await organizerDashboardService.getSummary()
        setSummary(data)
      } catch (error) {
        setSummaryError(error instanceof Error ? error.message : 'Gagal memuat ringkasan dashboard organizer')
      } finally {
        setSummaryLoading(false)
      }
    }

    loadSummary()
  }, [])

  useEffect(() => {
    const loadCharts = async () => {
      setChartLoading(true)
      setChartError('')

      try {
        const data = await organizerDashboardService.getCharts({
          period,
          year,
          ...(period !== 'year' ? { month } : {}),
          ...(period === 'day' ? { day } : {}),
        })

        setCharts(data)
      } catch (error) {
        setChartError(error instanceof Error ? error.message : 'Gagal memuat grafik dashboard organizer')
      } finally {
        setChartLoading(false)
      }
    }

    loadCharts()
  }, [period, year, month, day])

  useEffect(() => {
    const loadAttendees = async () => {
      setAttendeeLoading(true)
      setAttendeeError('')

      try {
        const data = await organizerDashboardService.getAttendees({
          page: attendeePage,
          limit: 10,
          ...(attendeeEventId ? { eventId: attendeeEventId } : {}),
          ...(attendeeSearch ? { search: attendeeSearch } : {}),
        })

        setAttendees(data.items)
        setAttendeeTotal(data.meta.total)
        setAttendeeTotalPages(data.meta.totalPages)
        setAttendeeEventOptions(data.eventOptions)
      } catch (error) {
        setAttendeeError(error instanceof Error ? error.message : 'Gagal memuat attendee organizer')
        setAttendees([])
        setAttendeeTotal(0)
        setAttendeeTotalPages(1)
      } finally {
        setAttendeeLoading(false)
      }
    }

    loadAttendees()
  }, [attendeePage, attendeeEventId, attendeeSearch])

  const stats = [
    {
      label: 'Total Events',
      value: summary.totalEvents.toLocaleString('id-ID'),
      icon: Calendar,
      colorClass: 'bg-blue-500',
      hint: 'Semua event milik organizer',
    },
    {
      label: 'Active Events',
      value: summary.activeEvents.toLocaleString('id-ID'),
      icon: TrendingUp,
      colorClass: 'bg-green-500',
      hint: 'Event yang masih aktif',
    },
    {
      label: 'Paid Transactions',
      value: summary.totalPaidTransactions.toLocaleString('id-ID'),
      icon: Ticket,
      colorClass: 'bg-amber-500',
      hint: 'Transaksi dengan status paid',
    },
    {
      label: 'Total Revenue',
      value: formatCurrency(summary.totalRevenue),
      icon: DollarSign,
      colorClass: 'bg-primary-900',
      hint: 'Akumulasi final price transaksi paid',
    },
    {
      label: 'Total Attendees',
      value: summary.totalAttendees.toLocaleString('id-ID'),
      icon: Users,
      colorClass: 'bg-orange-500',
      hint: 'Akumulasi ticket quantity terjual',
    },
  ]

  const handleAttendeeSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAttendeePage(1)
    setAttendeeSearch(attendeeSearchInput.trim())
  }

  const handleEventFilterChange = (value: string) => {
    setAttendeePage(1)
    setAttendeeEventId(value ? Number(value) : undefined)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-500 mt-2">Monitor performa event, revenue, dan attendee dari event organizer kamu.</p>
        </div>
      </div>

      {summaryError ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-700">{summaryError}</div>
      ) : null}

      {summaryLoading ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-16 flex items-center justify-center gap-3 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          Memuat ringkasan dashboard...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
          {stats.map((stat) => (
            <DashboardStatCard key={stat.label} {...stat} />
          ))}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Visual Statistics</h2>
            <p className="text-sm text-gray-500 mt-1">Lihat tren revenue dan attendee berdasarkan periode waktu.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:min-w-[560px]">
            <label className="flex flex-col gap-1 text-sm text-gray-600">
              Period
              <select
                value={period}
                onChange={(event) => setPeriod(event.target.value as OrganizerChartPeriod)}
                className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-200"
              >
                <option value="year">Year</option>
                <option value="month">Month</option>
                <option value="day">Day</option>
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm text-gray-600">
              Year
              <select
                value={year}
                onChange={(event) => setYear(Number(event.target.value))}
                className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-200"
              >
                {yearOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>

            {period !== 'year' ? (
              <label className="flex flex-col gap-1 text-sm text-gray-600">
                Month
                <select
                  value={month}
                  onChange={(event) => setMonth(Number(event.target.value))}
                  className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-200"
                >
                  {Array.from({ length: 12 }, (_, index) => index + 1).map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>
            ) : <div />}

            {period === 'day' ? (
              <label className="flex flex-col gap-1 text-sm text-gray-600">
                Day
                <select
                  value={day}
                  onChange={(event) => setDay(Number(event.target.value))}
                  className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-200"
                >
                  {dayOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>
            ) : <div />}
          </div>
        </div>
      </div>

      {chartError ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-700">{chartError}</div>
      ) : null}

      {chartLoading ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-20 flex items-center justify-center gap-3 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          Memuat chart dashboard...
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <TrendChartCard
            title="Revenue Trend"
            description="Pergerakan revenue dari transaksi paid sesuai periode yang dipilih."
            data={charts?.revenue ?? []}
            dataKey="Revenue"
            color="#0f172a"
            emptyMessage="Belum ada revenue pada periode ini."
            formatValue={(value) => formatCurrency(value)}
          />
          <TrendChartCard
            title="Attendee Trend"
            description="Total ticket quantity yang terjual pada periode yang dipilih."
            data={charts?.attendees ?? []}
            dataKey="Attendees"
            color="#f97316"
            emptyMessage="Belum ada attendee pada periode ini."
          />
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Attendee Filters</h2>
            <p className="text-sm text-gray-500 mt-1">Cari attendee berdasarkan event organizer atau invoice.</p>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <label className="flex flex-col gap-1 text-sm text-gray-600 min-w-[220px]">
              Event
              <select
                value={attendeeEventId ?? ''}
                onChange={(event) => handleEventFilterChange(event.target.value)}
                className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-200"
              >
                <option value="">Semua event</option>
                {attendeeEventOptions.map((option) => (
                  <option key={option.id} value={option.id}>{option.name}</option>
                ))}
              </select>
            </label>

            <form onSubmit={handleAttendeeSearchSubmit} className="flex items-end gap-2">
              <label className="flex flex-col gap-1 text-sm text-gray-600 min-w-[240px]">
                Search
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={attendeeSearchInput}
                    onChange={(event) => setAttendeeSearchInput(event.target.value)}
                    placeholder="Cari nama attendee atau invoice"
                    className="w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-200"
                  />
                </div>
              </label>
              <button
                type="submit"
                className="rounded-xl bg-primary-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-800 transition-colors"
              >
                Terapkan
              </button>
            </form>
          </div>
        </div>
      </div>

      {attendeeError ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-700">{attendeeError}</div>
      ) : null}

      {attendeeLoading ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-20 flex items-center justify-center gap-3 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          Memuat attendee organizer...
        </div>
      ) : (
        <AttendeeTable
          items={attendees}
          page={attendeePage}
          totalPages={attendeeTotalPages}
          total={attendeeTotal}
          onPreviousPage={() => setAttendeePage((current) => Math.max(1, current - 1))}
          onNextPage={() => setAttendeePage((current) => Math.min(attendeeTotalPages, current + 1))}
        />
      )}
    </div>
  )
}