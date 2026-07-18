/**
 * Insert BPMN-style swimlane pools with horizontal lanes.
 * @module engine/commands/swimlane
 */
import type { Shape } from '@/types';
import { createShape } from '@/models/factory';
import { useProjectStore } from '@/state/projectStore';
import { useHistoryStore } from '@/state/historyStore';
import { useEditorStore } from '@/state/editorStore';
import { viewportCenter } from '@/utils/viewport';

const POOL_W = 720;
const POOL_HEADER = 36;
const LANE_H = 100;
const LANE_HEADER = 120;

/** Insert a swimlane pool with the given number of horizontal lanes. */
export function insertSwimlanePool(laneCount = 3): void {
  const count = Math.max(1, Math.min(8, laneCount));
  const store = useProjectStore.getState();
  const page = store.activePage();
  const layerId = page.layers[0]!.id;
  const center = viewportCenter();
  const poolH = POOL_HEADER + count * LANE_H;
  const originX = center.x - POOL_W / 2;
  const originY = center.y - poolH / 2;

  const pool = createShape(
    {
      kind: 'swimlane-pool',
      x: originX,
      y: originY,
      width: POOL_W,
      height: poolH,
      text: 'Pool',
      fill: { type: 'solid', color: '#f8fafc' },
      stroke: '#64748b',
      strokeWidth: 2,
      locked: true,
    },
    layerId,
  );

  const lanes: Shape[] = [];
  for (let i = 0; i < count; i++) {
    lanes.push(
      createShape(
        {
          kind: 'swimlane-lane',
          x: originX,
          y: originY + POOL_HEADER + i * LANE_H,
          width: POOL_W,
          height: LANE_H,
          text: `Lane ${i + 1}`,
          fill: { type: 'solid', color: i % 2 === 0 ? '#ffffff' : '#f1f5f9' },
          stroke: '#94a3b8',
          strokeWidth: 1,
          metadata: { laneHeader: LANE_HEADER },
        },
        layerId,
        i,
      ),
    );
  }

  const shapes = [pool, ...lanes];
  useHistoryStore.getState().run('Insert swimlane', () => {
    store.addShapes(shapes);
    useEditorStore.getState().select(lanes.map((l) => l.id));
  });
}
