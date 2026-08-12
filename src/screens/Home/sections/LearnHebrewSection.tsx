import React from 'react';
import { ArticleLibrarySection } from './ArticleLibrarySection';

/** The CDN article collection this section reads. */
const LEARN_HEBREW_COLLECTION = 'learn-hebrew';

/**
 * Learn Hebrew section body — the published article library, nothing else.
 *
 * The aleph-bet teaser and the three lesson-level rows used to live here and
 * were removed; the curriculum screens (`LearnHebrewLevel`) are still routed and
 * still reachable by deep link (`learn-hebrew/:slug`), but nothing in this
 * section links to them any more.
 */
export const LearnHebrewSection: React.FC = React.memo(() => (
  <ArticleLibrarySection collection={LEARN_HEBREW_COLLECTION} />
));

LearnHebrewSection.displayName = 'LearnHebrewSection';
