// The event names the originating session, never the currently focused tab.
export function closeTuiTab(tabs, sessionID) {
  if (tabs.enabled()) tabs.close(sessionID)
}
