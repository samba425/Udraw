# AI Prompt: Build an Open-Source Diagram Editor (draw.io Alternative)

## Objective

Build a production-quality web application similar to draw.io, Lucidchart, and Excalidraw using only open-source technologies.

The application must work completely offline without requiring user login, cloud accounts, or paid SDKs.

The architecture must be modular, scalable, maintainable, and support future collaboration features.

---

# Primary Goals

The application should support:

* Infinite canvas
* Drag & Drop
* Professional diagram editor
* Flowcharts
* UML
* AWS Architecture
* Azure Architecture
* Cisco Architecture
* Kubernetes Diagrams
* Network Topology
* ER Diagrams
* BPMN
* Mind Maps
* Organization Charts
* Whiteboard
* Sticky Notes
* SVG Editor
* Image Import
* PDF Export
* SVG Export
* PNG Export
* JSON Import/Export
* XML Import/Export (optional)
* Undo / Redo
* Layers
* Pages
* Alignment
* Smart Guides
* Grid
* Snap
* Keyboard Shortcuts
* Context Menu
* Minimap
* Search
* Dark Mode
* Themes
* Auto Save (Browser)
* Offline Support
* High Performance

The application must never depend on any paid SDK or commercial library.

---

# Technology Stack

Frontend

* React 19
* TypeScript
* Vite
* Tailwind CSS
* Zustand
* React Router
* React Hook Form
* Framer Motion

Canvas Engine

Preferred:

* tldraw SDK (Open Source)

Alternative:

* React Flow
* Fabric.js
* Konva.js

Rendering

* SVG
* HTML
* Canvas only where necessary

Backend

Initially none.

Everything should work locally.

Future backend

FastAPI

or

Node.js

Storage

Browser

* IndexedDB
* LocalStorage

Future

* PostgreSQL
* S3 Compatible Storage

Testing

* Vitest
* React Testing Library
* Playwright

Linting

* ESLint
* Prettier

---

# Architecture

```
src/

app/

components/

canvas/

toolbar/

sidebar/

property-panel/

layers/

pages/

dialogs/

menus/

hooks/

engine/

history/

selection/

snapping/

alignment/

routing/

zoom/

clipboard/

commands/

renderer/

models/

services/

storage/

export/

import/

icons/

themes/

utils/

types/

constants/

workers/

```

Each module must be completely independent.

No business logic inside React components.

---

# Design Principles

Follow

* SOLID
* DRY
* KISS
* Composition over inheritance
* Feature-based architecture
* Clean Architecture
* Command Pattern
* Observer Pattern
* Event Bus
* Dependency Injection where appropriate

---

# Canvas Engine

The canvas should support

Infinite Canvas

Zoom

Pan

Grid

Snap

Selection Box

Resize Handles

Rotation

Guidelines

Multiple Selection

Drag Selection

Copy

Paste

Duplicate

Delete

Bring Forward

Send Backward

Grouping

Ungrouping

Lock

Unlock

Hide

Show

---

# Shape System

Every shape must implement

```
BaseShape

id

position

rotation

width

height

fill

stroke

opacity

shadow

text

locked

hidden

layerId

pageId

metadata
```

Derived Shapes

Rectangle

Circle

Ellipse

Diamond

Triangle

Hexagon

Cloud

Cylinder

Actor

Database

Server

Laptop

Router

Firewall

Switch

Image

Text

Arrow

Connector

Custom SVG

---

# Connectors

Support

Straight

Orthogonal

Curved

Bezier

Auto Routing

Connection Points

Magnetic Anchors

Reconnect

Arrow Styles

Dashed

Animated

Labels

---

# Smart Features

Alignment

Snap to Grid

Snap to Objects

Smart Guides

Equal Spacing

Distribute

Auto Layout

Auto Center

---

# Layers

Create

Rename

Delete

Lock

Hide

Reorder

Nested Layers

---

# Pages

Multiple Pages

Duplicate Page

Delete Page

Rename

Move

Thumbnail Preview

---

# History

Use Command Pattern.

Commands

Move

Resize

Rotate

Delete

Create

Paste

Import

Group

Ungroup

Property Change

Unlimited Undo

Unlimited Redo

---

# Clipboard

Copy

Paste

Duplicate

Cut

Clipboard JSON

Paste Offset

---

# Keyboard Shortcuts

Ctrl+C

Ctrl+V

Ctrl+X

Ctrl+D

Ctrl+G

Ctrl+Shift+G

Delete

Ctrl+Z

Ctrl+Shift+Z

Ctrl+A

Ctrl+S

Ctrl+P

Space = Pan

Mouse Wheel = Zoom

Shift = Multi Select

Alt = Duplicate Drag

---

# Property Panel

Position

Size

Rotation

Opacity

Fill

Stroke

Shadow

Blur

Border Radius

Typography

Line Style

Arrow Style

Layer

Page

Metadata

---

# Toolbar

Pointer

Hand

Rectangle

Circle

Diamond

Arrow

Text

Image

Pen

Eraser

Sticky Note

Comment

Zoom

Undo

Redo

Export

Import

---

# Sidebar

Flowchart

AWS

Azure

Cisco

Networking

Kubernetes

BPMN

UML

Mind Map

Basic Shapes

Icons

Custom SVG

Favorites

---

# File Format

JSON

```
Project

Pages

Layers

Nodes

Edges

Assets

Theme

Settings

Version
```

Every object should be serializable.

---

# Storage

Auto save every 3 seconds.

Store inside IndexedDB.

Recover after refresh.

Support

Save As

Export

Import

---

# Export

PNG

SVG

PDF

JSON

ZIP Project

---

# Import

PNG

SVG

JSON

Draw.io XML (future)

Visio (future)

---

# Performance

Must support

10,000+ nodes

Virtual rendering

Lazy loading

React memoization

Web Workers

Incremental rendering

Viewport culling

---

# Future AI Module

Design architecture so AI can later generate diagrams from prompts.

Example

"Generate AWS architecture"

↓

AI returns JSON

↓

Renderer creates nodes.

AI module must remain optional.

---

# Theme System

Light

Dark

System

Custom Theme

CSS Variables

---

# Plugin System

Future plugins should be able to register

Shapes

Menus

Toolbar Items

Property Panels

Exporters

Importers

Commands

Keyboard Shortcuts

---

# Testing

Every module must include

Unit Tests

Integration Tests

End-to-End Tests

No feature should be accepted without tests.

---

# Documentation

Generate documentation for

Architecture

Folder Structure

Public APIs

Hooks

State Management

Shape Model

Rendering Pipeline

History System

Export Pipeline

Import Pipeline

Performance Optimizations

Plugin APIs

---

# Cursor Development Rules

You are the lead software architect.

Before implementing any feature:

1. Analyze requirements.
2. Identify dependencies.
3. Create/update architecture diagrams if needed.
4. Write a technical design summary.
5. Break the work into small tasks.
6. Implement one task at a time.
7. Ensure each task builds successfully.
8. Add unit tests.
9. Run linting.
10. Run type checking.
11. Never break existing functionality.
12. Refactor when duplication appears.
13. Use TypeScript strict mode.
14. Avoid `any`.
15. Keep files under ~300 lines where practical.
16. Prefer reusable hooks and components.
17. Document all exported APIs with JSDoc.
18. Follow accessibility best practices (ARIA, keyboard navigation).
19. Optimize for performance from the beginning.
20. Do not introduce paid libraries or services.

---

# Development Roadmap

## Phase 1

* Project setup
* Layout
* Infinite canvas
* Zoom/Pan
* Basic shapes
* Selection

## Phase 2

* Connectors
* Smart guides
* Grid
* Snap
* Property panel
* Keyboard shortcuts

## Phase 3

* Layers
* Pages
* History
* Clipboard
* Context menus

## Phase 4

* Import/Export
* Templates
* Shape libraries
* Themes
* Offline persistence

## Phase 5

* Plugin architecture
* Performance optimization
* Advanced routing
* Auto-layout
* AI-ready JSON schema

---

# Definition of Done

A feature is complete only when:

* Functionally correct
* Type-safe
* Tested
* Documented
* Responsive
* Accessible
* No lint errors
* No TypeScript errors
* No console errors
* No duplicated logic
* No paid dependencies
* Works offline
* Maintains existing functionality
