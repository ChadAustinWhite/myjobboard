/**
 * Decide whether a posting is UX / product-design aligned enough for Chad’s feed.
 * Title-heavy to avoid Packaging / PO / dev roles slipping in via vague body copy.
 */
export function passesUxProductDesignFocus(
  title: string,
  descriptionPlain: string,
  tags: string[],
): boolean {
  const t = title.trim();
  const blob = `${descriptionPlain} ${tags.join(" ")}`.toLowerCase();

  const titleHardExclude =
    /\b(packaging|graphic\s+design|motion\s+design|videographer|\banimator\b|\billustrator\b|\b(?:3d)\s+artist\b|visual\s+designer\b|brand\s+designer\b|video\s+(?:producer|artist))\b/i.test(
      t,
    );
  const titleSalvage =
    /\b(ui\s*[/&]\s*ux|ui\/ux|ux\s*\/\s*ui|\bux\b|senior\s+ux|lead\s+ux|staff\s+ux|principal\s+ux|ux\s+design(?:er)?|ux\s+researcher|user\s+experience|product\s+design(?:er)?|interaction\s+design(?:er)?|experience\s+design(?:er)?|service\s+design(?:er)?|design\s+systems?(?:\s+design(?:er))?)\b/i.test(
      t,
    );
  if (titleHardExclude && !titleSalvage) return false;

  const titleStrong =
    /\b(ui\s*[/&]\s*ux|ui\/ux|ux\s*\/\s*ui|\bux\b|senior\s+ux|lead\s+ux|staff\s+ux|principal\s+ux|ux\s+design(?:er)?|ux\s+researcher|user\s+experience|product\s+design(?:er)?|interaction\s+design(?:er)?|experience\s+design(?:er)?|service\s+design(?:er)?)\b/i.test(
      t,
    ) || /\bdesign\s+systems?(?:\s+design(?:er))?\b/i.test(t);

  if (titleStrong && !looksLikeNonDesignRoleTitle(t)) return true;

  const designerAdjacent =
    /\bdesign(?:er|ers)?\b/i.test(t) &&
    /\b(figma|prototyping|prototype|wireframe|journey\s+mapping|user\s+(?:research|testing)|uxr\b|research\s+synthesis|interaction|usability|accessibility|information\s+architecture|IxD\b|design\s+operations)\b/i.test(
      blob,
    );

  if (designerAdjacent && !looksLikeNonDesignRoleTitle(t)) return true;

  return false;
}

function looksLikeNonDesignRoleTitle(title: string): boolean {
  const x = title.toLowerCase();
  return (
    /\b(product\s+owner|project\s+manager|engineering\s+(?:lead|manager|director))\b/i.test(x) ||
    /\b(full[- ]stack|front[- ]end|back[- ]end|(?:senior\s+)?software\s+(?:developer|engineer)|devops|(?:ios|android)\s+developer|\bqa\b\s+engineer|\bqa\b\b)\b/i.test(
      x,
    )
  );
}
