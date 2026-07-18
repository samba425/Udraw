/**
 * Root application component and editor layout.
 * @module app/App
 */
import { EditorLayout } from './EditorLayout';
import { useTheme } from '@/hooks/useTheme';

/** Top-level app: applies the theme and renders the editor layout. */
export default function App(): React.JSX.Element {
  useTheme();
  return <EditorLayout />;
}
