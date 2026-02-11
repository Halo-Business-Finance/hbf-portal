import { invokeEdgeFunction } from './supabaseHttp';

/**
 * Security Telemetry Service
 *
 * Tracks anonymous aggregate metrics for security monitoring.
 * NO personally identifiable information (PII) is collected.
 * All metrics are aggregated by day with no user association.
 */

type SecurityMetric =
  | 'password_toggle_show'
  | 'password_toggle_hide'
  | 'failed_login_attempt'
  | 'repeated_failed_login'
  | 'rate_limit_triggered'
  | 'session_timeout'
  | 'mfa_prompt_shown';

class TelemetryService {
  private pendingMetrics: Map<SecurityMetric, number> = new Map();
  private flushTimeout: ReturnType<typeof setTimeout> | null = null;
  private readonly FLUSH_DELAY_MS = 5000;

  track(metric: SecurityMetric, count: number = 1): void {
    const current = this.pendingMetrics.get(metric) || 0;
    this.pendingMetrics.set(metric, current + count);
    if (!this.flushTimeout) {
      this.flushTimeout = setTimeout(() => this.flush(), this.FLUSH_DELAY_MS);
    }
  }

  async flush(): Promise<void> {
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
      this.flushTimeout = null;
    }
    if (this.pendingMetrics.size === 0) return;

    const metricsToSend = new Map(this.pendingMetrics);
    this.pendingMetrics.clear();

    for (const [metric, count] of metricsToSend) {
      try {
        await invokeEdgeFunction('security-telemetry', { metric, count });
      } catch (error) {
        console.debug('Telemetry send failed:', metric, error);
      }
    }
  }

  trackPasswordToggle(shown: boolean): void { this.track(shown ? 'password_toggle_show' : 'password_toggle_hide'); }
  trackFailedLogin(): void { this.track('failed_login_attempt'); }
  trackRepeatedFailedLogin(): void { this.track('repeated_failed_login'); }
  trackRateLimitTriggered(): void { this.track('rate_limit_triggered'); }
  trackSessionTimeout(): void { this.track('session_timeout'); }
  trackMFAPrompt(): void { this.track('mfa_prompt_shown'); }
}

export const telemetryService = new TelemetryService();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    telemetryService.flush();
  });
}
