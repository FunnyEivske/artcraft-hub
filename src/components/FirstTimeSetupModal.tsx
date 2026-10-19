import React from 'react';
import { OnboardingWizard, OnboardingWizardProps } from './OnboardingWizard';

export type FirstTimeSetupModalProps = OnboardingWizardProps;

export const FirstTimeSetupModal: React.FC<FirstTimeSetupModalProps> = (props) => {
  return <OnboardingWizard {...props} />;
};

export { OnboardingWizard };
export default OnboardingWizard;
