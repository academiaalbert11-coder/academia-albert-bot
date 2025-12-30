
export type UserRole = 'admin' | 'user' | 'student';

export interface Profile {
  id: string;
  FullName: string;
  Email: string;
  Phone: string;
  Role: UserRole;
  Password?: string;
  whatsapp?: string;
  supportEmail?: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  promoPrice?: number;
  bannerUrl: string;
  created_at?: string;
  isFree?: boolean;
  homeVideoUrl?: string;
}

export interface Module {
  id: string;
  course_id: string;
  title: string;
  order_index: number;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correct_index: number;
}

export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  content_type: 'video' | 'text' | 'pdf' | 'quiz';
  video_url?: string;
  pdf_url?: string;
  content_text?: string;
  quiz_data?: QuizQuestion[];
  order_index: number;
}

export interface Enrollment {
  id: string;
  profile_id: string;
  course_id: string;
  status: 'pending' | 'paid';
  created_at: string;
}

export interface Payment {
  id: string;
  invoice_id: string;
  method: 'MPESA' | 'EMOLA' | 'BIM';
  status: 'success' | 'failed';
  amount: number;
  created_at: string;
}

export interface ForumTopic {
  id: string;
  title: string;
  description: string;
  author_id: string;
  created_at: string;
  author?: Profile;
}

export interface ForumPost {
  id: string;
  topic_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author?: Profile;
}
