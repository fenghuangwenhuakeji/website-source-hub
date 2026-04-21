export type WritingProjectType = 'novel' | 'script' | 'comic' | 'storyboard';

export type WritingProjectStatus = 'planning' | 'drafting' | 'serializing' | 'completed';

export type WritingMaterialType =
  | 'character'
  | 'location'
  | 'world'
  | 'prop'
  | 'scene'
  | 'visual'
  | 'dialogue'
  | 'reference';

export interface WritingChapter {
  id: string;
  title: string;
  summary: string;
  content: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface WritingVolume {
  id: string;
  title: string;
  summary: string;
  order: number;
  chapters: WritingChapter[];
}

export interface WritingMaterialItem {
  id: string;
  title: string;
  type: WritingMaterialType;
  summary: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface WritingProject {
  id: string;
  type: WritingProjectType;
  title: string;
  genre: string;
  premise: string;
  summary: string;
  description: string;
  worldview: string;
  outline: string;
  coverImage: string;
  tags: string[];
  status: WritingProjectStatus;
  createdAt: string;
  updatedAt: string;
  volumes: WritingVolume[];
  materials: WritingMaterialItem[];
}
