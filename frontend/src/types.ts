export type VaultType = 'public' | 'protected';

export type FileCategory = 'all' | 'images' | 'pdf' | 'video' | 'audio' | 'others';

export interface VaultFile {
  name: string;
  path: string;
  category: 'images' | 'pdf' | 'video' | 'audio' | 'others';
  subfolder: string;
  vault: VaultType;
  size_bytes: number;
  size_formatted: string;
  mime_type: string;
  modified_at: number;
  url: string;
}

export interface VaultStats {
  public: {
    total_files: number;
    total_size_bytes: number;
    categories: Record<string, number>;
  };
  protected: {
    total_files: number;
    total_size_bytes: number;
    categories: Record<string, number>;
  };
}
