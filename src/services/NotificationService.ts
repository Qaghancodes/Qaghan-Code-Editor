interface NotificationOptions {
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  duration?: number;
  actions?: NotificationAction[];
}

interface NotificationAction {
  label: string;
  handler: () => void;
}

export class NotificationService {
  private container: HTMLElement;
  private notifications: Map<string, HTMLElement> = new Map();

  constructor() {
    this.createContainer();
  }

  private createContainer() {
    this.container = document.createElement('div');
    this.container.className = 'notifications-container';
    document.body.appendChild(this.container);
  }

  public show(options: NotificationOptions): string {
    const id = Math.random().toString(36).substr(2, 9);
    const notification = this.createNotification(id, options);
    
    this.container.appendChild(notification);
    this.notifications.set(id, notification);

    if (options.duration !== undefined) {
      setTimeout(() => this.dismiss(id), options.duration);
    }

    return id;
  }

  private createNotification(id: string, options: NotificationOptions): HTMLElement {
    const element = document.createElement('div');
    element.className = `notification notification-${options.type}`;
    
    element.innerHTML = `
      <div class="notification-header">
        <span class="notification-title">${options.title}</span>
        <button class="notification-close">&times;</button>
      </div>
      <div class="notification-message">${options.message}</div>
      ${options.actions ? `
        <div class="notification-actions">
          ${options.actions.map((action, index) => `
            <button class="notification-action" data-action-index="${index}">
              ${action.label}
            </button>
          `).join('')}
        </div>
      ` : ''}
    `;

    element.querySelector('.notification-close')?.addEventListener('click', () => {
      this.dismiss(id);
    });

    if (options.actions) {
      element.querySelectorAll('.notification-action').forEach((button) => {
        button.addEventListener('click', () => {
          const index = parseInt(button.getAttribute('data-action-index')!);
          options.actions![index].handler();
        });
      });
    }

    return element;
  }

  public dismiss(id: string) {
    const notification = this.notifications.get(id);
    if (notification) {
      notification.classList.add('notification-hiding');
      setTimeout(() => {
        notification.remove();
        this.notifications.delete(id);
      }, 300);
    }
  }

  public dismissAll() {
    this.notifications.forEach((_, id) => this.dismiss(id));
  }
} 