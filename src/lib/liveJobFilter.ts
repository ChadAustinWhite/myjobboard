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

/**
 * Loose ingest gate used for live APIs so production isn’t dominated by placeholders
 * when strict UX matching would drop every legitimate role.
 */
export function passesBoardIngestUxDesignSignals(
  title: string,
  descriptionPlain: string,
  tags: string[],
  meta?: { boardCategory?: string },
): boolean {
  if (passesUxProductDesignFocus(title, descriptionPlain, tags)) return true;

  const t = title.trim();
  if (looksLikeNonDesignRoleTitle(t)) return false;

  const salvageUxish =
    /\b(ui\s*[/&]\s*ux|ui\/ux|\bux\b|product\s+design(?:er)?|experience\s+design(?:er)?|interaction\s+design(?:er)?|service\s+design(?:er)?|design\s+systems?(?:\s+design(?:er))?|ux\s+research(?:er)?|user\s+research|\bmarketing\s+(?:experience|lifecycle|growth)\b|\bcx\b\s+design\b)/i.test(t);

  const titleHardExclude =
    /\b(packaging|graphic\s+design(?:er)?|motion\s+design|videographer|\banimator\b|\billustrator\b|\b(?:3d)\s+artist\b|\b(?:visual)\s+designer\b|\bbrand\s+designer\b|video\s+(?:producer|artist))\b/i.test(t);
  if (titleHardExclude && !salvageUxish) return false;

  const blob = `${descriptionPlain}\n${tags.join(" ")}`.toLowerCase();

  const craftSignals =
    /\b(figma|sketch(?:\.app)?|framer|creative\s+cloud|prototype|wireframe|journey\s+mapping|experience\s+journey|customer\s+journey|\b ux\b|experiment|experimentation|\ba\s*\/\s*b\b|\bab\s+test(?:ing)?|discovery|insights?|survey|priorit(?:y|ies)|conversion|lifecycle|\b personalization\b|\b localization\b|\baccessibility\b|wcag|(?:information\s+architecture)|(?:interaction\s+design)|design\s+system|portfolio|case\s+stud(?:y|ies)|cross[- ]functional|hand\s*off|north\s+star|persona\b|scenario\b|concept\s+(?:exploration|direction)|wireframes?|\bia\b|usability|\buxr\b|user\s+research|discovery\s+sprint|research\s+synthesis|\bmarketing\s+funnel\b|(?:ship|shipping))\b/i.test(
      blob,
    );

  if ((meta?.boardCategory ?? "").trim().toLowerCase() === "design") {
    if (/\bgraphic\s+design(?:er)?\b/i.test(t) && !salvageUxish) return false;
    return true;
  }

  const typedDesigner =
    /\b(product|experience|interaction|conversion|lifecycle|growth|digital|marketing\s+(?:experience|lifecycle|growth)|web)\s+design(?:er)?\b/i.test(t);
  if (typedDesigner && !looksLikeNonDesignRoleTitle(t)) return true;

  const tl = t.toLowerCase();
  const ladderDesigner =
    /\bdesign\s+(?:lead|manager|leadership)\b/i.test(tl) ||
    /\bdesign(?:er)?\s+(?:i{1,3}|iv)\b/i.test(tl) ||
    /\b(?:staff|principal|lead|associate|junior|\bjr\.?\b|mid(?:dle)?|\bsenior\b|\bsr\b)\b.{0,50}\bdesign(?:er)?\b/i.test(
      t,
    );

  if (/\bmarketing\s+design(?:er)?\b/i.test(t)) {
    return craftSignals || salvageUxish;
  }

  if (ladderDesigner && (craftSignals || salvageUxish)) return true;

  if (salvageUxish) return craftSignals;

  /** Last resort — rare “Senior Designer …” gigs that bury signals in prose */
  if (/\bdesign(?:ers?|ing)\b/i.test(t)) {
    return (
      craftSignals &&
      /\b(tool|portfolio|experiment|experimentation|insights?|survey|conversion|lifecycle|experience|accessibility|\b ux\b|interaction|journeys?\b|\bmarketing\b.{0,32}\bgrowth\b|\bconversion\b\s+design\b|\bproduct\b.{0,32}\brand\b|\bbrand\b.{0,32}\bexperience\b|\bexperimentation\b)/i.test(blob)
    );
  }

  return false;
}
