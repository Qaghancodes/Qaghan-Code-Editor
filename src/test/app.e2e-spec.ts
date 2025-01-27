import { Application } from 'spectron';
import { join } from 'path';

describe('Application launch', () => {
  let app: Application;

  beforeEach(() => {
    app = new Application({
      path: join(__dirname, '../../node_modules/.bin/electron'),
      args: [join(__dirname, '../../dist/main/main.js')]
    });
    return app.start();
  });

  afterEach(() => {
    if (app && app.isRunning()) {
      return app.stop();
    }
  });

  it('shows the initial window', async () => {
    const windowCount = await app.client.getWindowCount();
    expect(windowCount).toBe(1);
  });

  it('has the correct title', async () => {
    const title = await app.client.getTitle();
    expect(title).toBe('Modern Code Editor');
  });

  it('shows the editor component', async () => {
    const editorExists = await app.client.$('#editor-container').isExisting();
    expect(editorExists).toBe(true);
  });
}); 