export const THEME_STORAGE_KEY = "gymapps-theme";

export const themeScript = `(function(){try{var key="${THEME_STORAGE_KEY}";var value=localStorage.getItem(key)||"system";var dark=value==="dark"||(value==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",dark);}catch(e){}})();`;
