const ext = (window.browser ?? window.chrome) as BrowserLike;

export const assets: AssetMap = {
  menuIcon: ext.runtime.getURL("assets/menu-icon.png"),
  placeholder: ext.runtime.getURL("assets/placeholder.png"),
};