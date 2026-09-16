export type Role = "owner" | "office_staff" | "site_staff";
export type SiteStatus = "active" | "inactive";
export type TaskPriority = "low" | "normal" | "urgent";
export type TaskStatus = "pending" | "in_progress" | "completed";

export interface Site {
  id: string;
  name: string;
  address: string;
  status: SiteStatus;
  createdAt: string;
}

export interface Staff {
  id: string;
  name: string;
  role: Role;
  siteId: string;
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
  assigneeId: string;
  createdBy: string;
  priority: TaskPriority;
  deadline: string;
  status: TaskStatus;
  proofRequired: boolean;
  createdAt: string;
  updatedAt: string;
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
