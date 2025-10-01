export interface Category {
  slug: string;
  name: string;
}

export interface Crumb {
  label: string;
  to?: string;
  current?: boolean;
  name?: string; 
}