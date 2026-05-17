import type { Metadata } from 'next';
import './style.css';

const description =
  'Local-first Agent artifact renderer for beautiful reading and precise review comments.';

export const metadata: Metadata = {
  metadataBase: new URL('http://localhost:3737'),
  title: {
    default: 'RenderKit',
    template: '%s · RenderKit',
  },
  description,
  applicationName: 'RenderKit',
  openGraph: {
    title: 'RenderKit',
    description,
    type: 'website',
    siteName: 'RenderKit',
    images: [
      {
        url: '/renderkit-og.svg',
        width: 1200,
        height: 630,
        alt: 'RenderKit document review surface',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RenderKit',
    description,
    images: ['/renderkit-og.svg'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <a href="#rk-main" className="rk-skip-link">
          跳到正文
        </a>
        {children}
      </body>
    </html>
  );
}
