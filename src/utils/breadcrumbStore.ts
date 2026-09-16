import { reactive } from "vue";
import type { Breadcrumb } from "./types";

export const breadcrumbState = reactive<{ breadcrumbs: Breadcrumb[] }>({
  breadcrumbs: [],
});

/**
 * Appends a user interaction breadcrumb, retaining at most the 10 most recent actions.
 */
export const addBreadcrumb = (crumb: Breadcrumb) => {
  breadcrumbState.breadcrumbs.push(crumb);
  if (breadcrumbState.breadcrumbs.length > 10) {
    breadcrumbState.breadcrumbs.shift();
  }
};

/**
 * Clears the breadcrumb trail.
 */
export const clearBreadcrumbs = () => {
  breadcrumbState.breadcrumbs = [];
};
