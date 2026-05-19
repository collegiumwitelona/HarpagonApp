export const ACTION_THROTTLE_MS = 500;

const MUTATING_METHODS = new Set(['post', 'put', 'patch', 'delete']);

let lastMutationAt = 0;

export const isMutatingRequest = (config) =>
  MUTATING_METHODS.has(String(config?.method || 'get').toLowerCase());

export const isActionThrottled = () => Date.now() - lastMutationAt < ACTION_THROTTLE_MS;

export const tryConsumeMutation = () => {
  if (isActionThrottled()) {
    return false;
  }

  lastMutationAt = Date.now();
  return true;
};

export const shouldSkipActionThrottle = (config) => config?.skipActionThrottle === true;

export const isActionThrottledError = (error) => error?.code === 'ACTION_THROTTLED';

export const installGlobalClickThrottle = () => {
  if (typeof document === 'undefined') {
    return;
  }

  document.addEventListener(
    'click',
    (event) => {
      if (event.defaultPrevented) {
        return;
      }

      const interactive = event.target.closest(
        'button, a[href], input[type="submit"], input[type="button"], [role="button"]'
      );

      if (!interactive) {
        return;
      }

      if (interactive.dataset.throttleExempt === 'true') {
        return;
      }

      if (interactive.closest('[data-throttle-exempt="true"]')) {
        return;
      }

      if (isActionThrottled()) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
      }
    },
    true
  );
};
