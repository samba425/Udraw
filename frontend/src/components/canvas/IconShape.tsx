/**
 * Renders a library icon shape (AWS, Azure, network, ...). The icon body is
 * looked up from the shape registry; falls back to a rounded rect if missing.
 * @module components/canvas/IconShape
 */
import { memo } from 'react';
import type { Shape } from '@/types';
import { getLibraryIcon } from '@/shapes/registry';

interface IconShapeProps {
  shape: Shape;
  commonProps: Record<string, unknown>;
}

/** Render a registered colored icon inside the shape bounds. */
export const IconShape = memo(function IconShape({
  shape,
  commonProps,
}: IconShapeProps): React.JSX.Element {
  const icon = shape.libraryId ? getLibraryIcon(shape.libraryId) : undefined;

  if (!icon) {
    return (
      <rect
        width={shape.width}
        height={shape.height}
        rx={8}
        {...commonProps}
      />
    );
  }

  return (
    <g
      transform={`scale(${shape.width / icon.viewSize} ${shape.height / icon.viewSize})`}
      dangerouslySetInnerHTML={{ __html: icon.body }}
    />
  );
});
