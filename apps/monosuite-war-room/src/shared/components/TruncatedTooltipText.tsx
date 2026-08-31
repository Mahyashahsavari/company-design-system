import { Text, Tooltip, type TextProps } from '@mantine/core';
import { useEffect, useRef, useState, type ReactNode } from 'react';

interface TruncatedTooltipTextProps extends TextProps {
  /** Tooltip content — defaults to string children. */
  tooltip?: ReactNode;
  lineClamp?: number;
  children?: ReactNode;
}

/** Shows full text in a tooltip when the label is visually truncated. */
export function TruncatedTooltipText({
  tooltip,
  children,
  lineClamp = 1,
  ...textProps
}: TruncatedTooltipTextProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [truncated, setTruncated] = useState(false);
  const tooltipLabel =
    tooltip ?? (typeof children === 'string' || typeof children === 'number' ? String(children) : undefined);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const check = () => {
      setTruncated(el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1);
    };

    check();
    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, [children, lineClamp]);

  const text = (
    <Text ref={ref} lineClamp={lineClamp} {...textProps}>
      {children}
    </Text>
  );

  if (!truncated || tooltipLabel == null || tooltipLabel === '') {
    return text;
  }

  return (
    <Tooltip label={tooltipLabel} withArrow openDelay={280} position="top">
      {text}
    </Tooltip>
  );
}
