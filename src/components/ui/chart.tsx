// Re-export from lazy-loaded chart components with explicit named exports
// This maintains backward compatibility while enabling code splitting
export {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent,
} from "./chart-lazy";
