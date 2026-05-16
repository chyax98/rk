import './style.css';

export const metadata = { title: 'RenderKit' };

export default function RootLayout({ children }) {
  return <html lang="zh-CN"><body><a href="#rk-main" className="rk-skip-link">跳到正文</a>{children}</body></html>;
}
