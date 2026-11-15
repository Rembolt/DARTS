import { render, h } from 'preact';
import '@fontsource-variable/hanken-grotesk';
import './styles.css';
import { App } from './App';

export function mountUi(root: HTMLElement): void {
  render(h(App, {}), root);
}
