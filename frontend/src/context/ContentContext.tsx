"use client";

import { createContext, useContext, ReactNode } from "react";
import { siteContent, SiteContent } from "@/constants/content";

const ContentContext = createContext<SiteContent>(siteContent);

export function ContentProvider({ children }: { children: ReactNode }) {
  return <ContentContext.Provider value={siteContent}>{children}</ContentContext.Provider>;
}

/** Central hook for all UI copy — sourced from the constants file by default. */
export function useContent() {
  return useContext(ContentContext);
}
