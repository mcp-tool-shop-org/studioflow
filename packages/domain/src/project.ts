export interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  schemaVersion: number;
}

export type ProjectMeta = Pick<Project, 'id' | 'name' | 'updatedAt'>;
