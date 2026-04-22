import { SelectorStrategy, RawCandidate } from '../types';
import { createCandidate } from './base';

export class RoleStrategy implements SelectorStrategy {
  readonly name = 'role' as const;

  // Map semantic HTML tags to implicit ARIA roles
  private static IMPLICIT_ROLES: Record<string, string> = {
    'button': 'button',
    'a': 'link',
    'input': 'textbox',
    'select': 'combobox',
    'textarea': 'textbox',
    'nav': 'navigation',
    'main': 'main',
    'header': 'banner',
    'footer': 'contentinfo',
    'aside': 'complementary',
    'form': 'form',
    'table': 'table',
    'img': 'img',
  };

  generate(element: Element, _root: Element | Document): RawCandidate[] {
    const candidates: RawCandidate[] = [];
    const tag = element.tagName.toLowerCase();

    // Explicit role attribute
    const role = element.getAttribute('role');
    if (role) {
      const name = element.getAttribute('aria-label') || element.getAttribute('name') || '';
      if (name) {
        candidates.push(createCandidate(
          `__role__[role="${role}"][name="${name}"]`,
          'role', 0.7
        ));
      } else {
        candidates.push(createCandidate(
          `__role__[role="${role}"]`,
          'role', 0.55
        ));
      }
    }

    // Implicit role from semantic tag
    const implicitRole = RoleStrategy.IMPLICIT_ROLES[tag];
    if (implicitRole && !role) {
      const name = element.getAttribute('aria-label') || element.getAttribute('name') || '';
      if (name) {
        candidates.push(createCandidate(
          `__role__[role="${implicitRole}"][name="${name}"]`,
          'role', 0.65
        ));
      }
    }

    return candidates;
  }
}
