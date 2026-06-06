import api from './api';

export const createMember = async (memberData: any) => {
  const response = await api.post('/members', memberData);
  return response.data.data;
};

export const loginMember = async (credentials: { full_name: string; phone: string }) => {
  const response = await api.post('/members/login', credentials);
  return response.data.data;
};

export const logoutMember = async () => {
  await api.post('/members/logout');
};

export const fetchMembers = async (query = '') => {
  const response = await api.get('/members', { params: query ? { q: query } : undefined });
  return response.data.data;
};

export const updateMemberStatus = async (memberId: string, status: string) => {
  const response = await api.patch(`/members/${memberId}/status`, { status });
  const payload = response.data.data;
  return Array.isArray(payload) ? payload[0] : payload;
};

export const fetchMemberActivities = async (memberId: string) => {
  const response = await api.get(`/members/${memberId}/activities`);
  return response.data.data;
};

export const updateMember = async (memberId: string, memberData: {
  full_name: string;
  phone: string;
  email: string;
  sex: 'homme' | 'femme' | 'non_precise';
  birth_date: string | null;
  commune: string;
  status: 'aspirant' | 'ureporter' | 'mentor';
  commission?: string;
}) => {
  const response = await api.patch(`/members/${memberId}`, memberData);
  const payload = response.data.data;
  return Array.isArray(payload) ? payload[0] : payload;
};

export const fetchMemberContributions = async (memberId: string) => {
  const response = await api.get(`/members/${memberId}/contributions`);
  return response.data.data;
};

// ---------------------------------------------------------------------------
// Awards / Prix
// ---------------------------------------------------------------------------

export interface MemberAward {
  id: string;
  member_id: string;
  award_name: string;
  award_type: 'ugirl' | 'best_ureporter' | 'award' | 'custom' | 'certificate';
  awarded_year: number;
  description: string;
  document_url?: string;
  issuer?: string;
  created_at: string;
}

export const fetchMemberAwards = async (memberId: string): Promise<MemberAward[]> => {
  try {
    const response = await api.get(`/members/${memberId}/awards`);
    return response.data.data || [];
  } catch (err: any) {
    // If the table doesn't exist yet (migration pending), return empty array silently
    if (err?.response?.status === 500 || err?.response?.status === 404) {
      return [];
    }
    throw err;
  }
};

export const addMemberAward = async (
  memberId: string,
  award: {
    award_name: string;
    award_type: MemberAward['award_type'];
    awarded_year: number;
    description?: string;
    document_url?: string;
    issuer?: string;
  }
): Promise<MemberAward> => {
  const response = await api.post(`/members/${memberId}/awards`, award);
  return response.data.data;
};

export const deleteMemberAward = async (memberId: string, awardId: string): Promise<void> => {
  await api.delete(`/members/${memberId}/awards/${awardId}`);
};

export const updateMemberLogistics = async (
  memberId: string,
  logisticsData: {
    interview_passed?: boolean;
    tshirt_received?: boolean;
    is_pco?: boolean;
    commission?: string;
    integration_note?: string;
  }
) => {
  const response = await api.patch(`/members/${memberId}`, logisticsData);
  const payload = response.data.data;
  return Array.isArray(payload) ? payload[0] : payload;
};

