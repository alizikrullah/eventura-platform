import type {
  OrganizerAttendeeQuery,
  OrganizerAttendeesResponse,
  OrganizerChartsQuery,
  OrganizerChartsResponse,
  OrganizerDashboardSummaryResponse,
} from '@/types/organizerDashboard'
import { api } from '@/utils/api'
import { getApiErrorMessage } from '@/utils/apiError'

export const organizerDashboardService = {
  async getSummary() {
    try {
      const response = await api.get<OrganizerDashboardSummaryResponse>('/organizer/dashboard/summary')
      return response.data.data.summary
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Gagal memuat ringkasan dashboard organizer'))
    }
  },

  async getCharts(query: OrganizerChartsQuery) {
    try {
      const response = await api.get<OrganizerChartsResponse>('/organizer/dashboard/charts', {
        params: query,
      })
      return response.data.data
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Gagal memuat statistik dashboard organizer'))
    }
  },

  async getAttendees(query: OrganizerAttendeeQuery) {
    try {
      const response = await api.get<OrganizerAttendeesResponse>('/organizer/dashboard/attendees', {
        params: query,
      })
      return response.data.data
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Gagal memuat attendee dashboard organizer'))
    }
  },
}