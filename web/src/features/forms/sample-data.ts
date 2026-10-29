import type { FormStatus } from '../../components/ui/StatusBadge';

export interface SampleForm {
  id: string;
  name: string;
  status: FormStatus;
  responses: number;
  updatedAt: string;
}

// Placeholder data for Day 1. Replaced by the API on Day 4.
export const SAMPLE_FORMS: SampleForm[] = [
  { id: 'f1', name: 'Customer Feedback Survey', status: 'PUBLISHED', responses: 128, updatedAt: '2026-10-27T09:30:00Z' },
  { id: 'f2', name: 'Job Application Form', status: 'PUBLISHED', responses: 86, updatedAt: '2026-10-24T14:10:00Z' },
  { id: 'f3', name: 'Event Registration', status: 'PUBLISHED', responses: 142, updatedAt: '2026-10-21T11:05:00Z' },
  { id: 'f4', name: 'Product Bug Report', status: 'DRAFT', responses: 0, updatedAt: '2026-10-19T16:45:00Z' },
  { id: 'f5', name: 'Contact Us', status: 'PUBLISHED', responses: 94, updatedAt: '2026-10-12T08:20:00Z' },
  { id: 'f6', name: 'Newsletter Signup', status: 'DRAFT', responses: 0, updatedAt: '2026-10-05T10:00:00Z' },
];

// Hard-coded to match the design. Computed from the API later.
export const SAMPLE_SUMMARY = { totalForms: 12, published: 7, totalResponses: 486 };