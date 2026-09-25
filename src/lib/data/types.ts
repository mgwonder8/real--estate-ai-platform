export type Role = "owner" | "office_staff" | "site_staff";
export type SiteStatus = "active" | "inactive";
export type TaskPriority = "low" | "normal" | "urgent";
export type TaskStatus = "pending" | "in_progress" | "completed" | "approved";
export type QueryStatus = "open" | "answered";

export interface Site {
  id: string;
  name: string;
  address: string;
  status: SiteStatus;
  createdAt: string;
  briefText: string;
  briefFileUrl: string;
  briefFileName: string;
}

export interface Staff {
  id: string;
  name: string;
  role: Role;
  siteId: string;
  extraSiteIds: string[];
  phone: string;
  email: string;
  active: boolean;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  brief: string;
  siteId: string;
  assigneeIds: string[];
  createdBy: string;
  priority: TaskPriority;
  deadline: string;
  status: TaskStatus;
  proofRequired: boolean;
  createdAt: string;
  updatedAt: string;
  resourceLink: string;
  resourceFileUrl: string;
  resourceFileName: string;
  approvedBy: string;
  approvedAt: string;
}

export interface Proof {
  id: string;
  taskId: string;
  submittedBy: string;
  photoUrl: string;
  videoUrl: string;
  gpsLat: string;
  gpsLng: string;
  notes: string;
  submittedAt: string;
}

export interface TaskUpdate {
  id: string;
  taskId: string;
  fromStatus: string;
  toStatus: string;
  changedBy: string;
  note: string;
  changedAt: string;
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  staffId: string;
  createdAt: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  authorId: string;
  authorRole: Role;
  message: string;
  createdAt: string;
}

export interface Query {
  id: string;
  raisedBy: string;
  siteId: string;
  taskId: string;
  message: string;
  status: QueryStatus;
  reply: string;
  repliedBy: string;
  createdAt: string;
  repliedAt: string;
  gpsLat: string;
  gpsLng: string;
}
