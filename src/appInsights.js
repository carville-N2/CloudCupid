import { ApplicationInsights } from '@microsoft/applicationinsights-web';

// Replace with your Application Insights Instrumentation Key
const instrumentationKey = 'f10e5868-4c04-4038-b106-e5bf3f7233a5';

export const appInsights = new ApplicationInsights({
  config: {
    instrumentationKey: instrumentationKey,
    enableAutoRouteTracking: true,  // Tracks route changes automatically
    enableAjaxErrorTracking: true,  // Tracks failed HTTP requests
    enableCorsCorrelation: true,    // Correlates AJAX requests
  }
});

appInsights.loadAppInsights(); // Initialize Application Insights

// Optionally, track the first page view manually if you want more control
appInsights.trackPageView();  // Track the initial page view
