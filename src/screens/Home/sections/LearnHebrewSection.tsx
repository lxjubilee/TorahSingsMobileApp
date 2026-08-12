import React from 'react';
import { ArticleLibrarySection } from './ArticleLibrarySection';

/** The CDN article collection this section reads. */
const LEARN_HEBREW_COLLECTION = 'learn-hebrew';

/**
 * Learn Hebrew section body — the published article library, nothing else.
 *
 * The aleph-bet teaser and the three lesson-level rows used to live here. They
 * and the bundled curriculum behind them (the `LearnHebrewLevel` screen, its
 * lesson/exercise data and its `learn-hebrew/:slug` deep link) have been
 * removed; this collection is the whole surface now.
 */
export const LearnHebrewSection: React.FC = React.memo(() => (
  <ArticleLibrarySection collection={LEARN_HEBREW_COLLECTION} />
));

LearnHebrewSection.displayName = 'LearnHebrewSection';
