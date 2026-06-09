export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  imageUrl: string;
  publishedAt: string;
  author: string;
  status: 'published' | 'draft';
}

export interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
  maxParticipants: number;
  currentInscriptions: number;
  status: 'upcoming' | 'past' | 'ongoing';
}
