import type { RemarkNode, BlockAttrs, CompiledBlock } from '../types';
/**
 * Chart block compiler.
 * Parses a markdown table body into columns/rows for ECharts recipe rendering.
 * Agent writes:
 *   :::chart{id="kpi" type="bar" template="report" title="Monthly Active" xField="Month" yField="Users"}
 *   | Month | Users |
 *   |---|---|
 *   | Jan | 1200 |
 *   :::
 */
export declare function compileChart(node: RemarkNode, attrs: BlockAttrs, source: string, errors: CompileContext['errors'], file: string): CompiledBlock;
import type { CompileContext } from '../types';
//# sourceMappingURL=chart.d.ts.map