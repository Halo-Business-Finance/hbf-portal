import { supabase } from '@/integrations/supabase/client';

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
  private readonly FLUSH_DELAY_MS = 5000; // Batch metrics every 5 seconds

  /**
   * Track a security metric anonymously.
   * Metrics are batched and sent periodically to reduce network overhead.
   */
  track(metric: SecurityMetric, count: number = 1): void {
    const current = this.pendingMetrics.get(metric) || 0;
    this.pendingMetrics.set(metric, current + count);

    // Schedule flush if not already scheduled
    if (!this.flushTimeout) {
      this.flushTimeout = setTimeout(() => this.flush(), this.FLUSH_DELAY_MS);
    }
  }

  /**
   * Immediately send pending metrics to the server.
   */
  async flush(): Promise<void> {
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
      this.flushTimeout = null;
    }

    if (this.pendingMetrics.size === 0) return;

    // Copy and clear pending metrics
    const metricsToSend = new Map(this.pendingMetrics);
    this.pendingMetrics.clear();

    // Send each metric (could batch into single call, but keeping simple)
    for (const [metric, count] of metricsToSend) {
      try {
        await supabase.functions.invoke('security-telemetry', {
          body: { metric, count }
        });
      } catch (error) {
        // Silently fail - telemetry should never disrupt user experience
        console.debug('Telemetry send failed:', metric, error);
      }
    }
  }

  /**
   * Track password visibility toggle
   */
  trackPasswordToggle(shown: boolean): void {
    this.track(shown ? 'password_toggle_show' : 'password_toggle_hide');
  }

  /**
   * Track a single failed login attempt
   */
  trackFailedLogin(): void {
    this.track('failed_login_attempt');
  }

  /**
   * Track when a user has 3+ consecutive failed logins
   */
  trackRepeatedFailedLogin(): void {
    this.track('repeated_failed_login');
  }

  /**
   * Track when rate limiting is triggered
   */
  trackRateLimitTriggered(): void {
    this.track('rate_limit_triggered');
  }

  /**
   * Track session timeout events
   */
  trackSessionTimeout(): void {
    this.track('session_timeout');
  }

  /**
   * Track MFA prompt displays
   */
  trackMFAPrompt(): void {
    this.track('mfa_prompt_shown');
  }
}

// Singleton instance
export const telemetryService = new TelemetryService();

// Flush on page unload to ensure metrics are sent
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    telemetryService.flush();
  });
}
