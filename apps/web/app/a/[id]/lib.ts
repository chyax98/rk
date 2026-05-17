export function flattenBlocks(blocks: any[]): any[] {
  const out: any[] = [];
  for (const block of blocks || []) {
    out.push(block);
    if (Array.isArray(block.props?.children)) out.push(...flattenBlocks(block.props.children));
    if (Array.isArray(block.props?.tabs)) {
      for (const tab of block.props.tabs) {
        if (Array.isArray(tab.blocks)) out.push(...flattenBlocks(tab.blocks));
      }
    }
  }
  return out;
}

export function blockLabel(block: any): string {
  if (block.type === 'heading') return block.props?.text || block.id;
  if (block.props?.title) return block.props.title;
  if (block.props?.question) return block.props.question;
  return block.id;
}

export function copyToClipboard(str: string) {
  navigator.clipboard?.writeText(str).catch(() => {});
}
