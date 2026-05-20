// Keep only the URL.canParse fallback needed for Safari 16.4 compatibility.
if (!("canParse" in URL)) {
  URL.canParse = function canParse(url, base) {
    try {
      new URL(url, base);
      return true;
    } catch {
      return false;
    }
  };
}
