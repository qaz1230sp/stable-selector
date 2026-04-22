import { SelectorStrategy, RawCandidate, StrategyType } from '../types';
import { FilterEngine } from '../filter';
import { IdStrategy } from './id';
import { AttributeStrategy } from './attribute';
import { StructuralStrategy } from './structural';
import { TextStrategy } from './text';
import { RoleStrategy } from './role';

export class StrategyPipeline {
  private strategies: SelectorStrategy[];

  constructor(
    filter: FilterEngine,
    priorities: StrategyType[] = ['id', 'attribute', 'structural', 'text', 'role'],
    maxDepth: number = 5,
  ) {
    const strategyMap: Record<StrategyType, SelectorStrategy> = {
      id: new IdStrategy(filter),
      attribute: new AttributeStrategy(filter),
      structural: new StructuralStrategy(filter, maxDepth),
      text: new TextStrategy(),
      role: new RoleStrategy(),
    };

    this.strategies = priorities.map(p => strategyMap[p]);
  }

  generate(element: Element, root: Element | Document = document): RawCandidate[] {
    const candidates: RawCandidate[] = [];
    for (const strategy of this.strategies) {
      candidates.push(...strategy.generate(element, root));
    }
    return candidates;
  }
}

export { IdStrategy, AttributeStrategy, StructuralStrategy, TextStrategy, RoleStrategy };
