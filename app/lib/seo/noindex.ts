// Shared noindex metadata for all private/authenticated pages
// These pages exist for system functionality but should not appear in search results

import type { Metadata } from "next";

export const noIndexMetadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};
