/* Visual refinement layer: tactical map dressing, room plans, silhouettes and a compact radar overlay. */
(function () {
  const originalDrawMapWorld = window.drawMapWorld;
  if (typeof originalDrawMapWorld !== 'function') return;

  function roomPlan(x, y, w, h) {
    ctx.save();
    ctx.strokeStyle = 'rgba(55,35,22,.85)';
    ctx.lineWidth = 5;
    ctx.strokeRect(x + 12, y + 12, w - 24, h - 24);
    ctx.strokeStyle = 'rgba(238,196,114,.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + w * .34, y + 12); ctx.lineTo(x + w * .34, y + h * .48);
    ctx.moveTo(x + w * .68, y + h * .52); ctx.lineTo(x + w * .68, y + h - 12);
    ctx.moveTo(x + 12, y + h * .52); ctx.lineTo(x + w * .68, y + h * .52);
    ctx.stroke();
    ctx.fillStyle = '#d6bd78';
    ctx.fillRect(x + w * .46, y - 3, 34, 8);
    ctx.fillStyle = '#3d2d22';
    ctx.fillRect(x + w * .15, y + h * .72, 42, 12);
    ctx.fillRect(x + w * .76, y + h * .18, 32, 12);
    ctx.restore();
  }

  function drawCover(x, y, w, h, angle) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(angle || 0);
    ctx.fillStyle = '#5c5140'; ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.fillStyle = '#897453'; ctx.fillRect(-w / 2 + 3, -h / 2 + 3, w - 6, 4);
    ctx.strokeStyle = '#3b352c'; ctx.strokeRect(-w / 2, -h / 2, w, h);
    ctx.restore();
  }

  function drawTacticalDecor() {
    ctx.save();
    ctx.translate(-player.cameraX, -player.cameraY);
    roomPlan(320, 440, 280, 200);
    roomPlan(760, 350, 420, 260);
    roomPlan(1300, 420, 320, 250);
    roomPlan(1600, 900, 340, 240);
    roomPlan(880, 980, 320, 230);
    drawCover(690, 770, 90, 16, .1); drawCover(840, 780, 72, 16, -.12);
    drawCover(1260, 820, 100, 17, .05); drawCover(1480, 800, 80, 17, -.08);
    drawCover(700, 1320, 90, 15, .4); drawCover(1240, 1390, 110, 16, -.3);
    ctx.restore();
  }

  window.drawMapWorld = function () {
    originalDrawMapWorld();
    drawTacticalDecor();
  };

  const originalRender = window.render;
  if (typeof originalRender === 'function') {
    window.render = function () {
      originalRender();
      drawTacticalDecor();
    };
  }
})();
