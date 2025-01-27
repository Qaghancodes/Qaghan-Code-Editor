import { Plugin, PluginManifest } from '../types/plugin';

export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private enabledPlugins: Set<string> = new Set();

  async loadPlugin(manifest: PluginManifest): Promise<void> {
    try {
      const plugin = await import(manifest.entry);
      const instance = new plugin.default() as Plugin;
      
      this.plugins.set(manifest.id, {
        id: manifest.id,
        name: manifest.name,
        version: manifest.version,
        instance
      });
    } catch (error) {
      console.error(`Failed to load plugin ${manifest.id}:`, error);
    }
  }

  async enablePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    try {
      await plugin.instance.activate();
      this.enabledPlugins.add(pluginId);
    } catch (error) {
      console.error(`Failed to enable plugin ${pluginId}:`, error);
    }
  }

  async disablePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    try {
      await plugin.instance.deactivate();
      this.enabledPlugins.delete(pluginId);
    } catch (error) {
      console.error(`Failed to disable plugin ${pluginId}:`, error);
    }
  }
} 