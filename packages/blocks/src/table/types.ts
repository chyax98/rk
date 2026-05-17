export type TableProfile = 'matrix' | 'status' | 'key-value' | 'cards' | 'compact';
export type TableRenderer = 'default' | 'tanstack';

export interface TableBlockProps {
  title?: string;
  caption?: string;
  columns: string[];
  rows: string[][];
  align?: string[];
  profile?: TableProfile;
  renderer?: TableRenderer;
  width?: string;
}
