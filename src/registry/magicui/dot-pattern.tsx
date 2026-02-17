import { useId } from "react"

import { cn } from "@/lib/utils"

type DotPatternProps = React.SVGProps<SVGSVGElement>

export function DotPattern({
  className,
  width = 24,
  height = 24,
  cx = 1,
  cy = 1,
  ...props
}: DotPatternProps & { width?: number; height?: number; cx?: number; cy?: number }) {
  const patternId = useId()

  return (
    <svg
      aria-hidden="true"
      className={cn("fill-muted-foreground/10", className)}
      width="100%"
      height="100%"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      {...props}
    >
      <defs>
        <pattern
          id={`dot-pattern-${patternId}`}
          x="0"
          y="0"
          width={width}
          height={height}
          patternUnits="userSpaceOnUse"
        >
          <circle cx={cx} cy={cy} r="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#dot-pattern-${patternId})`} />
    </svg>
  )
}
