import * as React from "react";
import { lazy, Suspense } from "react";

// Lazy load the entire chart component to reduce initial bundle size
// Recharts is 410KB - only load it when charts are actually rendered
const ChartInternal = lazy(() => import("./chart-internal"));

// Re-export chart config type
export type { ChartConfig } from "./chart-internal";
import type { ChartConfig } from "./chart-internal";

// Type definitions for wrapper components
// Defined explicitly to avoid circular dependency issues with lazy-loaded modules
type ChartContainerProps = React.ComponentProps<"div"> & {
  config: ChartConfig;
  children: React.ReactNode;
};

type ChartTooltipProps = Record<string, unknown>;

type ChartTooltipContentProps = React.ComponentProps<"div"> & {
  hideLabel?: boolean;
  hideIndicator?: boolean;
  indicator?: "line" | "dot" | "dashed";
  nameKey?: string;
  labelKey?: string;
  active?: boolean;
  payload?: unknown[];
  label?: string | number;
  labelFormatter?: (value: unknown, payload: unknown[]) => React.ReactNode;
  formatter?: (value: unknown, name: string, item: unknown, index: number, payload: unknown) => React.ReactNode;
  color?: string;
  labelClassName?: string;
};

type ChartLegendProps = Record<string, unknown>;

type ChartLegendContentProps = React.ComponentProps<"div"> & {
  hideIcon?: boolean;
  nameKey?: string;
  payload?: Array<{ value: string; color?: string; [key: string]: unknown }>;
  verticalAlign?: "top" | "bottom";
};

// Wrapper components that lazy-load the real implementation
export const ChartContainer = React.forwardRef<HTMLDivElement, ChartContainerProps>(
  (props, ref) => (
    <Suspense fallback={<div className="flex aspect-video justify-center items-center text-sm text-muted-foreground">Loading chart...</div>}>
      <ChartInternal.ChartContainer {...props} ref={ref} />
    </Suspense>
  )
);
ChartContainer.displayName = "ChartContainer";

export const ChartTooltip = (props: ChartTooltipProps) => (
  <Suspense fallback={null}>
    <ChartInternal.ChartTooltip {...props} />
  </Suspense>
);

export const ChartTooltipContent = React.forwardRef<HTMLDivElement, ChartTooltipContentProps>(
  (props, ref) => (
    <Suspense fallback={null}>
      <ChartInternal.ChartTooltipContent {...props} ref={ref} />
    </Suspense>
  )
);
ChartTooltipContent.displayName = "ChartTooltipContent";

export const ChartLegend = (props: ChartLegendProps) => (
  <Suspense fallback={null}>
    <ChartInternal.ChartLegend {...props} />
  </Suspense>
);

export const ChartLegendContent = React.forwardRef<HTMLDivElement, ChartLegendContentProps>(
  (props, ref) => (
    <Suspense fallback={null}>
      <ChartInternal.ChartLegendContent {...props} ref={ref} />
    </Suspense>
  )
);
ChartLegendContent.displayName = "ChartLegendContent";

export const ChartStyle = (props: { id: string; config: ChartConfig }) => (
  <Suspense fallback={null}>
    <ChartInternal.ChartStyle {...props} />
  </Suspense>
);
