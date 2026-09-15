(function () {
  var script = document.currentScript;
  var key = script.getAttribute("data-key");
  var base = script.getAttribute("data-base") || new URL(script.src).origin;
  if (!key) {
    console.error("Nova Reach widget: missing data-key attribute on script tag.");
    return;
  }

  var bubble = document.createElement("button");
  bubble.textContent = "💬";
  bubble.setAttribute("aria-label", "Open chat");
  bubble.style.cssText =
    "position:fixed;bottom:20px;right:20px;width:56px;height:56px;border-radius:50%;" +
    "background:#6d5efc;color:white;border:none;font-size:24px;cursor:pointer;" +
    "box-shadow:0 8px 24px rgba(0,0,0,0.25);z-index:999999;";

  var frame = document.createElement("iframe");
  frame.src = base + "/widget/" + key;
  frame.style.cssText =
    "position:fixed;bottom:88px;right:20px;width:360px;height:520px;border:none;" +
    "border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,0.35);z-index:999999;display:none;" +
    "max-width:calc(100vw - 40px);max-height:calc(100vh - 120px);";

  var open = false;
  bubble.addEventListener("click", function () {
    open = !open;
    frame.style.display = open ? "block" : "none";
  });

  document.body.appendChild(frame);
  document.body.appendChild(bubble);
})();
