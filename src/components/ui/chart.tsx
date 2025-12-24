// Re-export from lazy-loaded chart components to keep tree-shaking predictable.
export {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent,
} from "./chart-lazy";
export type { ChartConfig } from "./chart-internal";
