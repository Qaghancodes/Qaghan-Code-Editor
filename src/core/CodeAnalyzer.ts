export class CodeAnalyzer {
  private static readonly CHUNK_SIZE = 50000; // 50KB chunks
  
  public async analyzeFile(content: string): Promise<AnalysisResult> {
    // Break analysis into chunks for better responsiveness
    const chunks = this.splitIntoChunks(content);
    const results = await Promise.all(
      chunks.map(chunk => this.analyzeChunk(chunk))
    );
    return this.mergeResults(results);
  }
} 