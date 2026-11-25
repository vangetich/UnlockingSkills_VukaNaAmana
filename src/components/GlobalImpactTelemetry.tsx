import React from 'react';
import {
  GlobalImpactDashboard,
  type GlobalImpactDashboardProps,
  type StageTelemetryDatum,
} from './GlobalImpactDashboard';

export type { StageTelemetryDatum };
export type GlobalImpactTelemetryProps = GlobalImpactDashboardProps;

export const GlobalImpactTelemetry: React.FC<GlobalImpactTelemetryProps> = (props) => {
  return <GlobalImpactDashboard {...props} />;
};
