/**
 * One-Euro Filter for smoothing face tracking landmarks
 * Reduces jitter while maintaining responsiveness to movement
 */

interface OneEuroFilterConfig {
  minCutoff: number;
  beta: number;
  dcutoff: number;
}

class LowPassFilter {
  private y: number | null = null;
  private s: number | null = null;

  filter(value: number, alpha: number): number {
    if (this.y === null) {
      this.s = value;
      this.y = value;
      return value;
    }
    
    this.y = alpha * value + (1 - alpha) * this.y;
    return this.y;
  }
}

export class OneEuroFilter {
  private xFilter: LowPassFilter;
  private dxFilter: LowPassFilter;
  private lastTime: number | null = null;
  private config: OneEuroFilterConfig;

  constructor(config: Partial<OneEuroFilterConfig> = {}) {
    this.config = {
      minCutoff: config.minCutoff ?? 1.0,
      beta: config.beta ?? 0.007,
      dcutoff: config.dcutoff ?? 1.0,
    };
    this.xFilter = new LowPassFilter();
    this.dxFilter = new LowPassFilter();
  }

  private alpha(cutoff: number, dt: number): number {
    const tau = 1.0 / (2 * Math.PI * cutoff);
    return 1.0 / (1.0 + tau / dt);
  }

  filter(value: number, timestamp?: number): number {
    const now = timestamp ?? performance.now();
    const dt = this.lastTime !== null ? (now - this.lastTime) / 1000 : 0.016;
    this.lastTime = now;

    const dx = this.lastTime !== null 
      ? (value - this.xFilter.filter(value, this.alpha(this.config.dcutoff, dt))) / dt
      : 0;

    const edx = this.dxFilter.filter(dx, this.alpha(this.config.dcutoff, dt));
    const cutoff = this.config.minCutoff + this.config.beta * Math.abs(edx);

    return this.xFilter.filter(value, this.alpha(cutoff, dt));
  }

  reset(): void {
    this.xFilter = new LowPassFilter();
    this.dxFilter = new LowPassFilter();
    this.lastTime = null;
  }
}

/**
 * Filter for smoothing 2D points (face landmarks)
 */
export class PointFilter {
  private xFilter: OneEuroFilter;
  private yFilter: OneEuroFilter;

  constructor(config?: Partial<OneEuroFilterConfig>) {
    this.xFilter = new OneEuroFilter(config);
    this.yFilter = new OneEuroFilter(config);
  }

  filter(point: { x: number; y: number }, timestamp?: number): { x: number; y: number } {
    return {
      x: this.xFilter.filter(point.x, timestamp),
      y: this.yFilter.filter(point.y, timestamp),
    };
  }

  reset(): void {
    this.xFilter.reset();
    this.yFilter.reset();
  }
}
