import { Builder, WebDriver, By, until, WebElement } from 'selenium-webdriver';
import { Options as ChromeOptions } from 'selenium-webdriver/chrome';
import { EventEmitter } from 'events';

interface E2ETestContext {
  driver: WebDriver;
  helpers: E2ETestHelpers;
}

interface E2ETestHelpers {
  waitForElement: (selector: string, timeout?: number) => Promise<WebElement>;
  waitForText: (text: string, timeout?: number) => Promise<WebElement>;
  clickElement: (selector: string) => Promise<void>;
  typeText: (selector: string, text: string) => Promise<void>;
  executeCommand: (command: string) => Promise<void>;
  openFile: (path: string) => Promise<void>;
  switchTab: (tabTitle: string) => Promise<void>;
  getNotifications: () => Promise<string[]>;
}

export class E2ETestRunner extends EventEmitter {
  private driver?: WebDriver;

  public async setup(): Promise<E2ETestContext> {
    const options = new ChromeOptions()
      .addArguments('--headless')
      .addArguments('--disable-gpu')
      .addArguments('--no-sandbox')
      .addArguments('--disable-dev-shm-usage');

    this.driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();

    const helpers = this.createHelpers(this.driver);
    return { driver: this.driver, helpers };
  }

  private createHelpers(driver: WebDriver): E2ETestHelpers {
    return {
      waitForElement: async (selector: string, timeout: number = 5000) => {
        return driver.wait(until.elementLocated(By.css(selector)), timeout);
      },

      waitForText: async (text: string, timeout: number = 5000) => {
        return driver.wait(
          until.elementLocated(By.xpath(`//*[contains(text(), '${text}')]`)),
          timeout
        );
      },

      clickElement: async (selector: string) => {
        const element = await driver.wait(
          until.elementLocated(By.css(selector)),
          5000
        );
        await driver.wait(until.elementIsVisible(element));
        await element.click();
      },

      typeText: async (selector: string, text: string) => {
        const element = await driver.wait(
          until.elementLocated(By.css(selector)),
          5000
        );
        await element.sendKeys(text);
      },

      executeCommand: async (command: string) => {
        await helpers.clickElement('.command-palette-trigger');
        await helpers.typeText('.command-palette-input', command);
        await driver.actions()
          .sendKeys('\n')
          .perform();
      },

      openFile: async (path: string) => {
        await helpers.executeCommand('Open File');
        await helpers.typeText('.quick-open-input', path);
        await driver.actions()
          .sendKeys('\n')
          .perform();
      },

      switchTab: async (tabTitle: string) => {
        await helpers.clickElement(`[data-tab-title="${tabTitle}"]`);
      },

      getNotifications: async () => {
        const notifications = await driver.findElements(
          By.css('.notification-message')
        );
        return Promise.all(
          notifications.map(n => n.getText())
        );
      }
    };
  }

  public async teardown() {
    if (this.driver) {
      await this.driver.quit();
      this.driver = undefined;
    }
  }
} 