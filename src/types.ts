export interface JobPosting {
  id: string;
  company: string;
  title: string;
  postedAt: string;
  snippet: string;
  applyUrl: string;
  location: string;
  remote: boolean;
  tags: string[];
  /** ISO source label for transparency */
  source: string;
}

export interface AppliedRecord {
  jobId: string;
  appliedAt: string;
  matchScore: number;
  assisted: boolean;
}
