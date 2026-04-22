import { ScoringWeights } from '../types';

export const DEFAULT_WEIGHTS: ScoringWeights = {
  uniqueness: 0.4,
  stability: 0.35,
  brevity: 0.15,
  readability: 0.1,
};
