import * as React from "react";
import { lazy, Suspense } from "react";
import type * as RechartsPrimitive from "recharts";

// Lazy load the entire chart component to reduce initial bundle size
// Recharts is 410KB - only load it when charts are actually rendered
const ChartInternal = lazy(() => import("./chart-internal"));

// Re-export chart config type
export type { ChartConfig } from "./chart-internal";
import type { ChartConfig } from "./chart-internal";

// Wrapper components that lazy-load the real implementation
export const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig;
    children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>["children"];
  }
>((props, ref) => (
  <Suspense fallback={<div className="flex aspect-video justify-center items-center text-sm text-muted-foreground">Loading chart...</div>}>
    <ChartInternal.ChartContainer {...props} ref={ref} />
  </Suspense>
));
ChartContainer.displayName = "ChartContainer";

export const ChartTooltip = (props: React.ComponentProps<typeof RechartsPrimitive.Tooltip>) => (
  <Suspense fallback={null}>
    <ChartInternal.ChartTooltip {...props} />
  </Suspense>
);

export const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof RechartsPrimitive.Tooltip> &
    React.ComponentProps<"div"> & {
      hideLabel?: boolean;
      hideIndicator?: boolean;
      indicator?: "line" | "dot" | "dashed";
      nameKey?: string;
      labelKey?: string;
    }
>((props, ref) => (
  <Suspense fallback={null}>
    <ChartInternal.ChartTooltipContent {...props} ref={ref} />
  </Suspense>
));
ChartTooltipContent.displayName = "ChartTooltipContent";

export const ChartLegend = (props: React.ComponentProps<typeof RechartsPrimitive.Legend>) => (
  <Suspense fallback={null}>
    <ChartInternal.ChartLegend {...props} />
  </Suspense>
);

export const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> &
    Pick<RechartsPrimitive.LegendProps, "payload" | "verticalAlign"> & {
      hideIcon?: boolean;
      nameKey?: string;
    }
>((props, ref) => (
  <Suspense fallback={null}>
    <ChartInternal.ChartLegendContent {...props} ref={ref} />
  </Suspense>
));
ChartLegendContent.displayName = "ChartLegendContent";

export const ChartStyle = (props: { id: string; config: ChartConfig }) => (
  <Suspense fallback={null}>
    <ChartInternal.ChartStyle {...props} />
  </Suspense>
);
