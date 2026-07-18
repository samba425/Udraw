/**
 * Starter diagram templates shown in the welcome / templates gallery.
 * Each template is a factory that builds a ready-to-edit project.
 * @module templates
 */
import type { Project } from '@/types';
import { createEdge, createProject, createShape } from '@/models/factory';

export interface DiagramTemplate {
  id: string;
  title: string;
  description: string;
  category: 'Flowchart' | 'Architecture' | 'Org' | 'Whiteboard';
  /** Accent color for the template card preview stripe. */
  accent: string;
  build: () => Project;
}

function flowchartTemplate(): Project {
  const project = createProject('Flowchart starter');
  const page = project.pages[0]!;
  const layerId = page.layers[0]!.id;
  const steps = ['Start', 'Process step', 'Decision?', 'End'];
  const kinds = ['rounded-rectangle', 'rectangle', 'diamond', 'rounded-rectangle'] as const;
  const shapes = steps.map((text, i) =>
    createShape(
      { kind: kinds[i]!, x: 80 + i * 220, y: 120, width: 160, height: i === 2 ? 100 : 64, text },
      layerId,
      i,
    ),
  );
  page.shapes = Object.fromEntries(shapes.map((s) => [s.id, s]));
  page.order = shapes.map((s) => s.id);
  const edges = [
    createEdge({ source: { shapeId: shapes[0]!.id }, target: { shapeId: shapes[1]!.id }, router: 'orthogonal', endArrow: 'triangle' }, layerId),
    createEdge({ source: { shapeId: shapes[1]!.id }, target: { shapeId: shapes[2]!.id }, router: 'orthogonal', endArrow: 'triangle' }, layerId),
    createEdge({ source: { shapeId: shapes[2]!.id }, target: { shapeId: shapes[3]!.id }, router: 'orthogonal', endArrow: 'triangle', label: 'yes' }, layerId),
  ];
  page.edges = Object.fromEntries(edges.map((e) => [e.id, e]));
  page.order.push(...edges.map((e) => e.id));
  return project;
}

function awsTemplate(): Project {
  const project = createProject('AWS 3-tier architecture');
  const page = project.pages[0]!;
  const layerId = page.layers[0]!.id;
  const boxes = [
    { text: 'Users', kind: 'actor' as const, x: 80, y: 80, w: 80, h: 120 },
    { text: 'CloudFront', kind: 'rounded-rectangle' as const, x: 220, y: 100, w: 140, h: 64 },
    { text: 'ALB', kind: 'rounded-rectangle' as const, x: 420, y: 100, w: 120, h: 64 },
    { text: 'EC2 / ECS', kind: 'rectangle' as const, x: 600, y: 80, w: 150, h: 90 },
    { text: 'RDS', kind: 'cylinder' as const, x: 620, y: 240, w: 120, h: 90 },
  ];
  const shapes = boxes.map((b, i) =>
    createShape({ kind: b.kind, x: b.x, y: b.y, width: b.w, height: b.h, text: b.text }, layerId, i),
  );
  page.shapes = Object.fromEntries(shapes.map((s) => [s.id, s]));
  page.order = shapes.map((s) => s.id);
  const chain = shapes.slice(0, 4);
  const edges = chain.slice(0, -1).map((s, i) =>
    createEdge(
      { source: { shapeId: s.id }, target: { shapeId: chain[i + 1]!.id }, router: 'orthogonal', endArrow: 'triangle' },
      layerId,
    ),
  );
  edges.push(
    createEdge(
      { source: { shapeId: shapes[3]!.id }, target: { shapeId: shapes[4]!.id }, router: 'orthogonal', endArrow: 'triangle' },
      layerId,
    ),
  );
  page.edges = Object.fromEntries(edges.map((e) => [e.id, e]));
  page.order.push(...edges.map((e) => e.id));
  return project;
}

function orgTemplate(): Project {
  const project = createProject('Org chart');
  const page = project.pages[0]!;
  const layerId = page.layers[0]!.id;
  const ceo = createShape({ kind: 'rectangle', x: 340, y: 60, width: 160, height: 56, text: 'CEO' }, layerId, 0);
  const mgr1 = createShape({ kind: 'rectangle', x: 140, y: 180, width: 160, height: 56, text: 'Engineering' }, layerId, 1);
  const mgr2 = createShape({ kind: 'rectangle', x: 540, y: 180, width: 160, height: 56, text: 'Product' }, layerId, 2);
  const eng = createShape({ kind: 'rectangle', x: 80, y: 300, width: 140, height: 48, text: 'Developer' }, layerId, 3);
  const prod = createShape({ kind: 'rectangle', x: 560, y: 300, width: 140, height: 48, text: 'Designer' }, layerId, 4);
  const shapes = [ceo, mgr1, mgr2, eng, prod];
  page.shapes = Object.fromEntries(shapes.map((s) => [s.id, s]));
  page.order = shapes.map((s) => s.id);
  const edges = [
    createEdge({ source: { shapeId: ceo.id }, target: { shapeId: mgr1.id }, router: 'orthogonal', endArrow: 'triangle' }, layerId),
    createEdge({ source: { shapeId: ceo.id }, target: { shapeId: mgr2.id }, router: 'orthogonal', endArrow: 'triangle' }, layerId),
    createEdge({ source: { shapeId: mgr1.id }, target: { shapeId: eng.id }, router: 'orthogonal', endArrow: 'triangle' }, layerId),
    createEdge({ source: { shapeId: mgr2.id }, target: { shapeId: prod.id }, router: 'orthogonal', endArrow: 'triangle' }, layerId),
  ];
  page.edges = Object.fromEntries(edges.map((e) => [e.id, e]));
  page.order.push(...edges.map((e) => e.id));
  return project;
}

function retroTemplate(): Project {
  const project = createProject('Sprint retro board');
  const page = project.pages[0]!;
  const layerId = page.layers[0]!.id;
  const cols = [
    { text: 'Went well', x: 80, fill: '#dcfce7', stroke: '#16a34a' },
    { text: 'To improve', x: 320, fill: '#fef9c3', stroke: '#ca8a04' },
    { text: 'Action items', x: 560, fill: '#dbeafe', stroke: '#2563eb' },
  ];
  const shapes = cols.map((c, i) =>
    createShape(
      {
        kind: 'sticky-note',
        x: c.x,
        y: 100,
        width: 180,
        height: 140,
        text: c.text,
        fill: { type: 'solid', color: c.fill },
        stroke: c.stroke,
      },
      layerId,
      i,
    ),
  );
  page.shapes = Object.fromEntries(shapes.map((s) => [s.id, s]));
  page.order = shapes.map((s) => s.id);
  return project;
}

/** All built-in starter templates. */
export const DIAGRAM_TEMPLATES: DiagramTemplate[] = [
  {
    id: 'flowchart',
    title: 'Flowchart',
    description: 'Start → process → decision → end with connectors.',
    category: 'Flowchart',
    accent: '#6366f1',
    build: flowchartTemplate,
  },
  {
    id: 'aws-3tier',
    title: 'AWS 3-tier',
    description: 'Users, CDN, load balancer, compute, and database.',
    category: 'Architecture',
    accent: '#ff9900',
    build: awsTemplate,
  },
  {
    id: 'org-chart',
    title: 'Org chart',
    description: 'CEO, managers, and team members with hierarchy.',
    category: 'Org',
    accent: '#0ea5e9',
    build: orgTemplate,
  },
  {
    id: 'retro',
    title: 'Sprint retro',
    description: 'Three-column sticky-note whiteboard.',
    category: 'Whiteboard',
    accent: '#eab308',
    build: retroTemplate,
  },
];

/** Load a template by id into the editor. */
export function loadTemplate(templateId: string): Project | undefined {
  const template = DIAGRAM_TEMPLATES.find((t) => t.id === templateId);
  return template?.build();
}
