import { sharedContext } from "../../models/contexte";

const currentGlobalContext = `In a harsh, post-apocalyptic world, Gu Hang rises to power as the new governor of a planet ravaged by monsters and energy storms. The previous governors faced grim fates, executed for their inability to meet the council’s tax demands within two years. Despite the council’s political maneuvering, Gu Hang takes bold steps to establish control, moving his camp outside the city, which is largely disregarded by the council.
With the support of a cruiser in orbit acting as a nuclear deterrent, he strategically eliminates multiple bandit groups and faces cultist threats as he pressures the council to act against them. Recently, Gu Hang successfully regained control of the city from a rogue general, initiating a purge of corrupt officials to replace them with loyal allies. He receives assistance from the Sisters of Battle, dedicated to eradicating cultist influence, and commands a squad of seven space marines from a nearly extinct chapter, recently freed from a century-long punishment for heresy.`;

export class sharedContextManager {
  private sharedContext: sharedContext = {
    lastChapterSummary: null,
    currentChapterSummary: null,
    globalContext: currentGlobalContext,
    currentChapterText: null,
  };

  private getSharedContext(): sharedContext {
    return this.sharedContext;
  }

  getLastChapterSummary(): string | null {
    return this.getSharedContext().lastChapterSummary;
  }

  getCurrentChapterSummary(): string | null {
    return this.getSharedContext().currentChapterSummary;
  }

  getCurrentChapterText(): string | null {
    const currentChapterText = this.getSharedContext().currentChapterText;
    if (!currentChapterText) {
      return null;
    }
    return currentChapterText.trim();
  }

  getGlobalContext(): string | null {
    return this.getSharedContext().globalContext;
  }
  setLastChapterSummary(value: string | null): void {
    this.sharedContext.lastChapterSummary = value;
  }

  setCurrentChapterSummary(value: string | null): void {
    this.sharedContext.currentChapterSummary = value;
  }
  private resetCurrentChapterSummary(): void {
    this.setCurrentChapterSummary(null);
  }

  updateSummaries() {
    const currentChapterSummary = this.getCurrentChapterSummary();
    if (!currentChapterSummary) {
      return;
    }

    this.setLastChapterSummary(currentChapterSummary);
    this.resetCurrentChapterSummary();
  }

  addToCurrentChapterText(newChunckText: string): void {
    if (this.sharedContext.currentChapterText) {
      this.sharedContext.currentChapterText += newChunckText;
    } else {
      this.sharedContext.currentChapterText = newChunckText;
    }
  }

  updateGlobalContext(globalContextUpdated: string): void {
    this.sharedContext.globalContext = globalContextUpdated;
  }
}
