import { WebSocket } from 'ws';
import { EventEmitter } from 'events';

interface RemoteConfig {
  host: string;
  port: number;
  username: string;
  privateKey?: string;
  password?: string;
}

interface RemoteFile {
  path: string;
  content: string;
  lastModified: number;
}

export class RemoteDevelopmentService extends EventEmitter {
  private ws: WebSocket | null = null;
  private connected: boolean = false;
  private config?: RemoteConfig;
  private pendingRequests: Map<string, { resolve: Function, reject: Function }> = new Map();

  constructor() {
    super();
  }

  public async connect(config: RemoteConfig): Promise<void> {
    this.config = config;
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(`ws://${config.host}:${config.port}`);
        
        this.ws.on('open', () => {
          this.connected = true;
          this.authenticate();
          resolve();
        });

        this.ws.on('message', (data: string) => {
          this.handleMessage(JSON.parse(data));
        });

        this.ws.on('close', () => {
          this.connected = false;
          this.emit('disconnected');
        });

        this.ws.on('error', (error) => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  private async authenticate() {
    const auth = this.config!.privateKey 
      ? { type: 'key', key: this.config!.privateKey }
      : { type: 'password', password: this.config!.password };

    await this.sendRequest('auth', {
      username: this.config!.username,
      ...auth
    });
  }

  public async readFile(path: string): Promise<RemoteFile> {
    return this.sendRequest('readFile', { path });
  }

  public async writeFile(path: string, content: string): Promise<void> {
    return this.sendRequest('writeFile', { path, content });
  }

  public async executeCommand(command: string): Promise<string> {
    return this.sendRequest('execute', { command });
  }

  private async sendRequest(type: string, data: any): Promise<any> {
    if (!this.connected || !this.ws) {
      throw new Error('Not connected to remote server');
    }

    const requestId = Math.random().toString(36).substr(2, 9);
    const request = { id: requestId, type, ...data };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(requestId, { resolve, reject });
      this.ws!.send(JSON.stringify(request));
    });
  }

  private handleMessage(message: any) {
    if (message.id && this.pendingRequests.has(message.id)) {
      const { resolve, reject } = this.pendingRequests.get(message.id)!;
      this.pendingRequests.delete(message.id);

      if (message.error) {
        reject(new Error(message.error));
      } else {
        resolve(message.data);
      }
    } else {
      this.emit('message', message);
    }
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.connected = false;
    }
  }
} 