import React from 'react';
import {
  GlobalImpactTelemetry,
  type GlobalImpactTelemetryProps,
  type StageTelemetryDatum,
} from './GlobalImpactTelemetry';

export type { StageTelemetryDatum };
export type GlobalImpactDashboardProps = GlobalImpactTelemetryProps;

/**
 * GlobalImpactDashboard — D3-powered platform SDG impact telemetry dashboard
 * visualizing total verified builders across the 5 Crossing stages, active
 * solution sprints, and disbursed stipends inside PulseView.
 */
export const GlobalImpactDashboard: React.FC<GlobalImpactDashboardProps> = (props) => {
  return <GlobalImpactTelemetry {...props} />;
};
