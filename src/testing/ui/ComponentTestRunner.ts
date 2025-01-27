import { JSDOM } from 'jsdom';
import { EventEmitter } from 'events';

interface ComponentTestContext {
  container: HTMLElement;
  dom: JSDOM;
  cleanup: () => void;
  fireEvent: typeof fireEvent;
  waitFor: (callback: () => boolean | Promise<boolean>, timeout?: number) => Promise<void>;
}

const fireEvent = {
  click: (element: HTMLElement, options = {}) => {
    const event = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      ...options
    });
    element.dispatchEvent(event);
  },

  change: (element: HTMLElement, value: string) => {
    const event = new Event('change', { bubbles: true });
    if (element instanceof HTMLInputElement) {
      element.value = value;
    }
    element.dispatchEvent(event);
  },

  keyDown: (element: HTMLElement, key: string) => {
    const event = new KeyboardEvent('keydown', {
      key,
      bubbles: true
    });
    element.dispatchEvent(event);
  },

  dragStart: (element: HTMLElement) => {
    const event = new DragEvent('dragstart', {
      bubbles: true,
      cancelable: true
    });
    element.dispatchEvent(event);
  }
};

export class ComponentTestRunner extends EventEmitter {
  private dom: JSDOM | null = null;

  public async setup(): Promise<ComponentTestContext> {
    this.dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      url: 'http://localhost',
      pretendToBeVisual: true,
      runScripts: 'dangerously'
    });

    global.window = this.dom.window as any;
    global.document = this.dom.window.document;
    global.HTMLElement = this.dom.window.HTMLElement;
    global.customElements = this.dom.window.customElements;

    const container = document.createElement('div');
    document.body.appendChild(container);

    return {
      container,
      dom: this.dom,
      cleanup: () => this.cleanup(),
      fireEvent,
      waitFor: this.waitFor
    };
  }

  private async waitFor(
    callback: () => boolean | Promise<boolean>,
    timeout: number = 1000
  ): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (await callback()) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    throw new Error(`Timeout waiting for condition (${timeout}ms)`);
  }

  private cleanup() {
    if (this.dom) {
      this.dom.window.close();
      this.dom = null;
    }
  }
} 