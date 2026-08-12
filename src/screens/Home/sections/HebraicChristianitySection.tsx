import React from 'react';
import { HEBRAIC_COLLECTION } from '@/services/articles';
import { ArticleLibrarySection } from './ArticleLibrarySection';

/**
 * Hebraic Christianity section body — the published article library, read live
 * from the CDN catalog manifest. Articles only: no hero or standfirst.
 */
export const HebraicChristianitySection: React.FC = React.memo(() => (
  <ArticleLibrarySection collection={HEBRAIC_COLLECTION} />
));

HebraicChristianitySection.displayName = 'HebraicChristianitySection';
