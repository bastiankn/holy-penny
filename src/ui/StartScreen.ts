/**
 * StartScreen - UI component for starting the AR experience
 * Part of Phase 2: Camera Implementation
 */

export interface StartScreenOptions {
  title?: string;
  buttonText?: string;
  onStart?: () => void | Promise<void>;
}

export class StartScreen {
  private container: HTMLElement;
  private titleElement: HTMLElement;
  private buttonElement: HTMLButtonElement;
  private statusElement: HTMLElement;
  private options: StartScreenOptions;

  constructor(options: StartScreenOptions = {}) {
    this.options = {
      title: 'COIN HUNT',
      buttonText: 'START AR',
      ...options,
    };

    this.container = document.createElement('div');
    this.container.style.position = 'fixed';
    this.container.style.top = '0';
    this.container.style.left = '0';
    this.container.style.width = '100vw';
    this.container.style.height = '100vh';
    this.container.style.display = 'flex';
    this.container.style.flexDirection = 'column';
    this.container.style.alignItems = 'center';
    this.container.style.justifyContent = 'center';
    this.container.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    this.container.style.zIndex = '1000';
    this.container.style.color = 'white';
    this.container.style.fontFamily = 'Arial, sans-serif';

    // Title
    this.titleElement = document.createElement('h1');
    this.titleElement.textContent = this.options.title;
    this.titleElement.style.fontSize = '2.5rem';
    this.titleElement.style.marginBottom = '2rem';
    this.titleElement.style.textAlign = 'center';

    // Button
    this.buttonElement = document.createElement('button');
    this.buttonElement.textContent = this.options.buttonText;
    this.buttonElement.style.padding = '1rem 2rem';
    this.buttonElement.style.fontSize = '1.2rem';
    this.buttonElement.style.backgroundColor = '#4CAF50';
    this.buttonElement.style.color = 'white';
    this.buttonElement.style.border = 'none';
    this.buttonElement.style.borderRadius = '5px';
    this.buttonElement.style.cursor = 'pointer';
    this.buttonElement.style.transition = 'background-color 0.3s';

    this.buttonElement.addEventListener('mouseenter', () => {
      this.buttonElement.style.backgroundColor = '#45a049';
    });

    this.buttonElement.addEventListener('mouseleave', () => {
      this.buttonElement.style.backgroundColor = '#4CAF50';
    });

    this.buttonElement.addEventListener('click', async () => {
      this.setStatus('Requesting camera permission...');
      try {
        if (this.options.onStart) {
          await this.options.onStart();
        }
      } catch (error) {
        this.setStatus(`Error: ${(error as Error).message}`);
      }
    });

    // Status
    this.statusElement = document.createElement('div');
    this.statusElement.style.marginTop = '1rem';
    this.statusElement.style.fontSize = '0.9rem';
    this.statusElement.style.color = '#ccc';
    this.statusElement.style.textAlign = 'center';

    // Assemble
    this.container.appendChild(this.titleElement);
    this.container.appendChild(this.buttonElement);
    this.container.appendChild(this.statusElement);

    document.body.appendChild(this.container);
  }

  /**
   * Update the status message
   */
  setStatus(message: string): void {
    this.statusElement.textContent = message;
  }

  /**
   * Hide the start screen
   */
  hide(): void {
    this.container.style.display = 'none';
  }

  /**
   * Show the start screen
   */
  show(): void {
    this.container.style.display = 'flex';
  }

  /**
   * Check if the start screen is visible
   */
  isVisible(): boolean {
    return this.container.style.display !== 'none';
  }

  /**
   * Remove the start screen from DOM
   */
  destroy(): void {
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }

  /**
   * Update button text
   */
  setButtonText(text: string): void {
    this.buttonElement.textContent = text;
  }

  /**
   * Enable or disable the button
   */
  setButtonEnabled(enabled: boolean): void {
    this.buttonElement.disabled = !enabled;
    this.buttonElement.style.opacity = enabled ? '1' : '0.5';
    this.buttonElement.style.cursor = enabled ? 'pointer' : 'not-allowed';
  }
}
