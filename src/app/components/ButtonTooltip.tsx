import React from 'react';
import Tooltip from './Tooltip';

interface ButtonTooltipProps {
  children: React.ReactElement;
}

function getButtonCode(props: Record<string, unknown>) {
  const propOrder = [
    'style', 'color', 'size', 'disabled', 'className', 'iconLeft', 'iconRight', 'type', 'onClick'
  ];
  const entries = Object.entries(props)
    .filter(([key, value]) =>
      value !== undefined &&
      key !== 'children' &&
      key !== 'ref' &&
      key !== 'forwardedAs' &&
      typeof value !== 'function'
    )
    .sort(([a], [b]) => propOrder.indexOf(a) - propOrder.indexOf(b));
  const propString = entries
    .map(([key, value]) => {
      if (typeof value === 'string') {
        return `${key}="${value}"`;
      } else if (typeof value === 'boolean') {
        return value ? key : '';
      } else if (React.isValidElement(value)) {
        return `${key}={<... />}`;
      }
      return '';
    })
    .filter(Boolean)
    .join(' ');
  return `<Button${propString ? ' ' + propString : ''}>`;
}

const ButtonTooltip: React.FC<ButtonTooltipProps> = ({ children }) => {
  const buttonProps = (children.props ?? {}) as Record<string, unknown>;
  const borderRadius = buttonProps.size === 'large' ? 8 : 6;

  return (
    <Tooltip
      codeGenerator={() => getButtonCode(buttonProps)}
      borderRadius={borderRadius}
      showBorder={true}
      tooltipType="code"
      borderColor="stroke-accent"
    >
      {children}
    </Tooltip>
  );
};

export default ButtonTooltip; 