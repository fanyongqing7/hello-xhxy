"use strict";
// 旧的 /java-guide/#章节 或 #q-编号 迁移到静态子页；未知锚点仍停留在总览。
function redirectLegacyGuide() {
  let id;
  try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
  if (!Object.hasOwn(guideRoutes, id)) return;
  location.replace(new URL("./" + guideRoutes[id] + "#" + encodeURIComponent(id), location.href).href);
}
redirectLegacyGuide();
window.addEventListener("hashchange", redirectLegacyGuide);
