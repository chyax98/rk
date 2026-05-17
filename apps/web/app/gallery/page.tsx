import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type React from 'react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../../..');
const galleryPath = path.join(root, 'examples/gallery.json');

export const dynamic = 'force-dynamic';

interface GallerySurface {
  id: string;
  label: string;
  description: string;
  theme: string;
  file: string;
}

interface GalleryData {
  description: string;
  surfaces: GallerySurface[];
}

export default async function GalleryPage(): Promise<React.ReactElement> {
  const raw = fs.readFileSync(galleryPath, 'utf8');
  const gallery: GalleryData = JSON.parse(raw);

  return (
    <main className="rk-home">
      <h1>RenderKit Gallery</h1>
      <p className="rk-muted">{gallery.description}</p>
      <div className="rk-gallery-grid">
        {gallery.surfaces.map((s: GallerySurface) => (
          <a key={s.id} className="rk-gallery-card" href={`#${s.id}`}>
            <h3>{s.label}</h3>
            <p className="rk-muted">{s.description}</p>
            <code>{s.theme}</code>
            <span
              className="rk-muted"
              style={{ display: 'block', marginTop: '8px', fontSize: '12px' }}
            >
              {s.file}
            </span>
          </a>
        ))}
      </div>
    </main>
  );
}
