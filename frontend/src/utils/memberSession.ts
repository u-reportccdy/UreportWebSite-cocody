export interface MemberSession {
  id: string;
  full_name: string;
  phone: string;
  email?: string;
  status?: string;
  sex?: string;
}

interface StoredMemberSession {
  id: string;
  full_name: string;
}

const MEMBER_SESSION_KEY = 'member_session';
const MEMBER_SESSION_EVENT = 'member-session-changed';

function dispatchMemberSessionChange() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(MEMBER_SESSION_EVENT));
}

export function loadMemberSession(): MemberSession | null {
  if (typeof window === 'undefined') return null;
  const saved = localStorage.getItem(MEMBER_SESSION_KEY);
  if (!saved) return null;
  try {
    return JSON.parse(saved) as MemberSession;
  } catch {
    return null;
  }
}

export function saveMemberSession(session: MemberSession) {
  if (typeof window === 'undefined') return;
  const storedSession: StoredMemberSession = {
    id: session.id,
    full_name: session.full_name,
  };
  localStorage.setItem(MEMBER_SESSION_KEY, JSON.stringify(storedSession));
  dispatchMemberSessionChange();
}

export function clearMemberSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(MEMBER_SESSION_KEY);
  dispatchMemberSessionChange();
}

export function subscribeMemberSessionChange(callback: () => void) {
  if (typeof window === 'undefined') return () => undefined;
  window.addEventListener('storage', callback);
  window.addEventListener(MEMBER_SESSION_EVENT, callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(MEMBER_SESSION_EVENT, callback);
  };
}
