export type PlanTier = 'free' | 'pro' | 'enterprise';

export function getCurrentPlan() {
  return { tier: 'free' as PlanTier, renewalDate: null };
}

export function upgradePlan(tier: PlanTier) {
  console.debug('[billing] upgrade to', tier);
  // TODO: supply stripe / in-app purchase adaptation
}
