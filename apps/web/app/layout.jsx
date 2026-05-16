import './style.css';

export const metadata = { title: 'RenderKit' };

export default function RootLayout({ children }) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
